import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SECRET_KEY || "",
);

const mesiAbbonamento: Record<string, number> = { mensile: 1, trimestrale: 3, semestrale: 6, annuale: 12 };
const nomiAbbonamento: Record<string, string> = { mensile: "Mensile", trimestrale: "Trimestrale", semestrale: "Semestrale", annuale: "Annuale" };

function dataLocaleISO(data: Date) {
  const y = data.getFullYear();
  const m = String(data.getMonth() + 1).padStart(2, "0");
  const d = String(data.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function aggiungiMesi(data: Date, mesi: number) {
  const risultato = new Date(data);
  const giorno = risultato.getDate();
  risultato.setDate(1);
  risultato.setMonth(risultato.getMonth() + mesi);
  const ultimo = new Date(risultato.getFullYear(), risultato.getMonth() + 1, 0).getDate();
  risultato.setDate(Math.min(giorno, ultimo));
  return risultato;
}

export async function POST(req: Request) {
  let sessionId = "";
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_SECRET_KEY) {
      return NextResponse.json({ error: "Configurazione server incompleta" }, { status: 500 });
    }

    const body = await req.json();
    sessionId = String(body.sessionId || "");
    if (!sessionId) return NextResponse.json({ error: "Sessione Stripe mancante" }, { status: 400 });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Il pagamento non risulta completato" }, { status: 400 });
    }

    const tipo = session.metadata?.tipo || "";
    const clienteId = session.metadata?.cliente_id || "";
    if (!clienteId) return NextResponse.json({ error: "Cliente non identificato" }, { status: 400 });

    const { data: gia } = await supabaseAdmin
      .from("pagamenti_stripe")
      .select("session_id,stato")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (gia?.stato === "completed") {
      const { data: clienteGia } = await supabaseAdmin.from("profiles").select("*").eq("id", clienteId).single();
      return NextResponse.json({ success: true, alreadyProcessed: true, cliente: clienteGia, tipo });
    }

    if (!gia) {
      const { error } = await supabaseAdmin.from("pagamenti_stripe").insert({
        session_id: sessionId,
        cliente_id: clienteId,
        tipo,
        importo: session.amount_total || 0,
        stato: "processing",
      });
      if (error && error.code !== "23505") throw new Error(error.message);
    }

    const { data: cliente, error: erroreCliente } = await supabaseAdmin
      .from("profiles").select("*").eq("id", clienteId).single();
    if (erroreCliente || !cliente) throw new Error("Cliente non trovato");
const importiAbbonamento: Record<string, number> = {
  mensile: 4000,
  trimestrale: 11000,
  semestrale: 20000,
  annuale: 36000,
};
    if (mesiAbbonamento[tipo]) {
      if (
  session.mode !== "payment" ||
  session.currency?.toLowerCase() !== "eur" ||
  session.amount_total !== importiAbbonamento[tipo]
) {
  return NextResponse.json(
    { error: "Dati del pagamento Stripe non validi" },
    { status: 400 }
  );
}
     const { data: conferma, error: erroreConferma } =
  await supabaseAdmin.rpc("conferma_pagamento_abbonamento", {
    p_session_id: sessionId,
    p_cliente_id: clienteId,
    p_tipo: tipo,
    p_importo: session.amount_total!,
  }).single();

if (erroreConferma || !conferma) {
  throw new Error(
    erroreConferma?.message ||
      "Errore durante l'attivazione dell'abbonamento"
  );
}

const { data: clienteAggiornato, error: erroreClienteAggiornato } =
  await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", clienteId)
    .single();

if (erroreClienteAggiornato || !clienteAggiornato) {
  throw new Error("Impossibile recuperare l'abbonamento aggiornato");
}

return NextResponse.json({
  success: true,
  alreadyProcessed: (conferma as { gia_elaborato: boolean }).gia_elaborato,
  cliente: clienteAggiornato,
  tipo,
});
    }

    if (tipo === "pt_5" || tipo === "pt_10" || tipo === "pt_personal") {
      const config =
        tipo === "pt_5"
          ? { dbTipo: "pacchetto_5", prezzo: 100, lezioni: 5 }
          : tipo === "pt_10"
            ? { dbTipo: "pacchetto_10", prezzo: 180, lezioni: 10 }
            : { dbTipo: "personal", prezzo: 80, lezioni: 0 };

      const { data: esistente } = await supabaseAdmin
        .from("pacchetti_pt")
        .select("id")
        .eq("stripe_session_id", sessionId)
        .maybeSingle();

      if (!esistente) {
        const oggi = new Date();
        const scadenza = tipo === "pt_personal" ? dataLocaleISO(aggiungiMesi(oggi, 1)) : null;
        const { error } = await supabaseAdmin.from("pacchetti_pt").insert({
          cliente_id: clienteId,
          tipo: config.dbTipo,
          prezzo: config.prezzo,
          lezioni_totali: config.lezioni,
          lezioni_utilizzate: 0,
          stato: "attivo",
          acquistato_il: new Date().toISOString(),
          scadenza,
          stripe_session_id: sessionId,
          operatore: tipo === "pt_personal" ? session.metadata?.operatore || null : null,
        });
        if (error) throw new Error(error.message);
      }

      await completa(sessionId);
      return NextResponse.json({ success: true, cliente, tipo, messaggio: "Pacchetto PT attivato" });
    }

    if (tipo === "pt_singola") {
      const operatore = session.metadata?.operatore || "";
      const data = session.metadata?.data || "";
      const ora = session.metadata?.ora || "";
      if (!operatore || !data || !ora) throw new Error("Dati prenotazione PT mancanti");

      const { data: esistente } = await supabaseAdmin
        .from("prenotazioni_pt")
        .select("id")
        .eq("stripe_session_id", sessionId)
        .maybeSingle();

      if (!esistente) {
        const { count } = await supabaseAdmin
          .from("prenotazioni_pt")
          .select("id", { count: "exact", head: true })
          .eq("operatore", operatore)
          .eq("data", data)
          .eq("ora", ora)
          .in("stato", ["in_attesa_admin", "confermata"]);
        if ((count || 0) > 0) {
          await supabaseAdmin.from("pagamenti_stripe").update({ stato: "slot_conflict" }).eq("session_id", sessionId);
          return NextResponse.json(
            { error: "Pagamento ricevuto, ma nel frattempo lo slot è stato occupato. Contatta lo staff per riprogrammazione o rimborso." },
            { status: 409 },
          );
        }

        const { error } = await supabaseAdmin.from("prenotazioni_pt").insert({
          cliente_id: clienteId,
          cliente_nome: `${cliente.nome || ""} ${cliente.cognome || ""}`.trim(),
          operatore,
          data,
          ora,
          prezzo: 30,
          stato: "in_attesa_admin",
          pagamento: "stripe",
          tipo_servizio: "singola",
          richiesta_il: new Date().toISOString(),
          stripe_session_id: sessionId,
        });
        if (error) throw new Error(error.message);
      }

      await completa(sessionId);
      return NextResponse.json({ success: true, cliente, tipo, messaggio: "Pagamento ricevuto e richiesta PT inviata" });
    }

    throw new Error("Tipo pagamento non gestito");
  } catch (error: unknown) {
    console.error("ERRORE VERIFICA PAGAMENTO:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore durante la verifica del pagamento" },
      { status: 500 },
    );
  }
}

async function completa(sessionId: string) {
  await supabaseAdmin
    .from("pagamenti_stripe")
    .update({ stato: "completed", completato_il: new Date().toISOString() })
    .eq("session_id", sessionId);
}
