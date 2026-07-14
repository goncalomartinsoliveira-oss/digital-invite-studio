"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useBrand } from "@/components/site/BrandProvider";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, ArrowLeft, Loader2 } from "lucide-react";
import pt from "@/dictionaries/pt";
import en from "@/dictionaries/en";
const dictionaries = { pt, en };

interface Guest {
  id: string;
  name: string;
  table_id: string;
}

interface Table {
  id: string;
  name: string;
}

export default function SeatingPlanGuestView() {
  const params = useParams();
  const brand = useBrand();
  const locale = (params?.locale as "en" | "pt") || "pt";
  const dict = dictionaries[locale]?.SeatingPublic || dictionaries.pt.SeatingPublic;

  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<{ groom_name: string; bride_name: string } | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tables, setTables] = useState<Record<string, string>>({}); 
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  useEffect(() => {
    async function fetchData() {
      // 1. Buscar dados do Casamento
      const { data: invite } = await supabase
        .from("invitations")
        .select("id, groom_name, bride_name")
        .eq("slug", params.slug)
        .single();

      if (!invite) {
        setLoading(false);
        return;
      }
      setInviteData(invite);

      // 2. Buscar apenas os convidados que TÊM mesa atribuída
      const { data: guestsData } = await supabase
        .from("guests")
        .select("id, name, table_id")
        .eq("invitation_id", invite.id)
        .not("table_id", "is", null);

      // 3. Buscar as mesas (CORRIGIDO PARA event_tables)
      const { data: tablesData } = await supabase
        .from("event_tables")
        .select("id, name")
        .eq("invitation_id", invite.id);

      // Criar um dicionário de mesas para acesso rápido
      const tablesMap: Record<string, string> = {};
      if (tablesData) {
        tablesData.forEach(t => {
          tablesMap[t.id] = t.name;
        });
      }

      setGuests(guestsData || []);
      setTables(tablesMap);
      setLoading(false);
    }

    fetchData();
  }, [params.slug]);

  // Filtrar convidados à medida que o utilizador escreve
  const filteredGuests = useMemo(() => {
    if (searchQuery.length < 2) return [];
    return guests.filter(g => 
      g.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, guests]);

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

  return (
    /* O 'fixed inset-0 z-[100] overflow-y-auto' garante que a página cobre a Navbar e o Footer globais */
    <div className="fixed inset-0 z-[100] bg-cream text-ink font-montserrat flex flex-col selection:bg-brand selection:text-gold-soft overflow-y-auto">
      
      {/* BACKGROUND DECORATIVO PREMIUM */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-40 bg-gradient-to-b from-gold-soft/30 to-transparent blur-2xl pointer-events-none"></div>

      {/* CABEÇALHO DO EVENTO */}
      <header className="pt-16 pb-8 px-6 text-center shrink-0 relative z-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-brand/60 mb-4">{dict.welcome}</p>
        <h1 className="font-serif text-4xl text-brand leading-tight">
          {inviteData.bride_name} <span className="font-light italic text-[#E5D0A1] text-3xl mx-2">&</span> {inviteData.groom_name}
        </h1>
      </header>

      <main className="flex-1 flex flex-col px-6 max-w-md mx-auto w-full relative z-10">
        <AnimatePresence mode="wait">
          
          {!selectedGuest ? (
            /* VISTA DE PESQUISA */
            <motion.div 
              key="search"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              <div className="bg-white p-6 rounded-[2rem] shadow-2xl shadow-brand/5 border border-gold-soft/30 relative z-10 mt-4">
                <h2 className="font-serif text-2xl text-center mb-6">{dict.findYourSeat}</h2>

                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand/40 group-focus-within:text-brand transition-colors" size={20} />
                  <input
                    type="text"
                    placeholder={dict.searchPlaceholder}
                    className="w-full bg-cream border border-gray-100 focus:border-brand/50 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none transition-all placeholder:text-gray-300 shadow-inner"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              {/* RESULTADOS */}
              <div className="mt-6 flex-1 pb-10">
                {searchQuery.length >= 2 ? (
                  filteredGuests.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-4 mb-4">{dict.selectYourName}</p>
                      {filteredGuests.map(guest => (
                        <button 
                          key={guest.id}
                          onClick={() => setSelectedGuest(guest)}
                          className="w-full bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between hover:border-brand/30 active:scale-95 transition-all text-left group shadow-sm"
                        >
                          <span className="font-semibold text-[14px] text-gray-700 group-hover:text-brand transition-colors">{guest.name}</span>
                          <div className="w-8 h-8 rounded-full bg-brand/5 text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-gold-soft transition-colors shrink-0">
                            <MapPin size={14} />
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center mt-10">
                      <p className="text-gray-500 text-sm font-medium">{dict.notFound2}</p>
                      <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wider">{dict.notFoundTip}</p>
                    </div>
                  )
                ) : (
                  <div className="text-center mt-16 opacity-40 flex flex-col items-center">
                    <Search size={32} className="text-gray-300 mb-4" />
                    <p className="text-xs text-gray-400 font-medium whitespace-pre-line">{dict.typeMinChars}</p>
                  </div>
                )}
              </div>
            </motion.div>

          ) : (
            /* VISTA DA MESA (RESULTADO) */
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col justify-center items-center pb-20 mt-4"
            >
              <div className="w-full bg-white p-10 rounded-[3rem] shadow-2xl shadow-brand/10 border border-gold-soft/50 text-center relative overflow-hidden">
                {/* Background Decorativo Cartão VIP */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-brand"></div>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold-soft/30 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-brand/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10">
                  <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-2">{dict.reservedFor}</p>
                  <h3 className="font-bold text-xl mb-10 text-ink">{selectedGuest.name}</h3>

                  <div className="inline-flex items-center justify-center w-24 h-24 bg-cream border border-gold-soft rounded-full text-brand mb-8 shadow-inner">
                    <MapPin size={36} strokeWidth={1.5} />
                  </div>

                  <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-3">{dict.yourTableIs}</p>
                  <h2 className="font-serif text-5xl text-brand font-regular">
                    {tables[selectedGuest.table_id] || dict.tableNotDefined}
                  </h2>
                </div>
              </div>

              <button 
                onClick={() => {
                  setSelectedGuest(null);
                  setSearchQuery("");
                }}
                className="mt-12 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-brand transition-colors"
              >
                <ArrowLeft size={14} /> {dict.searchAnother}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* RODAPÉ DIGITAL INVITE STUDIO */}
      <footer className="mt-auto py-8 text-center shrink-0 relative z-10">
        <Link href={`/${params.locale}`} className="group flex flex-col items-center justify-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
          <span className="text-[7px] font-bold uppercase tracking-[0.4em] text-gray-400 group-hover:text-brand transition-colors">Powered by</span>
          <span className="text-[11px] font-serif italic tracking-wide text-gray-600 group-hover:text-brand transition-colors">{brand.name}</span>
        </Link>
      </footer>

    </div>
  );
}