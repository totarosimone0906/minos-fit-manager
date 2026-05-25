import Link from "next/link";

const clienti = [
  ["Luca Bianchi", "333 1234567", "Full Time", "20/06/2026", "Attivo"],
  ["Giulia Verdi", "333 9876543", "Fit Plus", "15/07/2026", "Attivo"],
]

export default function ClientiPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white p-10">
      <div className="flex justify-between items-center mb-10">
        <div>
          <p className="text-green-400 font-bold tracking-[0.35em] text-sm">
            MINOS FIT MANAGER
          </p>
          <h1 className="text-6xl font-black mt-3">Clienti</h1>
          <p className="text-zinc-400 mt-3">
            Gestione anagrafica, abbonamenti e scadenze.
          </p>
        </div>

        <Link
  href="/aggiungi-cliente"
  className="bg-green-500 text-black px-6 py-3 rounded-2xl font-black shadow-[0_0_25px_rgba(34,197,94,0.45)]"
>
  + Aggiungi cliente
</Link>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
        <div className="grid grid-cols-5 text-zinc-500 text-sm border-b border-zinc-800 pb-4">
          <p>Nome</p>
          <p>Telefono</p>
          <p>Abbonamento</p>
          <p>Scadenza</p>
          <p>Stato</p>
        </div>

        {clienti.map(([nome, tel, abb, scad, stato]) => (
          <div key={nome} className="grid grid-cols-5 py-5 border-b border-zinc-900 items-center">
            <p className="font-bold">{nome}</p>
            <p className="text-zinc-400">{tel}</p>
            <p className="text-zinc-400">{abb}</p>
            <p className="text-zinc-400">{scad}</p>
            <p className={
              stato === "Attivo" ? "text-green-400 font-bold" :
              stato === "Scaduto" ? "text-red-400 font-bold" :
              "text-yellow-400 font-bold"
            }>
              {stato}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}