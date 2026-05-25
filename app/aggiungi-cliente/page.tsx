"use client"

import { supabase } from "../lib/supabase"
export default function AggiungiClientePage() {
    async function salvaCliente() {
  const { error } = await supabase
    .from("profiles")
    .insert([
      {
        nome: "Mario Rossi",
        email: "mario@email.com",
        password: "123456",
        ruolo: "Cliente",
        abbonamento: "Full Time",
      },
    ])

  if (error) {
  console.log(error)
  alert(error.message)
  return
}

  alert("Cliente salvato!")
}
  return (
    <main className="min-h-screen bg-[#050505] text-white p-10">

      <h1 className="text-6xl font-black mb-3">
        Aggiungi Cliente
      </h1>

      <p className="text-zinc-400 mb-10">
        Crea un nuovo cliente MINOS FIT
      </p>

      <div className="max-w-3xl bg-zinc-950 border border-zinc-800 rounded-3xl p-8">

        <div className="grid grid-cols-2 gap-6">

          <div>
            <label className="block mb-2 text-zinc-400">
              Nome e Cognome
            </label>

            <input
              type="text"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4"
              placeholder="Mario Rossi"
            />
          </div>

          <div>
            <label className="block mb-2 text-zinc-400">
              Telefono
            </label>

            <input
              type="text"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4"
              placeholder="3331234567"
            />
          </div>

          <div>
            <label className="block mb-2 text-zinc-400">
              Email
            </label>

            <input
              type="email"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4"
              placeholder="cliente@email.com"
            />
          </div>

          <div>
            <label className="block mb-2 text-zinc-400">
              Abbonamento
            </label>

            <input
              type="text"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4"
              placeholder="Full Time"
            />
          </div>

          <div>
            <label className="block mb-2 text-zinc-400">
              Scadenza Abbonamento
            </label>

            <input
              type="date"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4"
            />
          </div>

          <div>
            <label className="block mb-2 text-zinc-400">
              Certificato Medico
            </label>

            <input
              type="date"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4"
            />
          </div>

        </div>

        <button
  onClick={salvaCliente}
  className="mt-8 bg-green-500 text-black px-8 py-4 rounded-2xl font-black shadow-[0_0_25px_rgba(34,197,94,0.45)]"
>
  Salva Cliente
</button>

      </div>

    </main>
  )
}