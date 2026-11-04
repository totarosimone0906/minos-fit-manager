import { createClient } from "@supabase/supabase-js";
import { getFirebaseMessaging } from "./firebase-admin";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SECRET_KEY || "",
);

type InviaPushParams = {
  profileId: string;
  titolo: string;
  messaggio: string;
  data?: Record<string, string>;
};

export async function inviaPushACliente({
  profileId,
  titolo,
  messaggio,
  data,
}: InviaPushParams) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SECRET_KEY
  ) {
    throw new Error("Configurazione Supabase server incompleta");
  }

  const { data: tokenRows, error } = await supabaseAdmin
    .from("push_tokens")
    .select("id, token")
    .eq("profile_id", profileId)
    .eq("attivo", true);

  if (error) {
    throw new Error(
      `Errore recupero token push: ${error.message}`,
    );
  }

  if (!tokenRows || tokenRows.length === 0) {
    return {
      success: true,
      inviati: 0,
      falliti: 0,
      motivo: "Nessun dispositivo attivo",
    };
  }

  const tokens = tokenRows.map((riga) => riga.token);

  const risposta = await getFirebaseMessaging().sendEachForMulticast({
    tokens,
    notification: {
      title: titolo,
      body: messaggio,
    },
    data: data || {},
    android: {
      priority: "high",
      notification: {
        sound: "default",
      },
    },
  });

  const tokenDaDisattivare: string[] = [];

  risposta.responses.forEach((risultato, indice) => {
    if (risultato.success) return;

    const codice = risultato.error?.code;

    if (
      codice === "messaging/registration-token-not-registered" ||
      codice === "messaging/invalid-registration-token"
    ) {
      tokenDaDisattivare.push(tokens[indice]);
    }
  });

  if (tokenDaDisattivare.length > 0) {
    const { error: erroreDisattivazione } = await supabaseAdmin
      .from("push_tokens")
      .update({
        attivo: false,
        updated_at: new Date().toISOString(),
      })
      .in("token", tokenDaDisattivare);

    if (erroreDisattivazione) {
      console.error(
        "Errore disattivazione token push:",
        erroreDisattivazione,
      );
    }
  }

  return {
    success: risposta.successCount > 0,
    inviati: risposta.successCount,
    falliti: risposta.failureCount,
  };
}