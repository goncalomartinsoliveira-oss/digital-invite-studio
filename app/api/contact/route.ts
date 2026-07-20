import { NextRequest, NextResponse } from "next/server";
import { resend, CONTACT_FROM, CONTACT_TO } from "@/lib/resend";

// Envia o formulário de contacto do site por email via Resend — não grava
// nada na base de dados, é só uma ponte para a caixa de correio da equipa.
export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Preencha nome, email e mensagem." }, { status: 400 });
    }

    const { error } = await resend.emails.send({
      from: CONTACT_FROM,
      to: CONTACT_TO,
      replyTo: email,
      subject: `[Site] ${subject || "Nova mensagem"} — ${name}`,
      text: `Nome: ${name}\nEmail: ${email}\nAssunto: ${subject || "—"}\n\nMensagem:\n${message}`,
    });

    if (error) {
      console.error("[contact] Erro ao enviar via Resend:", error);
      return NextResponse.json({ error: "Erro ao enviar a mensagem." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[contact] Erro:", err.message);
    return NextResponse.json({ error: "Erro ao enviar a mensagem." }, { status: 500 });
  }
}
