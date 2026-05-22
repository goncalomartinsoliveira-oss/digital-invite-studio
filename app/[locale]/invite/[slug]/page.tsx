import { supabase } from "@/lib/supabase";
import LuxuryTemplate from "../../templates/luxury-01/page";
import CollageTemplate from "../../templates/collage-01/page";
import Minimal01Template from "../../templates/minimal-01/page";

// 1. IMPORTAR OS DICIONÁRIOS (4 níveis de recuo)
import pt from "../../../../dictionaries/pt";
import en from "../../../../dictionaries/en";

const dictionaries = {
  pt: pt,
  en: en
};

// Atualizámos o tipo de 'params' para suportar as versões mais recentes do Next.js
export default async function InvitePage(props: { params: Promise<{ slug: string, locale: string }> }) {
  // 1. Esperar que os parâmetros do link estejam prontos (obrigatório no Next.js 15+)
  const params = await props.params;
  
  // 2. DESCOBRIR A LÍNGUA ATUAL
  const locale = (params?.locale as 'en' | 'pt') || 'pt';
  
  // 3. SELECIONAR OS TEXTOS CORRETOS
  const dict = dictionaries[locale]?.InvitePage || dictionaries.pt.InvitePage;

  // 4. Descodificar o endereço
  const decodedSlug = decodeURIComponent(params.slug || "");
  
  // 5. Criar uma versão com espaços (para o caso de o URL ter traços mas a base de dados ter espaços)
  const slugWithSpaces = decodedSlug.replace(/-/g, ' ');

  // 6. Procurar o convite na base de dados de forma inteligente (testa ambas as hipóteses)
  const { data: invite, error } = await supabase
    .from("invitations")
    .select("*")
    .or(`slug.eq.${decodedSlug},slug.eq.${slugWithSpaces}`)
    .single();

  // 7. Ecrã amigável caso não encontre (agora já não deve dar erro!)
  if (error || !invite) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-[#FDFBF7] p-8 text-center font-sans">
        <h1 className="text-3xl font-serif text-[#722F37] mb-4">{dict.notFoundTitle}</h1>
        <p className="text-gray-600 mb-6">{dict.notFoundDesc}<br/><strong className="text-gray-900 text-lg">{decodedSlug}</strong></p>
        
        <div className="bg-white p-4 rounded-xl border border-gray-200 text-xs text-gray-500 max-w-md text-left shadow-sm">
          <p className="font-bold text-gray-700 mb-1">{dict.errorDetails}</p>
          <p>{error?.message || dict.defaultError}</p>
        </div>
      </div>
    );
  }

  // 8. RENDERIZAÇÃO DO TEMPLATE CORRETO
  return (
    <main>
      {invite.template_id === 'collage-01' ? (
        <CollageTemplate data={invite} />
      ) : invite.template_id === 'minimal-01' ? (
        <Minimal01Template data={invite} params={params} />
      ) : (
        <LuxuryTemplate data={invite} params={params} />
      )}
    </main>
  );
}