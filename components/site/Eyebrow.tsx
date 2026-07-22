import React from "react";

// Etiqueta editorial usada por cima dos títulos em todo o site: versaletes
// muito espaçados, ladeados por traços finos dourados. Substitui os antigos
// "pills" com ícone de estrelinha, que davam à página um ar genérico/gerado.
//
// tone:  "brand" para fundos claros (texto bordô), "gold" para fundos escuros.
// align: "center" mostra um traço de cada lado; "left" alinha o texto à
//        esquerda do título (traço só à direita em ecrãs largos, centrado em mobile).
export function Eyebrow({
  children,
  tone = "brand",
  align = "center",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "brand" | "gold";
  align?: "center" | "left";
  className?: string;
}) {
  const isGold = tone === "gold";
  const rule = `h-px w-8 shrink-0 ${isGold ? "bg-gold-soft/40" : "bg-gold/60"}`;
  const text = isGold ? "text-gold-soft/90" : "text-brand/90";

  return (
    <div
      className={`flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.35em] ${text} ${
        align === "center" ? "justify-center" : "justify-center lg:justify-start"
      } ${className}`}
    >
      <span className={`${rule} ${align === "left" ? "lg:hidden" : ""}`} />
      <span>{children}</span>
      <span className={rule} />
    </div>
  );
}
