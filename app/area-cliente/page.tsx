"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
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
import PrenotazioniPT from "./components/PrenotazioniPT";
import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";

type Stato =
  | "ATTIVO"
  | "IN SCADENZA"
  | "SCADUTO"
  | "NON IMPOSTATO"
  | "IN VERIFICA"
  | "RIFIUTATO";

type PraticaCertificato = {
  id: string;
  stato: "da_verificare" | "approvato" | "rifiutato";
  data_rilascio: string;
  data_scadenza: string;
  file_nome: string | null;
  file_url: string | null;
  created_at: string;
};
type PraticaScheda = {
  id: string;
  stato: "in_attesa" | "attiva" | "scaduta" | "rifiutata" | "completata";
  richiesta_il: string | null;
  attivata_il: string | null;
  scadenza: string | null;
  note_admin: string | null;
};
type Agevolazione = {
  id: string;
  tipo: "studente" | "over_60";
  stato:
    | "da_verificare"
    | "approvata"
    | "rifiutata"
    | "sospesa"
    | "scaduta";
  richiesta_il: string | null;
  approvata_il: string | null;
  valida_fino_al: string | null;
  note_admin: string | null;
};
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
  id: "agevolazioni",
  nome: "Agevolazioni",
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
  id: "corsi",
  nome: "Corsi",
  icona: <UsersRound size={22} strokeWidth={2.2} />,
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
  const [cliente, setCliente] = useState<any>(null);
  const [accessoVerificato, setAccessoVerificato] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [menuAperto, setMenuAperto] = useState(false);
  const [notificheAperte, setNotificheAperte] = useState(false);
  const [sezioneAttiva, setSezioneAttiva] = useState(0);
  const [popupAbbonamentoAperto, setPopupAbbonamentoAperto] = useState(false);
  const [storicoPagamentiAperto, setStoricoPagamentiAperto] = useState(false);
  const [storicoPagamenti, setStoricoPagamenti] = useState<any[]>([]);
  const [storicoQuotaAperto, setStoricoQuotaAperto] = useState(false);
const [storicoQuota, setStoricoQuota] = useState<any[]>([]);
  const [popupSchedaAperto, setPopupSchedaAperto] = useState(false);
  const [richiestaInviata, setRichiestaInviata] = useState(false);
  const [calendarioAperto, setCalendarioAperto] = useState(false);

  const [operatore, setOperatore] = useState("Simone Totaro");
  const [dataPrenotazione, setDataPrenotazione] = useState("");
  const [oraPrenotazione, setOraPrenotazione] = useState("");
  const [slotOccupati, setSlotOccupati] = useState<string[]>([]);
  const [tipoServizioPT, setTipoServizioPT] = useState<
  "singola" | "pacchetto" | "personal" | "consulenza_gratuita"
>("singola");
  const [prenotazioneInviata, setPrenotazioneInviata] = useState(false);
  const [errorePrenotazione, setErrorePrenotazione] = useState("");
  const [praticaCertificato, setPraticaCertificato] =
    useState<PraticaCertificato | null>(null);
    const [praticaScheda, setPraticaScheda] =
  useState<PraticaScheda | null>(null);
  const [agevolazione, setAgevolazione] =
  useState<Agevolazione | null>(null);
  const [popupPTAperto, setPopupPTAperto] = useState(false);
 

  useEffect(() => {
    void caricaClienteAggiornato();
  }, []);
  useEffect(() => {
  if (!Capacitor.isNativePlatform()) return;

  const configuraNotifichePush = async () => {
    try {
      let permessi = await PushNotifications.checkPermissions();

      if (permessi.receive === "prompt") {
        permessi = await PushNotifications.requestPermissions();
      }

      if (permessi.receive !== "granted") {
        console.log("Permesso notifiche non concesso");
        return;
      }

      await PushNotifications.addListener("registration", (token) => {
  console.log("TOKEN FCM MINOS FIT:", token.value);
  setFcmToken(token.value);
});
      await PushNotifications.addListener("registrationError", (errore) => {
        console.error("Errore registrazione notifiche:", errore);
      });

      await PushNotifications.addListener(
        "pushNotificationReceived",
        (notifica) => {
          console.log("Notifica ricevuta:", notifica);
        },
      );

      await PushNotifications.addListener(
        "pushNotificationActionPerformed",
        (azione) => {
          console.log("Notifica aperta:", azione.notification);
        },
      );

      await PushNotifications.register();
    } catch (errore) {
      console.error("Errore configurazione notifiche push:", errore);
    }
  };

  void configuraNotifichePush();

  return () => {
    void PushNotifications.removeAllListeners();
  };
}, []);
useEffect(() => {
  if (!cliente?.id || !fcmToken) return;

  async function salvaTokenPush() {
    try {
      const risposta = await fetch("/api/push-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clienteId: cliente.id,
          token: fcmToken,
          piattaforma: "android",
        }),
      });

      const dati = await risposta.json();

      if (!risposta.ok) {
        console.error(
          "ERRORE API PUSH TOKEN:",
          JSON.stringify(dati),
        );
        return;
      }

      console.log("Token push salvato correttamente");
    } catch (errore) {
      console.error(
        "ERRORE SALVATAGGIO TOKEN PUSH:",
        errore,
      );
    }
  }

  void salvaTokenPush();
}, [cliente?.id, fcmToken]);


useEffect(() => {
  async function caricaSlotOccupati() {
    if (!operatore || !dataPrenotazione) {
      setSlotOccupati([]);
      return;
    }

    try {
      const risposta = await fetch("/api/prenotazioni-pt/slot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operatore,
          data: dataPrenotazione,
        }),
      });

      const dati = await risposta.json();
      

      if (!risposta.ok) {
        console.error("Errore caricamento slot PT:", dati.error);
        setSlotOccupati([]);
        return;
      }

      setSlotOccupati(dati.slotOccupati || []);

      // Se l'orario selezionato è diventato occupato, lo deselezioniamo.
      if (
        oraPrenotazione &&
        (dati.slotOccupati || []).includes(oraPrenotazione)
      ) {
        setOraPrenotazione("");
      }
    } catch (error) {
      console.error("Errore caricamento slot PT:", error);
      setSlotOccupati([]);
    }
  }

  void caricaSlotOccupati();
}, [operatore, dataPrenotazione]);

  useEffect(() => {
  if (!cliente?.id) return

  async function verificaPagamento() {
    const params = new URLSearchParams(window.location.search)

    const esito = params.get("pagamento")
    const sessionId = params.get("session_id")

    if (esito === "cancel") {
      window.history.replaceState({}, "", "/area-cliente")
      return
    }

    if (esito !== "success" || !sessionId) {
      return
    }

    try {
      const res = await fetch("/api/verifica-pagamento", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || "Errore durante la verifica del pagamento")
        return
      }

      if (data.cliente) {
        setCliente(data.cliente)

        localStorage.setItem(
          "cliente",
          JSON.stringify(data.cliente)
        )

        localStorage.setItem(
          "utente",
          JSON.stringify(data.cliente)
        )
      }

      const scadenzaFormattata =
        data.cliente?.abbonamento_scadenza
          ? new Date(
              `${data.cliente.abbonamento_scadenza}T00:00:00`
            ).toLocaleDateString("it-IT")
          : "Non disponibile"

      alert(
        `Pagamento confermato ✅\nNuova scadenza: ${scadenzaFormattata}`
      )
    } catch (error) {
      console.error("Errore verifica pagamento:", error)

      alert(
        "Si è verificato un errore durante la verifica del pagamento."
      )
    } finally {
      window.history.replaceState({}, "", "/area-cliente")
    }
  }

  void verificaPagamento()
}, [cliente?.id])



  async function caricaClienteAggiornato() {
    const { data: authData, error: authError } =
  await supabase.auth.getUser();

if (authError || !authData.user) {
  setCliente(null);
  router.replace("/login/accesso");
  return;
}

const base = { id: authData.user.id };

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", base.id)
      .single();
    if (error || !data) return router.push("/login/accesso");

    setCliente(data);
    setAccessoVerificato(true);
    localStorage.setItem("cliente", JSON.stringify(data));
    localStorage.setItem("utente", JSON.stringify(data));

    try {
      const rispostaCertificato = await fetch("/api/certificato-medico/stato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId: data.id }),
        cache: "no-store",
      });

      const datiCertificato = await rispostaCertificato.json();

      if (!rispostaCertificato.ok) {
        console.error("Errore caricamento pratica certificato:", datiCertificato.error);
        setPraticaCertificato(null);
      } else {
        setPraticaCertificato(datiCertificato.pratica || null);
      }
    } catch (errorePratica) {
      console.error("Errore caricamento pratica certificato:", errorePratica);
      setPraticaCertificato(null);
    }

   try {
  const rispostaScheda = await fetch("/api/schede/stato", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clienteId: data.id }),
    cache: "no-store",
  });

  const datiScheda = await rispostaScheda.json();

  if (!rispostaScheda.ok) {
    console.error(
      "Errore caricamento pratica scheda:",
      datiScheda.error,
    );

    setPraticaScheda(null);
    setRichiestaInviata(false);
  } else {
    const pratica = datiScheda.pratica || null;

    setPraticaScheda(pratica);

    setRichiestaInviata(
      pratica?.stato === "in_attesa" ||
      pratica?.stato === "attiva",
    );
  }
} catch (erroreScheda) {
  console.error("Errore caricamento pratica scheda:", erroreScheda);
  setPraticaScheda(null);
  setRichiestaInviata(false);
try {
  const rispostaAgevolazione = await fetch("/api/agevolazioni/stato", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clienteId: data.id }),
    cache: "no-store",
  });

  const datiAgevolazione = await rispostaAgevolazione.json();

  if (!rispostaAgevolazione.ok) {
    console.error(
      "Errore caricamento agevolazione:",
      datiAgevolazione.error,
    );

    setAgevolazione(null);
  } else {
    setAgevolazione(datiAgevolazione.agevolazione || null);
  }
} catch (erroreAgevolazione) {
  console.error(
    "Errore caricamento agevolazione:",
    erroreAgevolazione,
  );

  setAgevolazione(null);
}
}
}
  async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Errore durante il logout:", error.message);
    alert("Impossibile completare il logout. Riprova.");
    return;
  }

  localStorage.removeItem("cliente");
  localStorage.removeItem("utente");

  setCliente(null);
  router.replace("/login/accesso");
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

  async function avviaPagamento(tipo: string) {
    if (!cliente) return;

    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo,
        clienteId: cliente.id,
        clienteEmail: cliente.email || undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.url) {
      return alert(data.error || "Errore pagamento");
    }

    window.location.href = data.url;
  }

  async function confermaPrenotazione() {
  if (!cliente) return;

  if (!operatore || !dataPrenotazione || !oraPrenotazione) {
    setErrorePrenotazione("Compila tutti i campi");
    return;
  }

  try {
    setErrorePrenotazione("");
    setPrenotazioneInviata(false);

    const risposta = await fetch("/api/prenotazioni-pt/richiedi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clienteId: cliente.id,
        operatore,
        data: dataPrenotazione,
        ora: oraPrenotazione,
        tipoServizio: tipoServizioPT,
      }),
    });

    const dati = await risposta.json();

    if (!risposta.ok) {
      setErrorePrenotazione(
        dati.error || "Errore durante l'invio della prenotazione.",
      );
      return;
    }

    setErrorePrenotazione("");
    setPrenotazioneInviata(true);
  } catch (error) {
    console.error("Errore richiesta prenotazione PT:", error);

    setErrorePrenotazione(
      "Si è verificato un errore durante l'invio della richiesta.",
    );
  }
}

 async function inviaRichiestaScheda() {
  if (!cliente || richiestaInviata) return;

  try {
    const risposta = await fetch("/api/schede/richiedi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clienteId: cliente.id,
      }),
    });

    const dati = await risposta.json();

    if (!risposta.ok) {
      alert(dati.error || "Errore durante l'invio della richiesta.");
      return;
    }

    setPraticaScheda(dati.pratica || null);
    setRichiestaInviata(true);
    setPopupSchedaAperto(false);

    alert("Richiesta scheda inviata allo staff ✅");
  } catch (error) {
    console.error("Errore richiesta scheda:", error);
    alert("Si è verificato un errore durante l'invio della richiesta.");
  }
}

async function inviaRichiestaAgevolazione(
  tipo: "studente" | "over_60",
) {
  if (!cliente) return;

  try {
    const risposta = await fetch("/api/agevolazioni/richiedi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clienteId: cliente.id,
        tipo,
      }),
    });

    const dati = await risposta.json();

    if (!risposta.ok) {
      alert(
        dati.error ||
          "Errore durante l'invio della richiesta di agevolazione.",
      );
      return;
    }

    setAgevolazione(dati.agevolazione || null);

    alert("Richiesta di agevolazione inviata allo staff ✅");
  } catch (error) {
    console.error("Errore richiesta agevolazione:", error);

    alert(
      "Si è verificato un errore durante l'invio della richiesta.",
    );
  }
}

  async function apriStoricoPagamenti() {
  if (!cliente?.id) return;

  try {
    const risposta = await fetch("/api/pagamenti/storico", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clienteId: cliente.id,
      }),
      cache: "no-store",
    });

    const dati = await risposta.json();

    if (!risposta.ok) {
      alert(
        dati.error ||
          "Errore durante il caricamento dello storico pagamenti.",
      );
      return;
    }

    setStoricoPagamenti(dati.pagamenti || []);
    setStoricoPagamentiAperto(true);
  } catch (error) {
    console.error(
      "Errore caricamento storico pagamenti:",
      error,
    );

    alert(
      "Si è verificato un errore durante il caricamento dello storico pagamenti.",
    );
  }
}
async function apriStoricoQuota() {
  if (!cliente?.id) return;

  try {
    const risposta = await fetch("/api/quota-associativa/storico", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clienteId: cliente.id,
      }),
      cache: "no-store",
    });

    const dati = await risposta.json();

    if (!risposta.ok) {
      alert(
        dati.error ||
          "Errore durante il caricamento dello storico quota.",
      );
      return;
    }

    setStoricoQuota(dati.pagamenti || []);
    setStoricoQuotaAperto(true);
  } catch (error) {
    console.error(
      "Errore caricamento storico quota:",
      error,
    );

    alert(
      "Si è verificato un errore durante il caricamento dello storico quota.",
    );
  }
}function vaiAllaSezione(indice: number) {
    setSezioneAttiva(indice);
    setMenuAperto(false);
  }
  function schedaPrecedente() {
    setSezioneAttiva((i) => (i === 0 ? sezioni.length - 1 : i - 1));
  }
  function schedaSuccessiva() {
    setSezioneAttiva((i) => (i === sezioni.length - 1 ? 0 : i + 1));
  }

 if (!accessoVerificato || !cliente) {
  return null;
}
  const statoAbbonamento: Stato = calcolaStato(
  cliente.abbonamento_scadenza || cliente.scadenza,
  10
)

const statoQuota: Stato = calcolaStato(
  cliente.quota_associativa_scadenza,
  15
)

const statoCertificato: Stato =
  praticaCertificato?.stato === "da_verificare"
    ? "IN VERIFICA"
    : praticaCertificato?.stato === "rifiutato"
      ? "RIFIUTATO"
      : calcolaStato(cliente.certificato_scadenza, 15)

const clienteGrafico = {
  id: String(cliente.id || ""),
  email: cliente.email || "",
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

  certificatoDataRilascio:
    praticaCertificato?.data_rilascio || "",

  certificatoDataScadenzaPratica:
    praticaCertificato?.data_scadenza || "",

  certificatoFileNome:
    praticaCertificato?.file_nome || "",

  certificatoPraticaUrl:
    praticaCertificato?.file_url || "",

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
    statoCertificato,
    scadenzaCertificato: cliente.certificato_scadenza || "Non impostata",
    certificatoUrl: cliente.certificato_file_url || "",
    certificatoDataRilascio: praticaCertificato?.data_rilascio || "",
    certificatoDataScadenzaPratica: praticaCertificato?.data_scadenza || "",
    certificatoFileNome: praticaCertificato?.file_nome || "",
    certificatoPraticaUrl: praticaCertificato?.file_url || "",
    schedaUrl:
      cliente.schede_file_url || cliente["cliente.schede_file_url"] || "",
  };
  const numeroNotifiche =
  (grafico.statoCertificato === "IN SCADENZA" ? 1 : 0) +
  (grafico.statoCertificato === "IN VERIFICA" ? 1 : 0) +
  (grafico.statoCertificato === "RIFIUTATO" ? 1 : 0) +
  (richiestaInviata ? 1 : 0);

const haNotifiche = numeroNotifiche > 0;

  return (
   <main
  className={`bg-[#060708] text-white ${
    sezioneAttiva === 0
      ? "h-[100dvh] overflow-hidden"
      : "min-h-[100dvh] overflow-x-hidden"
  }`}
> <div className="pointer-events-none fixed inset-0">
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

      <header className="relative z-30 mx-auto flex h-[150px] w-full max-w-[1100px] items-end justify-center px-5 pb-4 sm:h-[112px] sm:items-center sm:pb-0">
       <div className="absolute left-5 top-5 sm:top-1/2 sm:-translate-y-1/2">
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
  {/* SALUTO CLIENTE */}
  <div className="mb-3 flex items-center justify-center gap-3">
    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-red-600 bg-zinc-900 shadow-[0_0_18px_rgba(220,38,38,0.25)]">
      <Image
        src={
          cliente.avatar_id
            ? `/avatars/${cliente.avatar_id}`
            : "/logo-small.png"
        }
        alt="Avatar"
        fill
        sizes="44px"
        className="object-cover"
      />
    </div>

    <p className="text-base font-black sm:text-lg">
      <span className="text-white">Ciao </span>
      <span className="text-red-500">
        {cliente.nickname || cliente.nome}
      </span>
    </p>
  </div>

  {/* MOTTO */}
  <p className="text-sm font-black uppercase tracking-[0.34em] text-white sm:text-lg">
    IL TUO UNICO LIMITE SEI TU
  </p>

  <div className="mx-auto mt-3 h-[3px] w-24 rounded-full bg-red-600 shadow-[0_0_18px_rgba(220,38,38,0.75)]" />
</div>
      </header>

    <section
  className={`relative z-10 mx-auto flex w-full max-w-[900px] flex-col items-center justify-center px-4 ${
    sezioneAttiva === 0
      ? "h-[calc(100dvh-150px)] overflow-hidden pb-[105px] pt-0 sm:min-h-[calc(100vh-100px)] sm:h-auto sm:overflow-visible sm:pb-32 sm:pt-2"
      : "min-h-[calc(100dvh-150px)] pb-32 pt-2 sm:min-h-[calc(100vh-100px)]"
  }`}
>
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
  praticaScheda={praticaScheda}
    agevolazione={agevolazione}
    onRichiestaAgevolazione={inviaRichiestaAgevolazione}
  onAbbonamento={() => setPopupAbbonamentoAperto(true)}
 onStoricoPagamenti={() => void apriStoricoPagamenti()}
  onCertificato={() => router.push("/area-cliente/certificato-medico")}
  onStoricoQuota={() => void apriStoricoQuota()}
 onPrenotazione={() => {
 
  setPrenotazioneInviata(false)
  setErrorePrenotazione("")
  setCalendarioAperto(true)
}}
onScheda={() => {
  setPopupSchedaAperto(true);
}}
  onPopupPTChange={setPopupPTAperto}
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

     <nav
  className={`fixed bottom-4 left-1/2 z-30 w-[calc(100%-24px)] max-w-[760px] -translate-x-1/2 items-center justify-around rounded-[34px] border border-zinc-800 bg-black/90 px-3 py-3 backdrop-blur-xl ${
    popupPTAperto ? "hidden" : "flex"
  }`}
>
        <NavButton
          testo="Home"
          icona={<Home size={24} strokeWidth={2.2} />}
          attivo={sezioneAttiva === 0}
          onClick={() => vaiAllaSezione(0)}
        />
     
        <NavButton
  testo="Prenotazioni"
  icona={<CalendarDays size={24} strokeWidth={2.2} />}
  attivo={sezioneAttiva === 5}
  onClick={() => vaiAllaSezione(5)}
/>
        <NavButton
  testo="Notifiche"
  icona={<Bell size={24} strokeWidth={2.2} />}
  badge={numeroNotifiche}
  onClick={() => setNotificheAperte(true)}
/>
       <NavButton
  testo="Profilo"
  icona={<CircleUserRound size={24} strokeWidth={2.2} />}
  onClick={() => router.push("/area-cliente/profilo")}
  
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
  className={`fixed left-0 top-0 z-50 flex h-[100dvh] w-[85%] max-w-[350px] flex-col overflow-hidden border-r border-red-600/20 bg-[#090a0b] p-5 transition-transform duration-300 ${
    menuAperto ? "translate-x-0" : "-translate-x-full"
  }`}
>
  {/* HEADER */}
  <div className="flex shrink-0 items-center justify-between">
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

  {/* MENU SCORREVOLE */}
  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
    <p className="mb-3 mt-6 px-3 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600">
      Area cliente
    </p>

    <nav className="space-y-1">
      {sezioni.map((s, i) => (
        <button
          key={s.id}
          type="button"
          onClick={() => vaiAllaSezione(i)}
          className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-sm font-bold ${
            sezioneAttiva === i
              ? "bg-red-600 text-white"
              : "text-zinc-300 hover:bg-zinc-900"
          }`}
        >
          <span
            className={`flex h-7 w-7 items-center justify-center ${
              sezioneAttiva === i ? "text-white" : "text-red-500"
            }`}
          >
            {s.icona}
          </span>

          <span>{s.nome}</span>
        </button>
      ))}
    </nav>

    <div className="my-4 border-t border-zinc-800" />

    <button
      type="button"
      onClick={() => {
  setMenuAperto(false);
  router.push("/area-cliente/eventi");
}}
      className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-zinc-300 hover:bg-zinc-900"
    >
      <CalendarDays size={22} className="text-red-500" />
      Eventi
    </button>
  </div>
  

  {/* PARTE FISSA IN BASSO */}
  <div className="shrink-0 border-t border-zinc-800 pt-3">
    <button
  type="button"
  onClick={() => {
    setMenuAperto(false);
    router.push("/area-cliente/profilo");
  }}
  className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left font-bold text-zinc-300 hover:bg-zinc-900"
>
  <UserRound size={22} className="text-red-500" />
  Il mio profilo
</button>

    <button
      type="button"
      onClick={logout}
      className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left font-bold text-red-500 hover:bg-red-950/30"
    >
      <LogOut size={22} />
      Esci
    </button>
  </div>
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
          {grafico.statoCertificato === "IN VERIFICA" && (
            <Notifica
              titolo="Certificato in verifica"
              testo="Il certificato è stato ricevuto ed è in attesa di controllo da parte dello staff."
            />
          )}
          {grafico.statoCertificato === "RIFIUTATO" && (
            <Notifica
              titolo="Certificato non approvato"
              testo="Apri la sezione Certificato medico per inviare un nuovo documento."
            />
          )}
          {richiestaInviata && (
            <Notifica
              titolo="Richiesta scheda inviata"
              testo="La tua richiesta è stata ricevuta dallo staff."
            />
          )}
          {grafico.statoCertificato !== "IN SCADENZA" &&
            grafico.statoCertificato !== "IN VERIFICA" &&
            grafico.statoCertificato !== "RIFIUTATO" &&
            !richiestaInviata && (
            <Notifica
              titolo="Nessuna nuova notifica"
              testo="Al momento non ci sono comunicazioni."
            />
          )}
        </div>
      </aside>

      {popupAbbonamentoAperto && (
        <PopupAbbonamento
          onChiudi={() => setPopupAbbonamentoAperto(false)}
          onPaga={avviaPagamento}
        />
      )}
      {storicoPagamentiAperto && (
  <PopupStoricoPagamenti
    pagamenti={storicoPagamenti}
    onChiudi={() => setStoricoPagamentiAperto(false)}
  />
)}
{storicoQuotaAperto && (
  <PopupStoricoQuota
    pagamenti={storicoQuota}
    onChiudi={() => setStoricoQuotaAperto(false)}
  />
)}
      {popupSchedaAperto && (
  <PopupScheda
    richiestaInviata={richiestaInviata}
    onPaga={() => void inviaRichiestaScheda()}
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
          slotOccupati={slotOccupati}
          tipoServizio={tipoServizioPT}
setTipoServizio={setTipoServizioPT}
          errore={errorePrenotazione}
          inviata={prenotazioneInviata}
          onConferma={() => void confermaPrenotazione()}
         onChiudi={() => {
  setCalendarioAperto(false)

 
}}
        />
      )}
    </main>
  );
}

type Grafico = {
  id: string;
  email: string;
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
  certificatoDataRilascio: string;
  certificatoDataScadenzaPratica: string;
  certificatoFileNome: string;
  certificatoPraticaUrl: string;
  schedaUrl: string;
};

function TesseraCliente({ cliente }: { cliente: Grafico }) {
  return (
    <div className="card-stage relative mx-auto w-full max-w-[760px]">
      <div className="card-glow" />
      <div className="card-red-aura" />

      <article className="member-card relative aspect-[1.52/1] w-full overflow-hidden rounded-[18px] border border-zinc-500/70 bg-[#101112] shadow-[0_24px_55px_rgba(0,0,0,0.75)] sm:aspect-[1.586/1] sm:rounded-[32px] sm:shadow-[0_35px_80px_rgba(0,0,0,0.75)]">
        <div className="card-sheen" />
        <div className="card-inner-light" />

        <div
          className="pointer-events-none absolute inset-0 z-[1] opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,255,255,0.12) 4px)",
          }}
        />

        <div className="relative z-[2] grid h-full grid-cols-[27%_73%] sm:grid-cols-[29%_71%]">
          <div className="relative overflow-hidden border-r border-red-600/30 bg-[#090a0b]">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at center, rgba(255,255,255,.18) 1px, transparent 1px)",
                backgroundSize: "7px 7px",
              }}
            />

            <div className="absolute -right-[34px] top-[-18px] h-[125%] w-[50px] rotate-[15deg] border-r border-red-600 bg-black/80 shadow-[12px_0_28px_rgba(220,38,38,0.10)] sm:-right-[56px] sm:top-[-30px] sm:w-[82px] sm:border-r-2" />

            <Image
              src="/logo-small.png"
              alt="Logo MF"
              width={150}
              height={150}
              priority
              className="absolute left-1/2 top-1/2 z-10 h-12 w-auto -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.12)] sm:h-28"
            />
          </div>

          <div className="relative flex min-w-0 flex-col px-3 py-2.5 sm:p-9">
            <div className="flex justify-center">
              <Image
                src="/logo.png"
                alt="MinosFit"
                width={290}
                height={100}
                priority
                className="h-7 w-auto object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.08)] sm:h-20"
              />
            </div>

            <div className="mt-1.5 grid min-w-0 grid-cols-2 gap-2 sm:mt-7 sm:gap-5">
              <Dato etichetta="Nome" valore={cliente.nome} />
              <Dato etichetta="Cognome" valore={cliente.cognome} />
            </div>

            <div className="my-1.5 border-t border-zinc-700/80 sm:my-6" />

            <div className="space-y-1 sm:space-y-4">
              <Riga
                icona={<CreditCard size={14} />}
                testo="Abbonamento"
                stato={cliente.statoAbbonamento}
              />

              <Riga
                icona={<UsersRound size={14} />}
                testo="Quota associativa"
                stato={cliente.statoQuota}
              />

              <Riga
                icona={<HeartPulse size={14} />}
                testo="Certificato medico"
                stato={cliente.statoCertificato}
              />
            </div>

            <p className="absolute bottom-1 right-2 text-[6px] font-black tracking-wider text-red-500 sm:bottom-4 sm:right-6 sm:text-xs">
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
  onStoricoPagamenti,
  onStoricoQuota,
  praticaScheda,
  agevolazione,
  onRichiestaAgevolazione,
  onCertificato,
  onPrenotazione,
  onScheda,
  onPopupPTChange,
}: {
  sezione: Sezione;
  cliente: Grafico;
  richiestaInviata: boolean;
praticaScheda: PraticaScheda | null;
agevolazione: Agevolazione | null;
onRichiestaAgevolazione: (
  tipo: "studente" | "over_60",
) => Promise<void>;
onAbbonamento: () => void;
onStoricoPagamenti: () => void;
onStoricoQuota: () => void;
  onCertificato: () => void;
  onPrenotazione: () => void;
  onPopupPTChange: (aperto: boolean) => void;
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

<Action onClick={onAbbonamento}>
  Rinnova abbonamento
</Action>
<button
  type="button"
  onClick={onStoricoPagamenti}
  className="mt-3 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-6 py-4 text-sm font-black uppercase text-zinc-200 transition hover:border-red-600 hover:text-white"
>
  <span className="flex items-center justify-center gap-2">
    <ReceiptText size={18} />
    Storico pagamenti
  </span>
</button>
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
  onClick={() => {
    window.location.href = "/area-cliente/quota-associativa"
  }}
>
  {cliente.statoQuota === "ATTIVO"
    ? "Visualizza / rinnova quota"
    : "Compila domanda di tesseramento"}
</Action>
<button
  type="button"
  onClick={onStoricoQuota}
  className="mt-3 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-6 py-4 text-sm font-black uppercase text-zinc-200 transition hover:border-red-600 hover:text-white"
>
  <span className="flex items-center justify-center gap-2">
    <ReceiptText size={18} />
    Storico pagamenti
  </span>
</button>
      </Card>
    );
if (sezione.id === "agevolazioni") {
  const statoAgevolazione =
    agevolazione?.stato === "da_verificare"
      ? "IN VERIFICA"
      : agevolazione?.stato === "approvata"
        ? "AGEVOLAZIONE ATTIVA"
        : agevolazione?.stato === "rifiutata"
          ? "RIFIUTATA"
          : agevolazione?.stato === "sospesa"
            ? "SOSPESA"
            : agevolazione?.stato === "scaduta"
              ? "SCADUTA"
              : "NESSUNA RICHIESTA";

  const tipoAgevolazione =
    agevolazione?.tipo === "studente"
      ? "Studente universitario"
      : agevolazione?.tipo === "over_60"
        ? "Over 60"
        : "Non selezionata";

  return (
    <Card titolo="Agevolazioni" icona={sezione.icona}>
      <Info
        icona={<UsersRound size={19} />}
        etichetta="Tipologia"
        valore={tipoAgevolazione}
      />

      <Info
        icona={<ReceiptText size={19} />}
        etichetta="Stato"
        valore={statoAgevolazione}
      />

      {agevolazione?.richiesta_il && (
        <Info
          icona={<CalendarDays size={19} />}
          etichetta="Data richiesta"
          valore={new Date(
            agevolazione.richiesta_il,
          ).toLocaleDateString("it-IT")}
        />
      )}

      {agevolazione?.valida_fino_al && (
        <Info
          icona={<CalendarDays size={19} />}
          etichetta="Valida fino al"
          valore={new Date(
            `${agevolazione.valida_fino_al}T00:00:00`,
          ).toLocaleDateString("it-IT")}
        />
      )}

      <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
        <p className="text-sm font-black text-white">
          Tariffe agevolate
        </p>

        <div className="mt-3 space-y-2 text-sm text-zinc-300">
          <p>Mensile — 35 €</p>
          <p>Trimestrale — 95 €</p>
          <p>Semestrale — 180 €</p>
          <p>Annuale — 300 €</p>
        </div>
      </div>

      {agevolazione?.stato === "da_verificare" && (
        <p className="mt-4 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 text-sm leading-6 text-orange-200">
          La richiesta è stata ricevuta ed è in attesa di verifica da parte
          dello staff.
        </p>
      )}

      {agevolazione?.stato === "approvata" && (
        <p className="mt-4 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-sm leading-6 text-green-200">
          La tua agevolazione è attiva. Puoi accedere alle tariffe ridotte
          fino alla data di scadenza indicata.
        </p>
      )}

      {agevolazione?.stato === "rifiutata" && (
        <p className="mt-4 rounded-2xl border border-red-600/30 bg-red-950/20 p-4 text-sm leading-6 text-red-300">
          La richiesta non è stata approvata dallo staff.
          {agevolazione.note_admin
            ? ` Motivo: ${agevolazione.note_admin}`
            : ""}
        </p>
      )}

      {agevolazione?.stato === "sospesa" && (
        <p className="mt-4 rounded-2xl border border-red-600/30 bg-red-950/20 p-4 text-sm leading-6 text-red-300">
          L&apos;agevolazione è stata sospesa dallo staff.
        </p>
      )}

      {agevolazione?.stato === "scaduta" && (
        <p className="mt-4 rounded-2xl border border-zinc-700 bg-zinc-900 p-4 text-sm leading-6 text-zinc-300">
          L&apos;agevolazione è scaduta. Puoi presentare una nuova richiesta.
        </p>
      )}

      {!agevolazione && (
  <>
    <p className="mt-4 text-xs leading-6 text-zinc-500">
      Per accedere alle tariffe ridotte è necessaria la verifica e
      l&apos;approvazione dello staff.
    </p>

    <div className="mt-5 space-y-3">
      <button
        type="button"
        onClick={() => onRichiestaAgevolazione("studente")}
        className="w-full rounded-2xl bg-red-600 px-5 py-4 text-sm font-black uppercase text-white transition hover:bg-red-500"
      >
        🎓 Richiedi agevolazione studente
      </button>

      <button
        type="button"
        onClick={() => onRichiestaAgevolazione("over_60")}
        className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 text-sm font-black uppercase text-white transition hover:bg-zinc-800"
      >
        👤 Richiedi agevolazione Over 60
      </button>
    </div>
  </>
)}
    </Card>
  );
}

  if (sezione.id === "certificato") {
    const praticaInVerifica = cliente.statoCertificato === "IN VERIFICA";
    const praticaRifiutata = cliente.statoCertificato === "RIFIUTATO";

    return (
      <Card titolo="Certificato medico" icona={sezione.icona}>
        {praticaInVerifica || praticaRifiutata ? (
          <>
            <Info
              icona={<CalendarDays size={19} />}
              etichetta="Data rilascio"
              valore={formattaDataCertificato(cliente.certificatoDataRilascio)}
            />
            <Info
              icona={<CalendarDays size={19} />}
              etichetta="Data scadenza dichiarata"
              valore={formattaDataCertificato(
                cliente.certificatoDataScadenzaPratica,
              )}
            />
            {cliente.certificatoFileNome && (
              <Info
                icona={<FileText size={19} />}
                etichetta="Documento"
                valore={cliente.certificatoFileNome}
              />
            )}
          </>
        ) : (
          <Info
            icona={<CalendarDays size={19} />}
            etichetta="Scadenza"
            valore={cliente.scadenzaCertificato}
          />
        )}

        <div className="mt-4 flex justify-end">
          <Badge stato={cliente.statoCertificato} />
        </div>

        {praticaInVerifica && (
          <p className="mt-5 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 text-sm leading-6 text-orange-200">
            Il certificato è stato ricevuto ed è in attesa di verifica da
            parte dello staff. Diventerà valido solo dopo l&apos;approvazione.
          </p>
        )}

        {praticaRifiutata && (
          <p className="mt-5 rounded-2xl border border-red-600/30 bg-red-950/20 p-4 text-sm leading-6 text-red-300">
            Il certificato inviato non è stato approvato. Puoi aprire la
            gestione certificato e inviarne uno nuovo.
          </p>
        )}

        <Action onClick={onCertificato}>
          {praticaInVerifica
            ? "Visualizza / gestisci certificato"
            : praticaRifiutata
              ? "Invia nuovo certificato"
              : cliente.statoCertificato === "NON IMPOSTATO" ||
                  cliente.statoCertificato === "SCADUTO"
                ? "Carica certificato medico"
                : "Visualizza / rinnova certificato"}
        </Action>

        {!praticaInVerifica &&
          !praticaRifiutata &&
          cliente.certificatoUrl && (
            <a
              href={cliente.certificatoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block rounded-2xl border border-zinc-700 bg-zinc-900 px-6 py-4 text-center text-sm font-black uppercase"
            >
              Visualizza certificato approvato
            </a>
          )}
      </Card>
    );
  }

  if (sezione.id === "prenotazioni")
    return (
      <Card titolo="Prenotazioni PT" icona={sezione.icona}>
       <PrenotazioniPT
  clienteId={cliente.id}
  clienteEmail={cliente.email || undefined}
  onPopupChange={onPopupPTChange}
/>
      </Card>
    );

if (sezione.id === "schede") {
  const statoScheda = praticaScheda?.stato;

  const statoTesto =
    statoScheda === "in_attesa"
      ? "IN ATTESA"
      : statoScheda === "attiva"
        ? "ATTIVA"
        : statoScheda === "scaduta"
          ? "SCADUTA"
          : statoScheda === "rifiutata"
            ? "RIFIUTATA"
            : statoScheda === "completata"
              ? "COMPLETATA"
              : "NESSUNA SCHEDA";

  return (
    <Card titolo="Le mie schede" icona={sezione.icona}>
      {praticaScheda ? (
        <>
          <Info
            icona={<FileText size={19} />}
            etichetta="Stato"
            valore={statoTesto}
          />

          {praticaScheda.richiesta_il && (
            <Info
              icona={<CalendarDays size={19} />}
              etichetta="Data richiesta"
              valore={new Date(
                praticaScheda.richiesta_il,
              ).toLocaleDateString("it-IT")}
            />
          )}

          {praticaScheda.attivata_il && (
            <Info
              icona={<CalendarDays size={19} />}
              etichetta="Data attivazione"
              valore={new Date(
                praticaScheda.attivata_il,
              ).toLocaleDateString("it-IT")}
            />
          )}

          {praticaScheda.scadenza && (
            <Info
              icona={<CalendarDays size={19} />}
              etichetta="Scadenza"
              valore={new Date(
                `${praticaScheda.scadenza}T00:00:00`,
              ).toLocaleDateString("it-IT")}
            />
          )}

          {statoScheda === "in_attesa" && (
            <p className="mt-3 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 text-sm leading-6 text-orange-200">
              La richiesta è stata ricevuta ed è in attesa di essere presa in
              carico dallo staff.
            </p>
          )}

          {statoScheda === "attiva" && (
            <p className="mt-3 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-sm leading-6 text-green-200">
              La tua scheda è attiva. La scheda di allenamento viene consegnata
              in formato cartaceo direttamente in palestra.
            </p>
          )}

          {statoScheda === "rifiutata" && (
            <p className="mt-3 rounded-2xl border border-red-600/30 bg-red-950/20 p-4 text-sm leading-6 text-red-300">
              La richiesta non è stata approvata dallo staff.
              {praticaScheda.note_admin
                ? ` Motivo: ${praticaScheda.note_admin}`
                : ""}
            </p>
          )}

          {statoScheda === "scaduta" && (
            <p className="mt-3 rounded-2xl border border-zinc-700 bg-zinc-900 p-4 text-sm leading-6 text-zinc-300">
              La precedente scheda è scaduta. Puoi richiederne una nuova.
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-zinc-400">
          Non hai ancora richiesto una scheda di allenamento.
        </p>
      )}

      <Action
        onClick={onScheda}
        disabled={
          statoScheda === "in_attesa" ||
          statoScheda === "attiva"
        }
        verde={
          statoScheda === "in_attesa" ||
          statoScheda === "attiva"
        }
      >
        {statoScheda === "in_attesa"
          ? "✓ Richiesta in attesa"
          : statoScheda === "attiva"
            ? "✓ Scheda attiva"
            : "Richiedi nuova scheda"}
      </Action>
    </Card>
  );
}
if (sezione.id === "corsi")
  return (
    <Card titolo="Corsi" icona={sezione.icona}>
      <div className="py-8 text-center">
        <UsersRound
          size={48}
          className="mx-auto text-red-500"
        />

        <h3 className="mt-5 text-2xl font-black text-white">
          Lavori in corso
        </h3>

        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-zinc-400">
          Stiamo preparando la nuova area dedicata ai corsi MinosFit.
          Presto potrai visualizzare corsi, orari e tutte le informazioni
          direttamente dalla tua area cliente.
        </p>

        <div className="mx-auto mt-6 h-1 w-20 rounded-full bg-red-600" />
      </div>
    </Card>
  );

 if (sezione.id === "ia")
  return (
    <Card titolo="Assistente IA" icona={sezione.icona}>
      <div className="py-8 text-center">
        <Bot
          size={48}
          className="mx-auto text-red-500"
        />

        <h3 className="mt-5 text-2xl font-black text-white">
          Lavori in corso
        </h3>

        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-zinc-400">
          Stiamo preparando il nuovo Assistente IA MinosFit.
          Presto potrai ricevere supporto e informazioni direttamente
          dalla tua area cliente.
        </p>

        <div className="mx-auto mt-6 h-1 w-20 rounded-full bg-red-600" />
      </div>
    </Card>
  );

 return (
  <Card titolo="Contatti" icona={sezione.icona}>
    <a
      href="tel:+393534488641"
      className="block rounded-2xl border border-zinc-700 bg-zinc-900 px-6 py-4 text-center text-sm font-black transition hover:border-red-600"
    >
      📞 Palestra — 353 448 8641
    </a>

    <a
      href="mailto:minosfitasd@gmail.com"
      className="mt-3 block rounded-2xl border border-zinc-700 bg-zinc-900 px-6 py-4 text-center text-sm font-black transition hover:border-red-600"
    >
      ✉️ minosfitasd@gmail.com
    </a>

    <a
      href="https://www.instagram.com/minos_fit_official/"
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 block rounded-2xl border border-zinc-700 bg-zinc-900 px-6 py-4 text-center text-sm font-black transition hover:border-red-600"
    >
      📸 @minos_fit_official
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
    { nome: "Mensile", prezzo: 40, tipo: "mensile" },
    { nome: "Trimestrale", prezzo: 110, tipo: "trimestrale" },
    { nome: "Semestrale", prezzo: 200, tipo: "semestrale" },
    { nome: "Annuale", prezzo: 360, tipo: "annuale" },
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
   <Modal titolo="Richiedi nuova scheda" onChiudi={onChiudi}>
      <p className="mb-5 text-center text-zinc-300">
        La scheda di allenamento è inclusa nel tuo abbonamento.
      </p>

      <div className="mb-5 rounded-2xl border border-zinc-700 bg-zinc-900 p-4">
        <p className="text-xl font-black">Nessun costo aggiuntivo</p>

        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Dopo l&apos;invio, la richiesta verrà presa in carico dallo staff.
          Quando la scheda sarà pronta, verrà consegnata in formato cartaceo
          direttamente in palestra.
        </p>
      </div>

      <button
        onClick={onPaga}
        disabled={richiestaInviata}
        className={`w-full rounded-2xl p-4 font-black ${
          richiestaInviata ? "bg-green-600" : "bg-red-600"
        }`}
      >
        {richiestaInviata
          ? "✓ Richiesta già inviata"
          : "Invia richiesta"}
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
  slotOccupati,
  tipoServizio,
setTipoServizio,
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
  slotOccupati: string[];
  tipoServizio: "singola" | "pacchetto" | "personal" | "consulenza_gratuita";
setTipoServizio: (
  v: "singola" | "pacchetto" | "personal" | "consulenza_gratuita"
) => void;
  errore: string;
  inviata: boolean;
  onConferma: () => void;
  onChiudi: () => void;
}) {
  const giornoSettimana = data
  ? new Date(`${data}T12:00:00`).getDay()
  : null;

const orariFeriali = [
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
];

const orariSabato = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
];

const orari =
  giornoSettimana === 0
    ? []
    : giornoSettimana === 6
      ? orariSabato
      : orariFeriali;
  return (
    <Modal titolo="Prenota PT" onChiudi={onChiudi}>
     <div className="mb-5">
  <label className="mb-2 block text-sm font-black text-zinc-300">
    Servizio
  </label>

  <select
    value={tipoServizio}
    onChange={(e) =>
      setTipoServizio(
        e.target.value as
          | "singola"
          | "pacchetto"
          | "personal"
          | "consulenza_gratuita"
      )
    }
    className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-4 text-white outline-none focus:border-red-600"
  >
    <option value="singola">Seduta singola — 30 €</option>
    <option value="pacchetto">Utilizza pacchetto 5 / 10 sedute</option>
    <option value="personal">Pacchetto Personal — 80 €</option>
    <option value="consulenza_gratuita">
      Consulenza gratuita mensile
    </option>
  </select>
</div>
      <label className="text-zinc-400">Personal trainer</label>
      <select
        value={operatore}
        onChange={(e) => setOperatore(e.target.value)}
        className="mb-4 mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 p-4"
      >
        <option>Simone Totaro</option>
        <option>Daniele Totaro</option>
      </select>
      <label className="text-zinc-400">Data</label>
      <input
        type="date"
        min={new Date(Date.now() + 86400000).toLocaleDateString("en-CA")}
        value={data}
        onChange={(e) => setData(e.target.value)}
        className="mb-4 mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 p-4"
      />
      <label className="text-zinc-400">Orario</label>
      {giornoSettimana === 0 && (
  <div className="mb-4 mt-2 rounded-2xl border border-red-900/50 bg-red-950/30 p-4">
    <p className="font-black text-red-500">🚫 Palestra chiusa</p>
    <p className="mt-1 text-sm text-zinc-400">
      La domenica non è possibile effettuare prenotazioni.
    </p>
  </div>
)}
      <select
        value={ora}
        onChange={(e) => setOra(e.target.value)}
        className="mb-4 mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 p-4"
      >
        <option value="">Seleziona orario</option>
       {orari.map((o) => {
  const occupato = slotOccupati.includes(o);

  return (
    <option key={o} value={o} disabled={occupato}>
      {o} {occupato ? "— NON DISPONIBILE" : ""}
    </option>
  );
})}
      </select>
     <div className="mb-4 rounded-2xl border border-zinc-700 bg-zinc-900 p-4">
  <p className="font-black">📅 Richiesta appuntamento</p>
  <p className="mt-1 text-sm text-zinc-400">
    La prenotazione dovrà essere confermata dallo staff.
  </p>
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
  if (typeof document === "undefined") {
    return null;
  }

return createPortal(
   <div
  style={{
    position: "fixed",
    inset: 0,
    zIndex: 2147483647,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
  }}
>
      <div className="flex max-h-[calc(100dvh-32px)] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-red-600 bg-zinc-950 p-6 text-white">
        <h2 className="mb-5 shrink-0 text-center text-2xl font-black text-red-500">
          {titolo}
        </h2>

        <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain pr-1">
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
    </div>,
    document.body,
  );
}
function Dato({
  etichetta,
  valore,
}: {
  etichetta: string;
  valore: string;
}) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[8px] font-black uppercase tracking-[0.18em] text-zinc-500 sm:text-xs sm:tracking-[0.22em]">
        {etichetta}
      </p>

      <p className="mt-1 truncate text-[16px] font-black leading-tight text-white sm:text-2xl">
        {valore}
      </p>
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
    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-red-600/45 bg-red-950/20 text-red-500 sm:h-10 sm:w-10">
        <span className="scale-[0.9] sm:scale-100">
          {icona}
        </span>
      </span>

     <span className="min-w-0 flex-1 truncate text-[15px] font-black leading-tight text-zinc-100 sm:text-base">
        {testo}
      </span>

      <Badge stato={stato} />
    </div>
  );
}

function Badge({ stato }: { stato: Stato }) {
  let stile = "border-zinc-600 text-zinc-400";

  if (stato === "ATTIVO") {
    stile =
      "border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.12)]";
  }

  if (stato === "IN SCADENZA") {
    stile =
      "border-orange-500 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.12)]";
  }

  if (stato === "SCADUTO" || stato === "RIFIUTATO") {
    stile =
      "border-red-600 text-red-500 shadow-[0_0_10px_rgba(220,38,38,0.12)]";
  }

  if (stato === "IN VERIFICA") {
    stile =
      "border-orange-500 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.12)]";
  }

  return (
  <span
    className={`inline-flex h-[26px] min-w-[72px] shrink-0 items-center justify-center whitespace-nowrap rounded-full border px-2 text-center text-[9px] font-black uppercase tracking-normal sm:h-auto sm:min-w-[112px] sm:px-3 sm:py-2 sm:text-xs sm:tracking-wide ${stile}`}
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
  badge = 0,
}: {
  testo: string;
  icona: ReactNode;
  attivo?: boolean;
  onClick: () => void;
  badge?: number;
}) {
  const haBadge = badge > 0;

  return (
    <button
      onClick={onClick}
      className={`relative flex min-w-[55px] flex-col items-center gap-1.5 rounded-2xl px-2 py-2 text-[10px] font-bold transition sm:min-w-[90px] sm:text-sm ${
        attivo || haBadge
          ? "text-red-500"
          : "text-zinc-500 hover:text-white"
      }`}
    >
      <span
        className={`relative flex h-8 w-8 items-center justify-center rounded-xl transition ${
          attivo || haBadge
            ? "bg-red-950/40 shadow-[0_0_16px_rgba(220,38,38,0.35)]"
            : ""
        }`}
      >
        {icona}

        {haBadge && (
  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#090a0b] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
)}
      </span>

      <span>{testo}</span>

      {attivo && (
        <span className="absolute -bottom-1 h-[3px] w-12 rounded-full bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.8)]" />
      )}
    </button>
  );
}
function formattaDataCertificato(data: string) {
  if (!data) return "Non disponibile";

  return new Date(`${data}T00:00:00`).toLocaleDateString("it-IT");
}

function Notifica({ titolo, testo }: { titolo: string; testo: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/35 p-5">
      <p className="font-black">{titolo}</p>
      <p className="mt-2 text-sm text-zinc-400">{testo}</p>
    </div>
  );
}

function PopupStoricoPagamenti({
  pagamenti,
  onChiudi,
}: {
  pagamenti: any[];
  onChiudi: () => void;
}) {
  function formattaData(data: string | null) {
    if (!data) return "—";

    const valore = data.includes("T")
      ? new Date(data)
      : new Date(`${data}T00:00:00`);

    if (Number.isNaN(valore.getTime())) return "—";

    return valore.toLocaleDateString("it-IT");
  }

  function nomePiano(tipo: string) {
    const nomi: Record<string, string> = {
      mensile: "Mensile",
      trimestrale: "Trimestrale",
      semestrale: "Semestrale",
      annuale: "Annuale",
    };

    return nomi[tipo] || tipo;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[600px] rounded-[30px] border border-zinc-700 bg-[#0d0e0f] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.9)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-red-500">
              Abbonamento
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Storico pagamenti
            </h2>
          </div>

          <button
            type="button"
            onClick={onChiudi}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-xl text-white transition hover:border-red-600"
          >
            ×
          </button>
        </div>

        <div className="mt-6 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {pagamenti.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-5 text-center">
              <ReceiptText
                size={28}
                className="mx-auto mb-3 text-zinc-600"
              />

              <p className="text-sm font-bold text-zinc-400">
                Nessun pagamento presente nello storico.
              </p>
            </div>
          ) : (
            pagamenti.map((pagamento) => (
              <div
                key={pagamento.id}
                className="rounded-2xl border border-zinc-800 bg-black/40 p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-black text-white">
                      {nomePiano(pagamento.tipo)}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Pagato il{" "}
                      {formattaData(
                        pagamento.completato_il ||
                          pagamento.creato_il,
                      )}
                    </p>
                  </div>

                  <p className="text-lg font-black text-red-500">
                    {((pagamento.importo || 0) / 100).toLocaleString(
                      "it-IT",
                      {
                        style: "currency",
                        currency: "EUR",
                      },
                    )}
                  </p>
                </div>

                <div className="mt-4 border-t border-zinc-800 pt-4">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-zinc-500">
                      Scadenza precedente
                    </span>

                    <span className="font-bold text-zinc-300">
                      {formattaData(
                        pagamento.scadenza_precedente,
                      )}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-4 text-sm">
                    <span className="text-zinc-500">
                      Nuova scadenza
                    </span>

                    <span className="font-black text-white">
                      {formattaData(
                        pagamento.scadenza_nuova,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={onChiudi}
          className="mt-6 w-full rounded-2xl bg-red-600 px-5 py-4 text-sm font-black uppercase text-white transition hover:bg-red-500"
        >
          Chiudi
        </button>
      </div>
    </div>
  );
}
function PopupStoricoQuota({
  pagamenti,
  onChiudi,
}: {
  pagamenti: any[];
  onChiudi: () => void;
}) {
  function formattaData(data: string | null) {
    if (!data) return "—";

    const valore = data.includes("T")
      ? new Date(data)
      : new Date(`${data}T00:00:00`);

    if (Number.isNaN(valore.getTime())) return "—";

    return valore.toLocaleDateString("it-IT");
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[600px] rounded-[30px] border border-zinc-700 bg-[#0d0e0f] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.9)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-red-500">
              Quota associativa
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Storico pagamenti
            </h2>
          </div>

          <button
            type="button"
            onClick={onChiudi}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-xl text-white transition hover:border-red-600"
          >
            ×
          </button>
        </div>

        <div className="mt-6 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {pagamenti.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-5 text-center">
              <ReceiptText
                size={28}
                className="mx-auto mb-3 text-zinc-600"
              />

              <p className="text-sm font-bold text-zinc-400">
                Nessun pagamento della quota presente nello storico.
              </p>
            </div>
          ) : (
            pagamenti.map((pagamento) => (
              <div
                key={pagamento.id}
                className="rounded-2xl border border-zinc-800 bg-black/40 p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-black text-white">
                      Quota associativa
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Pagata il{" "}
                      {formattaData(
                        pagamento.pagato_il ||
                          pagamento.quota_inizio,
                      )}
                    </p>
                  </div>

                  <p className="text-lg font-black text-red-500">
                    {(
                      (pagamento.importo || 0) / 100
                    ).toLocaleString("it-IT", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </p>
                </div>

                <div className="mt-4 border-t border-zinc-800 pt-4">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-zinc-500">
                      Scadenza precedente
                    </span>

                    <span className="font-bold text-zinc-300">
                      {formattaData(
                        pagamento.scadenza_precedente,
                      )}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-4 text-sm">
                    <span className="text-zinc-500">
                      Nuova scadenza
                    </span>

                    <span className="font-black text-white">
                      {formattaData(
                        pagamento.quota_scadenza,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={onChiudi}
          className="mt-6 w-full rounded-2xl bg-red-600 px-5 py-4 text-sm font-black uppercase text-white transition hover:bg-red-500"
        >
          Chiudi
        </button>
      </div>
    </div>
  );
}