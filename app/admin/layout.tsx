"use client"

import Link from "next/link"
import { useEffect } from "react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {

 function comandoTornello(direzione: "entrata" | "uscita") {
  console.log(`Comando tornello richiesto: ${direzione}`)
}

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
}, [])

return (
    <>
     <div className="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-700 bg-zinc-950 px-6 py-3 text-white shadow-xl">

        <Link
          href="/admin"
          className="font-black text-red-500 hover:text-red-400"
        >
          MINOS FIT ADMIN
        </Link>

        <div className="flex gap-3">
         <button
  type="button"
  onClick={() => comandoTornello("entrata")}
  className="rounded-xl bg-green-600 px-5 py-3 font-black hover:bg-green-500"
>
  🟢 APRI ENTRATA
</button>

<button
  type="button"
  onClick={() => comandoTornello("uscita")}
  className="rounded-xl bg-red-600 px-5 py-3 font-black hover:bg-red-500"
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