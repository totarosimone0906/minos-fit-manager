
"use client"

import Link from "next/link"
import { useEffect, useState, useRef, useCallback } from "react"
import { supabase } from "../lib/supabase"

const URL_LOCALE = "http://127.0.0.1:3030"

type PermessoLocale = {
  autorizzazione: string
  scadenza: number
  token: string
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const [occupato, setOccupato] = useState(false)
  const [messaggio, setMessaggio] = useState("")
  const [errore, setErrore] = useState(false)
  const [servizioLocale, setServizioLocale] = useState(false)

  const bloccoComando = useRef(false)
  const permessoLocale = useRef<PermessoLocale | null>(null)

  const ottieniAutorizzazione = useCallback(async () => {

    const { data, error } = await supabase.auth.getSession()

    if (error || !data.session) {
      permessoLocale.current = null
      throw new Error("Sessione non valida. Accedi nuovamente.")
    }

    const token = data.session.access_token
    const adesso = Math.floor(Date.now() / 1000)
    const permesso = permessoLocale.current

    if (
      permesso &&
      permesso.token === token &&
      permesso.scadenza > adesso + 30
    ) {
      return permesso
    }

    const risposta = await fetch(
      "/api/admin/autorizzazione-tornello",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }
    )

    const risultato = await risposta.json()

    if (
      !risposta.ok ||
      risultato.success !== true ||
      typeof risultato.autorizzazione !== "string" ||
      !Number.isInteger(risultato.scadenza) ||
      risultato.scadenza <= adesso
    ) {
      permessoLocale.current = null

      throw new Error(
        risultato.error || "Autorizzazione non disponibile"
      )
    }

    const nuovoPermesso: PermessoLocale = {
      autorizzazione: risultato.autorizzazione,
      scadenza: risultato.scadenza,
      token,
    }

    permessoLocale.current = nuovoPermesso

    return nuovoPermesso

  }, [])

  useEffect(() => {

    let attivo = true

    async function controllaServizio() {
      try {

        const risposta = await fetch(
          `${URL_LOCALE}/stato`,
          {
            cache: "no-store",
            signal: AbortSignal.timeout(2000),
          }
        )

        const dati = await risposta.json()

        if (attivo) {
          setServizioLocale(
            risposta.ok &&
            dati.servizio === "Minos Fit Tornello" &&
            dati.stato === "attivo"
          )
        }

      } catch {

        if (attivo) {
          setServizioLocale(false)
        }

      }
    }

    controllaServizio()

    const intervallo = window.setInterval(
      controllaServizio,
      5000
    )

    return () => {
      attivo = false
      window.clearInterval(intervallo)
    }

  }, [])

  useEffect(() => {

    if (!servizioLocale) return

    async function aggiornaPermesso() {
      try {
        await ottieniAutorizzazione()
      } catch {
        // Il prossimo comando verifichera nuovamente
        // la disponibilita dell'autorizzazione.
      }
    }

    aggiornaPermesso()

    const intervallo = window.setInterval(
      aggiornaPermesso,
      30000
    )

    return () => {
      window.clearInterval(intervallo)
    }

  }, [servizioLocale, ottieniAutorizzazione])

  useEffect(() => {

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((evento) => {

        if (
          evento === "SIGNED_OUT" ||
          evento === "TOKEN_REFRESHED" ||
          evento === "SIGNED_IN" ||
          evento === "USER_UPDATED"
        ) {
          permessoLocale.current = null
        }

      })

    return () => {
      subscription.unsubscribe()
    }

  }, [])

  const comandoTornello = useCallback(async (
    direzione: "entrata" | "uscita"
  ) => {

    if (bloccoComando.current) return

    bloccoComando.current = true

    setOccupato(true)
    setErrore(false)
    setMessaggio("Invio comando locale...")

    const inizio = performance.now()

    let richiestaInviata = false

    try {

      const permesso = await ottieniAutorizzazione()

      richiestaInviata = true

      const risposta = await fetch(
        `${URL_LOCALE}/comando-locale`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${permesso.token}`,
          },
          body: JSON.stringify({
            direzione,
            autorizzazione: permesso.autorizzazione,
          }),
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
        }
      )

      const dati = await risposta.json()

      if (risposta.status === 403) {

        permessoLocale.current = null
        richiestaInviata = false

        throw new Error(
          "Autorizzazione non valida. Riprova."
        )

      }

      if (risposta.status === 429) {

        richiestaInviata = false

        throw new Error(
          "Tornello occupato. Attendi qualche secondo."
        )

      }

      if (!risposta.ok || dati.success !== true) {

        throw new Error(
          dati.error ||
          `Richiesta non confermata (HTTP ${risposta.status})`
        )

      }

      const tempo = Math.round(
        performance.now() - inizio
      )

      setServizioLocale(true)

      if (dati.stato === "simulato") {

        setMessaggio(
          `SIMULAZIONE ${direzione.toUpperCase()} - ${tempo} ms`
        )

      } else if (dati.stato === "impulso_accettato") {

        setMessaggio(
          `IMPULSO ${direzione.toUpperCase()} ACCETTATO - ${tempo} ms`
        )

      } else {

        throw new Error("Esito del comando sconosciuto")

      }

    } catch (error) {

      setErrore(true)

      const dettaglio = error instanceof Error
        ? error.message
        : "Errore di comunicazione"

      setMessaggio(
        richiestaInviata
          ? `Esito non verificato. Controlla il tornello. ${dettaglio}`
          : dettaglio
      )

    } finally {

      bloccoComando.current = false
      setOccupato(false)

    }

  }, [ottieniAutorizzazione])

  useEffect(() => {

    function gestisciTastiera(evento: KeyboardEvent) {

      if (evento.repeat) return

      const elemento = evento.target as HTMLElement | null

      if (
        elemento?.isContentEditable ||
        elemento?.closest(
          "input, textarea, select, [contenteditable]"
        )
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

    window.addEventListener(
      "keydown",
      gestisciTastiera
    )

    return () => {
      window.removeEventListener(
        "keydown",
        gestisciTastiera
      )
    }

  }, [comandoTornello])

  return (
    <>
      <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-700 bg-zinc-950 px-6 py-3 text-white shadow-xl">

        <div className="flex flex-col gap-1">

          <Link
            href="/admin"
            className="font-black text-red-500 hover:text-red-400"
          >
            MINOS FIT ADMIN
          </Link>

          <div className="flex items-center gap-2 text-xs">

            <span
              className={`h-2 w-2 rounded-full ${
                servizioLocale
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            />

            <span
              className={
                servizioLocale
                  ? "text-green-400"
                  : "text-red-400"
              }
            >
              {servizioLocale
                ? "TORNELLO LOCALE ONLINE"
                : "TORNELLO LOCALE OFFLINE"}
            </span>

          </div>

        </div>

        <span
          role="status"
          className={`text-sm font-bold ${
            errore
              ? "text-red-500"
              : "text-zinc-300"
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
            APRI ENTRATA
            <span className="block text-xs font-normal">
              ALT + 1
            </span>
          </button>

          <button
            type="button"
            disabled={occupato}
            onClick={() => comandoTornello("uscita")}
            className="rounded-xl bg-red-600 px-5 py-3 font-black hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            APRI USCITA
            <span className="block text-xs font-normal">
              ALT + 2
            </span>
          </button>

        </div>

      </div>

      <div>
        {children}
      </div>
    </>
  )
}
