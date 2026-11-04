"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FileCheck2,
  FileText,
  HeartPulse,
  ShieldCheck,
  Upload,
} from "lucide-react"

type Cliente = {
  id: string
  nome?: string
  cognome?: string
}

type PraticaCertificato = {
  id: string
  stato: "da_verificare" | "approvato" | "rifiutato"
  data_rilascio: string
  data_scadenza: string
  file_nome?: string | null
  created_at?: string
}

const DICHIARAZIONE =
  "Dichiaro di aver verificato attentamente i dati inseriti relativi al certificato medico e che gli stessi corrispondono al documento allegato e in mio possesso. Dichiaro che le informazioni fornite sono veritiere e sono consapevole delle responsabilità derivanti da dichiarazioni false o non veritiere."

export default function CertificatoMedicoPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [cliente, setCliente] = useState<Cliente | null>(null)

  const [dataRilascio, setDataRilascio] = useState("")
  const [dataScadenza, setDataScadenza] = useState("")

  const [file, setFile] = useState<File | null>(null)
  const [dichiarazioneAccettata, setDichiarazioneAccettata] =
    useState(false)

  const [invioInCorso, setInvioInCorso] = useState(false)
  const [errore, setErrore] = useState("")
  const [successo, setSuccesso] = useState("")

  const [praticaInviata, setPraticaInviata] =
    useState<PraticaCertificato | null>(null)

  useEffect(() => {
    const salvato =
      localStorage.getItem("cliente") ||
      localStorage.getItem("utente")

    if (!salvato) {
      router.push("/login/accesso")
      return
    }

    try {
      const dati = JSON.parse(salvato)

      if (!dati?.id) {
        router.push("/login/accesso")
        return
      }

      setCliente(dati)
    } catch {
      router.push("/login/accesso")
    }
  }, [router])

  function selezionaFile(e: React.ChangeEvent<HTMLInputElement>) {
    setErrore("")

    const selezionato = e.target.files?.[0]

    if (!selezionato) {
      setFile(null)
      return
    }

    if (selezionato.type !== "application/pdf") {
      setFile(null)
      e.target.value = ""
      setErrore("Il certificato deve essere un file PDF.")
      return
    }

    const max = 10 * 1024 * 1024

    if (selezionato.size > max) {
      setFile(null)
      e.target.value = ""
      setErrore("Il PDF non può superare i 10 MB.")
      return
    }

    if (selezionato.size === 0) {
      setFile(null)
      e.target.value = ""
      setErrore("Il PDF selezionato è vuoto.")
      return
    }

    setFile(selezionato)
  }

  function rimuoviFile() {
    setFile(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function controllaDati() {
    if (!dataRilascio) {
      return "Inserisci la data di rilascio del certificato."
    }

    if (!dataScadenza) {
      return "Inserisci la data di scadenza del certificato."
    }

    const rilascio = new Date(`${dataRilascio}T00:00:00`)
    const scadenza = new Date(`${dataScadenza}T00:00:00`)

    if (
      Number.isNaN(rilascio.getTime()) ||
      Number.isNaN(scadenza.getTime())
    ) {
      return "Controlla le date inserite."
    }

    if (scadenza.getTime() < rilascio.getTime()) {
      return "La data di scadenza non può essere precedente alla data di rilascio."
    }

    if (!file) {
      return "Devi allegare obbligatoriamente il certificato medico in PDF."
    }

    if (!dichiarazioneAccettata) {
      return "Devi leggere e accettare la dichiarazione prima dell'invio."
    }

    return ""
  }

  async function inviaCertificato() {
    if (!cliente?.id || invioInCorso) return

    setErrore("")
    setSuccesso("")

    const erroreControllo = controllaDati()

    if (erroreControllo) {
      setErrore(erroreControllo)
      return
    }

    if (!file) return

    try {
      setInvioInCorso(true)

      const formData = new FormData()

      formData.append("clienteId", cliente.id)
      formData.append("dataRilascio", dataRilascio)
      formData.append("dataScadenza", dataScadenza)
      formData.append(
        "dichiarazioneAccettata",
        dichiarazioneAccettata ? "true" : "false"
      )
      formData.append("file", file)

      const res = await fetch("/api/certificato-medico/invia", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setErrore(
          data.error ||
            "Si è verificato un errore durante l'invio del certificato."
        )
        return
      }

      setPraticaInviata(data.pratica)

      setSuccesso(
        data.message ||
          "Certificato inviato correttamente allo staff."
      )
    } catch (error) {
      console.error("Errore invio certificato:", error)

      setErrore(
        "Impossibile inviare il certificato. Riprova tra poco."
      )
    } finally {
      setInvioInCorso(false)
    }
  }

  if (!cliente) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#060708] text-white">
        Caricamento...
      </main>
    )
  }

  if (praticaInviata) {
    return (
      <main className="min-h-screen bg-[#060708] px-4 py-8 text-white">
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={() => router.push("/area-cliente")}
            className="mb-8 flex items-center gap-2 text-sm font-bold text-zinc-400 transition hover:text-white"
          >
            <ArrowLeft size={19} />
            Torna all&apos;area cliente
          </button>

          <section className="overflow-hidden rounded-[32px] border border-zinc-800 bg-gradient-to-br from-[#151617] to-[#090a0b] shadow-[0_35px_80px_rgba(0,0,0,0.65)]">
            <div className="border-b border-zinc-800 bg-black/30 px-6 py-8 text-center sm:px-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-orange-500/40 bg-orange-500/10 text-orange-400">
                <FileCheck2 size={38} />
              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-red-500">
                Minos Fit
              </p>

              <h1 className="mt-3 text-3xl font-black">
                Certificato ricevuto
              </h1>

              <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-zinc-400">
                Il documento è stato inviato correttamente e ora deve
                essere verificato dallo staff.
              </p>
            </div>

            <div className="p-6 sm:p-10">
              <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-400">
                  Stato pratica
                </p>

                <p className="mt-2 text-xl font-black text-white">
                  In attesa di verifica
                </p>

                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Il certificato non verrà considerato valido fino
                  all&apos;approvazione dello staff MINOS FIT.
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <RigaRiepilogo
                  titolo="Data rilascio"
                  valore={formattaData(praticaInviata.data_rilascio)}
                />

                <RigaRiepilogo
                  titolo="Data scadenza"
                  valore={formattaData(praticaInviata.data_scadenza)}
                />

                <RigaRiepilogo
                  titolo="Documento"
                  valore={
                    praticaInviata.file_nome ||
                    file?.name ||
                    "Certificato PDF"
                  }
                />
              </div>

              <div className="mt-6 flex gap-3 rounded-2xl border border-zinc-800 bg-black/30 p-5">
                <ShieldCheck
                  className="mt-0.5 shrink-0 text-green-500"
                  size={22}
                />

                <div>
                  <p className="font-black">
                    Dichiarazione registrata
                  </p>

                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    L&apos;accettazione della dichiarazione è stata
                    registrata insieme alla pratica.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push("/area-cliente")}
                className="mt-8 w-full rounded-2xl bg-red-600 px-6 py-4 text-sm font-black uppercase tracking-wide transition hover:bg-red-500"
              >
                Torna all&apos;area cliente
              </button>
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#060708] px-4 py-8 text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-red-950/10 blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-2xl">
        <button
          type="button"
          onClick={() => router.push("/area-cliente")}
          className="mb-8 flex items-center gap-2 text-sm font-bold text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft size={19} />
          Torna all&apos;area cliente
        </button>

        <section className="overflow-hidden rounded-[32px] border border-zinc-800 bg-gradient-to-br from-[#151617] to-[#090a0b] shadow-[0_35px_80px_rgba(0,0,0,0.7)]">
          <div className="border-b border-zinc-800 bg-black/25 px-6 py-8 sm:px-10">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-red-600/40 bg-red-950/20 text-red-500">
                <HeartPulse size={31} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-red-500">
                  Area cliente
                </p>

                <h1 className="mt-2 text-2xl font-black sm:text-3xl">
                  Certificato medico
                </h1>
              </div>
            </div>

            <p className="mt-6 text-sm leading-6 text-zinc-400">
              Inserisci i dati riportati sul certificato e allega il
              documento originale in formato PDF. Lo staff verificherà
              la pratica prima di convalidarla.
            </p>
          </div>

          <div className="space-y-7 p-6 sm:p-10">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-950/30 text-red-500">
                  <CalendarDays size={19} />
                </span>

                <div>
                  <p className="font-black">Dati del certificato</p>
                  <p className="text-xs text-zinc-500">
                    Copia esattamente le date indicate sul documento.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <CampoData
                  label="Data di rilascio"
                  value={dataRilascio}
                  onChange={setDataRilascio}
                />

                <CampoData
                  label="Data di scadenza"
                  value={dataScadenza}
                  onChange={setDataScadenza}
                />
              </div>
            </div>

            <div className="border-t border-zinc-800" />

            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-950/30 text-red-500">
                  <FileText size={19} />
                </span>

                <div>
                  <p className="font-black">
                    Certificato PDF
                    <span className="ml-2 text-red-500">*</span>
                  </p>

                  <p className="text-xs text-zinc-500">
                    Obbligatorio · PDF · massimo 10 MB
                  </p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={selezionaFile}
                className="hidden"
              />

              {!file ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-black/30 px-5 py-9 text-center transition hover:border-red-600 hover:bg-red-950/10"
                >
                  <Upload size={32} className="text-red-500" />

                  <span className="mt-4 font-black">
                    Seleziona certificato
                  </span>

                  <span className="mt-1 text-xs text-zinc-500">
                    Tocca qui per scegliere il PDF
                  </span>
                </button>
              ) : (
                <div className="rounded-2xl border border-green-600/30 bg-green-950/10 p-5">
                  <div className="flex items-start gap-4">
                    <CheckCircle2
                      size={25}
                      className="mt-0.5 shrink-0 text-green-500"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="font-black text-green-400">
                        PDF selezionato
                      </p>

                      <p className="mt-1 break-all text-sm text-zinc-300">
                        {file.name}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        {formattaDimensione(file.size)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={rimuoviFile}
                    className="mt-4 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-xs font-black uppercase transition hover:border-red-600"
                  >
                    Cambia documento
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-zinc-800" />

            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-950/30 text-red-500">
                  <ShieldCheck size={19} />
                </span>

                <div>
                  <p className="font-black">Dichiarazione</p>
                  <p className="text-xs text-zinc-500">
                    È necessario confermare prima dell&apos;invio.
                  </p>
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-zinc-800 bg-black/30 p-5 transition hover:border-zinc-700">
                <input
                  type="checkbox"
                  checked={dichiarazioneAccettata}
                  onChange={(e) =>
                    setDichiarazioneAccettata(e.target.checked)
                  }
                  className="mt-1 h-5 w-5 shrink-0 accent-red-600"
                />

                <span className="text-sm leading-6 text-zinc-300">
                  {DICHIARAZIONE}
                  <strong className="ml-1 text-red-500">*</strong>
                </span>
              </label>
            </div>

            {errore && (
              <div className="rounded-2xl border border-red-600/40 bg-red-950/20 p-4 text-sm font-bold text-red-400">
                ❌ {errore}
              </div>
            )}

            {successo && (
              <div className="rounded-2xl border border-green-600/40 bg-green-950/20 p-4 text-sm font-bold text-green-400">
                ✅ {successo}
              </div>
            )}

            <button
              type="button"
              onClick={() => void inviaCertificato()}
              disabled={invioInCorso}
              className={`w-full rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-wide transition ${
                invioInCorso
                  ? "cursor-not-allowed bg-zinc-700 text-zinc-400"
                  : "bg-red-600 text-white shadow-[0_0_24px_rgba(220,38,38,0.25)] hover:bg-red-500"
              }`}
            >
              {invioInCorso
                ? "Invio in corso..."
                : "Invia certificato allo staff"}
            </button>

            <p className="text-center text-xs leading-5 text-zinc-600">
              Il certificato non sarà considerato valido fino alla
              verifica da parte dello staff MINOS FIT.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

function CampoData({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-zinc-500">
        {label}
        <span className="ml-1 text-red-500">*</span>
      </span>

      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-4 text-white outline-none transition focus:border-red-600"
      />
    </label>
  )
}

function RigaRiepilogo({
  titolo,
  valore,
}: {
  titolo: string
  valore: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4">
      <span className="text-sm font-bold text-zinc-500">
        {titolo}
      </span>

      <span className="max-w-[60%] break-words text-right text-sm font-black">
        {valore}
      </span>
    </div>
  )
}

function formattaData(data: string) {
  if (!data) return "Non disponibile"

  return new Date(`${data}T00:00:00`).toLocaleDateString("it-IT")
}

function formattaDimensione(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}