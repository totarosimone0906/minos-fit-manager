import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../../../lib/supabase-server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SECRET_KEY || "",
);

export async function POST(req: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
      return NextResponse.json({ error: "Configurazione Supabase mancante." }, { status: 500 });
    }

    const supabase = await createSupabaseServerClient();

const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();

if (authError || !user) {
  return NextResponse.json(
    { error: "Accesso non autorizzato." },
    { status: 401 },
  );
}

const body = await req.json();
const clienteId = String(body?.clienteId || "").trim();

if (!clienteId) {
  return NextResponse.json(
    { error: "Cliente non identificato." },
    { status: 400 },
  );
}

const { data: profilo, error: profiloError } = await supabase
  .from("profiles")
  .select("ruolo, stato_account")
  .eq("id", user.id)
  .single();

if (profiloError || !profilo || profilo.stato_account !== "attivo") {
  return NextResponse.json(
    { error: "Accesso non autorizzato." },
    { status: 403 },
  );
}

const isAdmin = profilo.ruolo === "admin";

if (!isAdmin && user.id !== clienteId) {
  return NextResponse.json(
    { error: "Non puoi consultare il certificato di un altro cliente." },
    { status: 403 },
  );
}

    const { data: cliente, error: erroreCliente } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", clienteId)
      .single();

    if (erroreCliente || !cliente) {
      return NextResponse.json({ error: "Cliente non trovato." }, { status: 404 });
    }

    const { data: pratica, error } = await supabaseAdmin
      .from("certificati_medici")
      .select("id, stato, data_rilascio, data_scadenza, file_nome, file_url, created_at")
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("ERRORE LETTURA STATO CERTIFICATO:", error);
      return NextResponse.json(
        { error: error.message || "Errore durante il recupero del certificato." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, pratica: pratica || null });
  } catch (error: unknown) {
    console.error("ERRORE API STATO CERTIFICATO:", error);
    const messaggio =
      error instanceof Error ? error.message : "Errore durante il recupero dello stato del certificato.";
    return NextResponse.json({ error: messaggio }, { status: 500 });
  }
}
