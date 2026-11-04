"use client"

import { ChangeEvent, useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "../../../lib/supabase"
export default function ClienteDettaglioPage() {
  const { id } = useParams()
  const [cliente, setCliente] = useState<any>(null)
  const [saving, setSaving]=useState(false)
  const [tipoRinnovo, setTipoRinnovo] = useState("mensile")
const [metodoPagamento, setMetodoPagamento] = useState("contanti")
const [rinnovoInCorso, setRinnovoInCorso] = useState(false)
  const schedaInputRef=
  useRef<HTMLInputElement>(null)
  const [titoloScheda,setTitoloScheda] = useState("")

  useEffect(() => {
    caricaCliente()
  }, [])

  async function rinnovaAbbonamento() {
  const { data, error } = await supabase.auth.getSession()

  if (error || !data.session?.access_token) {
    alert("Sessione scaduta. Effettua nuovamente l'accesso.")
    return
  }

  alert("Sessione amministratore disponibile. Collegamento pronto!")
}
async function caricaScheda(e: any) {
  const file = e.target.files?.[0]

  if (!file) return

  if (!titoloScheda) {
    alert("Inserisci un titolo per la scheda.")
    return
  }

  if (file.type !== "application/pdf") {
    alert("Puoi caricare solo file PDF.")
    return
  }

  const filePath = `${cliente.id}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage
    .from("schede")
    .upload(filePath, file)

  if (uploadError) {
    alert(uploadError.message)
    return
  }

  const { data } = supabase.storage
    .from("schede")
    .getPublicUrl(filePath)

  const { error } = await supabase.from("schede").insert([
    {
      cliente_id: cliente.id,
      titolo: titoloScheda,
      file_url: data.publicUrl,
    },
  ])

  if (error) {
    alert(error.message)
    return
  }

   alert("Scheda caricata correttamente!")
  setTitoloScheda("")
}

async function salvaAbbonamento() {
  setSaving(true)

  const { error } = await supabase
    .from("profiles")
    .update({

      

      quota_associativa_attiva: cliente.quota_associativa_attiva,
      quota_associativa_pagamento: cliente.quota_associativa_pagamento,
      quota_associativa_scadenza: cliente.quota_associativa_scadenza,

      pt_assegnato: cliente.pt_assegnato,
      note_staff: cliente.note_staff,

    })
    .eq("id", id)

  setSaving(false)

  if (error) {
    alert(error.message)
    return
  }

  alert("Cliente aggiornato!")
}

  async function caricaCliente() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      alert(error.message)
      return
    }

    setCliente(data)
  }

  if (!cliente) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        Caricamento cliente...
      </main>
    )
  }

   return (
    <main className="min-h-screen bg-[#050505] text-white p-8">
          <a
        href="/admin/clienti"
        className="inline-block mb-8 px-5 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white font-bold hover:bg-red-600 transition"
      >
        ← Torna all'elenco clienti
      </a>

      <h1 className="text-5xl font-black text-red-500 mt-6 mb-2">
        {cliente.nome} {cliente.cognome}
      </h1>

      <p className="text-zinc-400 mb-8">
        Scheda completa cliente
      </p>

      <section className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
        <h2 className="text-2xl font-black text-red-500 mb-5">
          👤 Dati personali
        </h2>
        </section>

      <section className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 mt-6">

  <h2 className="text-2xl font-black text-red-500 mb-5">
    💳 Gestione abbonamento
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

       <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4">
      <p className="text-xs text-zinc-400 mb-1">
        Abbonamento attuale
      </p>
      <p className="font-bold text-white">
        {cliente.abbonamento || "Nessun abbonamento"}
      </p>
    </div>

    <input
      type="text"
      placeholder="PT assegnato"
      value={cliente.pt_assegnato || ""}
      onChange={(e) =>
        setCliente({
          ...cliente,
          pt_assegnato: e.target.value,
        })
      }
      className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4"
    />

       <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4">
      <p className="text-xs text-zinc-400 mb-1">
        Ultimo pagamento abbonamento
      </p>
      <p className="font-bold text-white">
        {cliente.abbonamento_pagamento
          ? new Date(
              `${cliente.abbonamento_pagamento}T12:00:00`
            ).toLocaleDateString("it-IT")
          : "Nessun pagamento registrato"}
      </p>
    </div>

     <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4">
      <p className="text-xs text-zinc-400 mb-1">
        Scadenza abbonamento
      </p>
      <p className="font-bold text-white">
        {cliente.abbonamento_scadenza
          ? new Date(
              `${cliente.abbonamento_scadenza}T12:00:00`
            ).toLocaleDateString("it-IT")
          : "Nessuna scadenza registrata"}
      </p>
    </div>

  </div>

  <textarea
    placeholder="Note staff"
    value={cliente.note_staff || ""}
    onChange={(e) =>
      setCliente({
        ...cliente,
        note_staff: e.target.value,
      })
    }
    className="w-full mt-5 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 min-h-[120px]"
  />
<section className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 mt-6">

  <h2 className="text-2xl font-black text-red-500 mb-5">
    📄 Schede allenamento
  </h2>

  <input
    value={titoloScheda}
    onChange={(e)=>setTitoloScheda(e.target.value)}
    placeholder="Titolo scheda"
    className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4 mb-4"
  />

  <input
    ref={schedaInputRef}
    type="file"
    accept=".pdf"
    onChange={caricaScheda}
    className="hidden"
  />

  <button
    onClick={()=>schedaInputRef.current?.click()}
    className="w-full bg-red-600 rounded-2xl p-4 font-black"
  >
    Carica scheda PDF
  </button>

</section>

<section className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 mt-6">
  <h2 className="text-2xl font-black text-red-500 mb-5">
    💳 Rinnovo abbonamento
  </h2>

  <div className="grid gap-4">
    <label className="font-bold">Tipo di abbonamento</label>
    <select
      value={tipoRinnovo}
      onChange={(e) => setTipoRinnovo(e.target.value)}
      className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4"
    >
      <option value="mensile">Mensile — 40 €</option>
      <option value="trimestrale">Trimestrale — 110 €</option>
      <option value="semestrale">Semestrale — 200 €</option>
      <option value="annuale">Annuale — 360 €</option>
    </select>

    <label className="font-bold">Metodo di pagamento</label>
    <select
      value={metodoPagamento}
      onChange={(e) => setMetodoPagamento(e.target.value)}
      className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4"
    >
      <option value="contanti">Contanti</option>
      <option value="pos">POS</option>
      <option value="bonifico">Bonifico</option>
    </select>

    <p className="text-sm text-zinc-400">
      Il pagamento sarà registrato nello storico del cliente.
      La scadenza verrà aggiornata automaticamente.
    </p>

    <button
  type="button"
  onClick={rinnovaAbbonamento}
  disabled={rinnovoInCorso}
      className="w-full bg-zinc-700 rounded-2xl p-4 font-black opacity-60 cursor-not-allowed"
    >
      REGISTRA PAGAMENTO E RINNOVA
    </button>
  </div>
</section>

  <button
    onClick={salvaAbbonamento}
    disabled={saving}
    className="w-full mt-6 bg-red-600 hover:bg-red-700 rounded-2xl p-4 font-black"
  >
    {saving ? "Salvataggio..." : "SALVA MODIFICHE"}
  </button>

</section>
    </main>
  )
}