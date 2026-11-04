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
        { error: "Configurazione server incompleta" },
        { status: 500 },
      );
    }

    const body = await req.json();
    const clienteId = String(body.clienteId || "").trim();

    if (!clienteId) {
      return NextResponse.json(
        { error: "Cliente non identificato" },
        { status: 400 },
      );
    }

    const { data: pagamenti, error } = await supabaseAdmin
      .from("pagamenti_stripe")
      .select(
        `
          id,
          tipo,
          importo,
          stato,
          creato_il,
          completato_il,
          scadenza_precedente,
          scadenza_nuova
        `,
      )
      .eq("cliente_id", clienteId)
      .in("tipo", [
        "mensile",
        "trimestrale",
        "semestrale",
        "annuale",
      ])
      .eq("stato", "completed")
      .order("completato_il", {
        ascending: false,
      });

    if (error) {
      console.error(
        "ERRORE RECUPERO STORICO PAGAMENTI:",
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
      "ERRORE API STORICO PAGAMENTI:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Errore durante il recupero dello storico pagamenti",
      },
      { status: 500 },
    );
  }
}