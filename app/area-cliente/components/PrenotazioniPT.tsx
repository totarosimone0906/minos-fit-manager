"use client";

import { useEffect, useMemo, useState } from "react";

type Operatore = "Simone Totaro" | "Daniele Totaro";
type TipoPacchetto = "pacchetto_5" | "pacchetto_10" | "personal";

type Pacchetto = {
  id: string;
  tipo: TipoPacchetto;
  prezzo: number;
  lezioni_totali: number;
  lezioni_utilizzate: number;
  lezioni_impegnate: number;
  lezioni_disponibili: number;
  stato: string;
  operatore: Operatore | null;
  acquistato_il: string | null;
  scadenza: string | null;
};

type StatoPT = {
  pacchetto: Pacchetto | null;
  consulenzaDisponibile: boolean;
  consulenzaGiaRichiesta: boolean;
};

type Modalita =
  | null
  | "singola"
  | "pacchetto"
  | "personal_acquisto"
  | "personal_check"
  | "consulenza";

export default function PrenotazioniPT({
  clienteId,
  clienteEmail,
  onPopupChange,
}: {
  clienteId: string;
  clienteEmail?: string;
  onPopupChange?: (aperto: boolean) => void;
}) {
  
  const [stato, setStato] = useState<StatoPT>({
    pacchetto: null,
    consulenzaDisponibile: true,
    consulenzaGiaRichiesta: false,
  });
  const [caricamento, setCaricamento] = useState(true);
  const [modalita, setModalita] = useState<Modalita>(null);
  const [operatore, setOperatore] = useState<Operatore>("Simone Totaro");
  const [data, setData] = useState("");
  const [ora, setOra] = useState("");
  const [slotOccupati, setSlotOccupati] = useState<string[]>([]);
  const [errore, setErrore] = useState("");
  const [invio, setInvio] = useState(false);
useEffect(() => {
  onPopupChange?.(modalita !== null);
}, [modalita, onPopupChange]);

  async function caricaStato() {
    try {
      const res = await fetch("/api/prenotazioni-pt/stato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId }),
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Errore caricamento servizi PT");
      setStato({
        pacchetto: json.pacchetto || null,
        consulenzaDisponibile: Boolean(json.consulenzaDisponibile),
        consulenzaGiaRichiesta: Boolean(json.consulenzaGiaRichiesta),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setCaricamento(false);
    }
  }

  useEffect(() => {
    void caricaStato();
  }, [clienteId]);

  useEffect(() => {
    if (!modalita || modalita === "personal_acquisto" || !data) {
      setSlotOccupati([]);
      return;
    }
    void (async () => {
      try {
        const res = await fetch("/api/prenotazioni-pt/slot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operatore, data }),
        });
        const json = await res.json();
        setSlotOccupati(res.ok ? json.slotOccupati || [] : []);
        if ((json.slotOccupati || []).includes(ora)) setOra("");
      } catch {
        setSlotOccupati([]);
      }
    })();
  }, [operatore, data, modalita]);

  const pacchettoAttivo = stato.pacchetto;
  const bloccaAcquisti = Boolean(pacchettoAttivo);

  function apri(m: Modalita) {
    setErrore("");
    setData("");
    setOra("");
    if (m === "personal_check" && pacchettoAttivo?.operatore) {
      setOperatore(pacchettoAttivo.operatore);
    }
    setModalita(m);
  }

  async function checkout(tipo: string, extra: Record<string, string> = {}) {
    setInvio(true);
    setErrore("");
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          clienteId,
          clienteEmail: clienteEmail || undefined,
          ...extra,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || "Errore pagamento");
      window.location.href = json.url;
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore durante il pagamento");
      setInvio(false);
    }
  }

  async function acquistaPacchetto(tipo: "pt_5" | "pt_10") {
    if (bloccaAcquisti) return;
    await checkout(tipo);
  }

  async function acquistaPersonal() {
    if (bloccaAcquisti) return;
    await checkout("pt_personal", { operatore });
  }

  async function confermaAppuntamento() {
    if (!data || !ora || !operatore) {
      setErrore("Seleziona Personal Trainer, data e orario.");
      return;
    }

    if (modalita === "singola") {
      await checkout("pt_singola", { operatore, data, ora });
      return;
    }

    let tipoServizio = "";
    let pacchettoId: string | undefined;
    if (modalita === "pacchetto") {
      tipoServizio = "pacchetto";
      pacchettoId = pacchettoAttivo?.id;
    } else if (modalita === "personal_check") {
      tipoServizio = "personal";
      pacchettoId = pacchettoAttivo?.id;
    } else if (modalita === "consulenza") {
      tipoServizio = "consulenza_gratuita";
    }

    if (!tipoServizio) return;

    setInvio(true);
    setErrore("");
    try {
      const res = await fetch("/api/prenotazioni-pt/richiedi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId,
          operatore,
          data,
          ora,
          tipoServizio,
          pacchettoId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Errore invio prenotazione");
      setModalita(null);
      await caricaStato();
      alert("Richiesta inviata allo staff ✅");
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore invio prenotazione");
    } finally {
      setInvio(false);
    }
  }

  const cardDisabilitata = "cursor-not-allowed border-zinc-800 bg-zinc-950/70 opacity-40";
  const cardNormale = "border-zinc-800 bg-zinc-900/70 hover:border-red-600 active:scale-[0.98]";

  if (caricamento) {
    return <p className="text-sm text-zinc-400">Caricamento servizi PT...</p>;
  }

  return (
    <>
      <p className="text-sm leading-7 text-zinc-300">
        Prenota una seduta con Simone o Daniele oppure attiva un pacchetto Personal Trainer.
      </p>

      {pacchettoAttivo && (
        <div className="mt-5 rounded-2xl border-2 border-green-500 bg-green-950/15 p-5 shadow-[0_0_22px_rgba(34,197,94,0.12)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-green-400">Servizio attivo</p>
              <p className="mt-2 text-xl font-black text-white">
                {pacchettoAttivo.tipo === "pacchetto_5"
                  ? "🔥 Pacchetto 5 sedute"
                  : pacchettoAttivo.tipo === "pacchetto_10"
                    ? "💪 Pacchetto 10 sedute"
                    : "⭐ Pacchetto Personal"}
              </p>
            </div>
            <span className="rounded-full border border-green-500 px-3 py-1 text-xs font-black text-green-400">ATTIVO</span>
          </div>

          {pacchettoAttivo.tipo !== "personal" ? (
            <>
              <p className="mt-4 text-3xl font-black text-green-400">
                {pacchettoAttivo.lezioni_disponibili}/{pacchettoAttivo.lezioni_totali}
              </p>
              <p className="text-xs text-zinc-400">sedute disponibili</p>
              {pacchettoAttivo.lezioni_impegnate > 0 && (
                <p className="mt-2 text-xs text-orange-300">
                  {pacchettoAttivo.lezioni_impegnate} seduta/e già richiesta/e o confermata/e.
                </p>
              )}
              <button
                type="button"
                disabled={pacchettoAttivo.lezioni_disponibili <= 0}
                onClick={() => apri("pacchetto")}
                className="mt-5 w-full rounded-2xl bg-green-600 p-4 font-black text-white disabled:opacity-40"
              >
                Prenota una seduta
              </button>
            </>
          ) : (
            <>
              <p className="mt-4 text-sm text-zinc-300">
                Personal: <b>{pacchettoAttivo.operatore}</b>
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Valido fino al {formattaData(pacchettoAttivo.scadenza)}
              </p>
              <button
                type="button"
                onClick={() => apri("personal_check")}
                className="mt-5 w-full rounded-2xl bg-green-600 p-4 font-black text-white"
              >
                Prenota check mensile
              </button>
            </>
          )}
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={bloccaAcquisti}
          onClick={() => apri("singola")}
          className={`w-full rounded-2xl border p-4 text-left transition ${bloccaAcquisti ? cardDisabilitata : cardNormale}`}
        >
          <p className="font-black text-white">🏋️ Seduta singola</p>
          <p className="mt-1 text-2xl font-black text-red-500">30 €</p>
          <p className="mt-2 text-xs text-zinc-400">1 ora con Personal Trainer</p>
        </button>

        <button
          type="button"
          disabled={bloccaAcquisti}
          onClick={() => void acquistaPacchetto("pt_5")}
          className={`w-full rounded-2xl border p-4 text-left transition ${bloccaAcquisti ? cardDisabilitata : cardNormale}`}
        >
          <p className="font-black text-white">🔥 Pacchetto 5 sedute</p>
          <p className="mt-1 text-2xl font-black text-red-500">100 €</p>
          <p className="mt-2 text-xs text-zinc-400">5 lezioni PT · clicca per acquistare</p>
        </button>

        <button
          type="button"
          disabled={bloccaAcquisti}
          onClick={() => void acquistaPacchetto("pt_10")}
          className={`w-full rounded-2xl border p-4 text-left transition ${bloccaAcquisti ? cardDisabilitata : cardNormale}`}
        >
          <p className="font-black text-white">💪 Pacchetto 10 sedute</p>
          <p className="mt-1 text-2xl font-black text-red-500">180 €</p>
          <p className="mt-2 text-xs text-zinc-400">10 lezioni PT · clicca per acquistare</p>
        </button>

        <button
          type="button"
          disabled={bloccaAcquisti}
          onClick={() => apri("personal_acquisto")}
          className={`w-full rounded-2xl border p-4 text-left transition ${bloccaAcquisti ? cardDisabilitata : "border-red-600/40 bg-red-950/20 hover:border-red-500 active:scale-[0.98]"}`}
        >
          <p className="font-black text-white">⭐ Pacchetto Personal</p>
          <p className="mt-1 text-2xl font-black text-red-500">80 €</p>
          <p className="mt-2 text-xs leading-5 text-zinc-400">
            Scheda personalizzata, check mensile, consigli nutrizionali, supporto WhatsApp e ingresso mensile. Validità 1 mese.
          </p>
        </button>
      </div>

      <button
        type="button"
        disabled={!stato.consulenzaDisponibile}
        onClick={() => apri("consulenza")}
        className={`mt-3 w-full rounded-2xl border p-4 text-left transition ${
          stato.consulenzaDisponibile
            ? "border-green-700/30 bg-green-950/20 hover:border-green-500 active:scale-[0.98]"
            : "cursor-not-allowed border-zinc-800 bg-zinc-950/70 opacity-40"
        }`}
      >
        <p className="font-black text-green-400">💬 Consulenza gratuita</p>
        <p className="mt-1 text-xs leading-5 text-zinc-400">
          {stato.consulenzaDisponibile
            ? "Disponibile una volta al mese. Tocca per prenotare."
            : "Consulenza del mese già richiesta o utilizzata."}
        </p>
      </button>

      {modalita === "personal_acquisto" && (
        <Finestra titolo="Pacchetto Personal" onChiudi={() => setModalita(null)}>
          <p className="mb-4 text-sm leading-6 text-zinc-300">
            80 € · validità 1 mese dall&apos;acquisto. Scegli il Personal Trainer di riferimento.
          </p>
          <SelectOperatore operatore={operatore} setOperatore={setOperatore} />
          {errore && <Errore testo={errore} />}
          <button
            type="button"
            disabled={invio}
            onClick={() => void acquistaPersonal()}
            className="mt-4 w-full rounded-2xl bg-red-600 p-4 font-black disabled:opacity-50"
          >
            {invio ? "Apertura pagamento..." : "Paga 80 €"}
          </button>
        </Finestra>
      )}

      {(modalita === "singola" || modalita === "pacchetto" || modalita === "personal_check" || modalita === "consulenza") && (
        <Finestra
          titolo={
            modalita === "singola"
              ? "Seduta singola · 30 €"
              : modalita === "pacchetto"
                ? "Prenota seduta pacchetto"
                : modalita === "personal_check"
                  ? "Prenota check Personal"
                  : "Consulenza gratuita"
          }
          onChiudi={() => setModalita(null)}
        >
          {modalita === "personal_check" ? (
            <div className="mb-4 rounded-2xl border border-zinc-700 bg-zinc-900 p-4 text-sm text-zinc-300">
              Personal Trainer: <b>{operatore}</b>
            </div>
          ) : (
            <SelectOperatore operatore={operatore} setOperatore={setOperatore} />
          )}
          <Calendario
            data={data}
            setData={setData}
            ora={ora}
            setOra={setOra}
            slotOccupati={slotOccupati}
          />
          <div className="mb-4 rounded-2xl border border-zinc-700 bg-zinc-900 p-4">
            <p className="font-black">📅 Richiesta appuntamento</p>
            <p className="mt-1 text-sm text-zinc-400">La prenotazione dovrà essere confermata dallo staff.</p>
          </div>
          {errore && <Errore testo={errore} />}
          <button
            type="button"
            disabled={invio}
            onClick={() => void confermaAppuntamento()}
            className="w-full rounded-2xl bg-red-600 p-4 font-black disabled:opacity-50"
          >
            {invio
              ? "Attendi..."
              : modalita === "singola"
                ? "Vai al pagamento · 30 €"
                : "Invia richiesta"}
          </button>
        </Finestra>
      )}
    </>
  );
}

function SelectOperatore({
  operatore,
  setOperatore,
}: {
  operatore: Operatore;
  setOperatore: (v: Operatore) => void;
}) {
  return (
    <>
      <label className="text-sm font-black text-zinc-300">Personal Trainer</label>
      <select
        value={operatore}
        onChange={(e) => setOperatore(e.target.value as Operatore)}
        className="mb-4 mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 p-4 text-white"
      >
        <option value="Simone Totaro">Simone Totaro</option>
        <option value="Daniele Totaro">Daniele Totaro</option>
      </select>
    </>
  );
}

function Calendario({
  data,
  setData,
  ora,
  setOra,
  slotOccupati,
}: {
  data: string;
  setData: (v: string) => void;
  ora: string;
  setOra: (v: string) => void;
  slotOccupati: string[];
}) {
  const giorno = data ? new Date(`${data}T12:00:00`).getDay() : null;
  const feriali = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];
  const sabato = ["09:00", "10:00", "11:00", "12:00", "13:00"];
  const orari = giorno === 0 ? [] : giorno === 6 ? sabato : feriali;
  const domani = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString("en-CA");
  }, []);

  return (
    <>
      <label className="text-sm font-black text-zinc-300">Data</label>
      <input
        type="date"
        min={domani}
        value={data}
        onChange={(e) => {
          setData(e.target.value);
          setOra("");
        }}
        className="mb-4 mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 p-4 text-white"
      />
      {giorno === 0 && (
        <div className="mb-4 rounded-2xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
          🚫 La palestra è chiusa la domenica.
        </div>
      )}
      <label className="text-sm font-black text-zinc-300">Orario</label>
      <select
        value={ora}
        onChange={(e) => setOra(e.target.value)}
        className="mb-4 mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 p-4 text-white"
      >
        <option value="">Seleziona orario</option>
        {orari.map((o) => (
          <option key={o} value={o} disabled={slotOccupati.includes(o)}>
            {o} {slotOccupati.includes(o) ? "— NON DISPONIBILE" : ""}
          </option>
        ))}
      </select>
    </>
  );
}

function Finestra({
  titolo,
  children,
  onChiudi,
}: {
  titolo: string;
  children: React.ReactNode;
  onChiudi: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4">
      <div className="flex max-h-[calc(100dvh-32px)] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-red-600 bg-zinc-950 p-6 shadow-2xl">

        <h2 className="mb-5 shrink-0 text-center text-2xl font-black text-red-500">
          {titolo}
        </h2>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>

        <button
          type="button"
          onClick={onChiudi}
          className="mt-4 w-full shrink-0 rounded-2xl border border-zinc-700 bg-zinc-900 p-4 font-black"
        >
          Chiudi
        </button>

      </div>
    </div>
  );
}
function Errore({ testo }: { testo: string }) {
  return <p className="mb-4 text-center text-sm font-bold text-red-500">❌ {testo}</p>;
}

function formattaData(data: string | null) {
  if (!data) return "—";
  return new Date(`${data}T00:00:00`).toLocaleDateString("it-IT");
}
