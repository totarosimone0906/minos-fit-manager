"use client"

import Link from "next/link"
import { useEffect, useState, useRef, useCallback } from "react"
import { supabase } from "../lib/supabase"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const [occupato, setOccupato] = useState(false)
  const [messaggio, setMessaggio] = useState("")
  const [errore, setErrore] = useState(false)
  const bloccoComando = useRef(false)

  const comandoTornello = useCallback(async (
    direzione: "entrata" | "uscita"
  ) => {

    if (bloccoComando.current) return

    bloccoComando.current = true
    setOccupato(true)
    setErrore(false)
    setMessaggio("Invio comando in corso...")

    try {

      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session) {
        throw new Error("Sessione non valida. Effettua nuovamente l'accesso.")
      }

      const risposta = await fetch("/api/admin/comando-tornello", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({ direzione }),
        signal: AbortSignal.timeout(10000),
      })

      if (!risposta.ok) {
        throw new Error(`Richiesta non confermata (HTTP ${risposta.status})`)
      }

      setMessaggio(
        `Comando ${direzione.toUpperCase()} registrato`
      )

    } catch (error) {

      setErrore(true)
      setMessaggio(
        error instanceof Error
          ? error.message
          : "Errore di comunicazione"
      )

    } finally {

      bloccoComando.current = false
      setOccupato(false)

    }

  }, [])

  useEffect(() => {

    function gestisciTastiera(evento: KeyboardEvent) {

      if (evento.repeat) return

      const elemento = evento.target as HTMLElement | null

      if (
        elemento?.isContentEditable ||
        elemento?.closest("input, textarea, select, [contenteditable]")
      ) {
        return
      }

      if (
        evento.altKey &&
        !evento.ctrlKey &&
        !evento.metaKey &&
        !evento.shiftKey
      ) {

        if (evento.code === "Digit1") {
          evento.preventDefault()
          comandoTornello("entrata")
        }

        if (evento.code === "Digit2") {
          evento.preventDefault()
          comandoTornello("uscita")
        }

      }

    }

    window.addEventListener("keydown", gestisciTastiera)

    return () => {
      window.removeEventListener("keydown", gestisciTastiera)
    }

  }, [comandoTornello])

  return (
    <>
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-700 bg-zinc-950 px-6 py-3 text-white shadow-xl">

        <Link
          href="/admin"
          className="font-black text-red-500 hover:text-red-400"
        >
          MINOS FIT ADMIN
        </Link>

        <span
          role="status"
          className={`text-sm font-bold ${
            errore ? "text-red-500" : "text-zinc-300"
          }`}
        >
          {messaggio}
        </span>

        <div className="flex gap-3">

          <button
            type="button"
            disabled={occupato}
            onClick={() => comandoTornello("entrata")}
            className="rounded-xl bg-green-600 px-5 py-3 font-black hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🟢 APRI ENTRATA
          </button>

          <button
            type="button"
            disabled={occupato}
            onClick={() => comandoTornello("uscita")}
            className="rounded-xl bg-red-600 px-5 py-3 font-black hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🔴 APRI USCITA
          </button>

        </div>

      </div>

      <div>
        {children}
      </div>
    </>
  )
}