import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/app/lib/supabase-server";

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

    const body = await req.json();
    const supabaseAuth = await createSupabaseServerClient();

const {
  data: { user },
  error: authError,
} = await supabaseAuth.auth.getUser();

if (authError || !user) {
  return NextResponse.json(
    { error: "Devi effettuare l'accesso." },
    { status: 401 },
  );
}

const { data: profilo, error: profiloError } = await supabaseAdmin
  .from("profiles")
  .select("ruolo, stato_account")
  .eq("id", user.id)
  .single();

if (profiloError || !profilo || profilo.stato_account !== "attivo") {
  return NextResponse.json(
    { error: "Account non attivo o non autorizzato." },
    { status: 403 },
  );
}

if (
  profilo.ruolo !== "admin" &&
  String(body?.clienteId || "").trim() !== user.id
) {
  return NextResponse.json(
    { error: "Non puoi richiedere agevolazioni per un altro cliente." },
    { status: 403 },
  );
}

    const clienteId = String(body?.clienteId || "").trim();
    const tipo = String(body?.tipo || "").trim();

    if (!clienteId) {
      return NextResponse.json(
        { error: "Cliente non identificato." },
        { status: 400 },
      );
    }

    if (tipo !== "studente" && tipo !== "over_60") {
      return NextResponse.json(
        { error: "Tipo di agevolazione non valido." },
        { status: 400 },
      );
    }

    // Controlliamo che il cliente esista realmente.
    const { data: cliente, error: erroreCliente } = await supabaseAdmin
      .from("profiles")
      .select("id")
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

    // Non permettiamo una seconda richiesta se ne esiste
    // già una in verifica o approvata.
    const { data: esistente, error: erroreControllo } =
      await supabaseAdmin
        .from("agevolazioni")
        .select(
          "id, tipo, stato, richiesta_il, approvata_il, valida_fino_al, note_admin",
        )
        .eq("cliente_id", clienteId)
        .in("stato", ["da_verificare", "approvata"])
        .order("richiesta_il", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (erroreControllo) {
      console.error(
        "ERRORE CONTROLLO AGEVOLAZIONE:",
        erroreControllo,
      );

      return NextResponse.json(
        { error: erroreControllo.message },
        { status: 500 },
      );
    }

    if (esistente) {
      return NextResponse.json(
        {
          error:
            esistente.stato === "da_verificare"
              ? "Hai già una richiesta di agevolazione in verifica."
              : "Hai già un'agevolazione attiva.",
          agevolazione: esistente,
        },
        { status: 409 },
      );
    }

    // Creazione della nuova richiesta.
    const { data: nuovaAgevolazione, error: erroreInserimento } =
      await supabaseAdmin
        .from("agevolazioni")
        .insert({
          cliente_id: clienteId,
          tipo,
          stato: "da_verificare",
          richiesta_il: new Date().toISOString(),
        })
        .select(
          "id, tipo, stato, richiesta_il, approvata_il, valida_fino_al, note_admin",
        )
        .single();

    if (erroreInserimento) {
      console.error(
        "ERRORE CREAZIONE AGEVOLAZIONE:",
        erroreInserimento,
      );

      return NextResponse.json(
        { error: erroreInserimento.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      agevolazione: nuovaAgevolazione,
    });
  } catch (error: unknown) {
    console.error("ERRORE API RICHIESTA AGEVOLAZIONE:", error);

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