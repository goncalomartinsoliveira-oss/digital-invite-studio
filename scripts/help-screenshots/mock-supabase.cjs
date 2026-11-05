// Supabase simulado (PostgREST mínimo, em memória) com dados de exemplo — só para
// gerar as capturas de ecrã do centro de ajuda. NÃO é um servidor real e não
// serve para mais nada. Ver README.md.
const http = require("http");
const crypto = require("crypto");

const INV = "11111111-1111-1111-1111-111111111111";
const T = {};

function seed() {
  for (const k of Object.keys(T)) delete T[k];
  T.invitations = [{
    id: INV, slug: "joana-e-rui", user_email: "test@example.com", groom_name: "Rui", bride_name: "Joana",
    event_date: "2027-06-12T16:00:00", template_id: "minimal-01", brand_id: null, expires_at: null,
    access_code_enabled: false, access_code_version: 1,
    unlocked_modules: ["save_the_date", "invite", "guests_seating", "photo_sharing", "guestbook"],
    dietary_tags: "Vegetariano,Sem glúten,Sem lactose",
    content: {
      sections_visibility: {},
      content: {
        hero: { text_above_names: "THE WEDDING OF" },
        story: { title_our: "A Nossa", title_history: "História", paragraphs: ["Conhecemo-nos num dia de chuva.", "Três anos depois, dissemos que sim.", ""] },
      },
    },
  }];
  T.guests = []; T.guest_links = []; T.event_tables = []; T.invitation_collaborators = [];
  T.super_admins = []; T.invite_access = []; T.invite_access_attempts = [];
  const g = (name, category, gender, side, group_id, status, extra = {}) =>
    T.guests.push({ id: crypto.randomUUID(), invitation_id: INV, name, category, gender, side, group_id, status, dietary_notes: null, notes: null, table_id: null, ...extra });
  g("Maria Silva", "adult", "feminino", "noiva", "Família Silva", "confirmed");
  g("José Silva", "adult", "masculino", "noiva", "Família Silva", "confirmed", { dietary_notes: "Sem glúten" });
  g("Pedro Silva", "child", "masculino", "noiva", "Família Silva", "confirmed");
  g("Ana Costa", "adult", "feminino", "noivo", "Ana e Tiago", "confirmed", { dietary_notes: "Vegetariano" });
  g("Tiago Costa", "adult", "masculino", "noivo", "Ana e Tiago", "pending");
  g("Marta Santos", "adult", "feminino", "comum", "Marta e Bruno", "confirmed");
  g("Bruno Santos", "adult", "masculino", "comum", "Marta e Bruno", "confirmed");
  g("Carlos Ferreira", "adult", "masculino", "noivo", "SOLO-1", "pending");
  g("Sofia Mendes", "adult", "feminino", "noiva", "SOLO-2", "declined");
  g("Helena Lopes", "adult", "feminino", "noivo", "Família Lopes", "pending");
  g("António Lopes", "adult", "masculino", "noivo", "Família Lopes", "pending");
  g("Inês Lopes", "adult", "feminino", "noivo", "Família Lopes", "pending");
  g("Leo Lopes", "baby", "masculino", "noivo", "Família Lopes", "pending");
  const id = n => T.guests.find(x => x.name === n).id;
  const tbl = (name, shape, capacity, x, y) => { const t = { id: crypto.randomUUID(), invitation_id: INV, name, shape, capacity, position_x: x, position_y: y }; T.event_tables.push(t); return t; };
  const t1 = tbl("Mesa 1", "round", 8, 80, 70), t2 = tbl("Mesa 2", "square", 8, 330, 70), t3 = tbl("Mesa 3", "rectangular", 10, 150, 300);
  ["Maria Silva", "José Silva", "Pedro Silva", "Ana Costa", "Tiago Costa"].forEach(n => { T.guests.find(x => x.id === id(n)).table_id = t1.id; });
  ["Marta Santos", "Bruno Santos"].forEach(n => { T.guests.find(x => x.id === id(n)).table_id = t2.id; });
  const link = (group_id, token, opens) => T.guest_links.push({
    id: crypto.randomUUID(), invitation_id: INV, group_id, token, display_name: null, seats_override: null, created_at: new Date().toISOString(),
    first_opened_at: opens ? "2027-02-03T18:20:00Z" : null, last_opened_at: opens ? "2027-02-10T21:05:00Z" : null, open_count: opens,
  });
  link("Família Silva", "SilvaTok01", 3); link("Ana e Tiago", "CostaTok02", 1); link("Marta e Bruno", "SantosTok3", 0); link("SOLO-1", "FerreiTok4", 0); link("Família Lopes", "LopesTok05", 0);
  T.invitation_collaborators.push(
    { id: crypto.randomUUID(), invitation_id: INV, user_email: "familia@exemplo.com", role: "editor" },
    { id: crypto.randomUUID(), invitation_id: INV, user_email: "planner@exemplo.com", role: "viewer" },
  );
}
seed();

function match(row, q) {
  for (const [k, v] of q) {
    if (["select", "order", "limit", "offset", "columns"].includes(k)) continue;
    const m = v.match(/^(eq|neq|in|is|gte|lt)\.(.*)$/); if (!m) continue;
    const [, op, val] = m; const cell = row[k];
    if (op === "eq" && String(cell) !== val) return false;
    if (op === "neq" && String(cell) === val) return false;
    if (op === "gte" && !(String(cell) >= val)) return false;
    if (op === "lt" && !(String(cell) < val)) return false;
    if (op === "is" && !(val === "null" ? cell == null : false)) return false;
    if (op === "in" && !val.replace(/[()]/g, "").split(",").includes(String(cell))) return false;
  }
  return true;
}

http.createServer((req, res) => {
  const h = { "access-control-allow-origin": req.headers.origin || "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*", "access-control-allow-credentials": "true" };
  if (req.method === "OPTIONS") { res.writeHead(204, h); return res.end(); }
  const u = new URL(req.url, "http://x");
  if (u.pathname === "/__seed") { seed(); res.writeHead(200, h); return res.end("seeded"); }
  if (u.pathname === "/__state") { res.writeHead(200, { ...h, "content-type": "application/json" }); return res.end(JSON.stringify(T)); }
  if (u.pathname === "/auth/v1/user") {
    res.writeHead(200, { ...h, "content-type": "application/json" });
    return res.end(JSON.stringify({ id: "u1", aud: "authenticated", role: "authenticated", email: "test@example.com", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" }));
  }
  const m = u.pathname.match(/^\/rest\/v1\/(\w+)/);
  if (!m) { res.writeHead(404, h); return res.end("{}"); }
  const name = m[1]; const rows = T[name] || (T[name] = []);
  let body = ""; req.on("data", d => body += d);
  req.on("end", () => {
    const json = (code, o, extra = {}) => { res.writeHead(code, { ...h, "content-type": "application/json", ...extra }); res.end(JSON.stringify(o)); };
    const q = [...u.searchParams.entries()];
    const rep = (req.headers.prefer || "").includes("return=representation");
    if (req.method === "POST") {
      const out = [].concat(JSON.parse(body || "[]")).map(r => { const row = { id: crypto.randomUUID(), created_at: new Date().toISOString(), display_name: null, seats_override: null, ...r }; rows.push(row); return row; });
      return rep ? json(201, out) : (res.writeHead(201, h), res.end());
    }
    if (req.method === "PATCH") { const hit = rows.filter(r => match(r, q)); hit.forEach(r => Object.assign(r, JSON.parse(body || "{}"))); return rep ? json(200, hit) : (res.writeHead(204, h), res.end()); }
    if (req.method === "DELETE") { for (let i = rows.length - 1; i >= 0; i--) if (match(rows[i], q)) rows.splice(i, 1); res.writeHead(204, h); return res.end(); }
    const hit = rows.filter(r => match(r, q));
    if ((req.headers.accept || "").includes("vnd.pgrst.object")) return hit.length ? json(200, hit[0]) : json(406, { code: "PGRST116", message: "no rows", details: "", hint: "" });
    json(200, hit, { "content-range": `0-${Math.max(hit.length - 1, 0)}/${hit.length}` });
  });
}).listen(54321, () => console.log("mock supabase on :54321"));
