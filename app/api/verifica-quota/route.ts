import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/app/lib/supabase-server";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || ""
)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SECRET_KEY || ""
)

function dataLocaleISO(data: Date) {
  const y = data.getFullYear()

  const m = String(
    data.getMonth() + 1
  ).padStart(2, "0")

  const d = String(
    data.getDate()
  ).padStart(2, "0")

  return `${y}-${m}-${d}`
}

function aggiungiDodiciMesi(data: Date) {
  const risultato = new Date(data)

  const giorno = risultato.getDate()

  risultato.setDate(1)

  risultato.setMonth(
    risultato.getMonth() + 12
  )

  const ultimoGiorno = new Date(
    risultato.getFullYear(),
    risultato.getMonth() + 1,
    0
  ).getDate()

  risultato.setDate(
    Math.min(giorno, ultimoGiorno)
  )

  return risultato
}

export async function POST(req: Request) {
  try {
    // ==============================
    // CONTROLLO ENV
    // ==============================

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        {
          error:
            "STRIPE_SECRET_KEY non configurata.",
        },
        {
          status: 500,
        }
      )
    }

    if (!process.env.SUPABASE_SECRET_KEY) {
      return NextResponse.json(
        {
          error:
            "SUPABASE_SECRET_KEY non configurata.",
        },
        {
          status: 500,
        }
      )
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        {
          error:
            "NEXT_PUBLIC_SUPABASE_URL non configurata.",
        },
        {
          status: 500,
        }
      )
    }

    // ==============================
    // RECUPERA SESSION ID
    // ==============================
const supabaseAuth = await createSupabaseServerClient();

const {
  data: { user },
  error: authError,
} = await supabaseAuth.auth.getUser();

if (authError || !user) {
  return NextResponse.json(
    { error: "Devi effettuare l'accesso per verificare il pagamento." },
    { status: 401 }
  );
}
    const body = await req.json()

    const sessionId = String(
      body.sessionId || ""
    ).trim()

    if (!sessionId) {
      return NextResponse.json(
        {
          error:
            "Sessione Stripe mancante.",
        },
        {
          status: 400,
        }
      )
    }

    // ==============================
    // VERIFICA SESSIONE STRIPE
    // ==============================

    const session =
      await stripe.checkout.sessions.retrieve(
        sessionId
      )

    if (
      session.payment_status !== "paid"
    ) {
      return NextResponse.json(
        {
          error:
            "Il pagamento non risulta completato.",
        },
        {
          status: 400,
        }
      )
    }

   // ==============================
// CONTROLLO IMPORTO E VALUTA
// ==============================

if (
  session.amount_total !== 3000 ||
  session.currency?.toLowerCase() !== "eur" ||
  session.mode !== "payment"
) {
  return NextResponse.json(
    {
      error:
        "Importo, valuta o modalità del pagamento Stripe non validi.",
    },
    { status: 400 }
  );
}

    // ==============================
    // DATI METADATA
    // ==============================

    const clienteId =
      session.metadata?.cliente_id || ""

    const tesseramentoId =
      session.metadata?.tesseramento_id || ""
if (clienteId !== user.id) {
  return NextResponse.json(
    {
      error: "Non puoi verificare il pagamento di un altro cliente.",
    },
    { status: 403 }
  );
}
    if (
      !clienteId ||
      !tesseramentoId
    ) {
      return NextResponse.json(
        {
          error:
            "Dati del tesseramento mancanti nella sessione Stripe.",
        },
        {
          status: 400,
        }
      )
    }

    // ==============================
    // RECUPERA TESSERAMENTO
    // ==============================

    const {
      data: pratica,
      error: errorePratica,
    } = await supabaseAdmin
      .from("tesseramenti")
      .select("*")
      .eq("id", tesseramentoId)
      .eq("cliente_id", clienteId)
      .single()

    if (
      errorePratica ||
      !pratica
    ) {
      console.error(
        "ERRORE RECUPERO TESSERAMENTO:",
        errorePratica
      )

      return NextResponse.json(
        {
          error:
            "Pratica di tesseramento non trovata.",
        },
        {
          status: 404,
        }
      )
    }

    // ==============================
    // CONTROLLO SESSIONE ASSOCIATA
    // ==============================

    if (
  !pratica.stripe_session_id ||
  pratica.stripe_session_id !== sessionId
) {
      return NextResponse.json(
        {
          error:
            "La sessione Stripe non corrisponde alla pratica.",
        },
        {
          status: 400,
        }
      )
    }

   
   
   // ==============================
// CONFERMA ATOMICA DEL PAGAMENTO
// ==============================

const { data: conferma, error: erroreConferma } =
  await supabaseAdmin
    .rpc("conferma_pagamento_quota", {
      p_tesseramento_id: tesseramentoId,
      p_cliente_id: clienteId,
      p_session_id: sessionId,
    })
    .single();

if (erroreConferma || !conferma) {
  console.error(
    "ERRORE CONFERMA PAGAMENTO:",
    erroreConferma
  );

  throw new Error(
    erroreConferma?.message ||
      "Impossibile confermare il pagamento."
  );
}

const risultato = conferma as {
  data_inizio: string;
  data_scadenza: string;
  gia_elaborato: boolean;
};

const quotaInizio = risultato.data_inizio;
const quotaScadenza = risultato.data_scadenza;
const giaElaborato = risultato.gia_elaborato;

// Recuperiamo i dati aggiornati per la risposta
const { data: praticaAggiornata, error: errorePraticaAggiornata } =
  await supabaseAdmin
    .from("tesseramenti")
    .select("*")
    .eq("id", tesseramentoId)
    .single();

if (errorePraticaAggiornata || !praticaAggiornata) {
  throw new Error("Impossibile recuperare il tesseramento aggiornato.");
}

const { data: clienteAggiornato, error: erroreClienteAggiornato } =
  await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", clienteId)
    .single();

if (erroreClienteAggiornato || !clienteAggiornato) {
  throw new Error("Impossibile recuperare il profilo aggiornato.");
}
    return NextResponse.json({
      success: true,

      alreadyProcessed: giaElaborato,

      quota_inizio:
        quotaInizio,

      quota_scadenza:
        quotaScadenza,

      tesseramento:
        praticaAggiornata,

      cliente:
        clienteAggiornato,
    })
  } catch (error: unknown) {
    console.error(
      "ERRORE VERIFICA QUOTA:",
      error
    )

    const messaggio =
      error instanceof Error
        ? error.message
        : "Errore durante la verifica della quota associativa."

    return NextResponse.json(
      {
        error: messaggio,
      },
      {
        status: 500,
      }
    )
  }
}