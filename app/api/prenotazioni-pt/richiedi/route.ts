import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/app/lib/supabase-server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SECRET_KEY || "",
);

const OPERATORI = ["Simone Totaro", "Daniele Totaro"];
const STATI_OCCUPATI = ["in_attesa_admin", "confermata"];

function oggiRoma() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Rome" });
}

function slotValido(data: string, ora: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !/^\d{2}:00$/.test(ora)) return false;
  const giorno = new Date(`${data}T12:00:00`).getDay();
  const h = Number(ora.slice(0, 2));
  if (giorno === 0) return false;
  if (giorno === 6) return h >= 9 && h <= 13;
  return h >= 9 && h <= 20;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabaseAuth = await createSupabaseServerClient();

const {
  data: { user },
  error: authError,
} = await supabaseAuth.auth.getUser();

if (authError || !user) {
  return NextResponse.json(
    { error: "Devi effettuare l'accesso per prenotare." },
    { status: 401 },
  );
}

if (String(body.clienteId || "") !== user.id) {
  return NextResponse.json(
    { error: "Non puoi effettuare prenotazioni per un altro cliente." },
    { status: 403 },
  );
}
    const clienteId = String(body.clienteId || "");
    const { data: profiloAccount, error: profiloAccountError } =
  await supabase
    .from("profiles")
    .select("stato_account")
    .eq("id", user.id)
    .single();

if (
  profiloAccountError ||
  !profiloAccount ||
  profiloAccount.stato_account !== "attivo"
) {
  return NextResponse.json(
    { error: "Account non attivo. Prenotazione non autorizzata." },
    { status: 403 },
  );
}
    const operatore = String(body.operatore || "");
    const data = String(body.data || "");
    const ora = String(body.ora || "");
    const tipoServizio = String(body.tipoServizio || "");
    const pacchettoId = body.pacchettoId ? String(body.pacchettoId) : null;

    if (!clienteId || !OPERATORI.includes(operatore)) {
      return NextResponse.json({ error: "Dati prenotazione non validi" }, { status: 400 });
    }
    if (data <= oggiRoma()) {
      return NextResponse.json({ error: "Non è possibile prenotare per oggi o per una data passata." }, { status: 400 });
    }
    if (!slotValido(data, ora)) {
      return NextResponse.json({ error: "Data o orario non valido." }, { status: 400 });
    }
    if (!["pacchetto", "personal", "consulenza_gratuita"].includes(tipoServizio)) {
      return NextResponse.json({ error: "Servizio PT non valido." }, { status: 400 });
    }

    const { data: profilo } = await supabase
      .from("profiles")
      .select("id,nome,cognome")
      .eq("id", clienteId)
      .single();
    if (!profilo) return NextResponse.json({ error: "Cliente non trovato" }, { status: 404 });

    const { count: occupato } = await supabase
      .from("prenotazioni_pt")
      .select("id", { count: "exact", head: true })
      .eq("operatore", operatore)
      .eq("data", data)
      .eq("ora", ora)
      .in("stato", STATI_OCCUPATI);
    if ((occupato || 0) > 0) {
      return NextResponse.json({ error: "Questo orario non è più disponibile." }, { status: 409 });
    }

    if (tipoServizio === "consulenza_gratuita") {
      const d = new Date(`${data}T12:00:00`);
      const y = d.getFullYear();
      const m = d.getMonth();
      const inizio = `${y}-${String(m + 1).padStart(2, "0")}-01`;
      const ultimo = new Date(y, m + 1, 0).getDate();
      const fine = `${y}-${String(m + 1).padStart(2, "0")}-${String(ultimo).padStart(2, "0")}`;
      const { count } = await supabase
        .from("prenotazioni_pt")
        .select("id", { count: "exact", head: true })
        .eq("cliente_id", clienteId)
        .eq("tipo_servizio", "consulenza_gratuita")
        .gte("data", inizio)
        .lte("data", fine)
        .in("stato", ["in_attesa_admin", "confermata", "effettuata"]);
      if ((count || 0) > 0) {
        return NextResponse.json({ error: "Hai già utilizzato o richiesto la consulenza gratuita del mese." }, { status: 409 });
      }
    }

    let pacchetto: any = null;
    if (tipoServizio === "pacchetto" || tipoServizio === "personal") {
      if (!pacchettoId) return NextResponse.json({ error: "Pacchetto mancante" }, { status: 400 });
      const { data: p } = await supabase
        .from("pacchetti_pt")
        .select("*")
        .eq("id", pacchettoId)
        .eq("cliente_id", clienteId)
        .eq("stato", "attivo")
        .single();
      if (!p) return NextResponse.json({ error: "Pacchetto non attivo" }, { status: 409 });
      pacchetto = p;

      if (tipoServizio === "personal") {
        if (p.tipo !== "personal") return NextResponse.json({ error: "Pacchetto Personal non valido" }, { status: 409 });
        if (p.scadenza && p.scadenza < oggiRoma()) return NextResponse.json({ error: "Pacchetto Personal scaduto" }, { status: 409 });
        if (p.operatore && p.operatore !== operatore) return NextResponse.json({ error: "Il check va prenotato con il Personal scelto." }, { status: 409 });
        const { count } = await supabase
          .from("prenotazioni_pt")
          .select("id", { count: "exact", head: true })
          .eq("pacchetto_id", p.id)
          .eq("tipo_servizio", "personal")
          .in("stato", ["in_attesa_admin", "confermata", "effettuata"]);
        if ((count || 0) > 0) return NextResponse.json({ error: "Hai già richiesto il check di questo mese." }, { status: 409 });
      } else {
        if (!["pacchetto_5", "pacchetto_10"].includes(p.tipo)) return NextResponse.json({ error: "Pacchetto sedute non valido" }, { status: 409 });
        const { count } = await supabase
          .from("prenotazioni_pt")
          .select("id", { count: "exact", head: true })
          .eq("pacchetto_id", p.id)
          .in("stato", ["in_attesa_admin", "confermata"]);
        const disponibili = p.lezioni_totali - p.lezioni_utilizzate - (count || 0);
        if (disponibili <= 0) return NextResponse.json({ error: "Non hai sedute disponibili." }, { status: 409 });
      }
    }

    const { data: prenotazione, error } = await supabase
      .from("prenotazioni_pt")
      .insert({
        cliente_id: clienteId,
        cliente_nome: `${profilo.nome || ""} ${profilo.cognome || ""}`.trim(),
        operatore,
        data,
        ora,
        prezzo: 0,
        stato: "in_attesa_admin",
        pagamento: tipoServizio === "consulenza_gratuita" ? "gratuito" : "pacchetto",
        tipo_servizio: tipoServizio,
        pacchetto_id: pacchetto?.id || null,
        richiesta_il: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "Questo orario non è più disponibile." }, { status: 409 });
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, prenotazione });
  } catch (e) {
    console.error("ERRORE RICHIESTA PT:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Errore richiesta PT" }, { status: 500 });
  }
}
