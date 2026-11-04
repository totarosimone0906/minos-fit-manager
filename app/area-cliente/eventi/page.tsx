"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  UsersRound,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

type Evento = {
  id: string;
  titolo: string;
  descrizione: string | null;
  data_evento: string;
  ora_inizio: string | null;
  ora_fine: string | null;
  luogo: string | null;
  immagine_url: string | null;
  posti_massimi: number | null;
  iscrizioni_attive: boolean;
  pubblicato: boolean;
};

export default function EventiPage() {
  const router = useRouter();

  const [eventi, setEventi] = useState<Evento[]>([]);
  const [caricamento, setCaricamento] = useState(true);

  useEffect(() => {
    void caricaEventi();
  }, []);

  async function caricaEventi() {
    try {
      setCaricamento(true);

      const { data, error } = await supabase
        .from("eventi")
        .select("*")
        .eq("pubblicato", true)
        .order("data_evento", { ascending: true });

      if (error) {
        console.error("Errore caricamento eventi:", error);
        setEventi([]);
        return;
      }

      setEventi(data || []);
    } catch (error) {
      console.error("Errore caricamento eventi:", error);
      setEventi([]);
    } finally {
      setCaricamento(false);
    }
  }

  function formattaData(data: string) {
    return new Date(`${data}T12:00:00`).toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formattaOra(ora: string | null) {
    if (!ora) return null;
    return ora.slice(0, 5);
  }

  return (
    <main className="min-h-[100dvh] bg-[#060708] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-zinc-900 bg-[#060708]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[900px] items-center justify-between px-5 py-4">
          <button
            type="button"
            onClick={() => router.push("/area-cliente")}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 transition hover:border-red-600"
            aria-label="Torna alla home"
          >
            <ArrowLeft size={21} />
          </button>

          <Image
            src="/logo.png"
            alt="Minos Fit"
            width={150}
            height={60}
            className="h-10 w-auto object-contain"
            priority
          />

          <div className="h-11 w-11" />
        </div>
      </header>

      <section className="mx-auto w-full max-w-[900px] px-5 pb-12 pt-8">
        {/* TITOLO */}
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-red-500">
            Minos Fit
          </p>

          <h1 className="mt-2 text-4xl font-black">
            Eventi
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
            Scopri gli eventi, le iniziative e gli appuntamenti organizzati
            da Minos Fit.
          </p>
        </div>

        {/* CONTENUTO */}
        <div className="mt-8">
          {caricamento ? (
            <div className="rounded-[28px] border border-zinc-800 bg-[#0d0e0f] p-8 text-center">
              <p className="font-bold text-zinc-500">
                Caricamento eventi...
              </p>
            </div>
          ) : eventi.length === 0 ? (
            <div className="rounded-[28px] border border-zinc-800 bg-[#0d0e0f] p-8 text-center">
              <CalendarDays
                size={44}
                className="mx-auto text-red-500"
              />

              <h2 className="mt-5 text-xl font-black">
                Nessun evento in programma
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Quando pubblicheremo un nuovo evento lo troverai qui.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {eventi.map((evento) => (
                <article
                  key={evento.id}
                  className="overflow-hidden rounded-[28px] border border-zinc-800 bg-[#0d0e0f] shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
                >
                  {/* IMMAGINE */}
                  {evento.immagine_url && (
                    <div className="relative aspect-[16/8] w-full overflow-hidden bg-zinc-900">
                      <img
                        src={evento.immagine_url}
                        alt={evento.titolo}
                        className="h-full w-full object-cover"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e0f] via-transparent to-transparent" />
                    </div>
                  )}

                  <div className="p-5 sm:p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-500">
                      Evento Minos Fit
                    </p>

                    <h2 className="mt-2 text-2xl font-black">
                      {evento.titolo}
                    </h2>

                    {evento.descrizione && (
                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-zinc-400">
                        {evento.descrizione}
                      </p>
                    )}

                    <div className="mt-6 space-y-3 border-t border-zinc-800 pt-5">
                      <div className="flex items-center gap-3">
                        <CalendarDays
                          size={19}
                          className="shrink-0 text-red-500"
                        />

                        <span className="text-sm font-bold capitalize text-zinc-200">
                          {formattaData(evento.data_evento)}
                        </span>
                      </div>

                      {evento.ora_inizio && (
                        <div className="flex items-center gap-3">
                          <Clock
                            size={19}
                            className="shrink-0 text-red-500"
                          />

                          <span className="text-sm font-bold text-zinc-200">
                            {formattaOra(evento.ora_inizio)}
                            {evento.ora_fine
                              ? ` – ${formattaOra(evento.ora_fine)}`
                              : ""}
                          </span>
                        </div>
                      )}

                      {evento.luogo && (
                        <div className="flex items-center gap-3">
                          <MapPin
                            size={19}
                            className="shrink-0 text-red-500"
                          />

                          <span className="text-sm font-bold text-zinc-200">
                            {evento.luogo}
                          </span>
                        </div>
                      )}

                      {evento.iscrizioni_attive && (
                        <div className="flex items-center gap-3">
                          <UsersRound
                            size={19}
                            className="shrink-0 text-red-500"
                          />

                          <span className="text-sm font-bold text-zinc-200">
                            {evento.posti_massimi
                              ? `Iscrizioni aperte · ${evento.posti_massimi} posti disponibili`
                              : "Iscrizioni aperte"}
                          </span>
                        </div>
                      )}
                    </div>

                    {evento.iscrizioni_attive && (
                      <button
                        type="button"
                        className="mt-6 w-full rounded-2xl bg-red-600 px-5 py-4 text-sm font-black uppercase text-white transition hover:bg-red-500"
                      >
                        Partecipa all&apos;evento
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}