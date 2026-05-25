"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../lib/supabase"

export default function AreaClientePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [cliente, setCliente] = useState<any>(null)
  const [pt, setPt] = useState("")
  const [schede, setSchede] = useState<any[]>([])

  useEffect(() => {
    caricaClienteAggiornato()
  }, [])

  async function caricaClienteAggiornato() {
    const clienteSalvato =
      localStorage.getItem("cliente") || localStorage.getItem("utente")

    if (!clienteSalvato) {
      router.push("/login")
      return
    }

    const clienteBase = JSON.parse(clienteSalvato)

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", clienteBase.id)
      .single()

    if (error || !data) {
      router.push("/login")
      return
    }

    setCliente(data)
    setPt(data.pt_assegnato || "Simone Totaro")
    const { data: schedeData } = await supabase
  .from("schede")
  .select("*")
  .eq("cliente_id", data.id)
  .order("created_at", { ascending: false })

setSchede(schedeData || [])

    localStorage.setItem("cliente", JSON.stringify(data))
    localStorage.setItem("utente", JSON.stringify(data))
  }

  function statoAbbonamento() {
    if (!cliente?.abbonamento_scadenza) {
      return {
        testo: "NON IMPOSTATO",
        colore: "bg-zinc-700 text-white",
      }
    }

    const oggi = new Date()
    const scadenza = new Date(cliente.abbonamento_scadenza)
    const giorni = Math.ceil(
      (scadenza.getTime() - oggi.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (giorni < 0) {
      return {
        testo: "SCADUTO",
        colore: "bg-red-600 text-white",
      }
    }

    if (giorni <= 10) {
      return {
        testo: "IN SCADENZA",
        colore: "bg-orange-500 text-black",
      }
    }

    return {
      testo: "ATTIVO",
      colore: "bg-green-500 text-black",
    }
  }

  function statoCertificato() {
    if (!cliente?.certificato_scadenza) {
      return {
        testo: "NON PRESENTE",
        colore: "bg-zinc-700 text-white",
      }
    }

    const oggi = new Date()
    const scadenza = new Date(cliente.certificato_scadenza)
    const giorni = Math.ceil(
      (scadenza.getTime() - oggi.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (giorni < 0) {
      return {
        testo: "SCADUTO",
        colore: "bg-red-600 text-white",
      }
    }

    if (giorni <= 15) {
      return {
        testo: "IN SCADENZA",
        colore: "bg-orange-500 text-black",
      }
    }

    return {
      testo: "VALIDO",
      colore: "bg-green-500 text-black",
    }
  }

  async function caricaCertificato(e: any) {
    const file = e.target.files?.[0]

    if (!file) return

    if (file.type !== "application/pdf") {
      alert("Puoi caricare solo file PDF.")
      return
    }

    const filePath = `${cliente.id}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from("certificati")
      .upload(filePath, file)

    if (uploadError) {
      alert(uploadError.message)
      return
    }

    const { data } = supabase.storage
      .from("certificati")
      .getPublicUrl(filePath)

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        certificato_file_url: data.publicUrl,
      })
      .eq("id", cliente.id)

    if (updateError) {
      alert(updateError.message)
      return
    }

    const clienteAggiornato = {
      ...cliente,
      certificato_file_url: data.publicUrl,
    }

    setCliente(clienteAggiornato)

    localStorage.setItem("cliente", JSON.stringify(clienteAggiornato))
    localStorage.setItem("utente", JSON.stringify(clienteAggiornato))

    alert("Certificato caricato correttamente!")
  }

  function logout() {
    localStorage.removeItem("cliente")
    localStorage.removeItem("utente")
    router.push("/login")
  }

  if (!cliente) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        Caricamento...
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white px-5 pt-5 pb-24">
      <div className="max-w-md mx-auto space-y-5">
        <header className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center font-black shadow-[0_0_25px_rgba(220,38,38,0.45)]">
            MF
          </div>

          <div>
            <p className="text-zinc-400 text-sm">Bentornato</p>
            <h1 className="text-2xl font-black">
              Ciao {cliente.nome} {cliente.cognome} 👋
            </h1>
            <p className="text-red-500 text-xs font-black tracking-[0.25em]">
              MINOS FIT MEMBER
            </p>
          </div>
        </header>

        <section className="bg-gradient-to-br from-red-600 to-red-900 rounded-[2rem] p-6 shadow-[0_0_35px_rgba(220,38,38,0.35)]">
          <p className="text-red-100 text-sm">Abbonamento</p>

          <h2 className="text-3xl font-black mt-1">
            {cliente.abbonamento || "Da impostare"}
          </h2>

          <span
            className={`inline-block mt-3 px-4 py-2 rounded-full text-xs font-black ${statoAbbonamento().colore}`}
          >
            {statoAbbonamento().testo}
          </span>

          <div className="mt-5 bg-black/25 rounded-2xl p-4">
            <p className="text-red-100 text-sm">Data pagamento</p>
            <p className="text-lg font-bold">
              {cliente.abbonamento_pagamento || "Non impostata"}
            </p>

            <p className="text-red-100 text-sm mt-4">Scadenza</p>
            <p className="text-xl font-bold">
              {cliente.abbonamento_scadenza ||
                cliente.scadenza ||
                "Non impostata"}
            </p>
          </div>

          <button className="w-full mt-5 bg-white text-black rounded-2xl p-4 font-black">
            Rinnova abbonamento
          </button>
        </section>

        <section className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-5">
          <h2 className="text-xl font-black text-red-500">
            🩺 Certificato medico
          </h2>

          <span
            className={`inline-block mt-3 px-4 py-2 rounded-full text-xs font-black ${statoCertificato().colore}`}
          >
            {statoCertificato().testo}
          </span>

          <p className="text-zinc-400 mt-4">Scadenza</p>
          <p className="font-bold">
            {cliente.certificato_scadenza || "Non impostata"}
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={caricaCertificato}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full mt-5 bg-white text-black rounded-2xl p-4 font-black"
          >
            Carica certificato PDF
          </button>

          {cliente.certificato_file_url && (
            <a
              href={cliente.certificato_file_url}
              target="_blank"
              className="block text-center w-full mt-3 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 font-black"
            >
              Visualizza certificato
            </a>
          )}
        </section>

        <section className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-5">
          <h2 className="text-xl font-black text-red-500">
            📅 Prenotazioni PT
          </h2>

          <p className="text-zinc-400 mt-2 mb-4">
            Personal trainer assegnato:
          </p>

          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 mb-4 font-bold">
            {pt || "Non assegnato"}
          </div>

          <button className="w-full bg-red-600 rounded-2xl p-4 font-black">
            Apri calendario PT
          </button>
        </section>

        <section className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-5">
          <h2 className="text-xl font-black text-red-500">
            📄 Le mie schede
          </h2>
          <h2 className="text-xl font-black text-red-500">
  📄 Le mie schede
</h2>

{schede.length === 0 ? (

  <p className="text-zinc-400 mt-4">
    Nessuna scheda attiva.
  </p>

) : (

  <div className="space-y-4 mt-4">

    {schede.map((scheda) => (

      <div
        key={scheda.id}
        className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4"
      >

        <p className="font-black text-lg">
          {scheda.titolo}
        </p>

        <a
          href={scheda.file_url}
          target="_blank"
          className="block mt-4 bg-red-600 rounded-xl p-3 text-center font-black"
        >
          APRI PDF
        </a>

      </div>

    ))}

  </div>

)}

          <p className="text-zinc-400 mt-2">
            Nessuna scheda attiva.
          </p>

          <button className="w-full mt-5 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 font-black">
            Richiedi nuova scheda
          </button>
        </section>

        <section className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-5">
          <h2 className="text-xl font-black text-red-500">
            🤖 Chat IA
          </h2>

          <p className="text-zinc-400 mt-2 mb-4">
            Assistenza virtuale MINOS FIT.
          </p>

          <button className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4 font-black">
            Apri chat
          </button>
        </section>

        <section className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-5">
          <h2 className="text-xl font-black text-red-500">
            📲 Contatta PT
          </h2>

          <a
            href="https://wa.me/393331234567"
            target="_blank"
            className="block mt-4 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 font-bold"
          >
            👤 {pt || "Personal Trainer"} — WhatsApp
          </a>
        </section>

        <button
          onClick={logout}
          className="w-full bg-red-600/20 border border-red-600 text-red-400 rounded-2xl p-4 font-black"
        >
          Logout
        </button>
      </div>
    </main>
  )
}