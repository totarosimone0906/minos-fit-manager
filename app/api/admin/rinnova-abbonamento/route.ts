
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;

    if (!url || !secretKey) {
      return NextResponse.json(
        { error: "Configurazione server incompleta" },
        { status: 500 }
      );
    }

    // Il token viene inviato dal gestionale.
    const authorization = req.headers.get("authorization");
    const token = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { error: "Accesso non autorizzato" },
        { status: 401 }
      );
    }

    const supabaseAdmin = createClient(url, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verifica il token con Supabase Auth.
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Sessione non valida" },
        { status: 401 }
      );
    }

    const adminId = authData.user.id;

    // Il ruolo viene letto dal database, non dal browser.
    const { data: profilo, error: profiloError } =
      await supabaseAdmin
        .from("profiles")
        .select("ruolo, stato_account")
        .eq("id", adminId)
        .single();

    if (
      profiloError ||
      profilo?.ruolo !== "admin" ||
      profilo?.stato_account !== "attivo"
    ) {
      return NextResponse.json(
        { error: "Permessi amministratore insufficienti" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const richiestaId = body.richiestaId;
    const clienteId = body.clienteId;
    const tipo = body.tipo;
    const metodo = body.metodo;

    if (
      typeof richiestaId !== "string" ||
      typeof clienteId !== "string" ||
      typeof tipo !== "string" ||
      typeof metodo !== "string"
    ) {
      return NextResponse.json(
        { error: "Dati del rinnovo mancanti o non validi" },
        { status: 400 }
      );
    }

    // Pagamento e rinnovo avvengono nella stessa transazione SQL.
    const { data, error } = await supabaseAdmin
      .rpc("rinnova_abbonamento_manuale", {
        p_richiesta_id: richiestaId,
        p_cliente_id: clienteId,
        p_admin_id: adminId,
        p_tipo: tipo,
        p_metodo: metodo,
      })
      .single();

    if (error || !data) {
      console.error("Errore rinnovo manuale:", error);
      return NextResponse.json(
        { error: "Impossibile completare il rinnovo" },
        { status: 500 }
      );
    }

   const risultato = data as {
  gia_elaborato: boolean;
  nuova_scadenza: string;
};

return NextResponse.json({
  success: true,
  alreadyProcessed: risultato.gia_elaborato,
  nuovaScadenza: risultato.nuova_scadenza,
});
  } catch (error) {
    console.error("Errore API rinnovo manuale:", error);

    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
