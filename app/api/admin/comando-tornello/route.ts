
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;

    if (!url || !secretKey) {
      return NextResponse.json(
        { error: "Configurazione server incompleta" },
        { status: 500 }
      );
    }

    const authorization = req.headers.get("authorization");
    const token = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { error: "Accesso non autorizzato" },
        { status: 401 }
      );
    }

    const supabaseAdmin = createClient(url, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Sessione non valida" },
        { status: 401 }
      );
    }

    const { data: profilo, error: profiloError } =
      await supabaseAdmin
        .from("profiles")
        .select("ruolo, stato_account")
        .eq("id", authData.user.id)
        .single();

    if (
      profiloError ||
      profilo?.ruolo !== "admin" ||
      profilo?.stato_account !== "attivo"
    ) {
      return NextResponse.json(
        { error: "Permessi amministratore insufficienti" },
        { status: 403 }
      );
    }

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "JSON non valido" },
        { status: 400 }
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      !("direzione" in body)
    ) {
      return NextResponse.json(
        { error: "Direzione mancante" },
        { status: 400 }
      );
    }

    const direzione = body.direzione;

    if (direzione !== "entrata" && direzione !== "uscita") {
      return NextResponse.json(
        { error: "Direzione non valida" },
        { status: 400 }
      );
    }

    const { data: comando, error: insertError } =
      await supabaseAdmin
        .from("comandi_tornello")
        .insert({
          direzione,
          richiesto_da: authData.user.id,
        })
        .select("id, direzione, stato, creato_il, scade_il")
        .single();

    if (insertError || !comando) {
      console.error("Errore creazione comando tornello:", insertError);

      return NextResponse.json(
        { error: "Impossibile registrare il comando" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        messaggio: "Richiesta di apertura registrata",
        comando,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Errore API comando tornello:", error);

    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
