import { dueDateFromOffset, type TaskPriority, type TaskResponsible } from "@/lib/planner";
import { offsetFromDates } from "@/lib/plannerCopy";

// Importar do Excel a checklist de um casamento e o diretório de fornecedores —
// para a agência não ter de reescrever o que já tem numa folha de cálculo.
// Funções puras: recebem as linhas já lidas da folha (objeto cabeçalho → valor)
// e devolvem as linhas a inserir e os erros por linha. Aceitam cabeçalhos em
// português ou inglês, com ou sem acentos.

export const TASK_TEMPLATE_HEADERS = ["Tarefa", "Dias antes do casamento", "Data limite", "Prioridade", "Responsável", "Notas"];
export const TASK_TEMPLATE_EXAMPLES = [
  ["Reservar a quinta", 365, "", "alta", "agência", "Pedir 3 propostas"],
  ["Escolher o fotógrafo", 300, "", "normal", "noivos", ""],
  ["Prova de menu", 90, "", "normal", "ambos", ""],
];
export const VENDOR_TEMPLATE_HEADERS = ["Nome", "Categoria", "Contacto", "Email", "Telefone", "Website", "Avaliação (1-5)", "Notas"];
export const VENDOR_TEMPLATE_EXAMPLES = [
  ["Quinta da Boavista", "Espaço", "Maria Silva", "geral@boavista.pt", "+351 912 345 678", "https://boavista.pt", 5, "Ótima para 150 pessoas"],
  ["Flores da Ana", "Flores", "Ana Costa", "ana@flores.pt", "+351 913 000 000", "", 4, ""],
];

export type ImportError = { line: number; reason: string };

const norm = (s: unknown) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function pick(row: Record<string, unknown>, aliases: string[]): unknown {
  for (const key of Object.keys(row)) {
    const k = norm(key);
    if (aliases.some(a => k === a || k.startsWith(a))) return row[key];
  }
  return undefined;
}

const text = (v: unknown) => (v === undefined || v === null ? "" : String(v).trim());

/** Data de uma célula: objeto Date (xlsx com cellDates), número de série do Excel, "dd/mm/aaaa" ou "aaaa-mm-dd". */
export function parseDateCell(v: unknown): string | null {
  if (v === undefined || v === null || v === "") return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return new Date(Date.UTC(v.getFullYear(), v.getMonth(), v.getDate())).toISOString().slice(0, 10);
  }
  if (typeof v === "number" && v > 20000 && v < 80000) {
    return new Date(Date.UTC(1899, 11, 30) + v * 86400000).toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

function priorityOf(v: unknown): TaskPriority {
  const s = norm(v);
  if (["alta", "high", "urgente", "a"].includes(s)) return "alta";
  if (["baixa", "low", "b"].includes(s)) return "baixa";
  return "normal";
}

function responsibleOf(v: unknown): TaskResponsible {
  const s = norm(v);
  if (["noivos", "casal", "couple", "noiva", "noivo", "clientes", "cliente"].includes(s)) return "couple";
  if (["ambos", "conjunta", "conjunto", "both", "todos"].includes(s)) return "both";
  return "agency";
}

export function parseTaskRows(
  rows: Record<string, unknown>[],
  opts: { invitationId: string; eventDate: string | null; startOrder: number; isAgency: boolean }
) {
  const out: Record<string, unknown>[] = [];
  const errors: ImportError[] = [];
  rows.forEach((row, idx) => {
    const line = idx + 2; // linha 1 = cabeçalhos
    const title = text(pick(row, ["tarefa", "task", "titulo", "title", "nome"]));
    const rawOffset = pick(row, ["dias antes", "days before", "dias"]);
    const rawDate = pick(row, ["data limite", "due date", "data", "prazo", "deadline"]);
    const allEmpty = Object.values(row).every(v => text(v) === "");
    if (allEmpty) return;
    if (!title) { errors.push({ line, reason: "sem nome de tarefa" }); return; }
    let offset: number | null = null;
    if (text(rawOffset) !== "") {
      const n = Number(String(rawOffset).replace(",", "."));
      if (!Number.isFinite(n)) { errors.push({ line, reason: `"dias antes" não é um número (${text(rawOffset)})` }); return; }
      offset = Math.round(n);
    }
    const date = parseDateCell(rawDate);
    if (text(rawDate) !== "" && !date) { errors.push({ line, reason: `data limite inválida (${text(rawDate)})` }); return; }
    if (offset === null && date) offset = offsetFromDates(date, opts.eventDate);
    const responsible = responsibleOf(pick(row, ["responsavel", "responsible", "owner", "quem"]));
    out.push({
      invitation_id: opts.invitationId,
      title,
      notes: text(pick(row, ["notas", "notes", "observacoes"])) || null,
      status: "todo",
      priority: priorityOf(pick(row, ["prioridade", "priority"])),
      responsible,
      due_offset_days: offset,
      due_date: offset !== null ? dueDateFromOffset(opts.eventDate, offset) : date,
      visibility: responsible === "agency" ? (opts.isAgency ? "agency" : "shared") : "shared",
      sort_order: opts.startOrder + out.length,
    });
  });
  return { rows: out, errors };
}

export function parseVendorRows(
  rows: Record<string, unknown>[],
  opts: { brandId: string; existingNames: string[] }
) {
  const out: Record<string, unknown>[] = [];
  const errors: ImportError[] = [];
  const seen = new Set(opts.existingNames.map(n => norm(n)));
  let duplicates = 0;
  rows.forEach((row, idx) => {
    const line = idx + 2;
    if (Object.values(row).every(v => text(v) === "")) return;
    const name = text(pick(row, ["nome", "name", "fornecedor", "vendor", "empresa"]));
    if (!name) { errors.push({ line, reason: "sem nome" }); return; }
    if (seen.has(norm(name))) { duplicates++; return; }
    seen.add(norm(name));
    const ratingRaw = text(pick(row, ["avaliacao", "rating", "classificacao"]));
    const rating = ratingRaw ? Math.round(Number(ratingRaw.replace(",", "."))) : null;
    out.push({
      brand_id: opts.brandId,
      name,
      category: text(pick(row, ["categoria", "category", "tipo"])) || null,
      contact_name: text(pick(row, ["contacto", "contact", "pessoa"])) || null,
      email: text(pick(row, ["email", "e mail", "mail"])) || null,
      phone: text(pick(row, ["telefone", "phone", "telemovel", "tel"])) || null,
      website: text(pick(row, ["website", "site", "url"])) || null,
      rating: rating && rating >= 1 && rating <= 5 ? rating : null,
      notes: text(pick(row, ["notas", "notes", "observacoes"])) || null,
    });
  });
  return { rows: out, errors, duplicates };
}
