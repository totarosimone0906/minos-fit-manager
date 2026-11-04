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
        { error: "Configurazione Supabase mancante." },
        { status: 500 },
      );
    }

    const body = await req.json();

    const operatore = String(body?.operatore || "").trim();
    const data = String(body?.data || "").trim();

    if (
      operatore !== "Simone Totaro" &&
      operatore !== "Daniele Totaro"
    ) {
      return NextResponse.json(
        { error: "Personal trainer non valido." },
        { status: 400 },
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return NextResponse.json(
        { error: "Data non valida." },
        { status: 400 },
      );
    }

    const { data: prenotazioni, error } = await supabaseAdmin
      .from("prenotazioni_pt")
      .select("ora")
      .eq("operatore", operatore)
      .eq("data", data)
      .in("stato", ["in_attesa_admin", "confermata"]);

    if (error) {
      console.error("ERRORE LETTURA SLOT PT:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    const slotOccupati = [
      ...new Set(
        (prenotazioni || [])
          .map((prenotazione) => prenotazione.ora)
          .filter(Boolean),
      ),
    ].sort();

    return NextResponse.json({
      success: true,
      operatore,
      data,
      slotOccupati,
    });
  } catch (error: unknown) {
    console.error("ERRORE API SLOT PT:", error);

    const messaggio =
      error instanceof Error
        ? error.message
        : "Errore durante il recupero degli orari occupati.";

    return NextResponse.json(
      { error: messaggio },
      { status: 500 },
    );
  }
}