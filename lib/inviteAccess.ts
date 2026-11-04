import crypto from "crypto";

// Código de acesso ao convite (opcional) — parte de SERVIDOR. Nunca importar
// num componente "use client".
//
// Depois de acertar no código o visitante recebe um cookie assinado (HMAC)
// com a versão do código. Mudar o código incrementa a versão em
// invitations.access_code_version e invalida todos os cookies antigos.
// A chave de assinatura deriva da SUPABASE_SERVICE_ROLE_KEY (já obrigatória
// noutras rotas): sem ela não se assina nem se valida nada — um evento com o
// código ligado fica fechado em vez de aberto.

export const ACCESS_CODE_RE = /^[0-9]{4}$/;
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const ACCESS_COOKIE_DAYS = 30;

// Limites de tentativas falhadas (4 dígitos = 10 000 combinações).
export const MAX_FAILS_PER_IP = 5;       // por IP e convite
export const WINDOW_PER_IP_MIN = 15;
export const MAX_FAILS_PER_INVITE = 100; // por convite, todos os IPs juntos
export const WINDOW_PER_INVITE_MIN = 60;

function secret(): string | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return crypto.createHash("sha256").update("dis-invite-access:" + key).digest("hex");
}

export function accessCookieName(invitationId: string): string {
  return "dis_ia_" + crypto.createHash("sha256").update(invitationId).digest("hex").slice(0, 16);
}

function mac(invitationId: string, version: number, exp: number, key: string): string {
  return crypto.createHmac("sha256", key).update(`${invitationId}|${version}|${exp}`).digest("hex");
}

export function signAccessCookie(invitationId: string, version: number): string | null {
  const key = secret();
  if (!key) return null;
  const exp = Math.floor(Date.now() / 1000) + ACCESS_COOKIE_DAYS * 86400;
  return `${version}.${exp}.${mac(invitationId, version, exp, key)}`;
}

export function verifyAccessCookie(invitationId: string, version: number, value: string | undefined): boolean {
  const key = secret();
  if (!key || !value) return false;
  const [v, e, sig] = value.split(".");
  const ver = Number(v), exp = Number(e);
  if (!Number.isInteger(ver) || !Number.isInteger(exp) || !sig) return false;
  if (ver !== version || exp < Math.floor(Date.now() / 1000)) return false;
  const expected = mac(invitationId, ver, exp, key);
  const a = Buffer.from(sig), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function accessCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ACCESS_COOKIE_DAYS * 86400,
  };
}

export function hashIp(ip: string, invitationId: string): string {
  return crypto.createHash("sha256").update(`${secret() ?? ""}|${invitationId}|${ip}`).digest("hex").slice(0, 32);
}

export function safeEqualCode(a: string, b: string): boolean {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
