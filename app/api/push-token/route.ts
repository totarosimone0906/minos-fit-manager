import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { inviaPushACliente } from "@/app/lib/push-notifications";

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
    const token = String(body.token || "").trim();
    const piattaforma = String(body.piattaforma || "").trim();

    if (!clienteId || !token) {
      return NextResponse.json(
        { error: "Cliente o token non valido" },
        { status: 400 },
      );
    }

    if (!["android", "ios"].includes(piattaforma)) {
      return NextResponse.json(
        { error: "Piattaforma non valida" },
        { status: 400 },
      );
    }

    // Salva o aggiorna il token del dispositivo
    const { error: tokenError } = await supabaseAdmin
      .from("push_tokens")
      .upsert(
        {
          profile_id: clienteId,
          token,
          piattaforma,
          attivo: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "token",
        },
      );

    if (tokenError) {
      console.error("ERRORE SALVATAGGIO PUSH TOKEN:", tokenError);
      throw new Error(tokenError.message);
    }

    // Controlla se il cliente ha già ricevuto il benvenuto
    const { data: profilo, error: profiloError } = await supabaseAdmin
      .from("profiles")
      .select("push_benvenuto_inviato")
      .eq("id", clienteId)
      .single();

    if (profiloError) {
      console.error("ERRORE LETTURA PROFILO:", profiloError);
      throw new Error(profiloError.message);
    }

    // Invia il benvenuto soltanto una volta
    if (!profilo.push_benvenuto_inviato) {
      const risultatoPush = await inviaPushACliente({
        profileId: clienteId,
        titolo: "🎉 Benvenuto in Minos Fit!",
        messaggio:
          "La tua iscrizione è stata completata. Benvenuto nella community di Minos Fit 💪",
        data: {
          tipo: "benvenuto",
        },
      });

      // Segna come inviato solo se almeno una notifica è stata recapitata a FCM
      if (risultatoPush.inviati > 0) {
        const { error: aggiornamentoError } = await supabaseAdmin
          .from("profiles")
          .update({
            push_benvenuto_inviato: true,
          })
          .eq("id", clienteId);

        if (aggiornamentoError) {
          console.error(
            "ERRORE AGGIORNAMENTO BENVENUTO:",
            aggiornamentoError,
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: unknown) {
    console.error("ERRORE API PUSH TOKEN:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Errore durante il salvataggio del token push",
      },
      { status: 500 },
    );
  }
}