import { NextResponse } from "next/server";
import { inviaPushACliente } from "@/app/lib/push-notifications";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const profileId = String(body.profileId || "").trim();

    if (!profileId) {
      return NextResponse.json(
        { error: "profileId mancante" },
        { status: 400 },
      );
    }

    const risultato = await inviaPushACliente({
      profileId,
      titolo: "Minos Fit 🔥",
      messaggio: "Test notifica inviato dal backend Minos Fit!",
      data: {
        tipo: "test",
      },
    });

    return NextResponse.json({
      success: true,
      risultato,
    });
  } catch (error: unknown) {
    console.error("ERRORE TEST PUSH:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Errore durante l'invio della notifica",
      },
      { status: 500 },
    );
  }
}