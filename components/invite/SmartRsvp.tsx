// components/invite/SmartRsvp.tsx
"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import pt from "@/dictionaries/pt";
import en from "@/dictionaries/en";

const dictionaries = { pt, en };

interface SmartRsvpProps {
  invitationId: string;
}

export default function SmartRsvp({ invitationId }: SmartRsvpProps) {
  const params = useParams();
  const locale = (params?.locale as "en" | "pt") || "pt";
  const dict = (dictionaries[locale]?.SmartRsvp || dictionaries.pt.SmartRsvp);

  const [searchTerm, setSearchTerm] = useState("");
  const [foundGuests, setFoundGuests] = useState<any[]>([]);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  // Steps: 0: Search, 1: Group form, 2: Success, 3: Request form, 4: Request success
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [requestName, setRequestName] = useState("");
  const [requestContact, setRequestContact] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Dynamic name search (accent-insensitive)
  useEffect(() => {
    if (searchTerm.length < 3) { setFoundGuests([]); return; }

    const delayDebounceFn = setTimeout(async () => {
      setLoadingSearch(true);
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('invitation_id', invitationId)
        .neq('status', 'requested');

      if (!error && data) {
        const normalizeStr = (str: string) => str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
        const searchNormalized = normalizeStr(searchTerm);
        setFoundGuests(data.filter((g: any) => normalizeStr(g.name).includes(searchNormalized)).slice(0, 5));
      }
      setLoadingSearch(false);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, invitationId]);

  // Fetch dietary tags from invitation settings
  useEffect(() => {
    const fetchInvitationTags = async () => {
      if (!invitationId) return;
      const { data, error } = await supabase
        .from('invitations')
        .select('dietary_tags')
        .eq('id', invitationId)
        .single();
      if (!error && data && data.dietary_tags) {
        setAvailableTags(data.dietary_tags.split(',').map((t: string) => t.trim()).filter(Boolean));
      }
    };
    fetchInvitationTags();
  }, [invitationId]);

  const handleSelectGroup = async (guest: any) => {
    setLoadingSearch(true);
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('invitation_id', invitationId)
      .eq('group_id', guest.group_id);

    if (!error && data) { setGroupMembers(data); setStep(1); setSearchTerm(""); }
    setLoadingSearch(false);
  };

  const handleSubmitRSVP = async () => {
    setSubmitting(true);
    const results = await Promise.all(groupMembers.map(member =>
      supabase.from('guests').update({
        status: member.status,
        dietary_notes: member.status === 'confirmed' ? member.dietary_notes : null,
        notes: member.status === 'confirmed' ? member.notes : null
      }).eq('id', member.id)
    ));

    if (results.some(r => r.error)) alert(dict.alerts.saveError);
    else setStep(2);
    setSubmitting(false);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestName.trim()) return;
    setSubmitting(true);

    const combinedNotes = `${dict.notes.contactPrefix}: ${requestContact} | ${dict.notes.messagePrefix}: ${requestMessage}`;

    const { error } = await supabase.from('guests').insert([{
      invitation_id: invitationId,
      name: requestName,
      category: 'adult',
      gender: 'masculino',
      side: 'comum',
      status: 'requested',
      dietary_notes: null,
      notes: combinedNotes,
      group_id: `REQ-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    }]);

    if (!error) {
      setStep(4);
      setRequestName(""); setRequestContact(""); setRequestMessage("");
    } else {
      alert(dict.alerts.submitError);
    }
    setSubmitting(false);
  };

  const s0 = dict.step0;
  const s1 = dict.step1;

  return (
    <section id="rsvp" className="py-24 px-6 bg-white border-t border-neutral-100 font-sans">
      <div className="max-w-xl mx-auto space-y-12">
        <header className="text-center space-y-2">
          <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-bold block">RSVP</span>
          <h2 className="font-serif text-4xl uppercase tracking-tighter">{dict.title}</h2>
          <div className="h-px w-12 bg-neutral-200 mx-auto mt-6"></div>
        </header>

        <AnimatePresence mode="wait">

          {/* STEP 0 — SEARCH */}
          {step === 0 && (
            <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <p className="text-sm text-center text-neutral-600 italic">{s0.description}</p>
              <div>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={s0.placeholder}
                    className="w-full border border-neutral-200 p-5 rounded-sm text-sm outline-none focus:border-black transition-colors bg-neutral-50"
                  />
                  {loadingSearch && <div className="absolute right-5 top-5 text-xs text-neutral-400 animate-pulse">{s0.searching}</div>}
                </div>
                {searchTerm.length > 0 && searchTerm.length < 3 && (
                  <p className="text-[10px] text-neutral-400 mt-2 px-1 text-center italic">{s0.minCharsHint}</p>
                )}
              </div>

              {foundGuests.length > 0 && (
                <ul className="border border-neutral-100 divide-y rounded-sm bg-white shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                  {foundGuests.map(g => (
                    <li key={g.id} onClick={() => handleSelectGroup(g)} className="p-5 flex justify-between items-center cursor-pointer hover:bg-neutral-50 transition-all">
                      <span className="font-bold text-neutral-800">{g.name}</span>
                      <span className="text-[9px] uppercase tracking-widest text-neutral-400">{s0.selectBtn}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="text-center pt-8">
                <button
                  onClick={() => setStep(3)}
                  className="text-xs text-neutral-400 hover:text-black transition-colors underline underline-offset-4 decoration-neutral-200"
                >
                  {s0.nameNotFound}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 1 — GROUP FORM */}
          {step === 1 && (
            <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="text-center">
                <h3 className="font-serif text-2xl italic">{s1.title}</h3>
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-2">{s1.subtitle}</p>
              </div>

              <div className="space-y-4">
                {groupMembers.map((member, idx) => (
                  <div key={member.id} className="p-6 border border-neutral-100 rounded-sm space-y-4 bg-neutral-50/50">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-neutral-900">{member.name}</p>
                        <p className="text-[9px] uppercase tracking-widest opacity-50">
                          {member.category === 'adult' ? s1.categoryAdult : member.category === 'child' ? s1.categoryChild : s1.categoryBaby}
                        </p>
                      </div>
                      <select
                        value={member.status}
                        onChange={(e) => {
                          const updated = [...groupMembers];
                          updated[idx].status = e.target.value;
                          setGroupMembers(updated);
                        }}
                        className={`text-[10px] uppercase tracking-widest font-bold p-3 border rounded-sm outline-none transition-all ${member.status === 'confirmed' ? 'bg-black text-white' : 'bg-white'}`}
                      >
                        <option value="pending">{s1.statusPending}</option>
                        <option value="confirmed">{s1.statusConfirmed}</option>
                        <option value="declined">{s1.statusDeclined}</option>
                      </select>
                    </div>

                    {member.status === 'confirmed' && (
                      <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-1 pt-4 border-t border-neutral-200/50">
                        {availableTags.length > 0 && (
                          <div>
                            <p className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold mb-2">{s1.dietaryLabel}</p>
                            <div className="flex flex-wrap gap-2">
                              {availableTags.map(tag => {
                                const currentTags = member.dietary_notes ? member.dietary_notes.split(',').filter(Boolean) : [];
                                const isSelected = currentTags.includes(tag);
                                return (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => {
                                      let newTags = [...currentTags];
                                      if (isSelected) newTags = newTags.filter(t => t !== tag);
                                      else newTags.push(tag);
                                      const updated = [...groupMembers];
                                      updated[idx].dietary_notes = newTags.join(',');
                                      setGroupMembers(updated);
                                    }}
                                    className={`px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase transition-colors border ${isSelected ? 'bg-black border-black text-white' : 'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-400'}`}
                                  >
                                    {tag}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div>
                          <p className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold mb-1 block">{s1.notesLabel}</p>
                          <input
                            type="text"
                            placeholder={s1.notesPlaceholder}
                            value={member.notes || ""}
                            onChange={(e) => {
                              const updated = [...groupMembers];
                              updated[idx].notes = e.target.value;
                              setGroupMembers(updated);
                            }}
                            className="w-full border-b border-neutral-200 bg-transparent py-2 text-xs outline-none focus:border-black transition-colors italic placeholder:text-neutral-300"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(0)}
                  className="w-1/3 border border-neutral-200 text-neutral-500 py-6 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-neutral-50 transition-all"
                >
                  {s1.backBtn}
                </button>
                <button
                  onClick={handleSubmitRSVP}
                  disabled={submitting || groupMembers.every(m => m.status === 'pending')}
                  className="w-2/3 bg-black text-white py-6 text-[10px] uppercase tracking-[0.4em] font-bold shadow-2xl disabled:bg-neutral-200 transition-all active:scale-[0.98]"
                >
                  {submitting ? s1.savingBtn : s1.confirmBtn}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2 — RSVP SUCCESS */}
          {step === 2 && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 space-y-6">
              <span className="text-6xl block mb-4">🥂</span>
              <h3 className="font-serif text-3xl uppercase tracking-tighter">{dict.step2.title}</h3>
              <p className="text-sm text-neutral-500 max-w-xs mx-auto italic leading-relaxed">{dict.step2.message}</p>
              <button onClick={() => setStep(0)} className="text-[9px] uppercase tracking-[0.2em] opacity-30 hover:opacity-100 pt-12 transition-all">{dict.step2.editBtn}</button>
            </motion.div>
          )}

          {/* STEP 3 — REQUEST FORM */}
          {step === 3 && (
            <motion.div key="request-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="text-center border-b border-neutral-100 pb-6">
                <h3 className="font-serif text-2xl italic">{dict.step3.title}</h3>
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-2 leading-relaxed">{dict.step3.description}</p>
              </div>

              <form onSubmit={handleSubmitRequest} className="space-y-5">
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold mb-1 block">{dict.step3.nameLbl}</label>
                  <input
                    type="text" required
                    value={requestName} onChange={(e) => setRequestName(e.target.value)}
                    className="w-full border-b border-neutral-200 bg-transparent py-3 text-sm outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold mb-1 block">{dict.step3.contactLbl}</label>
                  <input
                    type="text" required
                    value={requestContact} onChange={(e) => setRequestContact(e.target.value)}
                    className="w-full border-b border-neutral-200 bg-transparent py-3 text-sm outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold mb-1 block">{dict.step3.messageLbl}</label>
                  <input
                    type="text" placeholder={dict.step3.messagePlaceholder}
                    value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)}
                    className="w-full border-b border-neutral-200 bg-transparent py-3 text-sm outline-none focus:border-black transition-colors italic placeholder:text-neutral-300"
                  />
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button" onClick={() => setStep(0)}
                    className="w-1/3 border border-neutral-200 text-neutral-500 py-5 text-[9px] uppercase tracking-[0.2em] font-bold hover:bg-neutral-50 transition-all"
                  >
                    {dict.step3.cancelBtn}
                  </button>
                  <button
                    type="submit" disabled={submitting || !requestName.trim()}
                    className="w-2/3 bg-black text-white py-5 text-[9px] uppercase tracking-[0.2em] font-bold shadow-xl disabled:bg-neutral-200 transition-all active:scale-[0.98]"
                  >
                    {submitting ? dict.step3.sendingBtn : dict.step3.submitBtn}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* STEP 4 — REQUEST SUCCESS */}
          {step === 4 && (
            <motion.div key="request-success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 space-y-6">
              <span className="text-6xl block mb-4">💌</span>
              <h3 className="font-serif text-3xl uppercase tracking-tighter">{dict.step4.title}</h3>
              <p className="text-sm text-neutral-500 max-w-xs mx-auto italic leading-relaxed">{dict.step4.message}</p>
              <button onClick={() => setStep(0)} className="text-[9px] uppercase tracking-[0.2em] opacity-30 hover:opacity-100 pt-12 transition-all">{dict.step4.backBtn}</button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </section>
  );
}
