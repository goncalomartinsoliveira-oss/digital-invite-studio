"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

// Ecrã de código do convite (quando o administrador o ligou). Propositadamente
// sem nomes, data, fotos ou marca: quem só tem o link não fica a saber nada do
// evento. O convite em si nem chega ao browser — é a página, no servidor, que
// decide mostrar isto em vez do convite.

type Dict = {
  title: string; desc: string; label: string; submit: string; submitting: string;
  wrong: string; tooMany: string; error: string;
};

export default function InviteAccessGate({ invitationId, dict }: { invitationId: string; dict: Dict }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 4 || busy) return;
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/invite-access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ invitationId, code }),
      });
      if (res.ok) { router.refresh(); return; }
      setMsg(res.status === 401 ? dict.wrong : res.status === 429 ? dict.tooMany : dict.error);
      if (res.status === 401) setCode("");
    } catch {
      setMsg(dict.error);
    }
    setBusy(false);
  };

  return (
    <div data-invite-gate className="min-h-screen flex items-center justify-center bg-[#FDFBF7] px-6 font-sans">
      <form onSubmit={submit} className="w-full max-w-sm text-center space-y-6">
        <div className="mx-auto w-14 h-14 rounded-full border border-[#EFDFBB] bg-white flex items-center justify-center text-[#630100]">
          <Lock size={22} />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-3xl text-[#332E2B]">{dict.title}</h1>
          <p className="text-sm text-gray-500">{dict.desc}</p>
        </div>
        <div>
          <label htmlFor="invite-code" className="sr-only">{dict.label}</label>
          <input
            id="invite-code"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            maxLength={4}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="0000"
            autoFocus
            className="w-full text-center text-3xl tracking-[0.6em] pl-[0.6em] py-4 bg-white border border-[#EFDFBB] rounded-2xl outline-none focus:border-[#630100] transition-colors text-[#332E2B] placeholder:text-gray-200"
          />
        </div>
        {msg && <p role="alert" className="text-sm text-red-500">{msg}</p>}
        <button
          type="submit"
          disabled={code.length !== 4 || busy}
          className="w-full bg-[#630100] text-white py-4 rounded-full text-[11px] font-bold uppercase tracking-[0.25em] disabled:opacity-40 transition-opacity"
        >
          {busy ? dict.submitting : dict.submit}
        </button>
      </form>
    </div>
  );
}
