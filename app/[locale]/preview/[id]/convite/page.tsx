import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TEMPLATE_DEMOS } from "../../demos";
import { findTemplate } from "@/lib/templates";

// O convite de exemplo sozinho, sem nada à volta: é o que corre dentro do
// telemóvel da sala de demonstração (/preview/<modelo>), num iframe.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DemoInvitePage(props: { params: Promise<{ locale: string; id: string }> }) {
  const params = await props.params;
  const demo = TEMPLATE_DEMOS[params.id];
  if (!demo || !findTemplate(params.id)) notFound();
  const { Component, data } = demo;
  return <Component data={data} params={params} />;
}
