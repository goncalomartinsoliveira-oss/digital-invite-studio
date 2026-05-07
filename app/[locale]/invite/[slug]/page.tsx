import { supabase } from "@/lib/supabase";
import LuxuryTemplate from "../../templates/luxury-01/page";
import CollageTemplate from "../../templates/collage-01/page";

// Atualizámos o tipo de 'params' para suportar as versões mais recentes do Next.js
export default async function InvitePage(props: { params: Promise<{ slug: string, locale: string }> }) {
  // 1. Esperar que os parâmetros do link estejam prontos (obrigatório no Next.js 15+)
  const params = await props.params;
  
  // 2. Descodificar o endereço
  const decodedSlug = decodeURIComponent(params.slug || "");
  
  // 3. Criar uma versão com espaços (para o caso de o URL ter traços mas a base de dados ter espaços)
  const slugWithSpaces = decodedSlug.replace(/-/g, ' ');

  // 4. Procurar o convite na base de dados de forma inteligente (testa ambas as hipóteses)
  const { data: invite, error } = await supabase
    .from("invitations")
    .select("*")
    .or(`slug.eq.${decodedSlug},slug.eq.${slugWithSpaces}`)
    .single();

  // 5. Ecrã amigável caso não encontre (agora já não deve dar erro!)
  if (error || !invite) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-[#FDFBF7] p-8 text-center font-sans">
        <h1 className="text-3xl font-serif text-[#722F37] mb-4">Convite não encontrado</h1>
        <p className="text-gray-600 mb-6">Não conseguimos encontrar nenhum convite com o endereço:<br/><strong className="text-gray-900 text-lg">{decodedSlug}</strong></p>
        
        <div className="bg-white p-4 rounded-xl border border-gray-200 text-xs text-gray-500 max-w-md text-left shadow-sm">
          <p className="font-bold text-gray-700 mb-1">Detalhes do erro para diagnóstico:</p>
          <p>{error?.message || "O convite não existe na base de dados com este slug."}</p>
        </div>
      </div>
    );
  }

  // 6. RENDERIZAÇÃO DO TEMPLATE CORRETO
  return (
    <main>
      {invite.template_id === 'collage-01' ? (
        <CollageTemplate data={invite} />
      ) : invite.template_id === 'minimal-01' ? (
        <div className="flex min-h-screen items-center justify-center bg-white text-xl font-serif">
          O modelo Modern Minimal está em desenvolvimento.
        </div>
      ) : (
        <LuxuryTemplate data={invite} params={params} />
      )}
    </main>
  );
}