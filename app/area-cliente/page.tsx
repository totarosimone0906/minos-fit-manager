"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Bell,
  Bot,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CircleUserRound,
  CreditCard,
  FileText,
  HeartPulse,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Phone,
  ReceiptText,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Stato = "ATTIVO" | "IN SCADENZA" | "SCADUTO" | "NON IMPOSTATO";
type Sezione = { id: string; nome: string; icona: ReactNode };

const sezioni: Sezione[] = [
  { id: "home", nome: "Home", icona: <Home size={22} strokeWidth={2.2} /> },
  {
    id: "abbonamento",
    nome: "Abbonamento",
    icona: <CreditCard size={22} strokeWidth={2.2} />,
  },
  {
    id: "quota",
    nome: "Quota associativa",
    icona: <UsersRound size={22} strokeWidth={2.2} />,
  },
  {
    id: "certificato",
    nome: "Certificato medico",
    icona: <HeartPulse size={22} strokeWidth={2.2} />,
  },
  {
    id: "prenotazioni",
    nome: "Prenotazioni PT",
    icona: <CalendarDays size={22} strokeWidth={2.2} />,
  },
  {
    id: "schede",
    nome: "Schede",
    icona: <FileText size={22} strokeWidth={2.2} />,
  },
  {
    id: "ia",
    nome: "Assistente IA",
    icona: <Bot size={22} strokeWidth={2.2} />,
  },
  {
    id: "contatti",
    nome: "Contatti",
    icona: <Phone size={22} strokeWidth={2.2} />,
  },
];

export default function AreaClientePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cliente, setCliente] = useState<any>(null);
  const [menuAperto, setMenuAperto] = useState(false);
  const [notificheAperte, setNotificheAperte] = useState(false);
  const [sezioneAttiva, setSezioneAttiva] = useState(0);
  const [popupAbbonamentoAperto, setPopupAbbonamentoAperto] = useState(false);
  const [popupSchedaAperto, setPopupSchedaAperto] = useState(false);
  const [richiestaInviata, setRichiestaInviata] = useState(false);
  const [calendarioAperto, setCalendarioAperto] = useState(false);
  const [operatore, setOperatore] = useState("Simone Totaro");
  const [dataPrenotazione, setDataPrenotazione] = useState("");
  const [oraPrenotazione, setOraPrenotazione] = useState("");
  const [prenotazioneInviata, setPrenotazioneInviata] = useState(false);
  const [errorePrenotazione, setErrorePrenotazione] = useState("");

  useEffect(() => {
    void caricaClienteAggiornato();
  }, []);

  useEffect(() => {
    if (!cliente) return;
    const params = new URLSearchParams(window.location.search);
    const tipo = params.get("pagamento_abbonamento");
    if (
      ["mensile", "trimestrale", "semestrale", "annuale"].includes(tipo || "")
    ) {
      void registraPagamentoAbbonamento(tipo as string);
      window.history.replaceState({}, "", "/area-cliente");
    }
    if (tipo === "cancel") window.history.replaceState({}, "", "/area-cliente");
  }, [cliente?.id]);

  useEffect(() => {
    if (!cliente) return;
    const params = new URLSearchParams(window.location.search);
    const esito = params.get("pagamento_scheda");
    if (esito === "success") {
      void registraRichiestaSchedaPagata();
      window.history.replaceState({}, "", "/area-cliente");
    }
    if (esito === "cancel")
      window.history.replaceState({}, "", "/area-cliente");
  }, [cliente?.id]);

  async function caricaClienteAggiornato() {
    const salvato =
      localStorage.getItem("cliente") || localStorage.getItem("utente");
    if (!salvato) return router.push("/login/accesso");

    let base: any;
    try {
      base = JSON.parse(salvato);
    } catch {
      return router.push("/login/accesso");
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", base.id)
      .single();
    if (error || !data) return router.push("/login/accesso");

    setCliente(data);
    localStorage.setItem("cliente", JSON.stringify(data));
    localStorage.setItem("utente", JSON.stringify(data));

    const { data: richieste } = await supabase
      .from("richieste_schede")
      .select("id")
      .eq("cliente_id", data.id)
      .eq("stato", "pagata_in_attesa")
      .limit(1);
    setRichiestaInviata(Boolean(richieste?.length));
  }

  function logout() {
    localStorage.removeItem("cliente");
    localStorage.removeItem("utente");
    router.push("/login/accesso");
  }

  function calcolaStato(
    data: string | null | undefined,
    preavviso: number,
  ): Stato {
    if (!data) return "NON IMPOSTATO";
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    const scadenza = new Date(`${data}T00:00:00`);
    const giorni = Math.ceil((scadenza.getTime() - oggi.getTime()) / 86400000);
    if (giorni < 0) return "SCADUTO";
    if (giorni <= preavviso) return "IN SCADENZA";
    return "ATTIVO";
  }

  async function registraPagamentoAbbonamento(tipo: string) {
    if (!cliente) return;
    const mesi: Record<string, number> = {
      mensile: 1,
      trimestrale: 3,
      semestrale: 6,
      annuale: 12,
    };
    const nomi: Record<string, string> = {
      mensile: "Mensile",
      trimestrale: "Trimestrale",
      semestrale: "Semestrale",
      annuale: "Annuale",
    };
    if (!mesi[tipo]) return;

    const oggi = new Date();
    const scadenza = new Date();
    scadenza.setMonth(scadenza.getMonth() + mesi[tipo]);
    const pagamento = oggi.toISOString().split("T")[0];
    const dataScadenza = scadenza.toISOString().split("T")[0];

    const { error } = await supabase
      .from("profiles")
      .update({
        abbonamento: nomi[tipo],
        abbonamento_pagamento: pagamento,
        abbonamento_scadenza: dataScadenza,
        abbonamento_stato: "ATTIVO",
      })
      .eq("id", cliente.id);

    if (error) return alert(error.message);
    const aggiornato = {
      ...cliente,
      abbonamento: nomi[tipo],
      abbonamento_pagamento: pagamento,
      abbonamento_scadenza: dataScadenza,
      abbonamento_stato: "ATTIVO",
    };
    setCliente(aggiornato);
    localStorage.setItem("cliente", JSON.stringify(aggiornato));
    localStorage.setItem("utente", JSON.stringify(aggiornato));
    setPopupAbbonamentoAperto(false);
  }

  async function avviaPagamento(tipo: string) {
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo }),
    });
    const data = await res.json();
    if (!res.ok || !data.url) return alert(data.error || "Errore pagamento");
    window.location.href = data.url;
  }

  async function caricaCertificato(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !cliente) return;
    if (file.type !== "application/pdf")
      return alert("Puoi caricare solo file PDF.");

    const path = `${cliente.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: uploadError } = await supabase.storage
      .from("certificati")
      .upload(path, file);
    if (uploadError) return alert(uploadError.message);

    const { data } = supabase.storage.from("certificati").getPublicUrl(path);
    const { error } = await supabase
      .from("profiles")
      .update({ certificato_file_url: data.publicUrl })
      .eq("id", cliente.id);
    if (error) return alert(error.message);

    const aggiornato = { ...cliente, certificato_file_url: data.publicUrl };
    setCliente(aggiornato);
    localStorage.setItem("cliente", JSON.stringify(aggiornato));
    e.target.value = "";
    alert("Certificato caricato correttamente ✅");
  }

  async function confermaPrenotazione() {
    if (!operatore || !dataPrenotazione || !oraPrenotazione)
      return setErrorePrenotazione("Compila tutti i campi");
    const { error } = await supabase.from("prenotazioni_pt").insert([
      {
        cliente_id: cliente.id,
        cliente_nome: `${cliente.nome} ${cliente.cognome}`,
        operatore,
        data: dataPrenotazione,
        ora: oraPrenotazione,
        prezzo: 10,
        stato: "confermata",
        pagamento: "in_presenza",
      },
    ]);
    if (error) return setErrorePrenotazione(error.message);
    setErrorePrenotazione("");
    setPrenotazioneInviata(true);
  }

  async function registraRichiestaSchedaPagata() {
    if (!cliente || richiestaInviata) return;
    const { error } = await supabase
      .from("richieste_schede")
      .insert([{ cliente_id: cliente.id, stato: "pagata_in_attesa" }]);
    if (error) return alert(error.message);
    setRichiestaInviata(true);
    setPopupSchedaAperto(false);
  }

  function vaiAllaSezione(indice: number) {
    setSezioneAttiva(indice);
    setMenuAperto(false);
  }
  function schedaPrecedente() {
    setSezioneAttiva((i) => (i === 0 ? sezioni.length - 1 : i - 1));
  }
  function schedaSuccessiva() {
    setSezioneAttiva((i) => (i === sezioni.length - 1 ? 0 : i + 1));
  }

  if (!cliente) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#060708] text-white">
        Caricamento...
      </main>
    );
  }
  const statoAbbonamento: Stato = calcolaStato(
  cliente.abbonamento_scadenza || cliente.scadenza,
  10
)

const statoQuota: Stato = calcolaStato(
  cliente.quota_associativa_scadenza,
  15
)

const statoCertificato: Stato = calcolaStato(
  cliente.certificato_scadenza,
  15
)

const clienteGrafico = {
  nome: cliente.nome || "",
  cognome: cliente.cognome || "",

  codice:
    cliente.codice_tessera ||
    cliente.rfid_code ||
    `MF-${String(cliente.id || "").slice(0, 6).toUpperCase()}`,

  abbonamento: cliente.abbonamento || "Da impostare",

  statoAbbonamento,

  pagamentoAbbonamento:
    cliente.abbonamento_pagamento || "Non impostata",

  scadenzaAbbonamento:
    cliente.abbonamento_scadenza ||
    cliente.scadenza ||
    "Non impostata",

  statoQuota,

  pagamentoQuota:
    cliente.quota_associativa_pagamento || "Non impostata",

  scadenzaQuota:
    cliente.quota_associativa_scadenza || "Non impostata",

  statoCertificato,

  scadenzaCertificato:
    cliente.certificato_scadenza || "Non impostata",

  certificatoUrl:
    cliente.certificato_file_url || "",

  schedaUrl:
    cliente.schede_file_url ||
    cliente["cliente.schede_file_url"] ||
    "",
}

  const grafico = {
    nome: cliente.nome || "",
    cognome: cliente.cognome || "",
    codice:
      cliente.codice_tessera ||
      cliente.rfid_code ||
      `MF-${String(cliente.id).slice(0, 6).toUpperCase()}`,
    abbonamento: cliente.abbonamento || "Da impostare",
    statoAbbonamento: calcolaStato(
      cliente.abbonamento_scadenza || cliente.scadenza,
      10,
    ),
    pagamentoAbbonamento: cliente.abbonamento_pagamento || "Non impostata",
    scadenzaAbbonamento:
      cliente.abbonamento_scadenza || cliente.scadenza || "Non impostata",
    statoQuota: calcolaStato(cliente.quota_associativa_scadenza, 15),
    pagamentoQuota: cliente.quota_associativa_pagamento || "Non impostata",
    scadenzaQuota: cliente.quota_associativa_scadenza || "Non impostata",
    statoCertificato: calcolaStato(cliente.certificato_scadenza, 15),
    scadenzaCertificato: cliente.certificato_scadenza || "Non impostata",
    certificatoUrl: cliente.certificato_file_url || "",
    schedaUrl:
      cliente.schede_file_url || cliente["cliente.schede_file_url"] || "",
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#060708] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-red-950/10 blur-[150px]" />
        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
      </div>

      <header className="relative z-30 mx-auto flex h-[112px] w-full max-w-[1100px] items-center justify-center px-5">
        <div className="absolute left-5">
          <button
            type="button"
            onClick={() => setMenuAperto(true)}
            className="flex h-12 w-12 items-center justify-center rounded-xl text-white transition hover:bg-white/5 hover:text-red-500"
            aria-label="Apri menu"
          >
            <Menu size={32} strokeWidth={2.1} />
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.34em] text-white sm:text-lg">
            IL TUO UNICO LIMITE SEI TU
          </p>
          <div className="mx-auto mt-3 h-[3px] w-24 rounded-full bg-red-600 shadow-[0_0_18px_rgba(220,38,38,0.75)]" />
        </div>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-100px)] w-full max-w-[900px] flex-col items-center justify-center px-4 pb-32 pt-2">
        <button
          type="button"
          onClick={schedaPrecedente}
          className="mb-8 flex h-14 w-24 items-center justify-center rounded-[22px] border border-zinc-700 bg-gradient-to-b from-zinc-900 to-black text-red-600 shadow-[0_12px_28px_rgba(0,0,0,0.7)] transition hover:border-red-500 hover:shadow-[0_0_24px_rgba(220,38,38,0.2)]"
        >
          <ChevronUp size={32} strokeWidth={2.8} />
        </button>

       <div className="relative flex w-full items-center justify-center">
  {/* Pallini laterali */}
  <div className="absolute -right-8 top-1/2 flex -translate-y-1/2 flex-col gap-3 sm:-right-12">
    {sezioni.map((sezione, indice) => (
      <button
        key={sezione.id}
        type="button"
        onClick={() => vaiAllaSezione(indice)}
        className={`rounded-full transition-all ${
          sezioneAttiva === indice
            ? "h-8 w-3 bg-red-600 shadow-[0_0_14px_rgba(220,38,38,0.7)]"
            : "h-3 w-3 bg-zinc-600 hover:bg-zinc-400"
        }`}
        aria-label={`Apri ${sezione.nome}`}
      />
    ))}
  </div>

  {/* Scheda centrale */}
  <div className="w-full">
    {sezioneAttiva === 0 ? (
      <TesseraCliente cliente={clienteGrafico} />
    ) : (
      <SchedaSecondaria
  sezione={sezioni[sezioneAttiva]}
  cliente={clienteGrafico}
  richiestaInviata={richiestaInviata}
  onAbbonamento={() => setPopupAbbonamentoAperto(true)}
  onCertificato={() => fileInputRef.current?.click()}
  onPrenotazione={() => {
    setPrenotazioneInviata(false)
    setErrorePrenotazione("")
    setCalendarioAperto(true)
  }}
  onScheda={() => setPopupSchedaAperto(true)}
/>
    )}
  </div>
</div>

        <button
          type="button"
          onClick={schedaSuccessiva}
          className="mt-8 flex h-14 w-24 items-center justify-center rounded-[22px] border border-zinc-700 bg-gradient-to-b from-zinc-900 to-black text-red-600 shadow-[0_12px_28px_rgba(0,0,0,0.7)] transition hover:border-red-500 hover:shadow-[0_0_24px_rgba(220,38,38,0.2)]"
        >
          <ChevronDown size={32} strokeWidth={2.8} />
        </button>

        
      </section>

      <nav className="fixed bottom-4 left-1/2 z-30 flex w-[calc(100%-24px)] max-w-[760px] -translate-x-1/2 items-center justify-around rounded-[34px] border border-zinc-800 bg-black/90 px-3 py-3 backdrop-blur-xl">
        <NavButton
          testo="Home"
          icona={<Home size={24} strokeWidth={2.2} />}
          attivo={sezioneAttiva === 0}
          onClick={() => vaiAllaSezione(0)}
        />
        <NavButton
          testo="Prenotazioni"
          icona={<CalendarDays size={24} strokeWidth={2.2} />}
          attivo={sezioneAttiva === 4}
          onClick={() => vaiAllaSezione(4)}
        />
        <NavButton
          testo="Chat"
          icona={<MessageCircle size={24} strokeWidth={2.2} />}
          attivo={sezioneAttiva === 6}
          onClick={() => vaiAllaSezione(6)}
        />
        <NavButton
          testo="Notifiche"
          icona={<Bell size={24} strokeWidth={2.2} />}
          onClick={() => setNotificheAperte(true)}
        />
        <NavButton
          testo="Profilo"
          icona={<CircleUserRound size={24} strokeWidth={2.2} />}
          onClick={() => setMenuAperto(true)}
        />
      </nav>

      {menuAperto && (
        <button
          type="button"
          onClick={() => setMenuAperto(false)}
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm"
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-[85%] max-w-[350px] border-r border-red-600/20 bg-[#090a0b] p-5 transition-transform duration-300 ${menuAperto ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between">
          <Image
            src="/logo.png"
            alt="MinosFit"
            width={170}
            height={70}
            className="h-14 w-auto object-contain"
          />
          <button
            type="button"
            onClick={() => setMenuAperto(false)}
            className="h-11 w-11 rounded-full border border-zinc-700 bg-zinc-900 text-xl"
          >
            ×
          </button>
        </div>
        <p className="mb-3 mt-8 px-3 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600">
          Area cliente
        </p>
        <nav className="space-y-1">
          {sezioni.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => vaiAllaSezione(i)}
              className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-sm font-bold ${sezioneAttiva === i ? "bg-red-600" : "text-zinc-300 hover:bg-zinc-900"}`}
            >
              <span className="flex h-7 w-7 items-center justify-center text-red-500">
                {s.icona}
              </span>
              <span>{s.nome}</span>
            </button>
          ))}
        </nav>
        <div className="my-6 border-t border-zinc-800" />
        <button className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-zinc-300 hover:bg-zinc-900">
          <CalendarDays size={22} className="text-red-500" /> Eventi
        </button>
        <button className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-zinc-300 hover:bg-zinc-900">
          <UserRound size={22} className="text-red-500" /> Il mio profilo
        </button>
        <button
          onClick={logout}
          className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-red-500 hover:bg-red-950/30"
        >
          <LogOut size={22} /> Esci
        </button>
      </aside>

      {notificheAperte && (
        <button
          type="button"
          onClick={() => setNotificheAperte(false)}
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm"
        />
      )}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-[88%] max-w-[380px] border-l border-red-600/20 bg-[#090a0b] p-5 transition-transform duration-300 ${notificheAperte ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-500">
              Notifiche
            </p>
            <h2 className="mt-1 text-3xl font-black">Messaggi</h2>
          </div>
          <button
            type="button"
            onClick={() => setNotificheAperte(false)}
            className="h-11 w-11 rounded-full border border-zinc-700 bg-zinc-900 text-xl"
          >
            ×
          </button>
        </div>
        <div className="mt-8 space-y-4">
          {grafico.statoCertificato === "IN SCADENZA" && (
            <Notifica
              titolo="Certificato in scadenza"
              testo={`Il certificato scadrà il ${grafico.scadenzaCertificato}.`}
            />
          )}
          {richiestaInviata && (
            <Notifica
              titolo="Richiesta scheda inviata"
              testo="La tua richiesta è stata ricevuta dallo staff."
            />
          )}
          {grafico.statoCertificato !== "IN SCADENZA" && !richiestaInviata && (
            <Notifica
              titolo="Nessuna nuova notifica"
              testo="Al momento non ci sono comunicazioni."
            />
          )}
        </div>
      </aside>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={caricaCertificato}
        className="hidden"
      />

      {popupAbbonamentoAperto && (
        <PopupAbbonamento
          onChiudi={() => setPopupAbbonamentoAperto(false)}
          onPaga={avviaPagamento}
        />
      )}
      {popupSchedaAperto && (
        <PopupScheda
          richiestaInviata={richiestaInviata}
          onPaga={() => void avviaPagamento("scheda")}
          onChiudi={() => setPopupSchedaAperto(false)}
        />
      )}
      {calendarioAperto && (
        <PopupPrenotazione
          operatore={operatore}
          setOperatore={setOperatore}
          data={dataPrenotazione}
          setData={setDataPrenotazione}
          ora={oraPrenotazione}
          setOra={setOraPrenotazione}
          errore={errorePrenotazione}
          inviata={prenotazioneInviata}
          onConferma={() => void confermaPrenotazione()}
          onChiudi={() => setCalendarioAperto(false)}
        />
      )}
    </main>
  );
}

type Grafico = {
  nome: string;
  cognome: string;
  codice: string;
  abbonamento: string;
  statoAbbonamento: Stato;
  pagamentoAbbonamento: string;
  scadenzaAbbonamento: string;
  statoQuota: Stato;
  pagamentoQuota: string;
  scadenzaQuota: string;
  statoCertificato: Stato;
  scadenzaCertificato: string;
  certificatoUrl: string;
  schedaUrl: string;
};

function TesseraCliente({ cliente }: { cliente: Grafico }) {
  return (
    <div className="relative w-full">
  <div className="card-glow" />
  

  <article className="relative w-full overflow-hidden rounded-[32px] border border-zinc-500/70 bg-[#101112] shadow-[0_35px_80px_rgba(0,0,0,0.75)]">
      <div className="grid min-h-[390px] grid-cols-[29%_71%] sm:min-h-[430px]">
        <div className="relative overflow-hidden border-r border-red-600/30 bg-[#090a0b]">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at center, rgba(255,255,255,.18) 1px, transparent 1px)",
              backgroundSize: "9px 9px",
            }}
          />
          <div className="absolute -right-[56px] top-[-30px] h-[125%] w-[82px] rotate-[15deg] border-r-2 border-red-600 bg-black/80" />
          <Image
            src="/logo-small.png"
            alt="Logo MF"
            width={150}
            height={150}
            className="absolute left-1/2 top-1/2 z-10 h-28 w-auto -translate-x-1/2 -translate-y-1/2 object-contain sm:h-32"
            priority
          />
        </div>
        <div className="relative flex flex-col p-6 sm:p-9">
          <div className="flex justify-center">
            <Image
              src="/logo.png"
              alt="MinosFit"
              width={290}
              height={100}
              className="h-16 w-auto object-contain sm:h-20"
            />
          </div>
          <div className="mt-7 grid grid-cols-2 gap-5">
            <Dato etichetta="Nome" valore={cliente.nome} />
            <Dato etichetta="Cognome" valore={cliente.cognome} />
          </div>
          <div className="my-6 border-t border-zinc-700/80" />
          <div className="space-y-4">
            <Riga
              icona={<CreditCard size={20} />}
              testo="Abbonamento"
              stato={cliente.statoAbbonamento}
            />
            <Riga
              icona={<UsersRound size={20} />}
              testo="Quota associativa"
              stato={cliente.statoQuota}
            />
            <Riga
              icona={<HeartPulse size={20} />}
              testo="Certificato medico"
              stato={cliente.statoCertificato}
            />
          </div>
          <p className="absolute bottom-4 right-6 text-xs font-black tracking-wider text-red-500">
            {cliente.codice}
          </p>
        </div>
      </div>
    </article>
    </div>
  );
}

function SchedaSecondaria({
  sezione,
  cliente,
  richiestaInviata,
  onAbbonamento,
  onCertificato,
  onPrenotazione,
  onScheda,
}: {
  sezione: Sezione;
  cliente: Grafico;
  richiestaInviata: boolean;
  onAbbonamento: () => void;
  onCertificato: () => void;
  onPrenotazione: () => void;
  onScheda: () => void;
}) {
  if (sezione.id === "abbonamento")
    return (
      <Card titolo="Abbonamento" icona={sezione.icona}>
        <Info
          icona={<CreditCard size={19} />}
          etichetta="Piano"
          valore={cliente.abbonamento}
        />
        <Info
          icona={<ReceiptText size={19} />}
          etichetta="Data pagamento"
          valore={cliente.pagamentoAbbonamento}
        />
        <Info
          icona={<CalendarDays size={19} />}
          etichetta="Scadenza"
          valore={cliente.scadenzaAbbonamento}
        />
        <div className="mt-4 flex justify-end">
          <Badge stato={cliente.statoAbbonamento} />
        </div>
        <Action onClick={onAbbonamento}>Rinnova abbonamento</Action>
      </Card>
    );

  if (sezione.id === "quota")
    return (
      <Card titolo="Quota associativa" icona={sezione.icona}>
        <Info
          icona={<ReceiptText size={19} />}
          etichetta="Data pagamento"
          valore={cliente.pagamentoQuota}
        />
        <Info
          icona={<CalendarDays size={19} />}
          etichetta="Scadenza"
          valore={cliente.scadenzaQuota}
        />
        <div className="mt-4 flex justify-end">
          <Badge stato={cliente.statoQuota} />
        </div>
        <Action
          onClick={() =>
            alert(
              "Il rinnovo online della quota verrà collegato nel prossimo passaggio.",
            )
          }
        >
          Rinnova quota associativa
        </Action>
      </Card>
    );

  if (sezione.id === "certificato")
    return (
      <Card titolo="Certificato medico" icona={sezione.icona}>
        <Info
          icona={<CalendarDays size={19} />}
          etichetta="Scadenza"
          valore={cliente.scadenzaCertificato}
        />
        <div className="mt-4 flex justify-end">
          <Badge stato={cliente.statoCertificato} />
        </div>
        <Action onClick={onCertificato}>Carica certificato PDF</Action>
        {cliente.certificatoUrl && (
          <a
            href={cliente.certificatoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block rounded-2xl border border-zinc-700 bg-zinc-900 px-6 py-4 text-center text-sm font-black uppercase"
          >
            Visualizza certificato
          </a>
        )}
      </Card>
    );

  if (sezione.id === "prenotazioni")
    return (
      <Card titolo="Prenotazioni PT" icona={sezione.icona}>
        <p className="text-sm leading-7 text-zinc-300">
          Scegli il personal trainer, la data e l’orario. Il costo è di 10 €,
          con pagamento in presenza.
        </p>
        <Action onClick={onPrenotazione}>Apri calendario PT</Action>
      </Card>
    );

  if (sezione.id === "schede")
    return (
      <Card titolo="Le mie schede" icona={sezione.icona}>
        {cliente.schedaUrl ? (
          <a
            href={cliente.schedaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl border border-red-600 bg-zinc-900 px-6 py-4 text-center text-sm font-black uppercase"
          >
            Apri scheda PDF
          </a>
        ) : (
          <p className="text-sm text-zinc-400">Nessuna scheda attiva.</p>
        )}
        <Action
          onClick={onScheda}
          disabled={richiestaInviata}
          verde={richiestaInviata}
        >
          {richiestaInviata ? "✓ Richiesta inviata" : "Richiedi nuova scheda"}
        </Action>
      </Card>
    );

  if (sezione.id === "ia")
    return (
      <Card titolo="Assistente IA" icona={sezione.icona}>
        <p className="text-sm leading-7 text-zinc-300">
          La chat IA reale verrà collegata nel prossimo passaggio.
        </p>
        <Action onClick={() => alert("Chat IA in preparazione.")}>
          Apri assistente IA
        </Action>
      </Card>
    );

  return (
    <Card titolo="Contatti" icona={sezione.icona}>
      <a
        href="https://wa.me/393275396296"
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-2xl border border-zinc-700 bg-zinc-900 px-6 py-4 text-center text-sm font-black"
      >
        Simone Totaro — WhatsApp
      </a>
      <a
        href="https://wa.me/393286693919"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 block rounded-2xl border border-zinc-700 bg-zinc-900 px-6 py-4 text-center text-sm font-black"
      >
        Daniele Totaro — WhatsApp
      </a>
    </Card>
  );
}

function Card({
  titolo,
  icona,
  children,
}: {
  titolo: string;
  icona: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative w-full">
  <div className="card-glow" />

  <article className="relative flex min-h-[390px] w-full flex-col rounded-[32px] border border-zinc-700 bg-gradient-to-br from-[#151617] to-[#090a0b] p-8 shadow-[0_35px_80px_rgba(0,0,0,0.75)]">
      <div className="flex items-center gap-5 text-red-500">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-red-600/50 bg-red-950/20 shadow-[0_0_20px_rgba(220,38,38,0.12)]">
          {icona}
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-500">
            Area cliente
          </p>
          <h2 className="mt-3 text-3xl font-black text-white">{titolo}</h2>
        </div>
      </div>
      <div className="mt-10 flex flex-1 flex-col rounded-2xl border border-zinc-800 bg-black/40 p-6">
        {children}
      </div>
    </article>
    </div>
  );
}

function Info({
  icona,
  etichetta,
  valore,
}: {
  icona: ReactNode;
  etichetta: string;
  valore: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4 border-b border-zinc-800 pb-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-red-600/30 bg-red-950/20 text-red-500">
          {icona}
        </span>
        <span className="text-sm font-bold text-zinc-400">{etichetta}</span>
      </div>
      <span className="text-right text-sm font-black">{valore}</span>
    </div>
  );
}

function Action({
  children,
  onClick,
  disabled = false,
  verde = false,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  verde?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`mt-8 rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-wide transition ${verde ? "bg-green-600 shadow-[0_0_24px_rgba(22,163,74,0.22)]" : "bg-red-600 shadow-[0_0_24px_rgba(220,38,38,0.28)] hover:bg-red-500 hover:shadow-[0_0_34px_rgba(220,38,38,0.42)]"}`}
    >
      {children}
    </button>
  );
}

function PopupAbbonamento({
  onChiudi,
  onPaga,
}: {
  onChiudi: () => void;
  onPaga: (tipo: string) => void;
}) {
  const piani = [
    { nome: "Mensile", prezzo: 35, tipo: "mensile" },
    { nome: "Trimestrale", prezzo: 95, tipo: "trimestrale" },
    { nome: "Semestrale", prezzo: 180, tipo: "semestrale" },
    { nome: "Annuale", prezzo: 300, tipo: "annuale" },
  ];
  return (
    <Modal titolo="Rinnova abbonamento" onChiudi={onChiudi}>
      <p className="mb-5 text-center text-zinc-300">Scegli il pacchetto.</p>
      <div className="space-y-4">
        {piani.map((p) => (
          <button
            key={p.tipo}
            onClick={() => onPaga(p.tipo)}
            className="flex w-full justify-between rounded-2xl border border-zinc-700 bg-zinc-900 p-4 font-black"
          >
            <span>{p.nome}</span>
            <span>{p.prezzo} €</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

function PopupScheda({
  richiestaInviata,
  onPaga,
  onChiudi,
}: {
  richiestaInviata: boolean;
  onPaga: () => void;
  onChiudi: () => void;
}) {
  return (
    <Modal titolo="Nuova scheda" onChiudi={onChiudi}>
      <p className="mb-5 text-center text-zinc-300">
        Per richiedere una nuova scheda effettua prima il pagamento.
      </p>
      <div className="mb-5 rounded-2xl border border-zinc-700 bg-zinc-900 p-4">
        <p className="text-xl font-black">Costo scheda: 10 €</p>
        <p className="mt-1 text-sm text-zinc-400">
          Dopo il pagamento la richiesta verrà inviata allo staff.
        </p>
      </div>
      <button
        onClick={onPaga}
        disabled={richiestaInviata}
        className={`w-full rounded-2xl p-4 font-black ${richiestaInviata ? "bg-green-600" : "bg-red-600"}`}
      >
        {richiestaInviata ? "✓ Richiesta già inviata" : "Paga la scheda"}
      </button>
    </Modal>
  );
}

function PopupPrenotazione({
  operatore,
  setOperatore,
  data,
  setData,
  ora,
  setOra,
  errore,
  inviata,
  onConferma,
  onChiudi,
}: {
  operatore: string;
  setOperatore: (v: string) => void;
  data: string;
  setData: (v: string) => void;
  ora: string;
  setOra: (v: string) => void;
  errore: string;
  inviata: boolean;
  onConferma: () => void;
  onChiudi: () => void;
}) {
  const orari = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
  ];
  return (
    <Modal titolo="Prenota PT" onChiudi={onChiudi}>
      <label className="text-zinc-400">Personal trainer</label>
      <select
        value={operatore}
        onChange={(e) => setOperatore(e.target.value)}
        className="mb-4 mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 p-4"
      >
        <option>Simone Totaro</option>
        <option>Daniele Totaro</option>
        <option>Qualsiasi operatore</option>
      </select>
      <label className="text-zinc-400">Data</label>
      <input
        type="date"
        value={data}
        onChange={(e) => setData(e.target.value)}
        className="mb-4 mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 p-4"
      />
      <label className="text-zinc-400">Orario</label>
      <select
        value={ora}
        onChange={(e) => setOra(e.target.value)}
        className="mb-4 mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 p-4"
      >
        <option value="">Seleziona orario</option>
        {orari.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <div className="mb-4 rounded-2xl border border-zinc-700 bg-zinc-900 p-4">
        <p className="font-black">Costo: 10 €</p>
        <p className="text-sm text-zinc-400">Pagamento in presenza</p>
      </div>
      {errore && (
        <p className="mb-4 text-center font-bold text-red-500">❌ {errore}</p>
      )}
      <button
        onClick={onConferma}
        className="w-full rounded-2xl bg-red-600 p-4 font-black"
      >
        Conferma prenotazione
      </button>
      {inviata && (
        <p className="mt-4 text-center font-black text-green-500">
          ✅ Prenotazione inviata
        </p>
      )}
    </Modal>
  );
}

function Modal({
  titolo,
  onChiudi,
  children,
}: {
  titolo: string;
  onChiudi: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 px-4">
      <div className="w-full max-w-md rounded-[2rem] border border-red-600 bg-zinc-950 p-6">
        <h2 className="mb-5 text-center text-2xl font-black text-red-500">
          {titolo}
        </h2>
        {children}
        <button
          onClick={onChiudi}
          className="mt-4 w-full rounded-2xl border border-zinc-700 bg-zinc-900 p-4 font-black"
        >
          Chiudi
        </button>
      </div>
    </div>
  );
}

function Dato({ etichetta, valore }: { etichetta: string; valore: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">
        {etichetta}
      </p>
      <p className="mt-1 text-xl font-black">{valore}</p>
    </div>
  );
}
function Riga({
  icona,
  testo,
  stato,
}: {
  icona: ReactNode;
  testo: string;
  stato: Stato;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-red-600/40 bg-red-950/20 text-red-500">
        {icona}
      </span>
      <span className="flex-1 text-sm font-bold">{testo}</span>
      <Badge stato={stato} />
    </div>
  );
}
function Badge({ stato }: { stato: Stato }) {
  let s = "border-zinc-600 text-zinc-400";
  if (stato === "ATTIVO") s = "border-emerald-500 text-emerald-400";
  if (stato === "IN SCADENZA") s = "border-orange-500 text-orange-400";
  if (stato === "SCADUTO") s = "border-red-600 text-red-500";
  return (
    <span
      className={`inline-flex min-w-[92px] justify-center rounded-full border px-3 py-2 text-[10px] font-black uppercase ${s}`}
    >
      {stato}
    </span>
  );
}
function NavButton({
  testo,
  icona,
  attivo = false,
  onClick,
}: {
  testo: string;
  icona: ReactNode;
  attivo?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex min-w-[55px] flex-col items-center gap-1.5 rounded-2xl px-2 py-2 text-[10px] font-bold transition sm:min-w-[90px] sm:text-sm ${attivo ? "text-red-500" : "text-zinc-500 hover:text-white"}`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${attivo ? "bg-red-950/35" : ""}`}
      >
        {icona}
      </span>
      <span>{testo}</span>
      {attivo && (
        <span className="absolute -bottom-1 h-[3px] w-12 rounded-full bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.8)]" />
      )}
    </button>
  );
}
function Notifica({ titolo, testo }: { titolo: string; testo: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/35 p-5">
      <p className="font-black">{titolo}</p>
      <p className="mt-2 text-sm text-zinc-400">{testo}</p>
    </div>
  );
}