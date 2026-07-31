"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff,
  Home,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react"
import { supabase } from "../lib/supabase"

type FormRegistrazione = {
  nome: string
  cognome: string
  dataNascita: string
  prefisso: string
  telefono: string

  email: string
  confermaEmail: string
  password: string
  confermaPassword: string

  via: string
  numeroCivico: string
  cap: string
  citta: string
  provincia: string
  nazionalita: string
  codiceFiscale: string

  genitoreNome: string
  genitoreCognome: string
  genitoreTelefono: string
  genitoreEmail: string

  privacyAccettata: boolean
  consensoGenitore: boolean
}

const statoIniziale: FormRegistrazione = {
  nome: "",
  cognome: "",
  dataNascita: "",
  prefisso: "+39",
  telefono: "",

  email: "",
  confermaEmail: "",
  password: "",
  confermaPassword: "",

  via: "",
  numeroCivico: "",
  cap: "",
  citta: "",
  provincia: "",
  nazionalita: "Italia",
  codiceFiscale: "",

  genitoreNome: "",
  genitoreCognome: "",
  genitoreTelefono: "",
  genitoreEmail: "",

  privacyAccettata: false,
  consensoGenitore: false,
}

const provinceItaliane = [
  "AG",
  "AL",
  "AN",
  "AO",
  "AP",
  "AQ",
  "AR",
  "AT",
  "AV",
  "BA",
  "BG",
  "BI",
  "BL",
  "BN",
  "BO",
  "BR",
  "BS",
  "BT",
  "BZ",
  "CA",
  "CB",
  "CE",
  "CH",
  "CL",
  "CN",
  "CO",
  "CR",
  "CS",
  "CT",
  "CZ",
  "EN",
  "FC",
  "FE",
  "FG",
  "FI",
  "FM",
  "FR",
  "GE",
  "GO",
  "GR",
  "IM",
  "IS",
  "KR",
  "LC",
  "LE",
  "LI",
  "LO",
  "LT",
  "LU",
  "MB",
  "MC",
  "ME",
  "MI",
  "MN",
  "MO",
  "MS",
  "MT",
  "NA",
  "NO",
  "NU",
  "OR",
  "PA",
  "PC",
  "PD",
  "PE",
  "PG",
  "PI",
  "PN",
  "PO",
  "PR",
  "PT",
  "PU",
  "PV",
  "PZ",
  "RA",
  "RC",
  "RE",
  "RG",
  "RI",
  "RM",
  "RN",
  "RO",
  "SA",
  "SI",
  "SO",
  "SP",
  "SR",
  "SS",
  "SU",
  "SV",
  "TA",
  "TE",
  "TN",
  "TO",
  "TP",
  "TR",
  "TS",
  "TV",
  "UD",
  "VA",
  "VB",
  "VC",
  "VE",
  "VI",
  "VR",
  "VT",
  "VV",
]

export default function RichiediIscrizionePage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormRegistrazione>(statoIniziale)

  const [mostraPassword, setMostraPassword] = useState(false)
  const [mostraConfermaPassword, setMostraConfermaPassword] =
    useState(false)

  const [errore, setErrore] = useState("")
  const [invioInCorso, setInvioInCorso] = useState(false)
  const [registrazioneCompletata, setRegistrazioneCompletata] =
    useState(false)

  const eta = useMemo(() => {
    if (!form.dataNascita) return null

    const oggi = new Date()
    const nascita = new Date(`${form.dataNascita}T00:00:00`)

    let anni = oggi.getFullYear() - nascita.getFullYear()

    const compleannoNonPassato =
      oggi.getMonth() < nascita.getMonth() ||
      (oggi.getMonth() === nascita.getMonth() &&
        oggi.getDate() < nascita.getDate())

    if (compleannoNonPassato) {
      anni -= 1
    }

    return anni
  }, [form.dataNascita])

  const minorenne = eta !== null && eta < 18

  const requisitiPassword = {
    lunghezza: form.password.length >= 8,
    maiuscola: /[A-Z]/.test(form.password),
    numero: /\d/.test(form.password),
    speciale: /[^A-Za-z0-9]/.test(form.password),
  }

  const passwordValida = Object.values(requisitiPassword).every(Boolean)

  const percentuale = step === 1 ? 33 : step === 2 ? 66 : 100

  function aggiornaCampo<K extends keyof FormRegistrazione>(
    campo: K,
    valore: FormRegistrazione[K],
  ) {
    setForm((precedente) => ({
      ...precedente,
      [campo]: valore,
    }))

    if (errore) {
      setErrore("")
    }
  }

  function validaStepUno() {
    if (!form.nome.trim()) {
      return "Inserisci il nome"
    }

    if (!form.cognome.trim()) {
      return "Inserisci il cognome"
    }

    if (!form.dataNascita) {
      return "Inserisci la data di nascita"
    }

    if (eta === null || eta < 10) {
      return "Controlla la data di nascita inserita"
    }

    if (!form.telefono.trim()) {
      return "Inserisci il numero di telefono"
    }

    if (form.telefono.replace(/\D/g, "").length < 8) {
      return "Il numero di telefono non sembra valido"
    }

    if (minorenne) {
      if (!form.genitoreNome.trim()) {
        return "Inserisci il nome del genitore o tutore"
      }

      if (!form.genitoreCognome.trim()) {
        return "Inserisci il cognome del genitore o tutore"
      }

      if (!form.genitoreTelefono.trim()) {
        return "Inserisci il telefono del genitore o tutore"
      }

      if (!form.genitoreEmail.trim()) {
        return "Inserisci l’email del genitore o tutore"
      }

      if (!emailValida(form.genitoreEmail)) {
        return "L’email del genitore non è valida"
      }
    }

    return ""
  }

  function validaStepDue() {
    const emailPulita = form.email.trim().toLowerCase()
    const confermaEmailPulita = form.confermaEmail.trim().toLowerCase()

    if (!emailPulita) {
      return "Inserisci l’email"
    }

    if (!emailValida(emailPulita)) {
      return "Inserisci un indirizzo email valido"
    }

    if (emailPulita !== confermaEmailPulita) {
      return "Le email inserite non coincidono"
    }

    if (!passwordValida) {
      return "La password non rispetta tutti i requisiti"
    }

    if (form.password !== form.confermaPassword) {
      return "Le password inserite non coincidono"
    }

    return ""
  }

  function validaStepTre() {
    if (!form.via.trim()) {
      return "Inserisci la via di residenza"
    }

    if (!form.numeroCivico.trim()) {
      return "Inserisci il numero civico"
    }

    if (!/^\d{5}$/.test(form.cap.trim())) {
      return "Il CAP deve contenere 5 numeri"
    }

    if (!form.citta.trim()) {
      return "Inserisci la città"
    }

    if (!form.provincia) {
      return "Seleziona la provincia"
    }

    if (!form.nazionalita.trim()) {
      return "Inserisci la nazionalità"
    }

    if (form.codiceFiscale.trim().length !== 16) {
      return "Il codice fiscale deve contenere 16 caratteri"
    }

    if (!form.privacyAccettata) {
      return "Devi accettare l’informativa sulla privacy"
    }

    if (minorenne && !form.consensoGenitore) {
      return "È necessario il consenso del genitore o tutore"
    }

    return ""
  }

  function continua() {
    const messaggio =
      step === 1
        ? validaStepUno()
        : step === 2
          ? validaStepDue()
          : ""

    if (messaggio) {
      setErrore(messaggio)
      return
    }

    setErrore("")
    setStep((precedente) => Math.min(3, precedente + 1))
    tornaInAlto()
  }

  function indietro() {
    setErrore("")
    setStep((precedente) => Math.max(1, precedente - 1))
    tornaInAlto()
  }

  async function creaAccount() {
    const messaggio = validaStepTre()

    if (messaggio) {
      setErrore(messaggio)
      tornaInAlto()
      return
    }

    setInvioInCorso(true)
    setErrore("")

    const emailPulita = form.email.trim().toLowerCase()
    const codiceFiscalePulito = form.codiceFiscale
      .trim()
      .toUpperCase()

    try {
      const { data: profiloEsistente, error: erroreControllo } =
        await supabase
          .from("profiles")
          .select("id")
          .eq("email", emailPulita)
          .maybeSingle()

      if (erroreControllo) {
        throw erroreControllo
      }

      if (profiloEsistente) {
        setErrore("Esiste già un account associato a questa email")
        setStep(2)
        setInvioInCorso(false)
        tornaInAlto()
        return
      }

      const nuovoProfilo = {
        nome: formattaNome(form.nome),
        cognome: formattaNome(form.cognome),
        email: emailPulita,

        /*
          Questa colonna viene mantenuta per essere compatibile
          con il sistema di login attuale.

          In seguito sposteremo le password dentro Supabase Auth,
          senza salvarle direttamente nella tabella profiles.
        */
        password: form.password,

        ruolo: "cliente",
        stato_account: minorenne ? "da_approvare" : "attivo",
        minorenne,

        data_nascita: form.dataNascita,
        prefisso: form.prefisso,
        telefono: form.telefono.trim(),

        via: formattaTesto(form.via),
        numero_civico: form.numeroCivico.trim(),
        cap: form.cap.trim(),
        citta: formattaTesto(form.citta),
        provincia: form.provincia,
        nazionalita: formattaTesto(form.nazionalita),
        codice_fiscale: codiceFiscalePulito,

        privacy_accettata: true,

        genitore_nome: minorenne
          ? formattaNome(form.genitoreNome)
          : null,

        genitore_cognome: minorenne
          ? formattaNome(form.genitoreCognome)
          : null,

        genitore_telefono: minorenne
          ? form.genitoreTelefono.trim()
          : null,

        genitore_email: minorenne
          ? form.genitoreEmail.trim().toLowerCase()
          : null,

        consenso_genitore: minorenne
          ? form.consensoGenitore
          : false,
      }

      const { data, error } = await supabase
        .from("profiles")
        .insert(nuovoProfilo)
        .select()
        .single()

      if (error) {
        throw error
      }

      /*
        Gli adulti vengono attivati subito.
        I minorenni devono essere approvati dallo staff.
      */
      if (!minorenne && data) {
        localStorage.setItem("utente", JSON.stringify(data))
        localStorage.setItem("cliente", JSON.stringify(data))
      }

      setRegistrazioneCompletata(true)
    } catch (erroreRegistrazione) {
      console.error(
        "Errore durante la registrazione:",
        erroreRegistrazione,
      )

      const possibileErrore = erroreRegistrazione as {
        message?: string
        code?: string
      }

      if (possibileErrore.code === "23505") {
        setErrore(
          "Email o codice fiscale già presenti nel database",
        )
      } else {
        setErrore(
          possibileErrore.message ||
            "Non è stato possibile completare la registrazione",
        )
      }
    } finally {
      setInvioInCorso(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black text-white">
      {/* SFONDO */}
      <div className="fixed inset-0 bg-black">
        <video
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover opacity-50"
        >
          <source src="/intro.mp4?v=3" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-black/55" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.15),transparent_60%)]" />
      </div>

      {/* PAGINA */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[760px] flex-col px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-5">
          <Link
            href="/login/accesso"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm font-bold text-zinc-300 backdrop-blur-xl transition hover:border-red-500/60 hover:text-white"
          >
            <ChevronLeft size={19} />
            Torna all’accesso
          </Link>
        </div>

        <section className="w-full rounded-[32px] border border-red-600/60 bg-black/80 p-5 shadow-[0_0_55px_rgba(220,38,38,0.28)] backdrop-blur-2xl sm:p-9">
          {/* INTESTAZIONE */}
          <div className="mb-7 text-center">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.32em] text-red-500">
              MinosFit
            </p>

            <h1 className="text-3xl font-black uppercase tracking-tight sm:text-4xl">
              Crea il tuo account
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
              Inserisci i tuoi dati per accedere ai servizi della
              palestra.
            </p>
          </div>

          {/* PROGRESSO */}
          <div className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                Passo {step} di 3
              </span>

              <span className="text-sm font-black text-red-500">
                {percentuale}%
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-zinc-900">
              <div
                className="h-full rounded-full bg-red-600 shadow-[0_0_16px_rgba(220,38,38,0.8)] transition-all duration-500"
                style={{ width: `${percentuale}%` }}
              />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <IndicatoreStep
                numero={1}
                testo="Dati"
                attivo={step === 1}
                completato={step > 1}
              />

              <IndicatoreStep
                numero={2}
                testo="Account"
                attivo={step === 2}
                completato={step > 2}
              />

              <IndicatoreStep
                numero={3}
                testo="Residenza"
                attivo={step === 3}
                completato={false}
              />
            </div>
          </div>

          {/* ERRORE */}
          {errore && (
            <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm font-bold text-red-200">
              {errore}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="animate-step">
              <TitoloStep
                icona={<User size={22} />}
                titolo="Dati personali"
                descrizione="Raccontaci chi sei e come possiamo contattarti."
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <CampoTesto
                  id="nome"
                  label="Nome"
                  valore={form.nome}
                  placeholder="Inserisci il nome"
                  icona={<User size={20} />}
                  onChange={(valore) =>
                    aggiornaCampo("nome", valore)
                  }
                />

                <CampoTesto
                  id="cognome"
                  label="Cognome"
                  valore={form.cognome}
                  placeholder="Inserisci il cognome"
                  icona={<User size={20} />}
                  onChange={(valore) =>
                    aggiornaCampo("cognome", valore)
                  }
                />
              </div>

              <div className="mt-5">
                <label
                  htmlFor="dataNascita"
                  className="mb-2.5 block text-sm font-bold text-zinc-200"
                >
                  Data di nascita
                </label>

                <div className="relative">
                  <CalendarDays
                    size={20}
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-red-500"
                  />

                  <input
                    id="dataNascita"
                    type="date"
                    value={form.dataNascita}
                    max={dataMassimaOggi()}
                    onChange={(evento) =>
                      aggiornaCampo(
                        "dataNascita",
                        evento.target.value,
                      )
                    }
                    className="minos-register-input w-full rounded-2xl border border-zinc-700 bg-zinc-950/90 py-4 pl-12 pr-4 text-white outline-none transition focus:border-red-500 focus:shadow-[0_0_18px_rgba(220,38,38,0.2)]"
                  />
                </div>

                {eta !== null && (
                  <p className="mt-2 text-xs font-bold text-zinc-500">
                    Età calcolata: {eta} anni
                    {minorenne
                      ? " — è necessaria l’approvazione dello staff."
                      : ""}
                  </p>
                )}
              </div>

              <div className="mt-5">
                <label className="mb-2.5 block text-sm font-bold text-zinc-200">
                  Numero di telefono
                </label>

                <div className="flex gap-3">
                  <select
                    value={form.prefisso}
                    onChange={(evento) =>
                      aggiornaCampo(
                        "prefisso",
                        evento.target.value,
                      )
                    }
                    className="minos-register-input w-[105px] rounded-2xl border border-zinc-700 bg-zinc-950/90 px-3 py-4 text-white outline-none transition focus:border-red-500"
                  >
                    <option value="+39">+39</option>
                    <option value="+33">+33</option>
                    <option value="+34">+34</option>
                    <option value="+41">+41</option>
                    <option value="+44">+44</option>
                    <option value="+49">+49</option>
                  </select>

                  <div className="relative flex-1">
                    <Phone
                      size={20}
                      className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-red-500"
                    />

                    <input
                      type="tel"
                      inputMode="tel"
                      value={form.telefono}
                      placeholder="Numero di telefono"
                      onChange={(evento) =>
                        aggiornaCampo(
                          "telefono",
                          evento.target.value.replace(
                            /[^0-9 ]/g,
                            "",
                          ),
                        )
                      }
                      className="minos-register-input w-full rounded-2xl border border-zinc-700 bg-zinc-950/90 py-4 pl-12 pr-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500 focus:shadow-[0_0_18px_rgba(220,38,38,0.2)]"
                    />
                  </div>
                </div>
              </div>

              {/* DATI GENITORE */}
              {minorenne && (
                <div className="mt-7 rounded-[24px] border border-amber-500/30 bg-amber-950/15 p-4 sm:p-5">
                  <div className="mb-5 flex items-start gap-3">
                    <ShieldCheck
                      size={24}
                      className="mt-0.5 shrink-0 text-amber-400"
                    />

                    <div>
                      <h3 className="font-black text-amber-300">
                        Dati del genitore o tutore
                      </h3>

                      <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                        Essendo minorenne, il tuo account dovrà essere
                        approvato dallo staff.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <CampoTesto
                      id="genitoreNome"
                      label="Nome del genitore"
                      valore={form.genitoreNome}
                      placeholder="Nome"
                      icona={<User size={20} />}
                      onChange={(valore) =>
                        aggiornaCampo("genitoreNome", valore)
                      }
                    />

                    <CampoTesto
                      id="genitoreCognome"
                      label="Cognome del genitore"
                      valore={form.genitoreCognome}
                      placeholder="Cognome"
                      icona={<User size={20} />}
                      onChange={(valore) =>
                        aggiornaCampo(
                          "genitoreCognome",
                          valore,
                        )
                      }
                    />

                    <CampoTesto
                      id="genitoreTelefono"
                      label="Telefono del genitore"
                      valore={form.genitoreTelefono}
                      placeholder="Numero di telefono"
                      tipo="tel"
                      icona={<Phone size={20} />}
                      onChange={(valore) =>
                        aggiornaCampo(
                          "genitoreTelefono",
                          valore,
                        )
                      }
                    />

                    <CampoTesto
                      id="genitoreEmail"
                      label="Email del genitore"
                      valore={form.genitoreEmail}
                      placeholder="Email"
                      tipo="email"
                      icona={<Mail size={20} />}
                      onChange={(valore) =>
                        aggiornaCampo(
                          "genitoreEmail",
                          valore,
                        )
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="animate-step">
              <TitoloStep
                icona={<LockKeyhole size={22} />}
                titolo="Dati di accesso"
                descrizione="Scegli email e password per entrare nell’app."
              />

              <CampoTesto
                id="email"
                label="Email"
                valore={form.email}
                placeholder="nome@email.it"
                tipo="email"
                icona={<Mail size={20} />}
                onChange={(valore) =>
                  aggiornaCampo("email", valore)
                }
              />

              <div className="mt-5">
                <CampoTesto
                  id="confermaEmail"
                  label="Conferma email"
                  valore={form.confermaEmail}
                  placeholder="Ripeti l’email"
                  tipo="email"
                  icona={<Mail size={20} />}
                  onChange={(valore) =>
                    aggiornaCampo("confermaEmail", valore)
                  }
                />
              </div>

              <div className="mt-5">
                <CampoPassword
                  id="password"
                  label="Password"
                  valore={form.password}
                  placeholder="Crea una password"
                  visibile={mostraPassword}
                  onToggle={() =>
                    setMostraPassword(
                      (precedente) => !precedente,
                    )
                  }
                  onChange={(valore) =>
                    aggiornaCampo("password", valore)
                  }
                />
              </div>

              <div className="mt-4 grid gap-2 rounded-2xl border border-white/5 bg-zinc-950/60 p-4 sm:grid-cols-2">
                <RequisitoPassword
                  valido={requisitiPassword.lunghezza}
                  testo="Almeno 8 caratteri"
                />

                <RequisitoPassword
                  valido={requisitiPassword.maiuscola}
                  testo="Una lettera maiuscola"
                />

                <RequisitoPassword
                  valido={requisitiPassword.numero}
                  testo="Almeno un numero"
                />

                <RequisitoPassword
                  valido={requisitiPassword.speciale}
                  testo="Un carattere speciale"
                />
              </div>

              <div className="mt-5">
                <CampoPassword
                  id="confermaPassword"
                  label="Conferma password"
                  valore={form.confermaPassword}
                  placeholder="Ripeti la password"
                  visibile={mostraConfermaPassword}
                  onToggle={() =>
                    setMostraConfermaPassword(
                      (precedente) => !precedente,
                    )
                  }
                  onChange={(valore) =>
                    aggiornaCampo(
                      "confermaPassword",
                      valore,
                    )
                  }
                />
              </div>

              {form.confermaPassword && (
                <p
                  className={`mt-3 text-sm font-bold ${
                    form.password === form.confermaPassword
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {form.password === form.confermaPassword
                    ? "Le password coincidono"
                    : "Le password non coincidono"}
                </p>
              )}
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="animate-step">
              <TitoloStep
                icona={<Home size={22} />}
                titolo="Residenza"
                descrizione="Completa le ultime informazioni richieste."
              />

              <CampoTesto
                id="via"
                label="Via o piazza"
                valore={form.via}
                placeholder="Esempio: Via Roma"
                icona={<MapPin size={20} />}
                onChange={(valore) =>
                  aggiornaCampo("via", valore)
                }
              />

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <CampoTesto
                  id="numeroCivico"
                  label="Numero civico"
                  valore={form.numeroCivico}
                  placeholder="Esempio: 12/A"
                  icona={<Home size={20} />}
                  onChange={(valore) =>
                    aggiornaCampo("numeroCivico", valore)
                  }
                />

                <CampoTesto
                  id="cap"
                  label="CAP"
                  valore={form.cap}
                  placeholder="00000"
                  inputMode="numeric"
                  massimoCaratteri={5}
                  icona={<MapPin size={20} />}
                  onChange={(valore) =>
                    aggiornaCampo(
                      "cap",
                      valore.replace(/\D/g, "").slice(0, 5),
                    )
                  }
                />
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <CampoTesto
                  id="citta"
                  label="Città"
                  valore={form.citta}
                  placeholder="Inserisci la città"
                  icona={<MapPin size={20} />}
                  onChange={(valore) =>
                    aggiornaCampo("citta", valore)
                  }
                />

                <div>
                  <label
                    htmlFor="provincia"
                    className="mb-2.5 block text-sm font-bold text-zinc-200"
                  >
                    Provincia
                  </label>

                  <select
                    id="provincia"
                    value={form.provincia}
                    onChange={(evento) =>
                      aggiornaCampo(
                        "provincia",
                        evento.target.value,
                      )
                    }
                    className="minos-register-input w-full rounded-2xl border border-zinc-700 bg-zinc-950/90 px-4 py-4 text-white outline-none transition focus:border-red-500"
                  >
                    <option value="">Seleziona</option>

                    {provinceItaliane.map((provincia) => (
                      <option
                        key={provincia}
                        value={provincia}
                      >
                        {provincia}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <CampoTesto
                  id="nazionalita"
                  label="Nazionalità"
                  valore={form.nazionalita}
                  placeholder="Esempio: Italia"
                  icona={<MapPin size={20} />}
                  onChange={(valore) =>
                    aggiornaCampo("nazionalita", valore)
                  }
                />

                <CampoTesto
                  id="codiceFiscale"
                  label="Codice fiscale"
                  valore={form.codiceFiscale}
                  placeholder="RSSMRA..."
                  massimoCaratteri={16}
                  icona={<ShieldCheck size={20} />}
                  onChange={(valore) =>
                    aggiornaCampo(
                      "codiceFiscale",
                      valore
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "")
                        .slice(0, 16),
                    )
                  }
                />
              </div>

              <div className="mt-7 space-y-4">
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/65 p-4 transition hover:border-red-500/40">
                  <input
                    type="checkbox"
                    checked={form.privacyAccettata}
                    onChange={(evento) =>
                      aggiornaCampo(
                        "privacyAccettata",
                        evento.target.checked,
                      )
                    }
                    className="mt-1 h-5 w-5 accent-red-600"
                  />

                  <span className="text-sm leading-relaxed text-zinc-300">
                    Dichiaro di aver letto e accettato
                    l’informativa sulla privacy e autorizzo il
                    trattamento dei dati personali.
                  </span>
                </label>

                {minorenne && (
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-950/15 p-4 transition hover:border-amber-400/50">
                    <input
                      type="checkbox"
                      checked={form.consensoGenitore}
                      onChange={(evento) =>
                        aggiornaCampo(
                          "consensoGenitore",
                          evento.target.checked,
                        )
                      }
                      className="mt-1 h-5 w-5 accent-amber-500"
                    />

                    <span className="text-sm leading-relaxed text-zinc-300">
                      Il genitore o tutore autorizza la richiesta
                      di iscrizione del minore.
                    </span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* PULSANTI */}
          <div className="mt-9 flex gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={indietro}
                disabled={invioInCorso}
                className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-950/80 px-5 font-black text-zinc-300 transition hover:border-zinc-500 hover:text-white disabled:opacity-50"
              >
                <ArrowLeft size={20} />
                <span className="hidden sm:inline">Indietro</span>
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={continua}
                className="flex min-h-[56px] flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 text-lg font-black uppercase tracking-wide text-white shadow-[0_0_26px_rgba(220,38,38,0.4)] transition hover:bg-red-500"
              >
                Continua
                <ArrowRight size={21} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void creaAccount()}
                disabled={invioInCorso}
                className="flex min-h-[56px] flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 text-lg font-black uppercase tracking-wide text-white shadow-[0_0_30px_rgba(220,38,38,0.5)] transition hover:bg-red-500 disabled:cursor-wait disabled:opacity-60"
              >
                {invioInCorso ? (
                  <>
                    <LoaderCircle
                      size={22}
                      className="animate-spin"
                    />
                    Creazione...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={22} />
                    Crea account
                  </>
                )}
              </button>
            )}
          </div>
        </section>
      </div>

      {/* MODALE SUCCESSO */}
      {registrazioneCompletata && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
          <div className="w-full max-w-[480px] animate-success rounded-[32px] border border-emerald-500/40 bg-zinc-950 p-6 text-center shadow-[0_0_55px_rgba(16,185,129,0.24)] sm:p-9">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_35px_rgba(16,185,129,0.25)]">
              <CheckCircle2
                size={42}
                className="text-emerald-400"
              />
            </div>

            <h2 className="mt-6 text-3xl font-black uppercase">
              {minorenne
                ? "Richiesta inviata"
                : "Account creato"}
            </h2>

            <p className="mt-4 leading-relaxed text-zinc-400">
              {minorenne
                ? "La richiesta è stata inviata allo staff MinosFit. Potrai accedere quando l’account sarà approvato."
                : "La registrazione è stata completata. Il tuo account è già attivo e puoi entrare nell’area cliente."}
            </p>

            {minorenne ? (
              <Link
                href="/login/accesso"
                className="mt-7 block w-full rounded-2xl bg-red-600 px-5 py-4 text-center text-lg font-black uppercase text-white transition hover:bg-red-500"
              >
                Torna all’accesso
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/area-cliente"
                }}
                className="mt-7 w-full rounded-2xl bg-red-600 px-5 py-4 text-lg font-black uppercase text-white transition hover:bg-red-500"
              >
                Entra nell’app
              </button>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        .minos-register-input:-webkit-autofill,
        .minos-register-input:-webkit-autofill:hover,
        .minos-register-input:-webkit-autofill:focus,
        .minos-register-input:-webkit-autofill:active {
          -webkit-text-fill-color: white !important;
          -webkit-box-shadow: 0 0 0 1000px #09090b inset !important;
          box-shadow: 0 0 0 1000px #09090b inset !important;
          caret-color: white !important;
        }

        @keyframes stepEntrance {
          from {
            opacity: 0;
            transform: translateX(18px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes successEntrance {
          from {
            opacity: 0;
            transform: scale(0.92) translateY(18px);
          }

          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-step {
          animation: stepEntrance 400ms ease-out;
        }

        .animate-success {
          animation: successEntrance 450ms ease-out;
        }
      `}</style>
    </main>
  )
}

/* -------------------------------------------------------------------------- */
/* COMPONENTI INTERNI                                                         */
/* -------------------------------------------------------------------------- */

function IndicatoreStep({
  numero,
  testo,
  attivo,
  completato,
}: {
  numero: number
  testo: string
  attivo: boolean
  completato: boolean
}) {
  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-2xl border px-2 py-3 transition ${
        attivo
          ? "border-red-500/60 bg-red-950/30"
          : completato
            ? "border-emerald-500/30 bg-emerald-950/20"
            : "border-zinc-800 bg-zinc-950/40"
      }`}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${
          attivo
            ? "bg-red-600 text-white"
            : completato
              ? "bg-emerald-500 text-black"
              : "bg-zinc-800 text-zinc-500"
        }`}
      >
        {completato ? <Check size={17} /> : numero}
      </div>

      <span
        className={`text-[11px] font-black uppercase tracking-wide ${
          attivo
            ? "text-red-300"
            : completato
              ? "text-emerald-400"
              : "text-zinc-600"
        }`}
      >
        {testo}
      </span>
    </div>
  )
}

function TitoloStep({
  icona,
  titolo,
  descrizione,
}: {
  icona: React.ReactNode
  titolo: string
  descrizione: string
}) {
  return (
    <div className="mb-7 flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/30 bg-red-600/10 text-red-500">
        {icona}
      </div>

      <div>
        <h2 className="text-xl font-black uppercase sm:text-2xl">
          {titolo}
        </h2>

        <p className="mt-1 text-sm leading-relaxed text-zinc-500">
          {descrizione}
        </p>
      </div>
    </div>
  )
}

function CampoTesto({
  id,
  label,
  valore,
  placeholder,
  icona,
  tipo = "text",
  inputMode,
  massimoCaratteri,
  onChange,
}: {
  id: string
  label: string
  valore: string
  placeholder: string
  icona: React.ReactNode
  tipo?: string
  inputMode?:
    | "text"
    | "email"
    | "tel"
    | "numeric"
    | "decimal"
    | "search"
    | "url"
    | "none"
  massimoCaratteri?: number
  onChange: (valore: string) => void
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2.5 block text-sm font-bold text-zinc-200"
      >
        {label}
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-red-500">
          {icona}
        </div>

        <input
          id={id}
          type={tipo}
          inputMode={inputMode}
          value={valore}
          maxLength={massimoCaratteri}
          placeholder={placeholder}
          onChange={(evento) => onChange(evento.target.value)}
          className="minos-register-input w-full rounded-2xl border border-zinc-700 bg-zinc-950/90 py-4 pl-12 pr-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500 focus:shadow-[0_0_18px_rgba(220,38,38,0.2)]"
        />
      </div>
    </div>
  )
}

function CampoPassword({
  id,
  label,
  valore,
  placeholder,
  visibile,
  onToggle,
  onChange,
}: {
  id: string
  label: string
  valore: string
  placeholder: string
  visibile: boolean
  onToggle: () => void
  onChange: (valore: string) => void
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2.5 block text-sm font-bold text-zinc-200"
      >
        {label}
      </label>

      <div className="relative">
        <LockKeyhole
          size={20}
          className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-red-500"
        />

        <input
          id={id}
          type={visibile ? "text" : "password"}
          value={valore}
          placeholder={placeholder}
          autoComplete="new-password"
          onChange={(evento) => onChange(evento.target.value)}
          className="minos-register-input w-full rounded-2xl border border-zinc-700 bg-zinc-950/90 py-4 pl-12 pr-14 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500 focus:shadow-[0_0_18px_rgba(220,38,38,0.2)]"
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={
            visibile ? "Nascondi password" : "Mostra password"
          }
          className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-white/5 hover:text-white"
        >
          {visibile ? (
            <EyeOff size={21} />
          ) : (
            <Eye size={21} />
          )}
        </button>
      </div>
    </div>
  )
}

function RequisitoPassword({
  valido,
  testo,
}: {
  valido: boolean
  testo: string
}) {
  return (
    <div
      className={`flex items-center gap-2 text-xs font-bold transition ${
        valido ? "text-emerald-400" : "text-zinc-600"
      }`}
    >
      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          valido
            ? "bg-emerald-500/15"
            : "bg-zinc-800"
        }`}
      >
        <Check size={13} />
      </div>

      {testo}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* FUNZIONI                                                                   */
/* -------------------------------------------------------------------------- */

function emailValida(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email.trim().toLowerCase(),
  )
}

function formattaNome(testo: string) {
  return testo
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(
      (parola) =>
        parola.charAt(0).toUpperCase() + parola.slice(1),
    )
    .join(" ")
}

function formattaTesto(testo: string) {
  return testo
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (lettera) => lettera.toUpperCase())
}

function dataMassimaOggi() {
  return new Date().toISOString().split("T")[0]
}

function tornaInAlto() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  })
}