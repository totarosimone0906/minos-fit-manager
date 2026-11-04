"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  ShieldCheck,
  Upload,
  User,
  UsersRound,
  CreditCard,
} from "lucide-react"
import { supabase } from "../../lib/supabase"

type Cliente = {
  id: string
  nome?: string | null
  cognome?: string | null
  email?: string | null
  telefono?: string | null
  data_nascita?: string | null
  codice_fiscale?: string | null
}

type FormData = {
  tipo_adesione: "nuova" | "rinnovo"

  nome: string
  cognome: string

  data_nascita: string
  luogo_nascita: string
  provincia_nascita: string

  indirizzo: string
  civico: string
  cap: string
  comune: string
  provincia_residenza: string

  telefono: string
  email: string
  codice_fiscale: string

  genitore_nome: string
  genitore_cognome: string
  genitore_codice_fiscale: string

  consenso_privacy: boolean
  consenso_immagini: boolean
}

const FORM_INIZIALE: FormData = {
  tipo_adesione: "nuova",

  nome: "",
  cognome: "",

  data_nascita: "",
  luogo_nascita: "",
  provincia_nascita: "",

  indirizzo: "",
  civico: "",
  cap: "",
  comune: "",
  provincia_residenza: "",

  telefono: "",
  email: "",
  codice_fiscale: "",

  genitore_nome: "",
  genitore_cognome: "",
  genitore_codice_fiscale: "",

  consenso_privacy: false,
  consenso_immagini: false,
}

function calcolaEta(dataNascita: string) {
  if (!dataNascita) return null

  const nascita = new Date(`${dataNascita}T00:00:00`)

  if (Number.isNaN(nascita.getTime())) return null

  const oggi = new Date()

  let eta = oggi.getFullYear() - nascita.getFullYear()

  const mese = oggi.getMonth() - nascita.getMonth()

  if (
    mese < 0 ||
    (mese === 0 && oggi.getDate() < nascita.getDate())
  ) {
    eta--
  }

  return eta
}

function codiceFiscaleFormalmenteValido(cf: string) {
  const valore = cf.trim().toUpperCase()

  if (valore.length !== 16) return false

  return /^[A-Z0-9]{16}$/.test(valore)
}

export default function QuotaAssociativaPage() {
  const router = useRouter()

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [form, setForm] = useState<FormData>(FORM_INIZIALE)

  const [step, setStep] = useState(1)

  const [documentoIscritto, setDocumentoIscritto] =
    useState<File | null>(null)

  const [documentoGenitore, setDocumentoGenitore] =
    useState<File | null>(null)

  const [caricamento, setCaricamento] = useState(true)
  const [errore, setErrore] = useState("")
  const [invio, setInvio] = useState(false)

  const [verificaQuota, setVerificaQuota] = useState(false)
  const [quotaConfermata, setQuotaConfermata] = useState(false)
  const [quotaInizio, setQuotaInizio] = useState("")
  const [quotaScadenza, setQuotaScadenza] = useState("")
  const [pagamentoAnnullato, setPagamentoAnnullato] = useState(false)

  const eta = useMemo(
    () => calcolaEta(form.data_nascita),
    [form.data_nascita],
  )

  const minorenne = eta !== null && eta < 18

  useEffect(() => {
    async function caricaCliente() {
      try {
        const salvato =
          localStorage.getItem("cliente") ||
          localStorage.getItem("utente")

        if (!salvato) {
          router.replace("/login/accesso")
          return
        }

        const locale = JSON.parse(salvato)

        if (!locale?.id) {
          router.replace("/login/accesso")
          return
        }

        const { data, error } = await supabase
          .from("profiles")
          .select(
            "id,nome,cognome,email,telefono,data_nascita,codice_fiscale",
          )
          .eq("id", locale.id)
          .single()

        if (error || !data) {
          throw new Error(
            error?.message || "Impossibile recuperare il profilo",
          )
        }

        setCliente(data)

        setForm((precedente) => ({
          ...precedente,
          nome: data.nome || "",
          cognome: data.cognome || "",
          email: data.email || "",
          telefono: data.telefono || "",
          data_nascita: data.data_nascita || "",
          codice_fiscale: data.codice_fiscale || "",
        }))
      } catch (err) {
        console.error(err)
        setErrore("Impossibile caricare i dati del profilo.")
      } finally {
        setCaricamento(false)
      }
    }

    caricaCliente()
  }, [router])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const pagamento = params.get("pagamento")
    const sessionId = params.get("session_id")

    if (pagamento === "cancel") {
      setPagamentoAnnullato(true)
      return
    }

    if (pagamento !== "success" || !sessionId) return

    async function verificaPagamentoQuota() {
      try {
        setVerificaQuota(true)
        setErrore("")

        const risposta = await fetch("/api/verifica-quota", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        })

        const risultato = await risposta.json()

        if (!risposta.ok) {
          throw new Error(
            risultato.error ||
              "Impossibile verificare il pagamento della quota associativa.",
          )
        }

        if (!risultato.success) {
          throw new Error("Il pagamento non risulta confermato.")
        }

        setQuotaInizio(risultato.quota_inizio || "")
        setQuotaScadenza(risultato.quota_scadenza || "")
        setQuotaConfermata(true)

        window.history.replaceState(
          {},
          "",
          "/area-cliente/quota-associativa",
        )
      } catch (err) {
        console.error("Errore verifica quota:", err)
        setErrore(
          err instanceof Error
            ? err.message
            : "Errore durante la verifica del pagamento.",
        )
      } finally {
        setVerificaQuota(false)
      }
    }

    void verificaPagamentoQuota()
  }, [])

  function aggiornaCampo<K extends keyof FormData>(
    campo: K,
    valore: FormData[K],
  ) {
    setForm((precedente) => ({
      ...precedente,
      [campo]: valore,
    }))

    setErrore("")
  }

  function validaStep1() {
    if (
      !form.nome.trim() ||
      !form.cognome.trim() ||
      !form.data_nascita ||
      !form.luogo_nascita.trim() ||
      !form.provincia_nascita.trim() ||
      !form.indirizzo.trim() ||
      !form.civico.trim() ||
      !form.cap.trim() ||
      !form.comune.trim() ||
      !form.provincia_residenza.trim() ||
      !form.telefono.trim() ||
      !form.email.trim() ||
      !form.codice_fiscale.trim()
    ) {
      setErrore("Compila tutti i campi obbligatori.")
      return false
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setErrore("Inserisci un indirizzo email valido.")
      return false
    }

    if (!/^\d{5}$/.test(form.cap.trim())) {
      setErrore("Il CAP deve contenere 5 numeri.")
      return false
    }

    if (!codiceFiscaleFormalmenteValido(form.codice_fiscale)) {
      setErrore(
        "Il codice fiscale deve essere composto da 16 caratteri.",
      )
      return false
    }

    if (eta === null || eta < 0) {
      setErrore("Inserisci una data di nascita valida.")
      return false
    }

    return true
  }

  function validaStep2() {
    if (!documentoIscritto) {
      setErrore("Allega il documento dell'iscritto.")
      return false
    }

    if (minorenne) {
      if (
        !form.genitore_nome.trim() ||
        !form.genitore_cognome.trim() ||
        !form.genitore_codice_fiscale.trim()
      ) {
        setErrore(
          "Per un minorenne sono obbligatori i dati del genitore o tutore.",
        )
        return false
      }

      if (
        !codiceFiscaleFormalmenteValido(
          form.genitore_codice_fiscale,
        )
      ) {
        setErrore(
          "Controlla il codice fiscale del genitore o tutore.",
        )
        return false
      }

      if (!documentoGenitore) {
        setErrore(
          "Allega il documento del genitore o tutore.",
        )
        return false
      }
    }

    return true
  }

  function validaStep3() {
    if (!form.consenso_privacy) {
      setErrore(
        "Devi accettare il trattamento dei dati personali per procedere.",
      )
      return false
    }

    return true
  }

  function avanti() {
    setErrore("")

    if (step === 1 && !validaStep1()) return
    if (step === 2 && !validaStep2()) return
    if (step === 3 && !validaStep3()) return

    setStep((precedente) =>
      Math.min(precedente + 1, 4),
    )

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  function indietro() {
    setErrore("")

    if (step === 1) {
      router.push("/area-cliente")
      return
    }

    setStep((precedente) =>
      Math.max(precedente - 1, 1),
    )

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  
    async function procediPagamento() {
  if (!cliente?.id) {
    setErrore("Cliente non identificato.")
    return
  }

  if (
    !validaStep1() ||
    !validaStep2() ||
    !validaStep3()
  ) {
    return
  }

  setInvio(true)
  setErrore("")

  try {
    if (!documentoIscritto) {
      throw new Error(
        "Documento dell'iscritto mancante."
      )
    }

    const dati = new FormData()

    dati.append("cliente_id", cliente.id)
    dati.append("tipo_adesione", form.tipo_adesione)

    dati.append("nome", form.nome)
    dati.append("cognome", form.cognome)

    dati.append("data_nascita", form.data_nascita)
    dati.append("luogo_nascita", form.luogo_nascita)
    dati.append(
      "provincia_nascita",
      form.provincia_nascita
    )

    dati.append("indirizzo", form.indirizzo)
    dati.append("civico", form.civico)
    dati.append("cap", form.cap)
    dati.append("comune", form.comune)

    dati.append(
      "provincia_residenza",
      form.provincia_residenza
    )

    dati.append("telefono", form.telefono)
    dati.append("email", form.email)

    dati.append(
      "codice_fiscale",
      form.codice_fiscale
    )

    dati.append(
      "consenso_privacy",
      String(form.consenso_privacy)
    )

    dati.append(
      "consenso_immagini",
      String(form.consenso_immagini)
    )

    dati.append(
      "documento_iscritto",
      documentoIscritto
    )

    if (minorenne) {
      dati.append(
        "genitore_nome",
        form.genitore_nome
      )

      dati.append(
        "genitore_cognome",
        form.genitore_cognome
      )

      dati.append(
        "genitore_codice_fiscale",
        form.genitore_codice_fiscale
      )

      if (!documentoGenitore) {
        throw new Error(
          "Documento del genitore/tutore mancante."
        )
      }

      dati.append(
        "documento_genitore",
        documentoGenitore
      )
    }

    const risposta = await fetch(
      "/api/crea-tesseramento",
      {
        method: "POST",
        body: dati,
      }
    )

    const risultato = await risposta.json()

    if (!risposta.ok) {
      throw new Error(
        risultato.error ||
          "Impossibile preparare il pagamento."
      )
    }

    if (!risultato.url) {
      throw new Error(
        "Link Stripe non ricevuto."
      )
    }

    window.location.href = risultato.url
  } catch (err) {
    console.error(
      "Errore tesseramento:",
      err
    )

    setErrore(
      err instanceof Error
        ? err.message
        : "Si è verificato un errore."
    )

    setInvio(false)
  }
}

  if (verificaQuota) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050506] px-5 text-white">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 h-14 w-14 animate-spin rounded-full border-4 border-zinc-800 border-t-red-500" />
          <p className="text-xs font-black uppercase tracking-[0.25em] text-red-500">MINOS FIT A.S.D.</p>
          <h1 className="mt-3 text-3xl font-black">Verifica pagamento</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Stiamo confermando il pagamento della quota associativa.
          </p>
        </div>
      </main>
    )
  }

  if (quotaConfermata) {
    const formattaDataQuota = (data: string) => {
      if (!data) return "—"
      return new Date(`${data}T00:00:00`).toLocaleDateString("it-IT")
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050506] px-4 py-10 text-white">
        <div className="w-full max-w-md rounded-[32px] border border-zinc-800 bg-[#0d0e10] p-6 shadow-2xl sm:p-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-green-500/30 bg-green-500/10 text-green-400">
            <Check size={38} />
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-red-500">MINOS FIT A.S.D.</p>
            <h1 className="mt-3 text-3xl font-black">Tesseramento completato</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Il pagamento è stato confermato e la tua quota associativa è ora attiva.
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-[22px] border border-zinc-800 bg-black/40">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <span className="text-sm font-bold text-zinc-500">Stato</span>
              <span className="font-black text-green-400">ATTIVA</span>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <span className="text-sm font-bold text-zinc-500">Quota</span>
              <span className="font-black">30,00 €</span>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <span className="text-sm font-bold text-zinc-500">Attivazione</span>
              <span className="font-black">{formattaDataQuota(quotaInizio)}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm font-bold text-zinc-500">Scadenza</span>
              <span className="font-black">{formattaDataQuota(quotaScadenza)}</span>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-950/20 p-4">
            <p className="text-center text-xs leading-5 text-zinc-400">
              La quota associativa ha validità di 12 mesi dalla data di pagamento.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/area-cliente")}
            className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 font-black shadow-[0_10px_35px_rgba(220,38,38,0.3)] transition hover:bg-red-500 active:scale-[0.98]"
          >
            <Check size={18} />
            Torna all&apos;Area Cliente
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#050506] pb-16 text-white">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">

        {/* HEADER */}

        <button
          type="button"
          onClick={() => router.push("/area-cliente")}
          className="mb-7 flex items-center gap-2 text-sm font-bold text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft size={18} />
          Area cliente
        </button>

        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-500">
              <UsersRound size={22} />
            </div>

            <p className="text-xs font-black uppercase tracking-[0.25em] text-red-500">
              Minos Fit A.S.D.
            </p>
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Quota associativa
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
            Compila la domanda di tesseramento e verifica i
            dati prima di procedere al pagamento della quota
            associativa annuale.
          </p>
        </div>

        {/* PREZZO */}

        <div className="mb-7 flex items-center justify-between rounded-[24px] border border-red-500/20 bg-gradient-to-r from-red-950/30 to-zinc-950 px-5 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
              Quota annuale
            </p>

            <p className="mt-1 text-3xl font-black">
              30 €
            </p>
          </div>

          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-red-500">
            <CreditCard size={24} />
          </div>
        </div>

        {pagamentoAnnullato && (
          <div className="mb-7 rounded-[22px] border border-amber-500/30 bg-amber-500/10 p-5">
            <p className="font-black text-amber-200">Pagamento non completato</p>
            <p className="mt-2 text-sm leading-6 text-amber-100/70">
              Stripe è stato chiuso o il pagamento è stato annullato. La quota non è stata attivata.
              Se pensi che ci sia stato comunque un addebito, non effettuare un secondo pagamento.
            </p>
            <button
              type="button"
              onClick={() => {
                setPagamentoAnnullato(false)
                window.history.replaceState({}, "", "/area-cliente/quota-associativa")
              }}
              className="mt-4 rounded-xl border border-amber-400/30 px-4 py-2 text-xs font-black uppercase tracking-wider text-amber-200"
            >
              Chiudi avviso
            </button>
          </div>
        )}

        {/* PROGRESS */}

        <div className="mb-8 grid grid-cols-4 gap-2">
          {[
            ["Dati", User],
            ["Documenti", Upload],
            ["Privacy", ShieldCheck],
            ["Conferma", Check],
          ].map(([testo, Icona], indice) => {
            const numero = indice + 1
            const attivo = step >= numero

            const Icon = Icona as typeof User

            return (
              <div key={String(testo)}>
                <div
                  className={`h-1 rounded-full ${
                    attivo
                      ? "bg-red-500"
                      : "bg-zinc-800"
                  }`}
                />

                <div
                  className={`mt-3 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider ${
                    step === numero
                      ? "text-white"
                      : "text-zinc-600"
                  }`}
                >
                  <Icon size={12} />
                  <span className="hidden sm:inline">
                    {String(testo)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <section className="rounded-[30px] border border-zinc-800 bg-[#0d0e10] p-5 shadow-2xl sm:p-8">

          {/* STEP 1 */}

          {step === 1 && (
            <div>
              <TitoloStep
                numero="01"
                titolo="Dati dell'iscritto"
                descrizione="Controlla attentamente i dati. Verranno utilizzati per la domanda di tesseramento."
              />

              <div className="mb-7 grid grid-cols-2 gap-3">
                <SceltaTipo
                  attivo={
                    form.tipo_adesione === "nuova"
                  }
                  testo="Nuova adesione"
                  onClick={() =>
                    aggiornaCampo(
                      "tipo_adesione",
                      "nuova",
                    )
                  }
                />

                <SceltaTipo
                  attivo={
                    form.tipo_adesione === "rinnovo"
                  }
                  testo="Rinnovo"
                  onClick={() =>
                    aggiornaCampo(
                      "tipo_adesione",
                      "rinnovo",
                    )
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Campo
                  label="Nome"
                  value={form.nome}
                  onChange={(v) =>
                    aggiornaCampo("nome", v)
                  }
                />

                <Campo
                  label="Cognome"
                  value={form.cognome}
                  onChange={(v) =>
                    aggiornaCampo("cognome", v)
                  }
                />

                <Campo
                  label="Data di nascita"
                  type="date"
                  value={form.data_nascita}
                  onChange={(v) =>
                    aggiornaCampo(
                      "data_nascita",
                      v,
                    )
                  }
                />

                <Campo
                  label="Luogo di nascita"
                  value={form.luogo_nascita}
                  onChange={(v) =>
                    aggiornaCampo(
                      "luogo_nascita",
                      v,
                    )
                  }
                />

                <Campo
                  label="Provincia di nascita"
                  value={form.provincia_nascita}
                  maxLength={2}
                  onChange={(v) =>
                    aggiornaCampo(
                      "provincia_nascita",
                      v.toUpperCase(),
                    )
                  }
                />

                <Campo
                  label="Codice fiscale"
                  value={form.codice_fiscale}
                  maxLength={16}
                  onChange={(v) =>
                    aggiornaCampo(
                      "codice_fiscale",
                      v
                        .toUpperCase()
                        .replace(/\s/g, ""),
                    )
                  }
                />

                <div className="sm:col-span-2">
                  <Campo
                    label="Via / Piazza"
                    value={form.indirizzo}
                    onChange={(v) =>
                      aggiornaCampo(
                        "indirizzo",
                        v,
                      )
                    }
                  />
                </div>

                <Campo
                  label="Numero civico"
                  value={form.civico}
                  onChange={(v) =>
                    aggiornaCampo("civico", v)
                  }
                />

                <Campo
                  label="CAP"
                  inputMode="numeric"
                  maxLength={5}
                  value={form.cap}
                  onChange={(v) =>
                    aggiornaCampo(
                      "cap",
                      v.replace(/\D/g, ""),
                    )
                  }
                />

                <Campo
                  label="Comune di residenza"
                  value={form.comune}
                  onChange={(v) =>
                    aggiornaCampo("comune", v)
                  }
                />

                <Campo
                  label="Provincia"
                  maxLength={2}
                  value={
                    form.provincia_residenza
                  }
                  onChange={(v) =>
                    aggiornaCampo(
                      "provincia_residenza",
                      v.toUpperCase(),
                    )
                  }
                />

                <Campo
                  label="Telefono / cellulare"
                  type="tel"
                  value={form.telefono}
                  onChange={(v) =>
                    aggiornaCampo("telefono", v)
                  }
                />

                <Campo
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(v) =>
                    aggiornaCampo("email", v)
                  }
                />
              </div>

              {minorenne && (
                <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                  L'iscritto risulta minorenne. Nel
                  prossimo passaggio verranno richiesti
                  anche i dati e il documento del
                  genitore/tutore.
                </div>
              )}
            </div>
          )}

          {/* STEP 2 */}

          {step === 2 && (
            <div>
              <TitoloStep
                numero="02"
                titolo="Documenti"
                descrizione="Allega un documento leggibile e in corso di validità."
              />

              <UploadBox
                titolo="Documento dell'iscritto"
                descrizione="PDF, JPG, JPEG o PNG"
                file={documentoIscritto}
                onChange={setDocumentoIscritto}
              />

              {minorenne && (
                <div className="mt-8 border-t border-zinc-800 pt-8">
                  <div className="mb-5">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-red-500">
                      Minorenne
                    </p>

                    <h3 className="mt-2 text-xl font-black">
                      Genitore o tutore
                    </h3>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Campo
                      label="Nome genitore/tutore"
                      value={form.genitore_nome}
                      onChange={(v) =>
                        aggiornaCampo(
                          "genitore_nome",
                          v,
                        )
                      }
                    />

                    <Campo
                      label="Cognome genitore/tutore"
                      value={
                        form.genitore_cognome
                      }
                      onChange={(v) =>
                        aggiornaCampo(
                          "genitore_cognome",
                          v,
                        )
                      }
                    />

                    <div className="sm:col-span-2">
                      <Campo
                        label="Codice fiscale genitore/tutore"
                        maxLength={16}
                        value={
                          form.genitore_codice_fiscale
                        }
                        onChange={(v) =>
                          aggiornaCampo(
                            "genitore_codice_fiscale",
                            v
                              .toUpperCase()
                              .replace(/\s/g, ""),
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-5">
                    <UploadBox
                      titolo="Documento genitore/tutore"
                      descrizione="Obbligatorio per gli iscritti minorenni"
                      file={documentoGenitore}
                      onChange={
                        setDocumentoGenitore
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 */}

          {step === 3 && (
            <div>
              <TitoloStep
                numero="03"
                titolo="Privacy e consensi"
                descrizione="Leggi le informazioni e indica le tue scelte."
              />

              <div className="mb-5 rounded-2xl border border-zinc-800 bg-black/30 p-5">
                <div className="mb-3 flex items-center gap-3">
                  <FileText
                    className="text-red-500"
                    size={20}
                  />

                  <h3 className="font-black">
                    Informativa privacy
                  </h3>
                </div>

                <p className="text-sm leading-6 text-zinc-400">
                  I dati forniti saranno trattati da
                  MINOS FIT A.S.D. per le finalità
                  connesse alla gestione del rapporto
                  associativo e del tesseramento, secondo
                  l'informativa fornita
                  dall'associazione.
                </p>
              </div>

              <Checkbox
                checked={form.consenso_privacy}
                onChange={(v) =>
                  aggiornaCampo(
                    "consenso_privacy",
                    v,
                  )
                }
                obbligatorio
                titolo="Consenso al trattamento dei dati personali"
                testo="Dichiaro di aver letto l'informativa e acconsento al trattamento dei dati necessario alla gestione del rapporto associativo."
              />

              <div className="mt-4">
                <Checkbox
                  checked={
                    form.consenso_immagini
                  }
                  onChange={(v) =>
                    aggiornaCampo(
                      "consenso_immagini",
                      v,
                    )
                  }
                  titolo="Liberatoria immagini e video"
                  testo="Autorizzo la realizzazione e l'utilizzo di immagini e video nell'ambito delle attività associative."
                />
              </div>
            </div>
          )}

          {/* STEP 4 */}

          {step === 4 && (
            <div>
              <TitoloStep
                numero="04"
                titolo="Controlla e conferma"
                descrizione="Verifica i dati prima di procedere al pagamento."
              />

              <div className="space-y-3">
                <Riepilogo
                  nome="Tipo"
                  valore={
                    form.tipo_adesione === "nuova"
                      ? "Nuova adesione"
                      : "Rinnovo adesione"
                  }
                />

                <Riepilogo
                  nome="Iscritto"
                  valore={`${form.nome} ${form.cognome}`}
                />

                <Riepilogo
                  nome="Data di nascita"
                  valore={form.data_nascita}
                />

                <Riepilogo
                  nome="Codice fiscale"
                  valore={
                    form.codice_fiscale
                  }
                />

                <Riepilogo
                  nome="Residenza"
                  valore={`${form.indirizzo} ${form.civico}, ${form.cap} ${form.comune} (${form.provincia_residenza})`}
                />

                <Riepilogo
                  nome="Email"
                  valore={form.email}
                />

                <Riepilogo
                  nome="Telefono"
                  valore={form.telefono}
                />

                <Riepilogo
                  nome="Documento"
                  valore={
                    documentoIscritto?.name ||
                    "Non presente"
                  }
                />

                {minorenne && (
                  <>
                    <Riepilogo
                      nome="Genitore / tutore"
                      valore={`${form.genitore_nome} ${form.genitore_cognome}`}
                    />

                    <Riepilogo
                      nome="Documento genitore"
                      valore={
                        documentoGenitore?.name ||
                        "Non presente"
                      }
                    />
                  </>
                )}
              </div>

              <div className="mt-7 rounded-[22px] border border-red-500/30 bg-red-950/20 p-5">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-red-400">
                      Totale
                    </p>

                    <p className="mt-1 text-3xl font-black">
                      30,00 €
                    </p>

                    <p className="mt-2 text-xs leading-5 text-zinc-400">
                      Quota associativa annuale.
                      L'attivazione decorrerà dalla
                      conferma del pagamento.
                    </p>
                  </div>

                  <ShieldCheck
                    size={30}
                    className="shrink-0 text-red-500"
                  />
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-zinc-800 bg-black/40 p-4">
                <p className="text-xs leading-5 text-zinc-500">
                  Procedendo confermi che i dati inseriti
                  sono corretti. Il tesseramento non
                  risulterà attivo fino alla conferma del
                  pagamento.
                </p>
              </div>
            </div>
          )}

          {/* ERROR */}

          {errore && (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
              {errore}
            </div>
          )}

          {/* NAVIGATION */}

          <div className="mt-8 flex gap-3 border-t border-zinc-800 pt-6">
            <button
              type="button"
              onClick={indietro}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-black font-black transition active:scale-[0.98]"
            >
              <ArrowLeft size={18} />

              {step === 1
                ? "Esci"
                : "Indietro"}
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={avanti}
                className="flex h-14 flex-[1.5] items-center justify-center gap-2 rounded-2xl bg-red-600 font-black shadow-[0_10px_35px_rgba(220,38,38,0.25)] transition hover:bg-red-500 active:scale-[0.98]"
              >
                Continua
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                disabled={invio}
                onClick={procediPagamento}
                className="flex h-14 flex-[1.8] items-center justify-center gap-2 rounded-2xl bg-red-600 font-black shadow-[0_10px_35px_rgba(220,38,38,0.3)] transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
              >
                <CreditCard size={18} />

                {invio
                  ? "Preparazione..."
                  : "Procedi al pagamento • 30 €"}
              </button>
            )}
          </div>
        </section>

        <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-700">
          MINOS FIT A.S.D. • Tesseramento
        </p>
      </div>
    </main>
  )
}

function TitoloStep({
  numero,
  titolo,
  descrizione,
}: {
  numero: string
  titolo: string
  descrizione: string
}) {
  return (
    <div className="mb-7">
      <p className="text-xs font-black tracking-[0.25em] text-red-500">
        STEP {numero}
      </p>

      <h2 className="mt-2 text-2xl font-black">
        {titolo}
      </h2>

      <p className="mt-2 text-sm leading-6 text-zinc-500">
        {descrizione}
      </p>
    </div>
  )
}

function Campo({
  label,
  value,
  onChange,
  type = "text",
  maxLength,
  inputMode,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  maxLength?: number
  inputMode?:
    | "text"
    | "numeric"
    | "tel"
    | "email"
    | "decimal"
    | "search"
    | "url"
    | "none"
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500">
        {label} *
      </span>

      <input
        type={type}
        value={value}
        maxLength={maxLength}
        inputMode={inputMode}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="h-14 w-full rounded-2xl border border-zinc-800 bg-black/60 px-4 text-[16px] font-semibold text-white outline-none transition placeholder:text-zinc-700 focus:border-red-500/70 focus:ring-2 focus:ring-red-500/10"
      />
    </label>
  )
}

function SceltaTipo({
  attivo,
  testo,
  onClick,
}: {
  attivo: boolean
  testo: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-3 py-4 text-sm font-black transition ${
        attivo
          ? "border-red-500 bg-red-500/10 text-white"
          : "border-zinc-800 bg-black/40 text-zinc-500"
      }`}
    >
      {testo}
    </button>
  )
}

function UploadBox({
  titolo,
  descrizione,
  file,
  onChange,
}: {
  titolo: string
  descrizione: string
  file: File | null
  onChange: (file: File | null) => void
}) {
  const [elaborazione, setElaborazione] = useState(false)
  const [erroreFile, setErroreFile] = useState("")
  const [anteprima, setAnteprima] = useState<string | null>(null)
  const [qualita, setQualita] = useState<string>("")

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setAnteprima(null)
      return
    }

    const url = URL.createObjectURL(file)
    setAnteprima(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file])

  async function gestisciFile(fileOriginale: File | null) {
    if (!fileOriginale) return

    setErroreFile("")
    setQualita("")

    // PDF
    if (fileOriginale.type === "application/pdf") {
      if (fileOriginale.size > 10 * 1024 * 1024) {
        setErroreFile("Il PDF supera il limite massimo di 10 MB.")
        return
      }

      onChange(fileOriginale)
      setQualita("PDF caricato correttamente")
      return
    }

    if (!fileOriginale.type.startsWith("image/")) {
      setErroreFile("Formato non supportato. Usa PDF, JPG o PNG.")
      return
    }

    try {
      setElaborazione(true)

      const immagine = new Image()
      const url = URL.createObjectURL(fileOriginale)

      await new Promise<void>((resolve, reject) => {
        immagine.onload = () => resolve()
        immagine.onerror = () =>
          reject(new Error("Immagine non leggibile"))
        immagine.src = url
      })

      const larghezzaOriginale = immagine.naturalWidth
      const altezzaOriginale = immagine.naturalHeight

      // Controllo risoluzione minima
      if (
        larghezzaOriginale < 900 ||
        altezzaOriginale < 600
      ) {
        URL.revokeObjectURL(url)

        setErroreFile(
          "La foto ha una risoluzione troppo bassa. Scatta nuovamente il documento più da vicino."
        )

        return
      }

      /*
        Analisi semplice della nitidezza.

        Creiamo una copia piccola dell'immagine per non
        appesantire il telefono e analizziamo le differenze
        di luminosità tra pixel vicini.
      */

      const canvasAnalisi = document.createElement("canvas")

      const larghezzaAnalisi = 300
      const rapportoAnalisi =
        larghezzaAnalisi / larghezzaOriginale

      const altezzaAnalisi = Math.max(
        1,
        Math.round(altezzaOriginale * rapportoAnalisi)
      )

      canvasAnalisi.width = larghezzaAnalisi
      canvasAnalisi.height = altezzaAnalisi

      const ctxAnalisi = canvasAnalisi.getContext("2d", {
        willReadFrequently: true,
      })

      if (!ctxAnalisi) {
        URL.revokeObjectURL(url)
        throw new Error("Impossibile analizzare l'immagine")
      }

      ctxAnalisi.drawImage(
        immagine,
        0,
        0,
        larghezzaAnalisi,
        altezzaAnalisi
      )

      const pixels = ctxAnalisi.getImageData(
        0,
        0,
        larghezzaAnalisi,
        altezzaAnalisi
      ).data

      let differenzaTotale = 0
      let confronti = 0

      for (let y = 0; y < altezzaAnalisi; y += 2) {
        for (let x = 0; x < larghezzaAnalisi - 1; x += 2) {
          const indice1 = (y * larghezzaAnalisi + x) * 4
          const indice2 = indice1 + 4

          const luminosita1 =
            pixels[indice1] * 0.299 +
            pixels[indice1 + 1] * 0.587 +
            pixels[indice1 + 2] * 0.114

          const luminosita2 =
            pixels[indice2] * 0.299 +
            pixels[indice2 + 1] * 0.587 +
            pixels[indice2 + 2] * 0.114

          differenzaTotale += Math.abs(
            luminosita1 - luminosita2
          )

          confronti++
        }
      }

      const nitidezza =
        confronti > 0 ? differenzaTotale / confronti : 0

      /*
        Non blocchiamo aggressivamente:
        sui documenti alcuni telefoni applicano già
        riduzione rumore e possono abbassare questo valore.
      */

      if (nitidezza < 4) {
        URL.revokeObjectURL(url)

        setErroreFile(
          "La foto sembra troppo sfocata. Tieni fermo il telefono, inquadra bene il documento e riprova."
        )

        return
      }

      // Compressione
      const MAX_DIMENSIONE = 2000

      let larghezza = larghezzaOriginale
      let altezza = altezzaOriginale

      if (
        larghezza > MAX_DIMENSIONE ||
        altezza > MAX_DIMENSIONE
      ) {
        const rapporto = Math.min(
          MAX_DIMENSIONE / larghezza,
          MAX_DIMENSIONE / altezza
        )

        larghezza = Math.round(larghezza * rapporto)
        altezza = Math.round(altezza * rapporto)
      }

      const canvas = document.createElement("canvas")

      canvas.width = larghezza
      canvas.height = altezza

      const ctx = canvas.getContext("2d")

      if (!ctx) {
        URL.revokeObjectURL(url)
        throw new Error("Impossibile elaborare l'immagine")
      }

      ctx.drawImage(
        immagine,
        0,
        0,
        larghezza,
        altezza
      )

      URL.revokeObjectURL(url)

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(
          resolve,
          "image/jpeg",
          0.85
        )
      })

      if (!blob) {
        throw new Error("Compressione non riuscita")
      }

      const nomeSenzaEstensione =
        fileOriginale.name.replace(/\.[^/.]+$/, "")

      const fileCompresso = new File(
        [blob],
        `${nomeSenzaEstensione}.jpg`,
        {
          type: "image/jpeg",
          lastModified: Date.now(),
        }
      )

      if (fileCompresso.size > 10 * 1024 * 1024) {
        setErroreFile(
          "La foto è ancora troppo grande. Prova a scattarla nuovamente."
        )
        return
      }

      onChange(fileCompresso)

      setQualita(
        `Foto verificata • ${larghezzaOriginale}×${altezzaOriginale}px`
      )
    } catch (error) {
      console.error("Errore controllo documento:", error)

      setErroreFile(
        "Non sono riuscito a controllare questa immagine. Prova a scattarla nuovamente."
      )
    } finally {
      setElaborazione(false)
    }
  }

  return (
    <div>
      <label className="block cursor-pointer overflow-hidden rounded-[24px] border border-dashed border-zinc-700 bg-black/40 transition hover:border-red-500/50">

        {/* ANTEPRIMA */}

        {anteprima && (
          <div className="border-b border-zinc-800 bg-black p-3">
            <img
              src={anteprima}
              alt="Anteprima documento"
              className="mx-auto max-h-[320px] w-full rounded-2xl object-contain"
            />
          </div>
        )}

        <input
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(e) => {
            void gestisciFile(e.target.files?.[0] || null)
            e.target.value = ""
          }}
        />

        <div className="p-6">
          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
              {elaborazione ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-500/30 border-t-red-500" />
              ) : file ? (
                <Check size={22} />
              ) : (
                <Upload size={22} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-black">
                {elaborazione
                  ? "Controllo documento..."
                  : file
                    ? "Documento caricato"
                    : titolo}
              </p>

              <p className="mt-1 truncate text-xs text-zinc-500">
                {file
                  ? `${file.name} • ${(file.size / 1024 / 1024).toFixed(2)} MB`
                  : descrizione}
              </p>

              {qualita && (
                <p className="mt-2 text-xs font-bold text-green-400">
                  ✓ {qualita}
                </p>
              )}
            </div>
          </div>

          {file && !elaborazione && (
            <p className="mt-4 text-center text-xs font-bold text-zinc-500">
              Tocca per sostituire il documento
            </p>
          )}
        </div>
      </label>

      {erroreFile && (
        <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-xs font-bold leading-5 text-red-300">
            {erroreFile}
          </p>
        </div>
      )}

      {!file && !erroreFile && (
        <p className="mt-3 text-xs leading-5 text-zinc-600">
          Assicurati che il documento sia completamente visibile,
          ben illuminato e che scritte e fotografia siano nitide.
        </p>
      )}
    </div>
  )
}

function Checkbox({
  checked,
  onChange,
  titolo,
  testo,
  obbligatorio = false,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  titolo: string
  testo: string
  obbligatorio?: boolean
}) {
  return (
    <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-zinc-800 bg-black/40 p-5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) =>
          onChange(e.target.checked)
        }
        className="mt-1 h-5 w-5 accent-red-600"
      />

      <div>
        <p className="font-black">
          {titolo}

          {obbligatorio && (
            <span className="ml-2 text-xs text-red-500">
              OBBLIGATORIO
            </span>
          )}
        </p>

        <p className="mt-2 text-xs leading-5 text-zinc-500">
          {testo}
        </p>
      </div>
    </label>
  )
}

function Riepilogo({
  nome,
  valore,
}: {
  nome: string
  valore: string
}) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-zinc-800/70 py-3">
      <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">
        {nome}
      </span>

      <span className="max-w-[65%] text-right text-sm font-black text-zinc-200">
        {valore}
      </span>
    </div>
  )
}