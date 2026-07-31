import Stripe from "stripe"
import { NextResponse } from "next/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "")

const prezzi: any = {
  scheda: {
    nome: "Scheda Personalizzata MINOS FIT",
    prezzo: 1000,
  },
  mensile: {
    nome: "Abbonamento Mensile MINOS FIT",
    prezzo: 3500,
  },
  trimestrale: {
    nome: "Abbonamento Trimestrale MINOS FIT",
    prezzo: 9500,
  },
  semestrale: {
    nome: "Abbonamento Semestrale MINOS FIT",
    prezzo: 18000,
  },
  annuale: {
    nome: "Abbonamento Annuale MINOS FIT",
    prezzo: 30000,
  },
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const tipo = body.tipo || "scheda"

    if (!prezzi[tipo]) {
      return NextResponse.json(
        { error: "Tipo pagamento non valido" },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: prezzi[tipo].nome,
            },
            unit_amount: prezzi[tipo].prezzo,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/area-cliente?pagamento_abbonamento=${tipo}`,
cancel_url: `${appUrl}/area-cliente?pagamento_abbonamento=cancel`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Errore Stripe" },
      { status: 500 }
    )
  }
}