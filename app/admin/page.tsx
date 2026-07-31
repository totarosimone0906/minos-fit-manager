

import Link from "next/link"
import Image from "next/image"

export default function AdminPage() {
  const menu = [
  { nome: "Nuovo cliente", icona: "➕", href: "/admin/nuovo-cliente" },
  { nome: "Storico accessi", icona: "📋", href: "/admin/storico-accessi" },
  { nome: "Storico cliente", icona: "👤", href: "/admin/clienti" },
  { nome: "Pagamenti", icona: "💳", href: "/admin/pagamenti" },
  { nome: "Prenotazioni", icona: "📅", href: "/admin/prenotazioni" },
  { nome: "Promozioni", icona: "🎯", href: "/admin/promozioni" },
  { nome: "Notifiche", icona: "🔔", href: "/admin/notifiche" },
  { nome: "Schede", icona: "🏋️", href: "/admin/richieste-schede" },
]

  return (
    <main className="min-h-screen bg-[#050505] text-white p-6">
      <div className="flex gap-10">
        <aside className="w-[200px] shrink-0">
          <div className="min-h-[calc(100vh-48px)] border border-zinc-500 bg-zinc-800 rounded-2xl p-6 shadow-xl">
            <nav className="flex flex-col gap-12">
              {menu.map((item) => (
                
                 <Link
  key={item.nome}
  href={item.href}
  className="flex items-center gap-3 text-left text-sm font-black hover:text-red-400 transition"
>
  <span>{item.icona}</span>
  <span>{item.nome}</span>
</Link>
              ))}
            </nav>
          </div>
        </aside>

        <section className="flex-1">
       <div className="flex justify-between items-center mb-8">

  <div className="flex items-center gap-6">
    <Image
      src="/logo.png"
      alt="MinosFit"
      width={700}
      height={400}
      priority
    />

    <h1 className="text-6xl font-black uppercase tracking-widest text-red-600 justify-center gap-8">
      NO EXCUSE
    </h1>
  </div>

  <div className="flex gap-4">
    <button className="bg-green-600 hover:bg-green-500 px-8 py-4 rounded-xl font-black text-lg">
      🟢 APRI ENTRATA
    </button>

    <button className="bg-red-600 hover:bg-red-500 px-8 py-4 rounded-xl font-black text-lg">
      🔴 APRI USCITA
    </button>
  </div>

</div>
         <div className="border border-zinc-700 rounded-2xl p-6 mb-6 bg-zinc-950 min-h-[170px]">
  <div className="grid grid-cols-2 gap-x-20 gap-y-4 text-sm font-bold">
    <div className="space-y-3">
      <p><span className="text-red-500"></span> Nome: <span className="text-zinc-400">---</span></p>
      <p>Stato abbonamento: <span className="text-zinc-400">---</span></p>
      <p>Disciplina: <span className="text-zinc-400">---</span></p>
      <p>Assegna giornaliero: <span className="text-zinc-400">---</span></p>
    </div>

    <div className="space-y-3">
      <p><span className="text-red-500"></span> Cognome: <span className="text-zinc-400">---</span></p>
      <p>Certificato medico: <span className="text-zinc-400">---</span></p>
      <p>Rinnova abbonamento: <span className="text-zinc-400">---</span></p>
    </div>
  </div>
</div>

          <div className="border border-zinc-700 rounded-2xl overflow-hidden bg-zinc-950">
            <table className="w-full text-xs">
              <thead className="bg-zinc-900 text-red-500">
  <tr>
    <th className="p-3">Codice tessera</th>
    <th className="p-3">Cognome</th>
    <th className="p-3">Nome</th>
    <th className="p-3">Disciplina</th>
    <th className="p-3">Ora entrata</th>
    <th className="p-3">Ora uscita</th>
    <th className="p-3">C.M.</th>
    <th className="p-3">Q.A.</th>
    <th className="p-3">Abb.</th>
    <th className="p-3">Ingressi</th>
  </tr>
</thead>

              <tbody>
  <tr className="border-t border-zinc-800 text-center">
    <td className="p-3">---</td>
    <td className="p-3">---</td>
    <td className="p-3">---</td>
    <td className="p-3">---</td>
    <td className="p-3">---</td>
    <td className="p-3">---</td>
    <td className="p-3 text-green-500">✓</td>
    <td className="p-3 text-green-500">✓</td>
    <td className="p-3 text-green-500">✓</td>
    <td className="p-3">0</td>
  </tr>
</tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}