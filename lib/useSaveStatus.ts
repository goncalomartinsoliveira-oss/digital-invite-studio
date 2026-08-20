"use client";
import { useCallback, useRef, useState } from "react";

// Estado de gravação partilhado pelos módulos de Planeamento.
//
// Existe por duas razões, ambas apanhadas em uso real:
//   1. Estes módulos gravam ao sair do campo, sem qualquer confirmação — quem
//      escrevia um valor não tinha como saber se ficou guardado. O "Guardado"
//      no topo do painel é do convite, não destes módulos.
//   2. Quase todos ignoravam o campo `error` da resposta do Supabase, por
//      isso uma falha (RLS, tabela em falta, rede) não fazia rigorosamente
//      nada visível — foi assim que dois botões "Gerar" pareceram partidos.
//
// `track()` embrulha uma operação do Supabase e trata dos dois casos.

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useSaveStatus(label: string) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const track = useCallback(
    async <R extends { error: { message: string } | null }>(op: PromiseLike<R>): Promise<R> => {
      if (timer.current) clearTimeout(timer.current);
      setStatus("saving");
      const result = await op;
      if (result.error) {
        console.error(`[${label}] Falha ao gravar:`, result.error.message);
        // O erro fica no ecrã até a gravação seguinte correr bem — não
        // desaparece sozinho, ao contrário do "Guardado".
        setStatus("error");
      } else {
        setStatus("saved");
        timer.current = setTimeout(() => setStatus("idle"), 2500);
      }
      return result;
    },
    [label]
  );

  return { status, track };
}
