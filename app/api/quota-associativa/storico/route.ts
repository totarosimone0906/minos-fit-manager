import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
        {
          error: "Configurazione server incompleta",
        },
        {
          status: 500,
        },
      );
    }

    const body = await req.json();

    const clienteId = String(
      body.clienteId || "",
    ).trim();

    if (!clienteId) {
      return NextResponse.json(
        {
          error: "Cliente non identificato",
        },
        {
          status: 400,
        },
      );
    }

    const {
      data: pagamenti,
      error,
    } = await supabaseAdmin
      .from("tesseramenti")
      .select(
        `
          id,
          importo,
          pagato_il,
          quota_inizio,
          quota_scadenza,
          scadenza_precedente
        `,
      )
      .eq("cliente_id", clienteId)
      .eq("stato", "pagato")
      .order("pagato_il", {
        ascending: false,
      });

    if (error) {
      console.error(
        "ERRORE RECUPERO STORICO QUOTA:",
        error,
      );

      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      pagamenti: pagamenti || [],
    });
  } catch (error: unknown) {
    console.error(
      "ERRORE API STORICO QUOTA:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Errore durante il recupero dello storico quota associativa",
      },
      {
        status: 500,
      },
    );
  }
}