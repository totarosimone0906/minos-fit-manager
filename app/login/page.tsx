export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
        <h1 className="text-5xl font-black text-green-400 mb-2">
          MINOS FIT
        </h1>

        <p className="text-zinc-400 mb-8">
          Area clienti
        </p>

        <div className="space-y-4">
          <a
            href="/login/accesso"
            className="block w-full text-center bg-green-500 text-black rounded-2xl p-4 font-black"
          >
            Accedi
          </a>

          <a
            href="/richiedi-iscrizione"
            className="block w-full text-center bg-zinc-900 border border-zinc-700 rounded-2xl p-4 font-black"
          >
            Richiedi iscrizione
          </a>
        </div>

        <p className="text-zinc-500 text-sm mt-6">
          L’accesso sarà disponibile solo dopo approvazione dello staff.
        </p>
      </div>
    </main>
  )
}