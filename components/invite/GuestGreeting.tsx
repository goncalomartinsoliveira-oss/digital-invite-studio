"use client";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { useGuestLink } from "./useGuestLink";
import { seatsSentence } from "@/lib/guestLinks";
import pt from "@/dictionaries/pt";
import en from "@/dictionaries/en";

const dictionaries = { pt, en };

// Saudação do ecrã de entrada de um link personalizado: nome do grupo e lugares
// reservados. Num link geral (sem ?c=) ou com código inválido não renderiza
// nada — o ecrã fica como sempre. O modelo decide a aparência (fonte, cor)
// através de nameStyle/lineStyle.
export default function GuestGreeting({
  invitationId,
  nameStyle,
  lineStyle,
  className,
}: {
  invitationId: string;
  nameStyle?: CSSProperties;
  lineStyle?: CSSProperties;
  className?: string;
}) {
  const params = useParams();
  const locale = (params?.locale as "en" | "pt") || "pt";
  const dict = dictionaries[locale]?.GuestLink || dictionaries.pt.GuestLink;
  const link = useGuestLink(invitationId);

  if (link.status !== "ready") return null;
  const { displayName, seats, memberCount } = link.data;
  const line = seatsSentence(dict, { displayName, seats, memberCount });

  return (
    <motion.div
      data-guest-greeting
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.35 }}
      className={className}
    >
      <p style={nameStyle}>{displayName}</p>
      {line && <p style={lineStyle}>{line}</p>}
    </motion.div>
  );
}
