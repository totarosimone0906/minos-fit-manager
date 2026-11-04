
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const expectedToken = process.env.TORNELLO_AGENT_TOKEN;
    const authorization = req.headers.get("authorization");

    const receivedToken = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : null;

    if (!expectedToken || !receivedToken) {
      return NextResponse.json(
        { error: "Accesso non autorizzato" },
        { status: 401 }
      );
    }

    const expected = Buffer.from(expectedToken, "utf8");
    const received = Buffer.from(receivedToken, "utf8");

    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      return NextResponse.json(
        { error: "Accesso non autorizzato" },
        { status: 401 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;

    if (!url || !secretKey) {
      return NextResponse.json(
        { error: "Configurazione server incompleta" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(url, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await supabaseAdmin.rpc(
      "preleva_comando_tornello"
    );

    if (error) {
      console.error("Errore recupero comando tornello:", error);

      return NextResponse.json(
        { error: "Impossibile recuperare il comando" },
        { status: 500 }
      );
    }

    const comando = Array.isArray(data) ? data[0] : null;

    if (!comando) {
      return NextResponse.json({
        success: true,
        comando: null,
      });
    }

    return NextResponse.json({
      success: true,
     comando: {
  id: comando.id,
  esecuzione_id: comando.esecuzione_id,
  direzione: comando.direzione,
  scade_il: comando.scade_il,
},
    });
  } catch (error) {
    console.error("Errore API prossimo comando:", error);

    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
