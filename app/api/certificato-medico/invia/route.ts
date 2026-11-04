import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SECRET_KEY || ""
)

const DICHIARAZIONE_CERTIFICATO =
  "Dichiaro di aver verificato attentamente i dati inseriti relativi al certificato medico e che gli stessi corrispondono al documento allegato e in mio possesso. Dichiaro che le informazioni fornite sono veritiere e sono consapevole delle responsabilità derivanti da dichiarazioni false o non veritiere."

export async function POST(req: Request) {
  let filePathCaricato = ""

  try {
    // ==============================
    // CONTROLLO ENV
    // ==============================

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        {
          error:
            "NEXT_PUBLIC_SUPABASE_URL non configurata.",
        },
        {
          status: 500,
        }
      )
    }

    if (!process.env.SUPABASE_SECRET_KEY) {
      return NextResponse.json(
        {
          error:
            "SUPABASE_SECRET_KEY non configurata.",
        },
        {
          status: 500,
        }
      )
    }

    // ==============================
    // LEGGI FORM DATA
    // ==============================

    const formData = await req.formData()

    const clienteId = String(
      formData.get("clienteId") || ""
    ).trim()

    const dataRilascio = String(
      formData.get("dataRilascio") || ""
    ).trim()

    const dataScadenza = String(
      formData.get("dataScadenza") || ""
    ).trim()

    const dichiarazioneAccettata =
      String(
        formData.get(
          "dichiarazioneAccettata"
        ) || ""
      ) === "true"

    const file = formData.get("file")

    // ==============================
    // CONTROLLI DATI
    // ==============================

    if (!clienteId) {
      return NextResponse.json(
        {
          error:
            "Cliente non identificato.",
        },
        {
          status: 400,
        }
      )
    }

    if (
      !dataRilascio ||
      !dataScadenza
    ) {
      return NextResponse.json(
        {
          error:
            "Inserisci la data di rilascio e la data di scadenza del certificato.",
        },
        {
          status: 400,
        }
      )
    }

    const rilascio = new Date(
      `${dataRilascio}T00:00:00`
    )

    const scadenza = new Date(
      `${dataScadenza}T00:00:00`
    )

    if (
      Number.isNaN(
        rilascio.getTime()
      ) ||
      Number.isNaN(
        scadenza.getTime()
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Le date inserite non sono valide.",
        },
        {
          status: 400,
        }
      )
    }

    if (
      scadenza.getTime() <
      rilascio.getTime()
    ) {
      return NextResponse.json(
        {
          error:
            "La data di scadenza non può essere precedente alla data di rilascio.",
        },
        {
          status: 400,
        }
      )
    }

    if (
      !dichiarazioneAccettata
    ) {
      return NextResponse.json(
        {
          error:
            "Devi accettare la dichiarazione prima di inviare il certificato.",
        },
        {
          status: 400,
        }
      )
    }

    // ==============================
    // CONTROLLO FILE OBBLIGATORIO
    // ==============================

    if (
      !file ||
      !(file instanceof File)
    ) {
      return NextResponse.json(
        {
          error:
            "Devi allegare il certificato medico in formato PDF.",
        },
        {
          status: 400,
        }
      )
    }

    if (
      file.type !==
      "application/pdf"
    ) {
      return NextResponse.json(
        {
          error:
            "Il certificato medico deve essere un file PDF.",
        },
        {
          status: 400,
        }
      )
    }

    if (file.size === 0) {
      return NextResponse.json(
        {
          error:
            "Il file PDF è vuoto.",
        },
        {
          status: 400,
        }
      )
    }

    // Massimo 10 MB
    const dimensioneMassima =
      10 * 1024 * 1024

    if (
      file.size >
      dimensioneMassima
    ) {
      return NextResponse.json(
        {
          error:
            "Il PDF non può superare i 10 MB.",
        },
        {
          status: 400,
        }
      )
    }

    // ==============================
    // CONTROLLO CLIENTE
    // ==============================

    const {
      data: cliente,
      error: erroreCliente,
    } = await supabaseAdmin
      .from("profiles")
      .select("id, nome, cognome, email")
      .eq("id", clienteId)
      .single()

    if (
      erroreCliente ||
      !cliente
    ) {
      console.error(
        "ERRORE RECUPERO CLIENTE:",
        erroreCliente
      )

      return NextResponse.json(
        {
          error:
            "Cliente non trovato.",
        },
        {
          status: 404,
        }
      )
    }

    // ==============================
    // CONTROLLO RICHIESTE PENDENTI
    // ==============================

    const {
      data: certificatiPendenti,
      error:
        erroreCertificatiPendenti,
    } = await supabaseAdmin
      .from("certificati_medici")
      .select("id")
      .eq("cliente_id", clienteId)
      .eq(
        "stato",
        "da_verificare"
      )
      .limit(1)

    if (
      erroreCertificatiPendenti
    ) {
      console.error(
        "ERRORE CONTROLLO CERTIFICATI:",
        erroreCertificatiPendenti
      )

      return NextResponse.json(
        {
          error:
            "Errore durante il controllo delle richieste esistenti.",
        },
        {
          status: 500,
        }
      )
    }

    if (
      certificatiPendenti &&
      certificatiPendenti.length > 0
    ) {
      return NextResponse.json(
        {
          error:
            "Hai già un certificato in attesa di verifica da parte dello staff.",
        },
        {
          status: 409,
        }
      )
    }

    // ==============================
    // PREPARA NOME FILE
    // ==============================

    const nomeOriginale =
      file.name || "certificato.pdf"

    const nomeSicuro =
      nomeOriginale.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      )

    const timestamp =
      Date.now()

    filePathCaricato =
      `${clienteId}/richieste/` +
      `${timestamp}-${nomeSicuro}`

    // ==============================
    // CONVERTI FILE
    // ==============================

    const arrayBuffer =
      await file.arrayBuffer()

    const buffer =
      Buffer.from(arrayBuffer)

    // ==============================
    // UPLOAD STORAGE
    // ==============================

    const {
      error: erroreUpload,
    } = await supabaseAdmin.storage
      .from("certificati")
      .upload(
        filePathCaricato,
        buffer,
        {
          contentType:
            "application/pdf",

          upsert: false,
        }
      )

    if (erroreUpload) {
      console.error(
        "ERRORE UPLOAD CERTIFICATO:",
        erroreUpload
      )

      return NextResponse.json(
        {
          error:
            erroreUpload.message ||
            "Errore durante il caricamento del certificato.",
        },
        {
          status: 500,
        }
      )
    }

    // ==============================
    // RECUPERA URL FILE
    // ==============================

    const {
      data: urlData,
    } = supabaseAdmin.storage
      .from("certificati")
      .getPublicUrl(
        filePathCaricato
      )

    const fileUrl =
      urlData.publicUrl

    if (!fileUrl) {
      throw new Error(
        "Impossibile generare l'URL del certificato."
      )
    }

    // ==============================
    // CREA PRATICA
    // ==============================

    const oraDichiarazione =
      new Date().toISOString()

    const {
      data: pratica,
      error: errorePratica,
    } = await supabaseAdmin
      .from("certificati_medici")
      .insert([
        {
          cliente_id:
            clienteId,

          data_rilascio:
            dataRilascio,

          data_scadenza:
            dataScadenza,

          file_url:
            fileUrl,

          file_path:
            filePathCaricato,

          file_nome:
            nomeOriginale,

          stato:
            "da_verificare",

          dichiarazione_accettata:
            true,

          dichiarazione_testo:
            DICHIARAZIONE_CERTIFICATO,

          dichiarazione_accettata_il:
            oraDichiarazione,
        },
      ])
      .select("*")
      .single()

    if (
      errorePratica ||
      !pratica
    ) {
      console.error(
        "ERRORE CREAZIONE PRATICA:",
        errorePratica
      )

      // Se il database fallisce,
      // eliminiamo il PDF appena
      // caricato per non lasciare
      // file orfani nello Storage.

      if (filePathCaricato) {
        await supabaseAdmin.storage
          .from("certificati")
          .remove([
            filePathCaricato,
          ])
      }

      return NextResponse.json(
        {
          error:
            errorePratica?.message ||
            "Errore durante la creazione della pratica del certificato.",
        },
        {
          status: 500,
        }
      )
    }

    // ==============================
    // RISPOSTA
    // ==============================

    return NextResponse.json({
      success: true,

      message:
        "Certificato inviato correttamente. Lo staff dovrà verificarlo prima che venga considerato valido.",

      pratica: {
        id:
          pratica.id,

        stato:
          pratica.stato,

        data_rilascio:
          pratica.data_rilascio,

        data_scadenza:
          pratica.data_scadenza,

        file_nome:
          pratica.file_nome,

        created_at:
          pratica.created_at,
      },
    })
  } catch (error: unknown) {
    console.error(
      "ERRORE INVIO CERTIFICATO:",
      error
    )

    // Se qualcosa fallisce dopo
    // l'upload, proviamo a rimuovere
    // il file caricato.

    if (filePathCaricato) {
      try {
        await supabaseAdmin.storage
          .from("certificati")
          .remove([
            filePathCaricato,
          ])
      } catch (
        erroreRimozione
      ) {
        console.error(
          "ERRORE RIMOZIONE FILE:",
          erroreRimozione
        )
      }
    }

    const messaggio =
      error instanceof Error
        ? error.message
        : "Errore durante l'invio del certificato medico."

    return NextResponse.json(
      {
        error: messaggio,
      },
      {
        status: 500,
      }
    )
  }
}