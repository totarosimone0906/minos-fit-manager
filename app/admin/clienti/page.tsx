"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

export default function AdminClientiPage() {
  const [clienti, setClienti] = useState<any[]>([])

  useEffect(() => {
    caricaClienti()
  }, [])

  async function caricaClienti() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      alert(error.message)
      return
    }

    setClienti(data || [])
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white p-8">
      <h1 className="text-5xl font-black text-red-500 mb-2">
        Clienti
      </h1>

      <p className="text-zinc-400 mb-8">
        Lista clienti registrati su MINOS FIT.
      </p>

      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 overflow-x-auto">
        <div className="grid grid-cols-6 text-zinc-500 text-sm border-b border-zinc-800 pb-4 min-w-[900px]">
          <p>Nome</p>
          <p>Email</p>
          <p>Telefono</p>
          <p>Abbonamento</p>
          <p>Certificato</p>
          <p>Stato</p>
        </div>

        {clienti.map((c) => (
          <a
            href={`/admin/clienti/${c.id}`}
            key={c.id}
            className="grid grid-cols-6 py-4 border-b border-zinc-900 items-center min-w-[900px] hover:bg-zinc-900 cursor-pointer transition rounded-xl"
          >
           <p className="font-bold">
  {c.nome} {c.cognome}
</p>

<p className="text-red-500 text-xs">
  {c.id}
</p>

            <p className="text-zinc-400">
              {c.prefisso} {c.telefono}
            </p>

            <p className="text-zinc-400">
              {c.abbonamento || "Da impostare"}
            </p>

            <p className="text-zinc-400">
              {c.certificato_scadenza || "Non impostato"}
            </p>

            <p
              className={
                c.stato_account === "da_approvare"
                  ? "text-yellow-400 font-bold"
                  : "text-green-400 font-bold"
              }
            >
              {c.stato_account || "attivo"}
            </p>
          </a>
        ))}
      </div>
    </main>
  )
}