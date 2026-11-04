
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const headers = { "Cache-Control": "no-store" };

  try {
    const expectedToken = process.env.TORNELLO_AGENT_TOKEN;
    const authorization = req.headers.get("authorization");

    const receivedToken = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : null;

    if (!expectedToken || !receivedToken) {
      return NextResponse.json(
        { error: "Non autorizzato" },
        { status: 401, headers }
      );
    }

    const expectedHash = createHash("sha256")
      .update(expectedToken)
      .digest();

    const receivedHash = createHash("sha256")
      .update(receivedToken)
      .digest();

    if (!timingSafeEqual(expectedHash, receivedHash)) {
      return NextResponse.json(
        { error: "Non autorizzato" },
        { status: 401, headers }
      );
    }

    const body = await req.json().catch(() => null);

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (
      !body ||
      typeof body.id !== "string" ||
      typeof body.esecuzione_id !== "string" ||
      !uuidPattern.test(body.id) ||
      !uuidPattern.test(body.esecuzione_id) ||
      !["eseguito", "errore"].includes(body.esito)
    ) {
      return NextResponse.json(
        { error: "Dati non validi" },
        { status: 400, headers }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;

    if (!url || !secretKey) {
      return NextResponse.json(
        { error: "Configurazione server incompleta" },
        { status: 500, headers }
      );
    }

    const supabaseAdmin = createClient(url, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await supabaseAdmin.rpc(
      "conferma_comando_tornello",
      {
        p_id: body.id,
        p_esecuzione_id: body.esecuzione_id,
        p_esito: body.esito,
      }
    );

    if (error) {
      console.error("Errore conferma tornello:", error);

      return NextResponse.json(
        { error: "Errore durante la conferma" },
        { status: 500, headers }
      );
    }

    if (data !== true) {
      return NextResponse.json(
        { error: "Comando non confermabile" },
        { status: 409, headers }
      );
    }

    return NextResponse.json(
      { success: true, stato: body.esito },
      { headers }
    );
  } catch (error) {
    console.error("Errore API conferma tornello:", error);

    return NextResponse.json(
      { error: "Errore interno" },
      { status: 500, headers }
    );
  }
}
