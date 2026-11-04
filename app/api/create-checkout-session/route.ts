import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

type TipoPagamento =
  | "scheda"
  | "mensile"
  | "trimestrale"
  | "semestrale"
  | "annuale"
  | "pt_singola"
  | "pt_5"
  | "pt_10"
  | "pt_personal";

const prezzi: Record<TipoPagamento, { nome: string; prezzo: number }> = {
  scheda: { nome: "Scheda Personalizzata MINOS FIT", prezzo: 1000 },
  mensile: { nome: "Abbonamento Mensile MINOS FIT", prezzo: 4000 },
  trimestrale: { nome: "Abbonamento Trimestrale MINOS FIT", prezzo: 11000 },
  semestrale: { nome: "Abbonamento Semestrale MINOS FIT", prezzo: 20000 },
  annuale: { nome: "Abbonamento Annuale MINOS FIT", prezzo: 36000 },
  pt_singola: { nome: "Seduta Personal Trainer MINOS FIT", prezzo: 3000 },
  pt_5: { nome: "Pacchetto 5 sedute PT MINOS FIT", prezzo: 10000 },
  pt_10: { nome: "Pacchetto 10 sedute PT MINOS FIT", prezzo: 18000 },
  pt_personal: { nome: "Pacchetto Personal MINOS FIT - 1 mese", prezzo: 8000 },
};

const operatori = ["Simone Totaro", "Daniele Totaro"];

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "STRIPE_SECRET_KEY non configurata" }, { status: 500 });
    }

    const body = await req.json();
    const supabaseAuth = await createSupabaseServerClient();

const {
  data: { user },
  error: authError,
} = await supabaseAuth.auth.getUser();

if (authError || !user) {
  return NextResponse.json(
    { error: "Devi effettuare l'accesso per procedere al pagamento." },
    { status: 401 },
  );
}
    const tipo = body.tipo as TipoPagamento;
    const clienteId = String(body.clienteId || "");
    if (clienteId !== user.id) {
  return NextResponse.json(
    { error: "Non puoi effettuare pagamenti per un altro cliente." },
    { status: 403 },
  );
}
const { data: profilo, error: profiloError } = await supabaseAuth
  .from("profiles")
  .select("stato_account")
  .eq("id", user.id)
  .single();

if (
  profiloError ||
  !profilo ||
  profilo.stato_account !== "attivo"
) {
  return NextResponse.json(
    { error: "Account non attivo. Pagamento non autorizzato." },
    { status: 403 },
  );
}
    const clienteEmail = user.email || undefined;

    if (!tipo || !prezzi[tipo]) {
      return NextResponse.json({ error: "Tipo pagamento non valido" }, { status: 400 });
    }

    const richiedeCliente = tipo !== "scheda";
    if (richiedeCliente && !clienteId) {
      return NextResponse.json({ error: "Cliente non identificato" }, { status: 400 });
    }

    const metadata: Record<string, string> = { tipo, cliente_id: clienteId };

    if (tipo === "pt_singola") {
      const operatore = String(body.operatore || "");
      const data = String(body.data || "");
      const ora = String(body.ora || "");
      if (!operatori.includes(operatore) || !data || !ora) {
        return NextResponse.json({ error: "Dati della seduta PT incompleti" }, { status: 400 });
      }
      metadata.operatore = operatore;
      metadata.data = data;
      metadata.ora = ora;
    }

    if (tipo === "pt_personal") {
      const operatore = String(body.operatore || "");
      if (!operatori.includes(operatore)) {
        return NextResponse.json({ error: "Personal Trainer non valido" }, { status: 400 });
      }
      metadata.operatore = operatore;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: prezzi[tipo].nome },
            unit_amount: prezzi[tipo].prezzo,
          },
          quantity: 1,
        },
      ],
      metadata,
      ...(clienteEmail ? { customer_email: clienteEmail } : {}),
      success_url: `${appUrl}/area-cliente?pagamento=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/area-cliente?pagamento=cancel`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe non ha restituito un URL di pagamento" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error("ERRORE CREAZIONE CHECKOUT STRIPE:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore durante la creazione del pagamento" },
      { status: 500 },
    );
  }
}
