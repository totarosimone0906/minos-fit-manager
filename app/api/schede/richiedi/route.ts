import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../../../lib/supabase-server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SECRET_KEY || "",
);

export async function POST(req: Request) {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SECRET_KEY
    ) {
      return NextResponse.json(
        { error: "Configurazione Supabase mancante." },
        { status: 500 },
      );
    }
const supabase = await createSupabaseServerClient();

const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();

if (authError || !user) {
  return NextResponse.json(
    { error: "Accesso non autorizzato." },
    { status: 401 },
  );
}
    const body = await req.json();
    const clienteId = String(body?.clienteId || "").trim();

    if (!clienteId) {
      return NextResponse.json(
        { error: "Cliente non identificato." },
        { status: 400 },
      );
    }
    const { data: profilo, error: profiloError } = await supabase
  .from("profiles")
  .select("ruolo, stato_account")
  .eq("id", user.id)
  .single();

if (profiloError || !profilo || profilo.stato_account !== "attivo") {
  return NextResponse.json(
    { error: "Accesso non autorizzato." },
    { status: 403 },
  );
}

if (profilo.ruolo !== "admin" && user.id !== clienteId) {
  return NextResponse.json(
    { error: "Non puoi richiedere una scheda per un altro cliente." },
    { status: 403 },
  );
}

    // Controlliamo che il cliente esista e abbia un abbonamento attivo
    const { data: cliente, error: erroreCliente } = await supabaseAdmin
      .from("profiles")
      .select("id, abbonamento_scadenza, scadenza")
      .eq("id", clienteId)
      .maybeSingle();

    if (erroreCliente) {
      console.error("ERRORE LETTURA CLIENTE:", erroreCliente);

      return NextResponse.json(
        { error: erroreCliente.message },
        { status: 500 },
      );
    }

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente non trovato." },
        { status: 404 },
      );
    }

    const scadenzaAbbonamento =
      cliente.abbonamento_scadenza || cliente.scadenza;

    if (!scadenzaAbbonamento) {
      return NextResponse.json(
        {
          error:
            "Non risulta un abbonamento attivo. La scheda è inclusa nell'abbonamento.",
        },
        { status: 403 },
      );
    }

    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);

    const scadenza = new Date(`${scadenzaAbbonamento}T00:00:00`);

    if (scadenza.getTime() < oggi.getTime()) {
      return NextResponse.json(
        {
          error:
            "Il tuo abbonamento risulta scaduto. Rinnova l'abbonamento prima di richiedere una nuova scheda.",
        },
        { status: 403 },
      );
    }

    // Evitiamo richieste duplicate se ce n'è già una in attesa o attiva
    const { data: richiestaEsistente, error: erroreRichiesta } =
      await supabaseAdmin
        .from("richieste_schede")
        .select("id, stato, richiesta_il, attivata_il, scadenza, note_admin")
        .eq("cliente_id", clienteId)
        .in("stato", ["in_attesa", "attiva"])
        .order("richiesta_il", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (erroreRichiesta) {
      console.error(
        "ERRORE CONTROLLO RICHIESTA SCHEDA:",
        erroreRichiesta,
      );

      return NextResponse.json(
        { error: erroreRichiesta.message },
        { status: 500 },
      );
    }

    if (richiestaEsistente) {
      return NextResponse.json(
        {
          error:
            richiestaEsistente.stato === "in_attesa"
              ? "Hai già una richiesta scheda in attesa."
              : "Hai già una scheda attiva.",
          pratica: richiestaEsistente,
        },
        { status: 409 },
      );
    }

    // Creiamo la nuova richiesta
    const { data: nuovaRichiesta, error: erroreInserimento } =
      await supabaseAdmin
        .from("richieste_schede")
        .insert({
          cliente_id: clienteId,
          stato: "in_attesa",
          richiesta_il: new Date().toISOString(),
        })
        .select(
          "id, stato, richiesta_il, attivata_il, scadenza, note_admin",
        )
        .single();

    if (erroreInserimento) {
      console.error(
        "ERRORE CREAZIONE RICHIESTA SCHEDA:",
        erroreInserimento,
      );

      return NextResponse.json(
        { error: erroreInserimento.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      pratica: nuovaRichiesta,
    });
  } catch (error: unknown) {
    console.error("ERRORE API RICHIESTA SCHEDA:", error);

    const messaggio =
      error instanceof Error
        ? error.message
        : "Errore durante l'invio della richiesta.";

    return NextResponse.json(
      { error: messaggio },
      { status: 500 },
    );
  }
}