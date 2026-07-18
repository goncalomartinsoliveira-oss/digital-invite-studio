import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import { ALL_MODULE_IDS, expandWithDependencies, type ModuleId } from "@/lib/modules";
import { MODULE_PRICES_CENTS, getBundle } from "@/lib/pricing";

const MODULE_NAMES: Record<ModuleId, string> = {
  save_the_date: "Save the Date",
  invite: "Convite de Casamento",
  guests_seating: "Convidados & Mesas",
  photo_sharing: "Photo Sharing & Live Wall",
  guestbook: "Guestbook",
};

// Cria uma sessão de checkout do Stripe para desbloquear módulos de um
// evento — à peça (moduleIds) ou como bundle (bundleId). Os preços vêm
// sempre de lib/pricing.ts, nunca do que o cliente enviar no pedido.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invitationId, slug, locale, moduleIds, bundleId } = body as {
      invitationId: string;
      slug: string;
      locale: string;
      moduleIds?: string[];
      bundleId?: string;
    };

    if (!invitationId || !slug || !locale) {
      return NextResponse.json({ error: "Dados em falta." }, { status: 400 });
    }

    const { data: invite, error } = await supabase
      .from("invitations")
      .select("id, unlocked_modules")
      .eq("id", invitationId)
      .single();

    if (error || !invite) {
      return NextResponse.json({ error: "Convite não encontrado." }, { status: 404 });
    }

    const alreadyUnlocked: string[] = invite.unlocked_modules || [];
    let toPurchase: ModuleId[];
    let bundleUsed: string | null = null;

    if (bundleId) {
      const bundle = getBundle(bundleId);
      if (!bundle) return NextResponse.json({ error: "Bundle inválida." }, { status: 400 });
      // O preço da bundle é fixo para o conjunto completo — se já tiver
      // algum dos módulos incluídos, comprá-la de novo cobrava a dobrar
      // por esse módulo. Nesse caso, sugerir compra à peça dos que faltam.
      const alreadyOwnsSome = bundle.moduleIds.some(m => alreadyUnlocked.includes(m));
      if (alreadyOwnsSome) {
        return NextResponse.json(
          { error: "Já tem alguns dos módulos deste pacote — compre os que faltam à peça." },
          { status: 400 }
        );
      }
      toPurchase = bundle.moduleIds;
      bundleUsed = bundle.id;
    } else {
      const requested = (moduleIds || []).filter((m): m is ModuleId => ALL_MODULE_IDS.includes(m as ModuleId));
      toPurchase = requested.filter(m => !alreadyUnlocked.includes(m));
    }

    if (toPurchase.length === 0) {
      return NextResponse.json({ error: "Nada por comprar — módulos já desbloqueados." }, { status: 400 });
    }

    // toPurchase é o que é cobrado (linhas do Stripe); toUnlock é o que
    // realmente fica desbloqueado — inclui dependências gratuitas (ex.:
    // comprar "invite" desbloqueia sempre "guests_seating" também, sem
    // custo extra, porque o RSVP não funciona sem lista de convidados).
    const toUnlock = expandWithDependencies(toPurchase).filter(m => !alreadyUnlocked.includes(m));

    const origin = req.headers.get("origin") || `https://${req.headers.get("host")}`;

    let lineItems;
    if (bundleUsed) {
      const bundle = getBundle(bundleUsed)!;
      lineItems = [{
        price_data: {
          currency: "eur",
          product_data: { name: `Digital Invite Studio — ${bundle.id}` },
          unit_amount: bundle.priceCents,
        },
        quantity: 1,
      }];
    } else {
      lineItems = toPurchase.map(moduleId => ({
        price_data: {
          currency: "eur",
          product_data: { name: `Digital Invite Studio — ${MODULE_NAMES[moduleId]}` },
          unit_amount: MODULE_PRICES_CENTS[moduleId],
        },
        quantity: 1,
      }));
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/${locale}/dashboard/${slug}?checkout=success`,
      cancel_url: `${origin}/${locale}/dashboard/${slug}?checkout=cancelled`,
      metadata: {
        invitationId,
        moduleIds: toUnlock.join(","),
        bundleId: bundleUsed || "",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Erro ao criar sessão de checkout:", err);
    return NextResponse.json({ error: "Erro ao iniciar o pagamento." }, { status: 500 });
  }
}
