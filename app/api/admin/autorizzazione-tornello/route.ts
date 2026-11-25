import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    const agentToken = process.env.TORNELLO_AGENT_TOKEN;

    if (!url || !secretKey || !agentToken) {
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

    const adesso = Math.floor(Date.now() / 1000);

    const permesso = {
      sub: authData.user.id,
      ruolo: "admin",
      scope: "tornello:locale",
      iat: adesso,
      exp: adesso + 300,
    };

    const contenuto = Buffer.from(
      JSON.stringify(permesso)
    ).toString("base64url");

    const chiaveFirma = createHmac("sha256", agentToken)
      .update("minos-fit-autorizzazione-locale-v1")
      .digest();

    const firma = createHmac("sha256", chiaveFirma)
      .update(contenuto)
      .digest("base64url");

    return NextResponse.json(
      {
        success: true,
        autorizzazione: `${contenuto}.${firma}`,
        scadenza: permesso.exp,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );

  } catch (error) {
    console.error("Errore autorizzazione tornello:", error);

    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}