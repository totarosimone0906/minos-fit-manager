"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

export default function ConfermaAccountPage() {
  const [messaggio, setMessaggio] = useState(
    "Stiamo verificando il tuo account..."
  )

  useEffect(() => {
    async function confermaAccount() {
      try {
        const params = new URLSearchParams(window.location.search)
        const code = params.get("code")

        // Se Supabase ci restituisce un code,
        // lo scambiamo con una sessione autenticata.
        if (code) {
          const { error } =
            await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            console.error("Errore conferma email:", error)
            setMessaggio(
              "Non è stato possibile confermare l'email. Il link potrebbe essere scaduto o già utilizzato."
            )
            return
          }
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError || !session?.user) {
          console.error(
            "Sessione non disponibile:",
            sessionError
          )

          setMessaggio(
            "Non è stato possibile completare la verifica dell'account."
          )
          return
        }

        setMessaggio(
          "Email verificata! Stiamo aprendo il tuo account..."
        )

        const email = session.user.email?.toLowerCase()

        if (!email) {
          setMessaggio(
            "Email verificata, ma non è stato possibile recuperare il profilo."
          )
          return
        }

        const { data: profilo, error: profiloError } =
          await supabase
            .from("profiles")
            .select("*")
            .eq("email", email)
            .single()

        if (profiloError || !profilo) {
          console.error(
            "Errore recupero profilo:",
            profiloError
          )

          setMessaggio(
            "Email verificata, ma il profilo Minos Fit non è ancora disponibile."
          )
          return
        }

        if (profilo.stato_account === "da_approvare") {
          setMessaggio(
            "Email verificata. Il tuo account è in attesa di approvazione da parte dello staff."
          )
          return
        }

        localStorage.setItem(
          "utente",
          JSON.stringify(profilo)
        )

        localStorage.setItem(
          "cliente",
          JSON.stringify(profilo)
        )

        window.location.replace("/area-cliente")
      } catch (errore) {
        console.error(
          "Errore durante la conferma:",
          errore
        )

        setMessaggio(
          "Si è verificato un problema durante la verifica dell'account."
        )
      }
    }

    void confermaAccount()
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-md rounded-[28px] border border-red-600/70 bg-zinc-950 p-8 text-center">
        <div className="mb-5 text-5xl">✓</div>

        <h1 className="mb-4 text-2xl font-black text-red-500">
          MINOS FIT
        </h1>

        <p className="leading-relaxed text-zinc-300">
          {messaggio}
        </p>
      </div>
    </main>
  )
}