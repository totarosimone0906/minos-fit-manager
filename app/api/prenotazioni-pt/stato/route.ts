import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SECRET_KEY || "",
);

function oggiISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Rome" });
}

export async function POST(req: Request) {
  try {
    const { clienteId } = await req.json();
    if (!clienteId) return NextResponse.json({ error: "Cliente mancante" }, { status: 400 });

    const oggi = oggiISO();

    const { data: pacchetti, error } = await supabase
      .from("pacchetti_pt")
      .select("*")
      .eq("cliente_id", clienteId)
      .eq("stato", "attivo")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    for (const p of pacchetti || []) {
      if (p.tipo === "personal" && p.scadenza && p.scadenza < oggi) {
        await supabase.from("pacchetti_pt").update({ stato: "scaduto" }).eq("id", p.id);
      } else if (p.tipo !== "personal" && p.lezioni_utilizzate >= p.lezioni_totali) {
        await supabase.from("pacchetti_pt").update({ stato: "esaurito" }).eq("id", p.id);
      }
    }

    const { data: attivi } = await supabase
      .from("pacchetti_pt")
      .select("*")
      .eq("cliente_id", clienteId)
      .eq("stato", "attivo")
      .order("created_at", { ascending: false })
      .limit(1);

    let pacchetto: any = attivi?.[0] || null;

    if (pacchetto) {
      const { count } = await supabase
        .from("prenotazioni_pt")
        .select("id", { count: "exact", head: true })
        .eq("pacchetto_id", pacchetto.id)
        .in("stato", ["in_attesa_admin", "confermata"]);

      const impegnate = count || 0;
      pacchetto = {
        ...pacchetto,
        lezioni_impegnate: impegnate,
        lezioni_disponibili:
          pacchetto.tipo === "personal"
            ? 0
            : Math.max(0, pacchetto.lezioni_totali - pacchetto.lezioni_utilizzate - impegnate),
      };
    }

    const adesso = new Date();
    const anno = Number(
      new Intl.DateTimeFormat("en", { timeZone: "Europe/Rome", year: "numeric" }).format(adesso),
    );
    const mese = Number(
      new Intl.DateTimeFormat("en", { timeZone: "Europe/Rome", month: "numeric" }).format(adesso),
    );
    const inizioMese = `${anno}-${String(mese).padStart(2, "0")}-01`;
    const fine = new Date(Date.UTC(anno, mese, 0));
    const fineMese = `${anno}-${String(mese).padStart(2, "0")}-${String(fine.getUTCDate()).padStart(2, "0")}`;

    const { count: consulenze } = await supabase
      .from("prenotazioni_pt")
      .select("id", { count: "exact", head: true })
      .eq("cliente_id", clienteId)
      .eq("tipo_servizio", "consulenza_gratuita")
      .gte("data", inizioMese)
      .lte("data", fineMese)
      .in("stato", ["in_attesa_admin", "confermata", "effettuata"]);

    return NextResponse.json({
      pacchetto,
      consulenzaDisponibile: (consulenze || 0) === 0,
      consulenzaGiaRichiesta: (consulenze || 0) > 0,
    });
  } catch (e) {
    console.error("ERRORE STATO PT:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Errore stato PT" },
      { status: 500 },
    );
  }
}
