import { Resend } from "resend";

// Fallback só para não rebentar o build/arranque enquanto a env var não
// estiver configurada — mesmo padrão de lib/stripe.ts e lib/supabaseAdmin.ts.
export const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder_not_configured");

// Remetente do formulário de contacto — precisa do domínio verificado na
// Resend (registos DNS próprios, à parte dos da Zoho) para poder enviar
// como @digitalinvitestudio.com em vez do domínio de teste da Resend.
export const CONTACT_FROM = "Digital Invite Studio <hello@digitalinvitestudio.com>";
export const CONTACT_TO = "hello@digitalinvitestudio.com";
