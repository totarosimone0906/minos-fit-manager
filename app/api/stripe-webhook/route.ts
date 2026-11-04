import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SECRET_KEY || ""
);

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    console.error("Configurazione webhook Stripe mancante.");

    return NextResponse.json(
      { error: "Webhook non configurato." },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Firma Stripe mancante." },
      { status: 400 }
    );
  }

  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch {
    console.error("Firma webhook Stripe non valida.");

    return NextResponse.json(
      { error: "Firma Stripe non valida." },
      { status: 400 }
    );
  }

  console.log("Evento Stripe verificato:", event.type);
  if (event.type === "checkout.session.completed") {
  const session = event.data.object as Stripe.Checkout.Session;

 if (
  session.metadata?.tipo === "quota_associativa" &&
  session.payment_status === "paid" &&
  session.amount_total === 3000 &&
  session.currency?.toLowerCase() === "eur" &&
  session.mode === "payment"
) {
  console.log(
    "Pagamento quota associativa ricevuto:",
    session.id
  );const clienteId = session.metadata?.cliente_id;
const tesseramentoId = session.metadata?.tesseramento_id;

if (!clienteId || !tesseramentoId) {
  console.error(
    "Webhook Stripe: dati cliente o tesseramento mancanti."
  );

  return NextResponse.json(
    { error: "Metadata del pagamento mancanti." },
    { status: 400 }
  );
}
const { data: pratica, error: errorePratica } =
  await supabaseAdmin
    .from("tesseramenti")
    .select("id, cliente_id, stripe_session_id")
    .eq("id", tesseramentoId)
    .eq("cliente_id", clienteId)
    .eq("stripe_session_id", session.id)
    .maybeSingle();

if (errorePratica) {
  console.error(
    "Errore verifica tesseramento:",
    errorePratica
  );

  return NextResponse.json(
    { error: "Errore verifica tesseramento." },
    { status: 500 }
  );
}

if (!pratica) {
  console.error(
    "Webhook: sessione Stripe non associata al tesseramento."
  );

  return NextResponse.json(
    { error: "Tesseramento non corrispondente." },
    { status: 400 }
  );
}
// ==============================
// REGISTRA PAGAMENTO SU SUPABASE
// ==============================

const { data: conferma, error: erroreConferma } =
  await supabaseAdmin
    .rpc("conferma_pagamento_quota", {
      p_tesseramento_id: tesseramentoId,
      p_cliente_id: clienteId,
      p_session_id: session.id,
    })
    .single();

if (erroreConferma || !conferma) {
  console.error(
    "Webhook: errore conferma quota:",
    erroreConferma
  );

  return NextResponse.json(
    { error: "Impossibile registrare il pagamento." },
    { status: 500 }
  );
}

console.log(
  "Webhook: quota associativa confermata:",
  session.id
);
}
  }
if (event.type === "checkout.session.completed") {
  const session = event.data.object as Stripe.Checkout.Session;

  const tipiAbbonamento = [
    "mensile",
    "trimestrale",
    "semestrale",
    "annuale",
  ];

  if (tipiAbbonamento.includes(session.metadata?.tipo || "")) {
    const importiAbbonamento: Record<string, number> = {
  mensile: 4000,
  trimestrale: 11000,
  semestrale: 20000,
  annuale: 36000,
};

const tipo = session.metadata?.tipo || "";

if (
  session.payment_status !== "paid" ||
  session.mode !== "payment" ||
  session.currency?.toLowerCase() !== "eur" ||
  session.amount_total !== importiAbbonamento[tipo]
) {
  console.error(
    "Webhook: pagamento abbonamento non valido:",
    session.id
  );

  return NextResponse.json(
    { error: "Pagamento abbonamento non valido." },
    { status: 400 }
  );
}
    console.log(
      
      "Webhook: pagamento abbonamento ricevuto:",
      
      session.id
    );const clienteId = session.metadata?.cliente_id;

if (!clienteId) {
  console.error("Webhook: cliente abbonamento mancante.");

  return NextResponse.json(
    { error: "Cliente non identificato." },
    { status: 400 }
  );
}
const { error: erroreInserimento } = await supabaseAdmin
  .from("pagamenti_stripe")
  .upsert(
    {
      session_id: session.id,
      cliente_id: clienteId,
      tipo,
      importo: session.amount_total!,
      stato: "processing",
    },
    {
      onConflict: "session_id",
      ignoreDuplicates: true,
    }
  );

if (erroreInserimento) {
  console.error(
    "Webhook: errore registrazione pagamento:",
    erroreInserimento
  );

  return NextResponse.json(
    { error: "Impossibile registrare il pagamento." },
    { status: 500 }
  );
}
const { data: conferma, error: erroreConferma } =
  await supabaseAdmin
    .rpc("conferma_pagamento_abbonamento", {
      p_session_id: session.id,
      p_cliente_id: clienteId,
      p_tipo: tipo,
      p_importo: session.amount_total!,
    })
    .single();

if (erroreConferma || !conferma) {
  console.error(
    "Webhook: errore attivazione abbonamento:",
    erroreConferma
  );

  return NextResponse.json(
    { error: "Impossibile attivare l'abbonamento." },
    { status: 500 }
  );
}

console.log(
  "Webhook: abbonamento confermato:",
  session.id
);
  }
}
  return NextResponse.json({ received: true });
}