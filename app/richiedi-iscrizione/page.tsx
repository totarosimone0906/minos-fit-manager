"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../lib/supabase"

function calcolaEta(data: string) {
  const oggi = new Date()
  const nascita = new Date(data)
  let eta = oggi.getFullYear() - nascita.getFullYear()
  const m = oggi.getMonth() - nascita.getMonth()
  if (m < 0 || (m === 0 && oggi.getDate() < nascita.getDate())) eta--
  return eta
}

function codiceFiscaleValido(cf: string) {
  return /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/.test(cf)
}

export default function RichiediIscrizionePage() {
  const router = useRouter()

  const [tipoCertificato, setTipoCertificato] = useState("pdf")
  const [password, setPassword] = useState("")
  const [confermaPassword, setConfermaPassword] = useState("")
  const [mostraPassword, setMostraPassword] = useState(false)
  const [codiceFiscale, setCodiceFiscale] = useState("")
  const [dataNascita, setDataNascita] = useState("")

  const haMinimo8 = password.length >= 8
  const haMaiuscola = /[A-Z]/.test(password)
  const haNumero = /[0-9]/.test(password)
  const haSpeciale = /[^A-Za-z0-9]/.test(password)
  const passwordOk = haMinimo8 && haMaiuscola && haNumero && haSpeciale
  const passwordCoincidono = password === confermaPassword && confermaPassword.length > 0
  const minorenne = dataNascita ? calcolaEta(dataNascita) < 18 : false

  async function inviaRegistrazione(e: any) {
    e.preventDefault()

    if (!codiceFiscaleValido(codiceFiscale)) {
      alert("Codice fiscale non valido.")
      return
    }

    if (!passwordOk) {
      alert("La password non rispetta i requisiti.")
      return
    }

    if (!passwordCoincidono) {
      alert("Le password non coincidono.")
      return
    }

    const form = e.currentTarget

    const { error } = await supabase.from("profiles").insert([
      {
        nome: form.nome.value,
        cognome: form.cognome.value,
        data_nascita: form.data_nascita.value,
        codice_fiscale: codiceFiscale,
        via: form.via.value,
        numero_civico: form.numero_civico.value,
        cap: form.cap.value,
        citta: form.citta.value,
        provincia: form.provincia.value,
        nazionalita: form.nazionalita.value,
        prefisso: form.prefisso.value,
        telefono: form.telefono.value,
        email: form.email.value,
        password,
        ruolo: "cliente",
        abbonamento: "Da impostare",
        certificato_scadenza: form.certificato_scadenza.value,
        certificato_modalita: tipoCertificato,
        privacy_accettata: true,
        minorenne,
        stato_account: minorenne ? "da_approvare" : "attivo",
        genitore_nome: minorenne ? form.genitore_nome?.value : null,
        genitore_cognome: minorenne ? form.genitore_cognome?.value : null,
        genitore_telefono: minorenne ? form.genitore_telefono?.value : null,
        genitore_email: minorenne ? form.genitore_email?.value : null,
        consenso_genitore: minorenne ? true : false,
      },
    ])

    if (error) {
      if (error.message.includes("duplicate")) {
        alert("Questa email è già registrata.")
        return
      }
      alert(error.message)
      return
    }

    alert("Registrazione completata!")
    router.push("/login/accesso")
  }

  const input =
    "w-full bg-[#111318] border border-zinc-700/80 rounded-xl px-4 py-4 text-white placeholder-zinc-400 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"

  const box =
    "bg-black/30 border border-zinc-800 rounded-2xl p-6 shadow-[0_0_35px_rgba(0,0,0,0.35)]"

  return (
    <main className="min-h-screen bg-[#050505] text-white px-6 py-8">
      <form onSubmit={inviaRegistrazione} className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🛡️</div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              MINOS<span className="text-green-400">FIT</span>
            </h1>
          </div>

          <a
            href="/login"
            className="border border-zinc-700 rounded-xl px-5 py-3 text-sm hover:bg-zinc-900"
          >
            ← Torna alla home
          </a>
        </div>

        <h2 className="text-5xl md:text-6xl font-black mb-3">
          Richiedi <span className="text-green-400">iscrizione</span>
        </h2>

        <p className="text-zinc-400 text-lg mb-8">
          Compila i dati. Se sei maggiorenne potrai accedere subito.
        </p>

        <section className={box}>
          <h3 className="text-green-400 font-black mb-5">👤 DATI PERSONALI</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="nome" required className={input} placeholder="Nome" />
            <input name="cognome" required className={input} placeholder="Cognome" />

            <div>
              <label className="text-zinc-300 text-sm mb-2 block">Data di nascita</label>
              <input
                name="data_nascita"
                required
                type="date"
                value={dataNascita}
                onChange={(e) => setDataNascita(e.target.value)}
                className={input}
              />
            </div>

            <input
              name="codice_fiscale"
              required
              value={codiceFiscale}
              onChange={(e) => setCodiceFiscale(e.target.value.toUpperCase())}
              className={input + " uppercase"}
              placeholder="Codice fiscale"
            />

            <input name="via" required className={input} placeholder="Via" />
            <input name="numero_civico" required className={input} placeholder="Numero civico" />

            <input name="cap" required className={input} placeholder="CAP" />
            <input name="citta" required className={input} placeholder="Città" />
            <input name="provincia" required className={input} placeholder="Provincia" />

            <select name="nazionalita" required className={input}>
              <option value="Italia">Nazionalità - Italia</option>
              <option value="Francia">Francia</option>
              <option value="Germania">Germania</option>
              <option value="Svizzera">Svizzera</option>
              <option value="Spagna">Spagna</option>
            </select>
          </div>
        </section>

        <section className={box + " mt-4"}>
          <h3 className="text-green-400 font-black mb-5">📞 CONTATTI</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select name="prefisso" required className={input}>
              <option value="+39">🇮🇹 +39</option>
              <option value="+33">🇫🇷 +33</option>
              <option value="+49">🇩🇪 +49</option>
              <option value="+41">🇨🇭 +41</option>
              <option value="+34">🇪🇸 +34</option>
            </select>

            <input name="telefono" required className={input} placeholder="Numero telefono" />
            <input name="email" required type="email" className={input} placeholder="Email" />
          </div>
        </section>

        <section className={box + " mt-4"}>
          <h3 className="text-green-400 font-black mb-5">🔒 CREDENZIALI</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-zinc-300 text-sm mb-2 block">Password</label>
              <div className="flex gap-2">
                <input
                  required
                  type={mostraPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={input}
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setMostraPassword(!mostraPassword)}
                  className="bg-zinc-800 border border-zinc-700 rounded-xl px-4"
                >
                  👁
                </button>
              </div>

              <div className="text-sm mt-4 space-y-1">
                <p className={haMinimo8 ? "text-green-400" : "text-zinc-500"}>✓ Almeno 8 caratteri</p>
                <p className={haMaiuscola ? "text-green-400" : "text-zinc-500"}>✓ Almeno 1 maiuscola</p>
                <p className={haNumero ? "text-green-400" : "text-zinc-500"}>✓ Almeno 1 numero</p>
                <p className={haSpeciale ? "text-green-400" : "text-zinc-500"}>✓ Almeno 1 carattere speciale</p>
              </div>
            </div>

            <div>
              <label className="text-zinc-300 text-sm mb-2 block">Conferma password</label>
              <input
                required
                type={mostraPassword ? "text" : "password"}
                value={confermaPassword}
                onChange={(e) => setConfermaPassword(e.target.value)}
                className={input}
                placeholder="Conferma password"
              />

              <p className={passwordCoincidono ? "text-green-400 text-sm mt-4" : "text-zinc-500 text-sm mt-4"}>
                ✓ Le password coincidono
              </p>
            </div>
          </div>
        </section>

        <section className={box + " mt-4"}>
          <h3 className="text-green-400 font-black mb-5">🩺 CERTIFICATO MEDICO</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="border border-zinc-700 rounded-xl p-5 cursor-pointer bg-zinc-900/40">
              <input
                type="radio"
                checked={tipoCertificato === "pdf"}
                onChange={() => setTipoCertificato("pdf")}
                className="mr-3"
              />
              Carico il certificato PDF ora
              <p className="text-zinc-400 text-sm mt-1">Carica il certificato medico in formato PDF</p>
            </label>

            <label className="border border-zinc-700 rounded-xl p-5 cursor-pointer bg-zinc-900/40">
              <input
                type="radio"
                checked={tipoCertificato === "sede"}
                onChange={() => setTipoCertificato("sede")}
                className="mr-3"
              />
              Porterò il certificato fisicamente in sede
              <p className="text-zinc-400 text-sm mt-1">Lo consegnerai direttamente in struttura</p>
            </label>

            <div>
              <label className="text-zinc-300 text-sm mb-2 block">Scadenza certificato medico</label>
              <input name="certificato_scadenza" required type="date" className={input} />
            </div>

            {tipoCertificato === "pdf" && (
              <div>
                <label className="text-zinc-300 text-sm mb-2 block">Carica certificato medico PDF</label>
                <input required type="file" accept="application/pdf" className={input} />
              </div>
            )}
          </div>
        </section>

        {minorenne && (
          <section className="mt-4 bg-yellow-500/10 border border-yellow-500/50 rounded-2xl p-6">
            <h3 className="text-yellow-400 font-black mb-5">
              👨‍👩‍👦 DATI GENITORE / TUTORE
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="genitore_nome" required className={input} placeholder="Nome genitore" />
              <input name="genitore_cognome" required className={input} placeholder="Cognome genitore" />
              <input name="genitore_telefono" required className={input} placeholder="Telefono genitore" />
              <input name="genitore_email" required type="email" className={input} placeholder="Email genitore" />
            </div>

            <label className="flex gap-3 mt-5 text-zinc-300">
              <input required type="checkbox" />
              Confermo il consenso del genitore/tutore
            </label>
          </section>
        )}

        <section className={box + " mt-4"}>
          <label className="flex gap-3 text-zinc-300">
            <input required type="checkbox" />
            Acconsento al trattamento dei dati personali e alla privacy policy.
          </label>

          <button className="w-full mt-8 bg-green-500 hover:bg-green-400 text-black rounded-xl p-5 font-black text-xl">
            📋 Invia registrazione
          </button>
        </section>
      </form>
    </main>
  )
}