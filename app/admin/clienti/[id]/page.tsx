"use client"

import { ChangeEvent, useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "../../../lib/supabase"
export default function ClienteDettaglioPage() {
  const { id } = useParams()
  const [cliente, setCliente] = useState<any>(null)
  const [saving, setSaving]=useState(false)
  const schedaInputRef=
  useRef<HTMLInputElement>(null)
  const [titoloScheda,setTitoloScheda] = useState("")

  useEffect(() => {
    caricaCliente()
  }, [])

  async function salvaAbbonamento() {
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

  setSaving(true)

  const { error } = await supabase
    .from("profiles")
    .update({

      abbonamento: cliente.abbonamento,
      abbonamento_pagamento: cliente.abbonamento_pagamento,
      abbonamento_scadenza: cliente.abbonamento_scadenza,

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

  function caricaScheda(event: ChangeEvent<HTMLInputElement, HTMLInputElement>): void {
    throw new Error("Function not implemented.")
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white p-8">
      <a href="/admin/clienti" className="text-zinc-400">
        ← Torna ai clienti
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

    <select
      value={cliente.abbonamento || ""}
      onChange={(e) =>
        setCliente({
          ...cliente,
          abbonamento: e.target.value,
        })
      }
      className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4"
    >
      <option value="">Seleziona abbonamento</option>
      <option>Mensile</option>
      <option>Trimestrale</option>
      <option>Semestrale</option>
      <option>Annuale</option>
      <option>Full Time</option>
      <option>PT</option>
      <option>Admin</option>
    </select>

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

    <input
      type="date"
      value={cliente.abbonamento_pagamento || ""}
      onChange={(e) =>
        setCliente({
          ...cliente,
          abbonamento_pagamento: e.target.value,
        })
      }
      className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4"
    />

    <input
      type="date"
      value={cliente.abbonamento_scadenza || ""}
      onChange={(e) =>
        setCliente({
          ...cliente,
          abbonamento_scadenza: e.target.value,
        })
      }
      className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4"
    />

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