import { createClient } from "@supabase/supabase-js";

// Cliente com a service_role key — ignora RLS por completo. Só pode ser
// usado em código que corre no servidor (rotas de API/webhooks); nunca
// importar isto num componente "use client".
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Fallback só para não rebentar o build/arranque enquanto a env var não
// estiver configurada — ver o mesmo comentário em lib/stripe.ts.
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder_not_configured";

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
