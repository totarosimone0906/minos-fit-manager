"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [ok, setOk] = useState(false)

  useEffect(() => {
    const utente = localStorage.getItem("utente")

    if (!utente) {
      router.push("/login")
      return
    }

    const dati = JSON.parse(utente)

    if (dati.ruolo !== "admin") {
      router.push("/area-cliente")
      return
    }

    setOk(true)
  }, [router])

  if (!ok) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        Controllo accesso admin...
      </main>
    )
  }

  return <>{children}</>
}