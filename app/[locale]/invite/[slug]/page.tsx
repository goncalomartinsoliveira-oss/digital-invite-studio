import { supabase } from "@/lib/supabase";
import LuxuryTemplate from "../../templates/luxury-01/page";
import CollageTemplate from "../../templates/collage-01/page";
import Minimal01Template from "../../templates/minimal-01/page";
import ClassicTemplate from "../../templates/classic-01/page";
import NoirTemplate from "../../templates/noir-01/page";
import ArchTemplate from "../../templates/arch-01/page";
import EnvelopeTemplate from "../../templates/envelope-01/page";
import RenaissanceBlueTemplate from "../../templates/renaissance-blue-01/page";
import { EventBrandProvider } from "../../../../components/site/BrandProvider";
import EventExpiredScreen from "../../../../components/site/EventExpiredScreen";
import PreviewBridge from "../../../../components/site/PreviewBridge";
import InviteAccessGate from "../../../../components/invite/InviteAccessGate";
import { cookies } from "next/headers";
import { accessCookieName, verifyAccessCookie, ownerPreviewCookieName, OWNER_PREVIEW_VERSION } from "@/lib/inviteAccess";
import { InviteModeProvider } from "../../../../components/invite/InviteMode";

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
      <div className="flex flex-col min-h-screen items-center justify-center bg-cream p-8 text-center font-sans">
        <h1 className="text-3xl font-serif text-[#722F37] mb-4">{dict.notFoundTitle}</h1>
        <p className="text-gray-600 mb-6">{dict.notFoundDesc}<br/><strong className="text-gray-900 text-lg">{decodedSlug}</strong></p>
        
        <div className="bg-white p-4 rounded-xl border border-gray-200 text-xs text-gray-500 max-w-md text-left shadow-sm">
          <p className="font-bold text-gray-700 mb-1">{dict.errorDetails}</p>
          <p>{error?.message || dict.defaultError}</p>
        </div>
      </div>
    );
  }

  // 7b. Bloqueio total: passado o prazo (60 dias após o evento), o convite deixa de ficar acessível.
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    const expiredDict = dictionaries[locale]?.EventExpired || dictionaries.pt.EventExpired;
    return <EventExpiredScreen title={expiredDict.title} desc={expiredDict.desc} />;
  }

  // 7c. Convite por publicar (Plano Completo por pagar): os convidados veem
  // "ainda não foi publicado"; quem gere o evento, com o cookie de
  // pré-visualização (api/invite-access/preview), vê o convite completo.
  const unpublished = !invite.unlocked_modules?.includes("invite");
  if (unpublished) {
    const store = await cookies();
    const ownerPreview = verifyAccessCookie(invite.id, OWNER_PREVIEW_VERSION, store.get(ownerPreviewCookieName(invite.id))?.value);
    if (!ownerPreview) {
      const unpublishedDict = dictionaries[locale]?.InviteUnpublished || dictionaries.pt.InviteUnpublished;
      return <EventExpiredScreen title={unpublishedDict.title} desc={unpublishedDict.desc} />;
    }
  }
  const unpublishedLabel = (dictionaries[locale]?.InviteUnpublished || dictionaries.pt.InviteUnpublished).previewBadge;

  // 7d. Código de acesso (opcional, desligado por omissão): se o administrador
  // o ligou, sem o cookie de acesso só se mostra o ecrã do código — nenhum
  // dado do evento sai do servidor. Fica depois das verificações de
  // expirado/módulo, que também não revelam nada.
  if (invite.access_code_enabled) {
    const store = await cookies();
    const granted = verifyAccessCookie(invite.id, invite.access_code_version ?? 1, store.get(accessCookieName(invite.id))?.value);
    if (!granted) {
      const gateDict = dictionaries[locale]?.InviteAccess || dictionaries.pt.InviteAccess;
      return <InviteAccessGate invitationId={invite.id} dict={gateDict} />;
    }
  }

  // 8. RENDERIZAÇÃO DO TEMPLATE CORRETO (com a marca do próprio evento)
  return (
    <main>
      <PreviewBridge />
      <InviteModeProvider unpublished={unpublished} label={unpublishedLabel}>
      <EventBrandProvider brandId={invite.brand_id}>
        {invite.template_id === 'collage-01' ? (
          <CollageTemplate data={invite} />
        ) : invite.template_id === 'minimal-01' ? (
          <Minimal01Template data={invite} params={params} />
        ) : invite.template_id === 'classic-01' ? (
          <ClassicTemplate data={invite} params={params} />
        ) : invite.template_id === 'noir-01' ? (
          <NoirTemplate data={invite} params={params} />
        ) : invite.template_id === 'arch-01' ? (
          <ArchTemplate data={invite} params={params} />
        ) : invite.template_id === 'envelope-01' ? (
          <EnvelopeTemplate data={invite} params={params} />
        ) : invite.template_id === 'renaissance-blue-01' || invite.template_id === 'envelope-01-jose-e-dalia' ? (
          // 'envelope-01-jose-e-dalia' é o id antigo, ainda gravado no evento da Dália e do José.
          <RenaissanceBlueTemplate data={invite} params={params} />
        ) : (
          <LuxuryTemplate data={invite} params={params} />
        )}
      </EventBrandProvider>
      </InviteModeProvider>
    </main>
  );
}