import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SECRET_KEY || "",
);

export async function POST(req: Request) {
  try {
    const { clienteId } = await req.json();

    if (!clienteId) {
      return NextResponse.json(
        { error: "Cliente mancante" },
        { status: 400 },
      );
    }

    /*
     * PACCHETTI PT
     *
     * Comprende:
     * - pacchetto_5
     * - pacchetto_10
     * - personal
     *
     * Non filtriamo per stato perché nello storico vogliamo vedere
     * anche pacchetti scaduti o esauriti.
     */
    const { data: pacchetti, error: errorePacchetti } = await supabase
      .from("pacchetti_pt")
      .select(
        `
          id,
          tipo,
          prezzo,
          lezioni_totali,
          lezioni_utilizzate,
          stato,
          acquistato_il,
          scadenza,
          operatore,
          stripe_session_id
        `,
      )
      .eq("cliente_id", clienteId)
      .order("acquistato_il", { ascending: false });

    if (errorePacchetti) {
      throw new Error(errorePacchetti.message);
    }

    /*
     * SEDUTE SINGOLE
     *
     * Le sedute singole non vengono salvate in pacchetti_pt:
     * vengono registrate direttamente in prenotazioni_pt.
     */
    const { data: singole, error: erroreSingole } = await supabase
      .from("prenotazioni_pt")
      .select(
        `
          id,
          operatore,
          data,
          ora,
          prezzo,
          stato,
          pagamento,
          tipo_servizio,
          richiesta_il,
          stripe_session_id
        `,
      )
      .eq("cliente_id", clienteId)
      .eq("tipo_servizio", "singola")
      .eq("pagamento", "stripe")
      .order("richiesta_il", { ascending: false });

    if (erroreSingole) {
      throw new Error(erroreSingole.message);
    }

    /*
     * Normalizziamo tutto in un unico formato.
     */
    const storicoPacchetti = (pacchetti || []).map((p) => ({
      id: `pacchetto-${p.id}`,
      origine: "pacchetto",
      tipo: p.tipo,
      prezzo: Number(p.prezzo || 0),
      data_acquisto: p.acquistato_il,
      stato: p.stato,
      operatore: p.operatore || null,
      lezioni_totali: Number(p.lezioni_totali || 0),
      lezioni_utilizzate: Number(p.lezioni_utilizzate || 0),
      scadenza: p.scadenza || null,
      data_prenotazione: null,
      ora_prenotazione: null,
      stripe_session_id: p.stripe_session_id || null,
    }));

    const storicoSingole = (singole || []).map((s) => ({
      id: `singola-${s.id}`,
      origine: "singola",
      tipo: "pt_singola",
      prezzo: Number(s.prezzo || 30),
      data_acquisto: s.richiesta_il,
      stato: s.stato,
      operatore: s.operatore || null,
      lezioni_totali: 1,
      lezioni_utilizzate: s.stato === "effettuata" ? 1 : 0,
      scadenza: null,
      data_prenotazione: s.data || null,
      ora_prenotazione: s.ora || null,
      stripe_session_id: s.stripe_session_id || null,
    }));

    /*
     * Uniamo pacchetti e sedute singole e ordiniamo
     * dal più recente al più vecchio.
     */
    const storico = [...storicoPacchetti, ...storicoSingole].sort(
      (a, b) => {
        const dataA = a.data_acquisto
          ? new Date(a.data_acquisto).getTime()
          : 0;

        const dataB = b.data_acquisto
          ? new Date(b.data_acquisto).getTime()
          : 0;

        return dataB - dataA;
      },
    );

    return NextResponse.json({
      success: true,
      storico,
    });
  } catch (e) {
    console.error("ERRORE STORICO MY PERSONAL:", e);

    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Errore caricamento storico My Personal",
      },
      { status: 500 },
    );
  }
}