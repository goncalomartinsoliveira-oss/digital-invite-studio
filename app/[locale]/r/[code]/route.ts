import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { REF_COOKIE, REF_COOKIE_DAYS, findPartnerByCode, normalizeCode } from "@/lib/referrals";

// Link de recomendação de um parceiro: digitalinvitestudio.com/r/CODIGO
// (o middleware acrescenta o idioma). Se o código existir e a recomendação
// estiver ligada, guarda-o num cookie durante 90 dias (lib/referrals.ts) e
// segue para a página inicial. Um código inválido segue na mesma, sem cookie.
export async function GET(req: NextRequest, ctx: { params: Promise<{ locale: string; code: string }> }) {
  const { locale, code } = await ctx.params;
  const target = new URL(`/${locale === "en" ? "en" : "pt"}`, req.url);
  const res = NextResponse.redirect(target);
  const partner = await findPartnerByCode(supabaseAdmin, code);
  if (partner) {
    res.cookies.set(REF_COOKIE, normalizeCode(code), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: REF_COOKIE_DAYS * 86400,
    });
  }
  return res;
}
