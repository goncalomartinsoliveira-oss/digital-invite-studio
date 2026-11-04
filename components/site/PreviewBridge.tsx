"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Ponte entre o painel e a pré-visualização (iframe do próprio convite).
// Depois de cada gravação o painel envia 'dis-preview-refresh'; aqui o convite
// refaz só os dados do servidor (router.refresh) em vez de recarregar a página,
// o que preserva o estado do cliente — por exemplo o envelope já aberto, o
// scroll e a secção em que o casal estava a olhar. Só reage dentro de iframe e
// a mensagens da mesma origem, por isso não tem efeito num convite aberto
// por um convidado.
export default function PreviewBridge() {
  const router = useRouter();

  useEffect(() => {
    if (window.parent === window) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data === "dis-preview-refresh") router.refresh();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [router]);

  return null;
}
