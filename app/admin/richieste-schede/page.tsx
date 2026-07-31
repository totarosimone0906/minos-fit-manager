"use client"

import { useEffect, useRef, useState } from "react"
import { supabase } from "../../lib/supabase"

export default function RichiesteSchedePage() {
  const [richieste, setRichieste] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [richiestaSelezionata, setRichiestaSelezionata] = useState<any>(null)

  useEffect(() => {
    caricaRichieste()
  }, [])

 async function caricaRichieste() {
  const { data: richiesteData, error } = await supabase
    .from("richieste_schede")
    .select("*")
    .eq("stato", "pagata_in_attesa")
    .order("created_at", { ascending: false })

  if (error || !richiesteData) return

  const clienteIds = richiesteData.map((r) => r.cliente_id)

  const { data: profiliData } = await supabase
    .from("profiles")
    .select("id, nome, cognome, email")
    .in("id", clienteIds)

  const richiesteConCliente = richiesteData.map((richiesta) => {
    const profilo = profiliData?.find((p) => p.id === richiesta.cliente_id)

    return {
      ...richiesta,
      cliente: profilo,
    }
  })

  setRichieste(richiesteConCliente)
}
  
  async function caricaSchedaPDF(e: any) {
  const file = e.target.files?.[0]
  if (!file || !richiestaSelezionata) return

  if (file.type !== "application/pdf") {
    alert("Puoi caricare solo file PDF.")
    return
  }

  const filePath = `${richiestaSelezionata.cliente_id}/${Date.now()}-${file.name}`

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

  const { error: updateProfileError } = await supabase
    .from("profiles")
    .update({
      schede_file_url: data.publicUrl,
    })
    .eq("id", richiestaSelezionata.cliente_id)

  if (updateProfileError) {
    alert(updateProfileError.message)
    return
  }

  const { error: updateRichiestaError } = await supabase
    .from("richieste_schede")
    .update({
      stato: "completata",
    })
    .eq("id", richiestaSelezionata.id)

  if (updateRichiestaError) {
    alert(updateRichiestaError.message)
    return
  }

  alert("Scheda caricata correttamente ✅")
  setRichiestaSelezionata(null)
  caricaRichieste()
}

  return (
    <main className="min-h-screen bg-[#050505] text-white p-8">
      <h1 className="text-4xl font-black text-red-500 mb-6">
        Richieste Schede
      </h1>
      <input
  ref={fileInputRef}
  type="file"
  accept=".pdf"
  onChange={caricaSchedaPDF}
  className="hidden"
/>

      {richieste.length === 0 ? (
        <p>Nessuna richiesta presente.</p>
      ) : (
        richieste.map((richiesta) => (
          <div
            key={richiesta.id}
            className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 mb-4"
          >
            <button
  type="button"
  onClick={() => {
    setRichiestaSelezionata(richiesta)
    fileInputRef.current?.click()
  }}
  className="mt-4 bg-red-600 rounded-2xl px-5 py-3 font-black text-white"
>
  Carica Scheda PDF
</button>
            <p>ID richiesta: {richiesta.id}</p>
 <p>
  Cliente: {richiesta.cliente?.nome} {richiesta.cliente?.cognome}
</p>
<p>Email: {richiesta.cliente?.email}</p>
<p>Stato: {richiesta.stato}</p>
          </div>
          
        ))
      )}
    </main>
  )
}
