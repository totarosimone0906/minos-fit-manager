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
    { error: "Non puoi consultare la scheda di un altro cliente." },
    { status: 403 },
  );
}

    const { data: pratica, error } = await supabaseAdmin
      .from("richieste_schede")
      .select("id, stato, richiesta_il, attivata_il, scadenza, note_admin")
      .eq("cliente_id", clienteId)
      .order("richiesta_il", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("ERRORE STATO SCHEDA:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    let praticaEffettiva = pratica;

    if (
      praticaEffettiva?.stato === "attiva" &&
      praticaEffettiva.scadenza
    ) {
      const oggi = new Date();
      oggi.setHours(0, 0, 0, 0);

      const scadenza = new Date(
        `${praticaEffettiva.scadenza}T00:00:00`,
      );

      if (scadenza.getTime() < oggi.getTime()) {
        praticaEffettiva = {
          ...praticaEffettiva,
          stato: "scaduta",
        };
      }
    }

    return NextResponse.json({
      success: true,
      pratica: praticaEffettiva || null,
    });
  } catch (error: unknown) {
    console.error("ERRORE API STATO SCHEDA:", error);

    const messaggio =
      error instanceof Error
        ? error.message
        : "Errore durante il recupero della richiesta.";

    return NextResponse.json(
      { error: messaggio },
      { status: 500 },
    );
  }
}