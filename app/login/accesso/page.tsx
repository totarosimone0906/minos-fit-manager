"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react"
import { supabase } from "../../lib/supabase"

type Schermata = "video" | "scelta" | "login"

export default function AccessoPage() {
  const videoRef = useRef<HTMLVideoElement>(null)

  const [schermata, setSchermata] = useState<Schermata>("video")
  const [videoPronto, setVideoPronto] = useState(false)
  const [erroreVideo, setErroreVideo] = useState(false)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mostraPassword, setMostraPassword] = useState(false)
  const [accessoInCorso, setAccessoInCorso] = useState(false)

 useEffect(() => {
  const elementoVideo = videoRef.current

  if (!elementoVideo) {
    return
  }

  elementoVideo.currentTime = 0

  elementoVideo.play().catch((errore) => {
    console.error(
      "Il browser non riesce ad avviare il video:",
      errore,
    )
  })
}, [])

  function videoTerminato() {
    setTimeout(() => {
      setSchermata("scelta")
    }, 250)
  }

  function erroreRiproduzione() {
    setErroreVideo(true)
    setVideoPronto(true)
    setSchermata("scelta")
  }

  async function accedi() {
    const emailPulita = email.trim().toLowerCase()
    const passwordPulita = password.trim()

    if (!emailPulita || !passwordPulita) {
      alert("Inserisci email e password")
      return
    }

    setAccessoInCorso(true)

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", emailPulita)
      .eq("password", passwordPulita)
      .single()

    if (error || !data) {
      alert("Email o password errati")
      setAccessoInCorso(false)
      return
    }

    if (data.stato_account === "da_approvare") {
      alert("Account in attesa di approvazione")
      setAccessoInCorso(false)
      return
    }

    localStorage.setItem("utente", JSON.stringify(data))
    localStorage.setItem("cliente", JSON.stringify(data))

    if (data.ruolo === "admin") {
      window.location.href = "/admin/clienti"
      return
    }

    window.location.href = "/area-cliente"
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* VIDEO INTRO */}
      {!erroreVideo && (
       <video
  ref={videoRef}
  muted
  playsInline
  preload="auto"
  onLoadedMetadata={() => setVideoPronto(true)}
  onCanPlay={() => setVideoPronto(true)}
  onEnded={videoTerminato}
  onError={erroreRiproduzione}
  className="fixed inset-0 h-full w-full bg-black object-cover object-[42%_center] sm:object-center"
>
  <source src="/intro.mp4?v=4" type="video/mp4" />
</video>
      )}

      {/* FALLBACK NERO, SENZA IL VECCHIO SFONDO */}
      {erroreVideo && <div className="fixed inset-0 bg-black" />}

      {/* CARICAMENTO VIDEO */}
      {!videoPronto && !erroreVideo && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black">
          <p className="animate-pulse text-sm font-black uppercase tracking-[0.4em] text-zinc-500">
            MinosFit
          </p>
        </div>
      )}

      {/* OSCURAMENTO LEGGERO DOPO LA FINE DEL VIDEO */}
      <div
        className={`pointer-events-none fixed inset-0 z-[2] bg-black transition-all duration-1000 ${
          schermata === "video" ? "bg-black/0" : "bg-black/20"
        }`}
      />

      {/* SCELTA ACCEDI / REGISTRATI */}
<section
  className={`fixed inset-0 z-10 transition-all duration-1000 ${
    schermata === "scelta"
      ? "translate-y-0 opacity-100"
      : "pointer-events-none translate-y-12 opacity-0"
  }`}
>
  <div className="absolute inset-x-0 bottom-[70px] flex justify-center px-5 sm:bottom-[90px]">
    <div className="w-full max-w-[480px] rounded-[32px] border border-red-600/70 bg-black/75 px-6 py-5 shadow-[0_0_45px_rgba(220,38,38,0.45)] backdrop-blur-xl">
      <button
        type="button"
        onClick={() => setSchermata("login")}
        className="w-full rounded-2xl bg-red-600 px-5 py-4 text-xl font-black uppercase tracking-wide text-white shadow-[0_0_28px_rgba(220,38,38,0.5)] transition hover:bg-red-500"
      >
        Accedi
      </button>

      <Link
        href="/richiedi-iscrizione"
        className="mt-4 block w-full rounded-2xl border border-zinc-600 bg-black/50 px-5 py-4 text-center text-lg font-black uppercase tracking-wide text-white transition hover:border-red-500"
      >
        Registrati
      </Link>
    </div>
  </div>
</section>

   {/* MODULO LOGIN */}
<section
  className={`fixed inset-0 z-20 flex items-center justify-center overflow-y-auto px-4 py-8 transition-all duration-700 ${
    schermata === "login"
      ? "scale-100 opacity-100"
      : "pointer-events-none scale-[0.96] opacity-0"
  }`}
>
  {/* Oscuramento soltanto dietro al modulo */}
  <div className="pointer-events-none absolute inset-0 bg-black/35 backdrop-blur-[2px]" />

  <div className="relative z-10 w-full max-w-[520px] rounded-[32px] border border-red-600/80 bg-black/80 p-6 shadow-[0_0_45px_rgba(220,38,38,0.5)] backdrop-blur-xl sm:p-9">
    <button
      type="button"
      onClick={() => setSchermata("scelta")}
      className="mb-6 flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-zinc-400 transition hover:text-white"
    >
      <ArrowLeft size={20} />
      Indietro
    </button>

    <div className="mb-8 flex items-center gap-4">
      <div className="h-[2px] flex-1 bg-red-600" />

      <h2 className="text-3xl font-black tracking-[0.24em] text-red-500 sm:text-4xl">
        ACCEDI
      </h2>

      <div className="h-[2px] flex-1 bg-red-600" />
    </div>

    <label
      htmlFor="email"
      className="mb-3 block text-base font-bold text-zinc-200"
    >
      Email
    </label>

    <div className="relative mb-6">
      <Mail
        size={22}
        className="pointer-events-none absolute left-5 top-1/2 z-10 -translate-y-1/2 text-red-500"
      />

      <input
        id="email"
        type="email"
        value={email}
        placeholder="Inserisci email"
        autoComplete="email"
        onChange={(evento) => setEmail(evento.target.value)}
        className="minos-login-input w-full rounded-2xl border border-zinc-700 bg-zinc-950/95 py-4 pl-14 pr-5 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500 focus:shadow-[0_0_18px_rgba(220,38,38,0.25)] sm:py-5 sm:text-lg"
      />
    </div>

    <label
      htmlFor="password"
      className="mb-3 block text-base font-bold text-zinc-200"
    >
      Password
    </label>

    <div className="relative mb-8">
      <LockKeyhole
        size={22}
        className="pointer-events-none absolute left-5 top-1/2 z-10 -translate-y-1/2 text-red-500"
      />

      <input
        id="password"
        type={mostraPassword ? "text" : "password"}
        value={password}
        placeholder="Inserisci password"
        autoComplete="current-password"
        onChange={(evento) => setPassword(evento.target.value)}
        onKeyDown={(evento) => {
          if (evento.key === "Enter") {
            void accedi()
          }
        }}
        className="minos-login-input w-full rounded-2xl border border-zinc-700 bg-zinc-950/95 py-4 pl-14 pr-16 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500 focus:shadow-[0_0_18px_rgba(220,38,38,0.25)] sm:py-5 sm:text-lg"
      />

      <button
        type="button"
        onClick={() => setMostraPassword((valore) => !valore)}
        className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/5 hover:text-white"
        aria-label={
          mostraPassword ? "Nascondi password" : "Mostra password"
        }
      >
        {mostraPassword ? (
          <EyeOff size={22} />
        ) : (
          <Eye size={22} />
        )}
      </button>
    </div>

    <button
      type="button"
      onClick={() => void accedi()}
      disabled={accessoInCorso}
      className="w-full rounded-2xl bg-red-600 px-5 py-4 text-xl font-black text-white shadow-[0_0_30px_rgba(220,38,38,0.5)] transition hover:bg-red-500 disabled:cursor-wait disabled:opacity-60"
    >
      {accessoInCorso ? "ACCESSO IN CORSO..." : "ACCEDI"}
    </button>

    <p className="mt-7 text-center text-sm text-zinc-500">
      Non hai un account?{" "}
      <Link
        href="/richiedi-iscrizione"
        className="font-black text-red-500 hover:text-red-400"
      >
        Registrati
      </Link>
    </p>
  </div>
</section>

      <style jsx global>{`
        .minos-login-input:-webkit-autofill,
        .minos-login-input:-webkit-autofill:hover,
        .minos-login-input:-webkit-autofill:focus,
        .minos-login-input:-webkit-autofill:active {
          -webkit-text-fill-color: white !important;
          -webkit-box-shadow: 0 0 0 1000px #09090b inset !important;
          box-shadow: 0 0 0 1000px #09090b inset !important;
          caret-color: white !important;
        }
      `}</style>
    </main>
  )
}