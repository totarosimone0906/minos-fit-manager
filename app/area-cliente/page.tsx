"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../lib/supabase"

export default function AreaClientePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [cliente, setCliente] = useState<any>(null)
  const [pt, setPt] = useState("Simone Totaro")
  const [richiestaInviata, setRichiestaInviata] = useState(false)

  useEffect(() => {
    caricaClienteAggiornato()
  }, [])

  async function caricaClienteAggiornato() {
    const clienteSalvato = localStorage.getItem("cliente")

    if (!clienteSalvato) {
      router.push("/login/accesso")
      return
    }

    const clienteBase = JSON.parse(clienteSalvato)

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", clienteBase.id)
      .single()
      console.log(cliente)
        console.log(cliente?.schede_file_url)
        
      

    if (error || !data) {
      router.push("/login/accesso")
      return
    }

    setCliente(data)
    setPt(data.pt_assegnato || "Simone Totaro")
    localStorage.setItem("cliente", JSON.stringify(data))
  }

  function logout() {
    localStorage.removeItem("cliente")
    localStorage.removeItem("utente")
    router.push("/login/accesso")
  }

  function statoAbbonamento() {
    if (!cliente?.abbonamento_scadenza) {
      return { testo: "NON IMPOSTATO", colore: "bg-zinc-700 text-white" }
    }

    const oggi = new Date()
    const scadenza = new Date(cliente.abbonamento_scadenza)
    const giorni = Math.ceil(
      (scadenza.getTime() - oggi.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (giorni < 0) return { testo: "SCADUTO", colore: "bg-red-600 text-white" }
    if (giorni <= 10) return { testo: "IN SCADENZA", colore: "bg-orange-500 text-black" }

    return { testo: "ATTIVO", colore: "bg-green-500 text-black" }
  }

  function statoCertificato() {
    if (!cliente?.certificato_scadenza) {
      return { testo: "NON PRESENTE", colore: "bg-zinc-700 text-white" }
    }

    const oggi = new Date()
    const scadenza = new Date(cliente.certificato_scadenza)
    const giorni = Math.ceil(
      (scadenza.getTime() - oggi.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (giorni < 0) return { testo: "SCADUTO", colore: "bg-red-600 text-white" }
    if (giorni <= 15) return { testo: "IN SCADENZA", colore: "bg-orange-500 text-black" }

    return { testo: "VALIDO", colore: "bg-green-500 text-black" }
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

    setCliente({
      ...cliente,
      certificato_file_url: data.publicUrl,
    })

    alert("Certificato caricato correttamente ✅")
  }

  async function richiediScheda() {
    const { error } = await supabase
      .from("richieste_schede")
      .insert([
        {
          cliente_id: cliente.id,
          stato: "in_attesa",
        },
      ])

    if (error) {
      alert(error.message)
      return
    }

    setRichiestaInviata(true)
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
          <div className="flex items-center justify-center">
            <img
              src="/logo-small.png"
              alt="MINOS FIT"
              className="w-[95px] h-[95px] object-contain drop-shadow-[0_0_18px_rgba(255,0,0,0.95)]"
            />
          </div>

          <div>
            <p className="text-zinc-400 text-sm">Bentornato</p>
            <h1 className="text-3xl font-black animate-[slideIn_0.9s_ease-out]">
              Ciao {cliente.nome} {cliente.cognome} 
            </h1>
          </div>
        </header>

        <div className="text-center mt-6 mb-8">
          <p className="text-red-500 text-2xl font-black tracking-[0.35em] drop-shadow-[0_0_18px_rgba(255,0,0,0.8)]">
            MINOS FIT MEMBER
          </p>
          <div className="mx-auto mt-3 h-[3px] w-[75%] bg-red-600 rounded-full shadow-[0_0_18px_rgba(255,0,0,0.9)]" />
        </div>

        <section className="bg-gradient-to-br from-red-600 to-red-900 rounded-[2rem] p-6 shadow-[0_0_35px_rgba(220,38,38,0.35)]">
          <p className="text-red-100 text-sm">Abbonamento</p>

          <h2 className="text-3xl font-black mt-1">
            {cliente.abbonamento || "Da impostare"}
          </h2>

          <span className={`inline-block mt-3 px-4 py-2 rounded-full text-xs font-black ${statoAbbonamento().colore}`}>
            {statoAbbonamento().testo}
          </span>

          <div className="mt-5 bg-black/25 rounded-2xl p-4">
            <p className="text-red-100 text-sm">Data pagamento</p>
            <p className="text-lg font-bold">
              {cliente.abbonamento_pagamento || "Non impostata"}
            </p>

            <p className="text-red-100 text-sm mt-4">Scadenza</p>
            <p className="text-xl font-bold">
              {cliente.abbonamento_scadenza || cliente.scadenza || "Non impostata"}
            </p>
          </div>

          <button className="w-full mt-5 bg-white text-black rounded-2xl p-4 font-black">
            Rinnova abbonamento
          </button>
        </section>

        <section className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-5">
          <h2 className="text-xl font-black text-red-500">🩺 Certificato medico</h2>

          <span className={`inline-block mt-3 px-4 py-2 rounded-full text-xs font-black ${statoCertificato().colore}`}>
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
              rel="noopener noreferrer"
              className="block text-center w-full mt-3 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 font-black"
            >
              Visualizza certificato
            </a>
          )}
        </section>

        <section className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-5">
          <h2 className="text-xl font-black text-red-500">📅 Prenotazioni PT</h2>

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
          <h2 className="text-xl font-black text-red-500">📄 Le mie schede</h2>

          {cliente["cliente.schede_file_url"] ? (
  <a
    href={cliente["cliente.schede_file_url"]}
    target="_blank"
    rel="noopener noreferrer"
    className="block mt-4 bg-zinc-900 border border-red-600 rounded-2xl p-4 font-black text-center text-white shadow-[0_0_18px_rgba(220,38,38,0.35)]"
  >
    Apri scheda PDF
  </a>
) : (
  <p className="text-zinc-400 mt-2">Nessuna scheda attiva.</p>
)}

          <button
            type="button"
            onClick={richiediScheda}
            disabled={richiestaInviata}
            className={`w-full mt-5 rounded-2xl p-4 font-black ${
              richiestaInviata
                ? "bg-green-600 text-white"
                : "bg-zinc-900 border border-zinc-700 text-white"
            }`}
          >
            {richiestaInviata
              ? "✓ La tua richiesta è stata inviata"
              : "Richiedi nuova scheda"}
          </button>

          <a
            href="#"
            className="block w-full mt-3 text-center bg-red-600 rounded-2xl p-4 font-black text-white"
          >
            Paga la scheda
          </a>
        </section>

        <section className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-5">
          <h2 className="text-xl font-black text-red-500">🤖 Chat IA</h2>

          <p className="text-zinc-400 mt-2 mb-4">
            Assistenza virtuale MINOS FIT.
          </p>

          <button className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4 font-black">
            Apri chat
          </button>
        </section>

        <section className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-5">
          <h2 className="text-xl font-black text-red-500">📲 Contatta PT</h2>

          <a
            href="https://wa.me/393275396296"
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-4 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 font-bold"
          >
            👤 Simone Totaro — WhatsApp
          </a>

          <a
            href="https://wa.me/393286693919"
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-3 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 font-bold"
          >
            👤 Daniele Totaro — WhatsApp
          </a>
        </section>

        <button
          onClick={logout}
          className="w-full bg-red-600/20 border border-red-600 text-red-400 rounded-2xl p-4 font-black"
        >
          Logout
        </button>

      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-60px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </main>
  )
}