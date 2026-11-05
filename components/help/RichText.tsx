import React from "react";

// Marcação mínima dos textos de ajuda: **negrito** e `código`. Sem HTML
// arbitrário — o texto é sempre escapado pelo React.
export default function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") ? <strong key={i} className="font-semibold text-ink">{p.slice(2, -2)}</strong>
        : p.startsWith("`") ? <code key={i} className="font-mono text-[0.85em] bg-white border border-gray-200 rounded px-1.5 py-0.5 text-brand">{p.slice(1, -1)}</code>
        : <React.Fragment key={i}>{p}</React.Fragment>
      )}
    </>
  );
}
