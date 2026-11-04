"use client";
import { useEffect, useState } from "react";
import { Lock, Copy, Check, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

// "Acesso ao convite": código de 4 dígitos opcional, desligado por omissão.
// O interruptor e a versão ficam em invitations (não secretos, a página
// precisa de os ler); o código fica em invite_access, que só quem edita o
// evento consegue ler (RLS). A verificação a quem abre o convite é feita no
// servidor — ver app/api/invite-access.

type Dict = {
  title: string; badge: string; intro: string; switchLabel: string; codeLabel: string;
  copyCode: string; copyBoth: string; copied: string; codeWord: string; change: string; save: string;
  random: string; confirmChange: string; scope: string; weak: string; invalid: string; error: string;
};

type Props = {
  invitationId: string;
  inviteUrl: string;
  enabled: boolean;
  version: number;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onChanged: () => void; // pede ao painel que renove o acesso da pré-visualização
  dict: Dict;
};

function randomCode(): string {
  const n = new Uint32Array(1);
  crypto.getRandomValues(n);
  return String(n[0] % 10000).padStart(4, "0");
}

export default function InviteAccessCard({ invitationId, inviteUrl, enabled, version, setFormData, onChanged, dict }: Props) {
  const [code, setCode] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<"code" | "both" | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.from("invite_access").select("code").eq("invitation_id", invitationId).maybeSingle().then(({ data }) => {
      if (cancelled) return;
      setCode(data?.code ?? null);
      setDraft(data?.code ?? "");
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, [invitationId]);

  const fail = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 5000); };

  // Grava o código (insere ou atualiza). Devolve true se correu bem.
  const writeCode = async (value: string): Promise<boolean> => {
    const { data: existing } = await supabase.from("invite_access").select("invitation_id").eq("invitation_id", invitationId).maybeSingle();
    const { error } = existing
      ? await supabase.from("invite_access").update({ code: value, updated_at: new Date().toISOString() }).eq("invitation_id", invitationId)
      : await supabase.from("invite_access").insert([{ invitation_id: invitationId, code: value }]);
    if (error) return false;
    setCode(value); setDraft(value);
    return true;
  };

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    const turningOn = !enabled;
    if (turningOn && !code) {
      if (!(await writeCode(randomCode()))) { fail(dict.error); setBusy(false); return; }
    }
    const { error } = await supabase.from("invitations").update({ access_code_enabled: turningOn }).eq("id", invitationId);
    if (error) fail(dict.error);
    else { setFormData((f: any) => ({ ...f, access_code_enabled: turningOn })); if (turningOn) onChanged(); }
    setBusy(false);
  };

  const saveCode = async (value: string) => {
    if (!/^[0-9]{4}$/.test(value)) { fail(dict.invalid); return; }
    if (value === code) return;
    // Com o código ligado, mudar obriga quem já entrou a voltar a introduzi-lo.
    if (enabled && !confirm(dict.confirmChange)) { setDraft(code ?? ""); return; }
    setBusy(true);
    if (!(await writeCode(value))) { fail(dict.error); setBusy(false); return; }
    const next = (version || 1) + 1;
    const { error } = await supabase.from("invitations").update({ access_code_version: next }).eq("id", invitationId);
    if (error) fail(dict.error);
    else { setFormData((f: any) => ({ ...f, access_code_version: next })); onChanged(); }
    setBusy(false);
  };

  const copy = async (what: "code" | "both") => {
    if (!code) return;
    const text = what === "code" ? code : `${inviteUrl}\n${dict.codeWord}: ${code}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(c => (c === what ? null : c)), 2000);
    } catch { /* sem permissão — o código está visível */ }
  };

  return (
    <section data-invite-access className="mb-8 bg-white border border-gray-100 rounded-3xl shadow-sm p-6">
      <div className="flex items-start gap-4">
        <span className="w-11 h-11 rounded-2xl bg-cream border border-gold-soft/70 flex items-center justify-center text-brand shrink-0">
          <Lock size={18} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="font-serif text-lg text-ink">{dict.title}</h3>
            <span className="text-[9px] font-bold uppercase tracking-widest bg-gray-50 text-gray-400 px-2 py-0.5 rounded-md">{dict.badge}</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mt-1 max-w-2xl">{dict.intro}</p>
        </div>
        <button
          role="switch"
          aria-checked={enabled}
          aria-label={dict.switchLabel}
          onClick={toggle}
          disabled={!loaded || busy}
          className={`relative w-12 h-7 rounded-full transition-colors shrink-0 disabled:opacity-50 ${enabled ? "bg-brand" : "bg-gray-200"}`}
        >
          <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-5" : ""}`} />
        </button>
      </div>

      {enabled && code && (
        <div className="mt-5 pt-5 border-t border-gray-50">
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{dict.codeLabel}</p>
              <p data-access-code className="font-mono text-4xl tracking-[0.35em] text-ink">{code}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => copy("code")} className="flex items-center gap-1.5 bg-white text-gray-600 border border-gray-200 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 hover:text-brand transition-all">
                {copied === "code" ? <Check size={12} className="text-green-500" /> : <Copy size={12} />} {copied === "code" ? dict.copied : dict.copyCode}
              </button>
              <button onClick={() => copy("both")} className="flex items-center gap-1.5 bg-brand text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-dark transition-all">
                {copied === "both" ? <Check size={12} /> : <Copy size={12} />} {copied === "both" ? dict.copied : dict.copyBoth}
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <label htmlFor="access-code-input" className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{dict.change}</label>
            <input
              id="access-code-input"
              inputMode="numeric"
              maxLength={4}
              value={draft}
              onChange={e => setDraft(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="w-24 text-center font-mono tracking-[0.3em] bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <button onClick={() => saveCode(draft)} disabled={busy || draft === code} className="px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border border-gray-200 text-gray-600 hover:text-brand hover:bg-gray-50 disabled:opacity-40">
              {dict.save}
            </button>
            <button onClick={() => saveCode(randomCode())} disabled={busy} title={dict.random} aria-label={dict.random} className="p-2 rounded-full text-gray-400 hover:text-brand hover:bg-gray-50 disabled:opacity-40">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      )}

      {enabled && (
        <div className="mt-5 space-y-1.5">
          <p className="text-[11px] text-gray-400">{dict.scope}</p>
          <p className="text-[11px] text-gray-400">{dict.weak}</p>
        </div>
      )}
      {msg && <p role="alert" className="mt-3 text-[11px] text-red-500">{msg}</p>}
    </section>
  );
}
