"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useBrand } from "@/components/site/BrandProvider";
import { resolveBrandById } from "@/lib/brands";
import EventExpiredScreen from "@/components/site/EventExpiredScreen";
import SmartRsvp from "@/components/invite/SmartRsvp";
import { supabase } from "@/lib/supabase";
import pt from "@/dictionaries/pt";
import en from "@/dictionaries/en";
const dictionaries = { pt, en };

// Página pública standalone de confirmação de presença — pensada para o QR
// code de um convite físico (sem site de casamento). Só precisa do módulo
// "guests_seating", nunca de "invite" — funciona mesmo que o casal não
// tenha comprado o convite digital.
export default function RsvpGuestView() {
  const params = useParams();
  const brand = useBrand();
  const [eventBrand, setEventBrand] = useState<any>(null);
  const locale = (params?.locale as "en" | "pt") || "pt";
  const dict = dictionaries[locale]?.RsvpPublic || dictionaries.pt.RsvpPublic;

  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<{ id: string; groom_name: string; bride_name: string; expires_at?: string | null; unlocked_modules?: string[] | null } | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: invite } = await supabase
        .from("invitations")
        .select("id, groom_name, bride_name, brand_id, expires_at, unlocked_modules")
        .eq("slug", params.slug)
        .single();

      if (!invite) { setLoading(false); return; }
      setInviteData(invite);
      setEventBrand(await resolveBrandById(supabase, (invite as any)?.brand_id));
      setLoading(false);
    }
    fetchData();
  }, [params.slug]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-cream flex items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={40} />
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="fixed inset-0 z-[100] bg-cream flex items-center justify-center flex-col text-center p-6">
        <h1 className="font-serif text-3xl text-brand mb-2">{dict.notFound}</h1>
        <p className="text-gray-500 font-montserrat text-sm">{dict.notFoundSub}</p>
      </div>
    );
  }

  if (inviteData.expires_at && new Date(inviteData.expires_at) < new Date()) {
    const expiredDict = dictionaries[locale]?.EventExpired || dictionaries.pt.EventExpired;
    return <EventExpiredScreen title={expiredDict.title} desc={expiredDict.desc} footerText={expiredDict.footerText} brandName={eventBrand?.name ?? brand.name} />;
  }

  if (!inviteData.unlocked_modules?.includes("guests_seating")) {
    const unavailableDict = dictionaries[locale]?.ModuleUnavailable || dictionaries.pt.ModuleUnavailable;
    const footerText = (dictionaries[locale]?.EventExpired || dictionaries.pt.EventExpired).footerText;
    return <EventExpiredScreen title={unavailableDict.title} desc={unavailableDict.desc} footerText={footerText} brandName={eventBrand?.name ?? brand.name} />;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-cream text-ink font-montserrat flex flex-col selection:bg-brand selection:text-gold-soft overflow-y-auto">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-40 bg-gradient-to-b from-gold-soft/30 to-transparent blur-2xl pointer-events-none"></div>

      <header className="pt-16 pb-2 px-6 text-center shrink-0 relative z-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-brand/60 mb-4">{dict.welcome}</p>
        <h1 className="font-serif text-4xl text-brand leading-tight">
          {inviteData.bride_name} <span className="font-light italic text-[#E5D0A1] text-3xl mx-2">&</span> {inviteData.groom_name}
        </h1>
      </header>

      <main className="flex-1 relative z-10">
        <SmartRsvp invitationId={inviteData.id} />
      </main>

      <footer className="mt-auto py-8 text-center shrink-0 relative z-10">
        <Link href={`/${params.locale}`} className="group flex flex-col items-center justify-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
          <span className="text-[7px] font-bold uppercase tracking-[0.4em] text-gray-400 group-hover:text-brand transition-colors">Powered by</span>
          <span className="text-[11px] font-serif italic tracking-wide text-gray-600 group-hover:text-brand transition-colors">{eventBrand?.name ?? brand.name}</span>
        </Link>
      </footer>
    </div>
  );
}
