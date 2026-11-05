"use client";
import { useRef, useState } from "react";
import { Download, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  parseTaskRows, parseVendorRows,
  TASK_TEMPLATE_HEADERS, TASK_TEMPLATE_EXAMPLES, VENDOR_TEMPLATE_HEADERS, VENDOR_TEMPLATE_EXAMPLES,
  type ImportError,
} from "@/lib/plannerImport";

// Importar do Excel (checklist de um casamento ou diretório de fornecedores),
// com um modelo para descarregar. Acrescenta sempre — nunca apaga nem
// substitui. O `xlsx` só é carregado quando é preciso (é pesado).

type Props =
  | { kind: "tasks"; locale?: string; invitationId: string; eventDate: string | null; startOrder: number; isAgency: boolean; onDone: (rows: any[]) => void }
  | { kind: "vendors"; locale?: string; brandId: string; existingNames: string[]; onDone: (rows: any[]) => void };

export default function PlannerExcelImport(props: Props) {
  const en = props.locale === "en";
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string; errors?: ImportError[] } | null>(null);

  const t = {
    template: en ? "Excel template" : "Modelo Excel",
    import: en ? "Import Excel" : "Importar Excel",
    importing: en ? "Importing..." : "A importar...",
    none: en ? "No valid rows found. Check the headers against the template." : "Não foram encontradas linhas válidas. Comparem os cabeçalhos com os do modelo.",
    fail: en ? "Could not import. Please try again." : "Não foi possível importar. Tentem outra vez.",
    unreadable: en ? "Could not read the file. Use .xlsx, .xls or .csv." : "Não foi possível ler o ficheiro. Usem .xlsx, .xls ou .csv.",
    done: (n: number) => props.kind === "tasks"
      ? (en ? `${n} task${n === 1 ? "" : "s"} imported.` : `${n} tarefa${n === 1 ? "" : "s"} importada${n === 1 ? "" : "s"}.`)
      : (en ? `${n} vendor${n === 1 ? "" : "s"} imported.` : `${n} fornecedor${n === 1 ? "" : "es"} importado${n === 1 ? "" : "s"}.`),
    skipped: (n: number) => en ? ` ${n} row${n === 1 ? "" : "s"} skipped:` : ` ${n} linha${n === 1 ? "" : "s"} ignorada${n === 1 ? "" : "s"}:`,
    dupes: (n: number) => en ? ` ${n} already in the directory.` : ` ${n} já estava${n === 1 ? "" : "m"} no diretório.`,
    line: en ? "line" : "linha",
  };

  const downloadTemplate = async () => {
    const XLSX = await import("xlsx");
    const headers = props.kind === "tasks" ? TASK_TEMPLATE_HEADERS : VENDOR_TEMPLATE_HEADERS;
    const examples = props.kind === "tasks" ? TASK_TEMPLATE_EXAMPLES : VENDOR_TEMPLATE_EXAMPLES;
    const ws = XLSX.utils.aoa_to_sheet([headers, ...examples]);
    ws["!cols"] = headers.map(h => ({ wch: Math.max(14, h.length + 4) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, props.kind === "tasks" ? "Checklist" : "Fornecedores");
    XLSX.writeFile(wb, props.kind === "tasks" ? "modelo-checklist.xlsx" : "modelo-fornecedores.xlsx");
  };

  const onFile = async (file: File) => {
    setBusy(true); setMsg(null);
    let rows: Record<string, unknown>[] = [];
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });
      rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], { defval: "" });
    } catch {
      setBusy(false); setMsg({ ok: false, text: t.unreadable }); return;
    }
    const parsed = props.kind === "tasks"
      ? { ...parseTaskRows(rows, { invitationId: props.invitationId, eventDate: props.eventDate, startOrder: props.startOrder, isAgency: props.isAgency }), duplicates: 0 }
      : parseVendorRows(rows, { brandId: props.brandId, existingNames: props.existingNames });
    if (parsed.rows.length === 0) {
      setBusy(false);
      setMsg({ ok: false, text: t.none + (parsed.duplicates ? t.dupes(parsed.duplicates) : ""), errors: parsed.errors });
      return;
    }
    const { data, error } = await supabase.from(props.kind === "tasks" ? "event_tasks" : "agency_vendors").insert(parsed.rows).select("*");
    setBusy(false);
    if (error || !data) { setMsg({ ok: false, text: t.fail }); return; }
    props.onDone(data);
    setMsg({
      ok: true,
      text: t.done(data.length) + (parsed.duplicates ? t.dupes(parsed.duplicates) : "") + (parsed.errors.length ? t.skipped(parsed.errors.length) : ""),
      errors: parsed.errors,
    });
  };

  const btn = "inline-flex items-center gap-2 border border-gray-200 text-gray-500 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:text-brand hover:border-gold-soft transition-all disabled:opacity-50";
  return (
    <div className="flex flex-col gap-2" data-excel-import={props.kind}>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={downloadTemplate} className={btn}><Download size={13} /> {t.template}</button>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className={btn}>
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} {busy ? t.importing : t.import}
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onFile(f); }} />
      </div>
      {msg && (
        <div role="status" className={`text-[12px] ${msg.ok ? "text-emerald-700" : "text-red-500"}`}>
          {msg.text}
          {msg.errors && msg.errors.length > 0 && (
            <ul className="mt-1 text-gray-500 list-disc pl-5">
              {msg.errors.slice(0, 5).map(e => <li key={e.line}>{t.line} {e.line}: {e.reason}</li>)}
              {msg.errors.length > 5 && <li>…</li>}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
