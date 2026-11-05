// Gera as capturas de ecrã do centro de ajuda (public/help/<idioma>/*.webp) a
// partir do painel real, com os dados de exemplo de mock-supabase.cjs.
// Ver README.md para como correr. Os nomes dos ficheiros têm de coincidir com os
// `shots` dos artigos em content/help/pt.ts e en.ts.
const { chromium } = require("playwright");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE_URL || "http://localhost:3001";
const MOCK = process.env.MOCK_URL || "http://localhost:54321";
const OUT = path.resolve(__dirname, "../../public/help");
const SLUG = "joana-e-rui";

const b64 = o => Buffer.from(JSON.stringify(o)).toString("base64url");
const SESSION = {
  access_token: `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: "u1", email: "test@example.com", exp: 4102444800 })}.sig`,
  token_type: "bearer", expires_in: 99999999, expires_at: 4102444800, refresh_token: "r",
  user: { id: "u1", aud: "authenticated", role: "authenticated", email: "test@example.com", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" },
};

// Textos do painel que o script precisa de localizar (por idioma).
const TXT = {
  pt: { dataTools: "Ferramentas de Dados", collaborators: "Colaboradores", account: "Minha Conta", addForm: "Adicionar à Lista" },
  en: { dataTools: "Data Tools", collaborators: "Collaborators", account: "My Account", addForm: "Add to List" },
};

const HIDE_DEV_UI = "nextjs-portal, [data-nextjs-dev-tools-button], #next-logo { display: none !important; }";

async function save(locale, name, pngBuffer) {
  const dir = path.join(OUT, locale);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${name}.webp`);
  await sharp(pngBuffer).resize({ width: 1400, withoutEnlargement: true }).webp({ quality: 80 }).toFile(file);
  console.log(`  ${locale}/${name}.webp  ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
}

// Captura uma região da página (coordenadas da página, não do viewport).
async function shotRegion(page, locale, name, box, pad = 16) {
  const y = box.y - pad, x = Math.max(0, box.x - pad);
  const buf = await page.screenshot({
    fullPage: true,
    clip: { x, y: Math.max(0, y), width: Math.min(box.width + pad * 2, 1440 - x), height: box.height + pad * 2 },
  });
  await save(locale, name, buf);
}

async function pageBox(page, locator) {
  await locator.scrollIntoViewIfNeeded();
  const b = await locator.boundingBox();
  const sy = await page.evaluate(() => window.scrollY);
  return { x: b.x, y: b.y + sy, width: b.width, height: b.height };
}

// Os endereços visíveis nos ecrãs são os do servidor de teste; nas capturas
// mostra-se o domínio verdadeiro. Só muda o texto visível (os QR codes não).
async function maskHost(page) {
  await page.evaluate(() => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (n.nodeValue.includes("localhost:3001")) n.nodeValue = n.nodeValue.replace("http://localhost:3001", "https://digitalinvitestudio.com");
    }
  });
}

// As miniaturas dos modelos vêm de imagens externas (Unsplash), que podem estar
// bloqueadas ou mudar. Nas capturas usam-se mosaicos neutros, um tom por URL.
const TINTS = [["#E8DCCB", "#CDB9A0"], ["#D5DFD0", "#B4C4AE"], ["#E6D3D8", "#C9AAB3"], ["#D3DAE4", "#AEBBCD"], ["#EADFC9", "#CDB98E"], ["#DDD3CB", "#B9A99A"]];
async function tile(url) {
  let h = 0; for (const c of url) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const [a, b] = TINTS[h % TINTS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="500" fill="url(#g)"/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function run(locale) {
  console.log(`\n== ${locale}`);
  await fetch(`${MOCK}/__seed`);
  const browserLocale = locale === "pt" ? "pt-PT" : "en-GB"; // formato das datas nos campos do browser
  const browser = await chromium.launch({ args: [`--lang=${browserLocale}`] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2, locale: browserLocale });
  await ctx.addInitScript(([s, slug]) => {
    localStorage.setItem("sb-localhost-auth-token", JSON.stringify(s));
    localStorage.setItem(`dis_tour_seen_${slug}`, "1");
  }, [SESSION, SLUG]);
  await ctx.route(/images\.unsplash\.com/, async route => route.fulfill({ status: 200, contentType: "image/png", body: await tile(route.request().url()) }));
  const page = await ctx.newPage();
  await page.addInitScript(css => { document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s); }); }, HIDE_DEV_UI);
  const vp = () => page.screenshot();
  const hubCard = i => page.locator("main div.grid button.group").nth(i);
  const backToHub = async () => { await page.locator("aside button").first().click(); await page.waitForSelector("[data-checklist]"); };

  // hub
  await page.goto(`${BASE}/${locale}/dashboard/${SLUG}`, { waitUntil: "load", timeout: 90000 });
  await page.waitForSelector("[data-checklist]", { timeout: 30000 });
  await page.waitForTimeout(800);
  await save(locale, "hub", await vp());

  // convite: modelo e conteúdo
  await hubCard(1).click();
  await page.waitForSelector('[role="tablist"]');
  const frame = await (await page.waitForSelector('iframe[title="Mobile Preview"]')).contentFrame();
  await frame.waitForLoadState("load"); await page.waitForTimeout(2500);
  // Recorte até ao fim dos modelos: o campo de data nativo do Chromium sem interface não respeita o idioma.
  await save(locale, "invite-design", await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 725 } }));
  await page.locator('[role="tab"]').nth(1).click(); await page.waitForTimeout(1200);
  await save(locale, "invite-content", await vp());

  // convidados
  await backToHub(); await hubCard(2).click();
  await page.waitForSelector("[data-guest-links]"); await page.waitForTimeout(1500);
  const formHeading = page.getByText(TXT[locale].addForm, { exact: true }).first();
  await formHeading.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const main = document.querySelector("main.overflow-y-auto");
    const el = [...document.querySelectorAll("h1,h2,h3,h4,p,span")].find(e => /^(Ferramentas de Dados|Data Tools)$/.test(e.textContent.trim()));
    const card = el && el.closest('[class*="rounded-"]');
    if (main && card) main.scrollTo({ top: main.scrollTop + card.getBoundingClientRect().top - 100, behavior: "instant" });
  });
  await page.waitForTimeout(500);
  await save(locale, "guests-list", await vp());
  await page.evaluate(() => { const main = document.querySelector("main.overflow-y-auto"); if (main) main.scrollTo({ top: 0, behavior: "instant" }); });
  const tools = page.getByText(TXT[locale].dataTools, { exact: false }).first();
  await shotRegion(page, locale, "guests-tools", await pageBox(page, tools.locator("xpath=ancestor::*[contains(@class,'rounded-')][1]")), 8);

  // links personalizados
  const panel = page.locator("[data-guest-links]");
  await panel.locator("button[aria-expanded]").click();
  await panel.locator("tr[data-group]").first().waitFor(); await page.waitForTimeout(500);
  await maskHost(page);
  await shotRegion(page, locale, "guest-links", await pageBox(page, panel), 12);

  // mesas
  await page.locator("aside nav button").nth(1).click();
  await page.waitForTimeout(2000);
  await save(locale, "seating-plan", await vp());

  // links e QR + código de acesso
  await backToHub(); await hubCard(5).click();
  await page.waitForSelector("[data-invite-access]"); await page.waitForTimeout(1500);
  await maskHost(page);
  await save(locale, "links-hub", await vp());
  const access = page.locator("[data-invite-access]");
  await access.locator("[role=switch]").click();
  await access.locator("[data-access-code]").waitFor(); await page.waitForTimeout(500);
  await shotRegion(page, locale, "access-card", await pageBox(page, access), 12);

  // o que vê quem não tem o código (telemóvel)
  const mob = await browser.newContext({ viewport: { width: 390, height: 640 }, deviceScaleFactor: 2, locale: browserLocale });
  const mp = await mob.newPage();
  await mp.addInitScript(css => { document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s); }); }, HIDE_DEV_UI);
  await mp.goto(`${BASE}/${locale}/invite/${SLUG}`, { waitUntil: "load", timeout: 60000 });
  await mp.locator("[data-invite-gate]").waitFor(); await mp.waitForTimeout(600);
  await save(locale, "access-gate", await mp.screenshot());

  // RSVP de um grupo (telemóvel, link personalizado)
  const rp = await mob.newPage();
  await rp.addInitScript(css => { document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s); }); }, HIDE_DEV_UI);
  await rp.setViewportSize({ width: 390, height: 900 });
  await rp.goto(`${BASE}/${locale}/rsvp/${SLUG}?c=SilvaTok01`, { waitUntil: "load", timeout: 60000 });
  await rp.locator("select").first().waitFor({ timeout: 20000 });
  await rp.locator("select").nth(0).selectOption("confirmed");
  await rp.locator("select").nth(2).selectOption("declined");
  await rp.waitForTimeout(800);
  await save(locale, "rsvp-group", await rp.screenshot());
  await mob.close();

  // conta: colaboradores
  await page.locator("aside button", { hasText: TXT[locale].account }).click();
  await page.getByText(TXT[locale].collaborators, { exact: true }).first().waitFor(); await page.waitForTimeout(800);
  const colHeading = page.getByText(TXT[locale].collaborators, { exact: true }).first();
  await shotRegion(page, locale, "collaborators", await pageBox(page, colHeading.locator("xpath=ancestor::*[contains(@class,'rounded-')][1]")), 12);

  await browser.close();
}

(async () => {
  const only = process.argv[2];
  for (const l of ["pt", "en"]) if (!only || only === l) await run(l);
  console.log("\nConcluído. Verifiquem as imagens em public/help/ antes de fazer commit.");
})().catch(e => { console.error(e); process.exit(1); });
