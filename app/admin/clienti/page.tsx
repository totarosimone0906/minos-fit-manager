"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

export default function AdminClientiPage() {
  const [clienti, setClienti] = useState<any[]>([])
  const [ricerca, setRicerca] = useState("")

const clientiFiltrati = clienti.filter((cliente) => {
  const nome = String(cliente.nome || "").toLowerCase()
  const cognome = String(cliente.cognome || "").toLowerCase()
  const testo = ricerca.toLowerCase().trim()

  return `${nome} ${cognome}`.includes(testo) ||
         `${cognome} ${nome}`.includes(testo)
})
  const [adminVerificato, setAdminVerificato] = useState(false)

 useEffect(() => {
  async function verificaAdmin() {
    const { data: authData } = await supabase.auth.getUser()

    if (!authData.user) {
      window.location.replace("/login/accesso")
      return
    }

    const { data: profilo, error } = await supabase
      .from("profiles")
      .select("ruolo, stato_account")
      .eq("id", authData.user.id)
      .single()

    if (
      error ||
      profilo?.ruolo !== "admin" ||
      profilo?.stato_account !== "attivo"
    ) {
      window.location.replace("/area-cliente")
      return
    }

    await caricaClienti()
setAdminVerificato(true)
  }

  verificaAdmin()
}, [])

 async function caricaClienti() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .neq("ruolo", "admin")
    .order("cognome", { ascending: true })

  if (error) {
    alert(error.message)
    return
  }

  setClienti(data || [])
}
if (!adminVerificato) {
  return null
}
  return (
    <main className="min-h-screen bg-[#050505] text-white p-8">
      <a
        href="/admin"
        className="inline-block mb-8 px-5 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white font-bold hover:bg-red-600 transition"
      >
        ← Torna al pannello Admin
      </a>

      <h1 className="text-5xl font-black text-red-500 mb-2">
        Clienti
      </h1>

          <p className="text-zinc-400 mb-8">
        Lista clienti registrati su MINOS FIT.
      </p>

      <div className="mt-6 mb-5">
        <input
          type="search"
          placeholder="Cerca cliente per nome e cognome..."
          value={ricerca}
          onChange={(e) => setRicerca(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4 text-white outline-none focus:border-red-500"
        />

        <p className="text-sm text-zinc-400 mt-2">
          {clientiFiltrati.length} clienti trovati
        </p>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 overflow-x-auto">
        <div className="grid grid-cols-6 text-zinc-500 text-sm border-b border-zinc-800 pb-4 min-w-[900px]">
          <p>Nome</p>
          <p>Email</p>
          <p>Telefono</p>
          <p>Abbonamento</p>
          <p>Certificato</p>
          <p>Stato</p>
        </div>

        {clientiFiltrati.map((c) => (
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