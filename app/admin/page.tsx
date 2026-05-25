export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white p-8">
      <h1 className="text-5xl font-black text-red-500 mb-2">
        Staff Panel
      </h1>

      <p className="text-zinc-400 mb-8">
        Gestione clienti, abbonamenti, certificati e app MINOS FIT.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <a href="/admin/clienti" className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
          <h2 className="text-2xl font-black text-red-500">Clienti</h2>
          <p className="text-zinc-400 mt-2">Gestisci anagrafiche e abbonamenti.</p>
        </a>

        <a href="/admin/scadenze" className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
          <h2 className="text-2xl font-black text-red-500">Scadenze</h2>
          <p className="text-zinc-400 mt-2">Abbonamenti e certificati in scadenza.</p>
        </a>

        <a href="/admin/schede" className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
          <h2 className="text-2xl font-black text-red-500">Schede</h2>
          <p className="text-zinc-400 mt-2">Carica PDF e programmi per i clienti.</p>
        </a>
      </div>
    </main>
  )
}