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

if (
  profiloError ||
  !profilo ||
  profilo.stato_account !== "attivo"
) {
  return NextResponse.json(
    { error: "Accesso non autorizzato." },
    { status: 403 },
  );
}

if (profilo.ruolo !== "admin" && user.id !== clienteId) {
  return NextResponse.json(
    { error: "Non puoi consultare le agevolazioni di un altro cliente." },
    { status: 403 },
  );
}

    const { data: agevolazione, error } = await supabaseAdmin
      .from("agevolazioni")
      .select(
        "id, tipo, stato, richiesta_il, approvata_il, valida_fino_al, note_admin",
      )
      .eq("cliente_id", clienteId)
      .order("richiesta_il", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("ERRORE STATO AGEVOLAZIONE:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    let agevolazioneEffettiva = agevolazione;

    if (
      agevolazioneEffettiva?.stato === "approvata" &&
      agevolazioneEffettiva.valida_fino_al
    ) {
      const oggi = new Date();
      oggi.setHours(0, 0, 0, 0);

      const scadenza = new Date(
        `${agevolazioneEffettiva.valida_fino_al}T00:00:00`,
      );

      if (scadenza.getTime() < oggi.getTime()) {
        const { data: agevolazioneScaduta, error: erroreScadenza } =
          await supabaseAdmin
            .from("agevolazioni")
            .update({
              stato: "scaduta",
              updated_at: new Date().toISOString(),
            })
            .eq("id", agevolazioneEffettiva.id)
            .select(
              "id, tipo, stato, richiesta_il, approvata_il, valida_fino_al, note_admin",
            )
            .single();

        if (erroreScadenza) {
          console.error(
            "ERRORE AGGIORNAMENTO AGEVOLAZIONE SCADUTA:",
            erroreScadenza,
          );

          return NextResponse.json(
            { error: erroreScadenza.message },
            { status: 500 },
          );
        }

        agevolazioneEffettiva = agevolazioneScaduta;
      }
    }

    return NextResponse.json({
      success: true,
      agevolazione: agevolazioneEffettiva || null,
    });
  } catch (error: unknown) {
    console.error("ERRORE API STATO AGEVOLAZIONE:", error);

    const messaggio =
      error instanceof Error
        ? error.message
        : "Errore durante il recupero dell'agevolazione.";

    return NextResponse.json(
      { error: messaggio },
      { status: 500 },
    );
  }
}