"use client"

import { useState } from "react"
import { supabase } from "../../lib/supabase"

export default function AccessoPage() {
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

    if (data.ruolo === "admin") {
      window.location.href = "/admin/clienti"
    } else {
      window.location.href = "/area-cliente"
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 bg-black">

      <div
        className="absolute inset-0 bg-contain bg-top bg-no-repeat bg-black"
        style={{ backgroundImage: "url('/login-bg.png')" }}
      />

      <div className="absolute inset-0 bg-black/10" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[12%] left-[18%] w-[220px] h-[220px] bg-white/12 blur-[120px] rounded-full" />
        <div className="absolute top-[28%] right-[14%] w-[180px] h-[180px] bg-red-500/12 blur-[100px] rounded-full" />
        <div className="absolute bottom-[18%] left-[35%] w-[260px] h-[120px] bg-white/10 blur-[110px] rotate-[15deg]" />
      </div>

      <div className="relative z-10 w-full max-w-xl mt-[370px]">
        <div className="bg-black/75 backdrop-blur-md border border-red-600 rounded-[35px] p-8 shadow-[0_0_45px_rgba(255,0,0,0.45)]">

          <div className="flex items-center gap-4 justify-center mb-8">
            <div className="h-[2px] flex-1 bg-red-600" />
            <h2 className="text-red-500 text-4xl font-black tracking-[10px]">
              ACCEDI
            </h2>
            <div className="h-[2px] flex-1 bg-red-600" />
          </div>

          <label className="text-white text-xl mb-3 block">
            Email
          </label>

          <div className="relative mb-8">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-red-500 text-2xl">
              👤
            </span>

            <input
              type="email"
              placeholder="Inserisci email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl pl-16 p-5 text-white text-xl focus:outline-none focus:border-red-500"
            />
          </div>

          <label className="text-white text-xl mb-3 block">
            Password
          </label>

          <div className="relative mb-8">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-red-500 text-2xl">
              🔒
            </span>

            <input
              type={mostraPassword ? "text" : "password"}
              placeholder="Inserisci password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl pl-16 pr-16 p-5 text-white text-xl focus:outline-none focus:border-red-500"
            />

            <button
              type="button"
              onClick={() => setMostraPassword(!mostraPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-white text-2xl"
            >
              👁️
            </button>
          </div>

          <button
            type="button"
            onClick={accedi}
            className="w-full bg-red-600 hover:bg-red-500 transition-all duration-300 rounded-2xl p-5 text-white font-black text-3xl shadow-[0_0_35px_rgba(255,0,0,0.6)]"
          >
            ACCEDI
          </button>

          <div className="mt-10 text-center">
            <p className="text-zinc-400 text-lg">
              Non hai un account?{" "}
              <a
                href="/richiedi-iscrizione"
                className="text-red-500 font-bold"
              >
                Registrati
              </a>
            </p>
          </div>

        </div>
      </div>
    </main>
  )
}