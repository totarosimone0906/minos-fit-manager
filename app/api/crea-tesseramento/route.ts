import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/app/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "")

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SECRET_KEY || ""
)

const MAX_FILE_SIZE = 10 * 1024 * 1024

const TIPI_FILE = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]

function pulisciNomeFile(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
}

function calcolaEta(dataNascita: string) {
  const nascita = new Date(`${dataNascita}T00:00:00`)

  if (Number.isNaN(nascita.getTime())) {
    return null
  }

  const oggi = new Date()

  let eta = oggi.getFullYear() - nascita.getFullYear()

  const differenzaMesi =
    oggi.getMonth() - nascita.getMonth()

  if (
    differenzaMesi < 0 ||
    (differenzaMesi === 0 &&
      oggi.getDate() < nascita.getDate())
  ) {
    eta--
  }

  return eta
}

function cfFormalmenteValido(cf: string) {
  return /^[A-Z0-9]{16}$/.test(
    cf.trim().toUpperCase()
  )
}

function fileValido(file: File) {
  return (
    file.size > 0 &&
    file.size <= MAX_FILE_SIZE &&
    TIPI_FILE.includes(file.type)
  )
}

export async function POST(req: Request) {
  let tesseramentoId: string | null = null
  const fileCaricati: string[] = []

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "STRIPE_SECRET_KEY non configurata." },
        { status: 500 }
      )
    }

    if (!process.env.SUPABASE_SECRET_KEY) {
      return NextResponse.json(
        { error: "SUPABASE_SECRET_KEY non configurata." },
        { status: 500 }
      )
    }

    const formData = await req.formData()
    const supabaseAuth = await createSupabaseServerClient();

const {
  data: { user },
  error: authError,
} = await supabaseAuth.auth.getUser();

if (authError || !user) {
  return NextResponse.json(
    { error: "Devi effettuare l'accesso per procedere al tesseramento." },
    { status: 401 },
  );
}

const clienteIdRichiesto = String(
  formData.get("cliente_id") || ""
).trim();

if (clienteIdRichiesto !== user.id) {
  return NextResponse.json(
    { error: "Non puoi creare un tesseramento per un altro cliente." },
    { status: 403 },
  );
}
const { data: profiloAccount, error: profiloError } =
  await supabaseAuth
    .from("profiles")
    .select("stato_account")
    .eq("id", user.id)
    .single();

if (
  profiloError ||
  !profiloAccount ||
  profiloAccount.stato_account !== "attivo"
) {
  return NextResponse.json(
    {
      error: "Account non ancora approvato o non attivo.",
    },
    { status: 403 },
  );
}
    // ==============================
    // DATI CLIENTE
    // ==============================

    const clienteId = String(
      formData.get("cliente_id") || ""
    )

    const tipoAdesione = String(
      formData.get("tipo_adesione") || "nuova"
    )

    const nome = String(
      formData.get("nome") || ""
    ).trim()

    const cognome = String(
      formData.get("cognome") || ""
    ).trim()

    const sesso = String(
      formData.get("sesso") || ""
    ).trim()

    const dataNascita = String(
      formData.get("data_nascita") || ""
    )

    const luogoNascita = String(
      formData.get("luogo_nascita") || ""
    ).trim()

    const provinciaNascita = String(
      formData.get("provincia_nascita") || ""
    )
      .trim()
      .toUpperCase()

    const indirizzo = String(
      formData.get("indirizzo") || ""
    ).trim()

    const numeroCivico = String(
      formData.get("civico") || ""
    ).trim()

    const cap = String(
      formData.get("cap") || ""
    ).trim()

    const comuneResidenza = String(
      formData.get("comune") || ""
    ).trim()

    const provinciaResidenza = String(
      formData.get("provincia_residenza") || ""
    )
      .trim()
      .toUpperCase()

    const telefono = String(
      formData.get("telefono") || ""
    ).trim()

    const email = String(
      formData.get("email") || ""
    )
      .trim()
      .toLowerCase()

    const codiceFiscale = String(
      formData.get("codice_fiscale") || ""
    )
      .trim()
      .toUpperCase()

    const consensoPrivacy =
      String(formData.get("consenso_privacy")) ===
      "true"

    const consensoImmagini =
      String(formData.get("consenso_immagini")) ===
      "true"

    // ==============================
    // CONTROLLI
    // ==============================

    if (
      !clienteId ||
      !nome ||
      !cognome ||
      !dataNascita ||
      !luogoNascita ||
      !provinciaNascita ||
      !indirizzo ||
      !numeroCivico ||
      !cap ||
      !comuneResidenza ||
      !provinciaResidenza ||
      !telefono ||
      !email ||
      !codiceFiscale
    ) {
      return NextResponse.json(
        {
          error:
            "Compila tutti i campi obbligatori.",
        },
        { status: 400 }
      )
    }

    if (
      tipoAdesione !== "nuova" &&
      tipoAdesione !== "rinnovo"
    ) {
      return NextResponse.json(
        {
          error: "Tipo di adesione non valido.",
        },
        { status: 400 }
      )
    }

    const eta = calcolaEta(dataNascita)

    if (eta === null || eta < 0) {
      return NextResponse.json(
        {
          error: "Data di nascita non valida.",
        },
        { status: 400 }
      )
    }

    const minorenne = eta < 18

    if (!cfFormalmenteValido(codiceFiscale)) {
      return NextResponse.json(
        {
          error:
            "Codice fiscale formalmente non valido.",
        },
        { status: 400 }
      )
    }

    if (!consensoPrivacy) {
      return NextResponse.json(
        {
          error:
            "Devi accettare il trattamento dei dati per procedere.",
        },
        { status: 400 }
      )
    }

    // ==============================
    // DOCUMENTO ISCRITTO
    // ==============================

    const documentoCliente =
      formData.get("documento_iscritto")

    if (
      !(documentoCliente instanceof File) ||
      !fileValido(documentoCliente)
    ) {
      return NextResponse.json(
        {
          error:
            "Documento dell'iscritto mancante, non valido o superiore a 10 MB.",
        },
        { status: 400 }
      )
    }

    // ==============================
    // EVENTUALE GENITORE
    // ==============================

    let nomeGenitore: string | null = null
    let cognomeGenitore: string | null = null
    let cfGenitore: string | null = null
    let documentoGenitore: File | null = null

    if (minorenne) {
      nomeGenitore = String(
        formData.get("genitore_nome") || ""
      ).trim()

      cognomeGenitore = String(
        formData.get("genitore_cognome") || ""
      ).trim()

      cfGenitore = String(
        formData.get(
          "genitore_codice_fiscale"
        ) || ""
      )
        .trim()
        .toUpperCase()

      const fileGenitore =
        formData.get("documento_genitore")

      if (
        !nomeGenitore ||
        !cognomeGenitore ||
        !cfGenitore
      ) {
        return NextResponse.json(
          {
            error:
              "Compila i dati del genitore/tutore.",
          },
          { status: 400 }
        )
      }

      if (!cfFormalmenteValido(cfGenitore)) {
        return NextResponse.json(
          {
            error:
              "Codice fiscale del genitore/tutore non valido.",
          },
          { status: 400 }
        )
      }

      if (
        !(fileGenitore instanceof File) ||
        !fileValido(fileGenitore)
      ) {
        return NextResponse.json(
          {
            error:
              "Documento del genitore/tutore mancante o non valido.",
          },
          { status: 400 }
        )
      }

      documentoGenitore = fileGenitore
    }

    // ==============================
    // CONTROLLO CLIENTE
    // ==============================

    const {
      data: cliente,
      error: erroreCliente,
    } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", clienteId)
      .single()

    if (erroreCliente || !cliente) {
      return NextResponse.json(
        {
          error: "Cliente non trovato.",
        },
        { status: 404 }
      )
    }

    // ==============================
    // CREA PRATICA
    // ==============================

    const {
      data: pratica,
      error: errorePratica,
    } = await supabaseAdmin
      .from("tesseramenti")
      .insert({
        cliente_id: clienteId,

        stato: "in_pagamento",
        tipo_adesione: tipoAdesione,

        nome,
        cognome,
        sesso: sesso || null,

        data_nascita: dataNascita,
        luogo_nascita: luogoNascita,
        provincia_nascita: provinciaNascita,

        indirizzo,
        numero_civico: numeroCivico,
        cap,
        comune_residenza: comuneResidenza,
        provincia_residenza: provinciaResidenza,

        telefono,
        email,
        codice_fiscale: codiceFiscale,

        minorenne,

        nome_genitore: nomeGenitore,
        cognome_genitore: cognomeGenitore,
        codice_fiscale_genitore: cfGenitore,

        privacy_accettata: consensoPrivacy,
        consenso_dati: consensoPrivacy,
        consenso_immagini: consensoImmagini,

        importo: 3000,
      })
      .select("id")
      .single()

    if (errorePratica || !pratica) {
      throw new Error(
        errorePratica?.message ||
          "Impossibile creare il tesseramento."
      )
    }

    tesseramentoId = pratica.id

    // ==============================
    // STORAGE
    // ==============================

    const cartella =
      `${clienteId}/${tesseramentoId}`

    const nomeDocumentoCliente =
      pulisciNomeFile(documentoCliente.name)

    const pathDocumentoCliente =
      `${cartella}/documento-cliente-${nomeDocumentoCliente}`

    const bufferCliente = Buffer.from(
      await documentoCliente.arrayBuffer()
    )

    const {
      error: erroreUploadCliente,
    } = await supabaseAdmin.storage
      .from("tesseramenti")
      .upload(
        pathDocumentoCliente,
        bufferCliente,
        {
          contentType: documentoCliente.type,
          upsert: false,
        }
      )

    if (erroreUploadCliente) {
      throw new Error(
        `Errore upload documento: ${erroreUploadCliente.message}`
      )
    }

    fileCaricati.push(pathDocumentoCliente)

    // ==============================
    // DOCUMENTO GENITORE
    // ==============================

    let pathDocumentoGenitore:
      | string
      | null = null

    if (minorenne && documentoGenitore) {
      const nomeFile =
        pulisciNomeFile(
          documentoGenitore.name
        )

      pathDocumentoGenitore =
        `${cartella}/documento-genitore-${nomeFile}`

      const bufferGenitore =
        Buffer.from(
          await documentoGenitore.arrayBuffer()
        )

      const {
        error: erroreUploadGenitore,
      } = await supabaseAdmin.storage
        .from("tesseramenti")
        .upload(
          pathDocumentoGenitore,
          bufferGenitore,
          {
            contentType:
              documentoGenitore.type,
            upsert: false,
          }
        )

      if (erroreUploadGenitore) {
        throw new Error(
          `Errore upload documento genitore: ${erroreUploadGenitore.message}`
        )
      }

      fileCaricati.push(
        pathDocumentoGenitore
      )
    }

    // Salviamo i PATH PRIVATI
    const {
      error: errorePath,
    } = await supabaseAdmin
      .from("tesseramenti")
      .update({
        documento_cliente_path:
          pathDocumentoCliente,

        documento_genitore_path:
          pathDocumentoGenitore,
      })
      .eq("id", tesseramentoId)

    if (errorePath) {
      throw new Error(errorePath.message)
    }

    // ==============================
    // STRIPE
    // ==============================

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000"

    const session =
      await stripe.checkout.sessions.create({
        mode: "payment",

        payment_method_types: ["card"],

        line_items: [
          {
            price_data: {
              currency: "eur",

              product_data: {
                name:
                  "Quota associativa annuale MINOS FIT",
              },

              unit_amount: 3000,
            },

            quantity: 1,
          },
        ],

        metadata: {
          tipo: "quota_associativa",
          cliente_id: clienteId,
          tesseramento_id:
            tesseramentoId,
        },

        success_url:
          `${appUrl}/area-cliente/quota-associativa` +
          `?pagamento=success&session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          `${appUrl}/area-cliente/quota-associativa` +
          `?pagamento=cancel&tesseramento_id=${tesseramentoId}`,
      })

    if (!session.url) {
      throw new Error(
        "Stripe non ha restituito il link di pagamento."
      )
    }

    const {
      error: erroreSessione,
    } = await supabaseAdmin
      .from("tesseramenti")
      .update({
        stripe_session_id: session.id,
      })
      .eq("id", tesseramentoId)

    if (erroreSessione) {
      throw new Error(
        erroreSessione.message
      )
    }

    return NextResponse.json({
      success: true,
      url: session.url,
      tesseramentoId,
    })
  } catch (error: unknown) {
    console.error(
      "ERRORE CREA TESSERAMENTO:",
      error
    )

    // Se la creazione fallisce prima di Stripe,
    // eliminiamo i file eventualmente caricati.
    if (fileCaricati.length > 0) {
      await supabaseAdmin.storage
        .from("tesseramenti")
        .remove(fileCaricati)
    }

    if (tesseramentoId) {
      await supabaseAdmin
        .from("tesseramenti")
        .delete()
        .eq("id", tesseramentoId)
    }

    const messaggio =
      error instanceof Error
        ? error.message
        : "Errore durante il tesseramento."

    return NextResponse.json(
      { error: messaggio },
      { status: 500 }
    )
  }
}