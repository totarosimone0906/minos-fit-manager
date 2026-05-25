"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"

export default function AccessoPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mostraPassword, setMostraPassword] = useState(false)
async function accedi() {
  const emailPulita = email.trim().toLowerCase()
  const passwordPulita = password.trim()

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", emailPulita)
    .eq("password", passwordPulita)
    .single()

  if (error || !data) {
    alert("Email o password errati")
    return
  }

  if (data.stato_account === "da_approvare") {
    alert("Account in attesa di approvazione")
    return
  }

  localStorage.setItem("utente", JSON.stringify(data))
  localStorage.setItem("cliente", JSON.stringify(data))

  alert(`Login OK: ${data.nome} - ruolo: ${data.ruolo}`)

  setTimeout(() => {
    if (data.ruolo === "admin") {
      window.location.href = `${window.location.origin}/admin/clienti`
    } else {
      window.location.href = `${window.location.origin}/area-cliente`
    }
  }, 300)
}


  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
        <h1 className="text-5xl font-black text-green-400 mb-2">
          Accedi
        </h1>

        <p className="text-zinc-400 mb-8">
          Inserisci email e password.
        </p>

        <div className="space-y-5">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4"
          />

          <input
            type={mostraPassword ? "text" : "password"}
            
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4"

            
          />
          <button
  type="button"
  onClick={() => setMostraPassword(!mostraPassword)}
  className="text-zinc-400 text-sm"
>
  {mostraPassword ? "Nascondi password" : "Mostra password"}
</button>

          <button
  type="button"
  onClick={() => {
    alert("CLICK LOGIN")
    accedi()
  }}
  className="w-full bg-green-500 text-black rounded-2xl p-4 font-black"
>
  Accedi
</button>
        </div>
      </div>
    </main>
  )
}