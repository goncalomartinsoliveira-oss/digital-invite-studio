import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Confirma que o pedido vem de um super admin (token da sessão no cabeçalho
// Authorization: Bearer). O token é validado com a anon key — o padrão do
// Supabase — e só depois se usa a service_role. Mesmo critério que
// app/api/admin/business-overview.
export async function requireSuperAdmin(req: NextRequest): Promise<{ email: string } | { status: number; error: string }> {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return { status: 401, error: "Não autenticado." };
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data, error } = await authClient.auth.getUser();
  const email = data?.user?.email;
  if (error || !email) return { status: 401, error: "Não autenticado." };
  const { data: sa } = await supabaseAdmin
    .from("super_admins")
    .select("user_email")
    .eq("user_email", email.trim().toLowerCase())
    .maybeSingle();
  if (!sa) return { status: 403, error: "Sem permissão." };
  return { email };
}
