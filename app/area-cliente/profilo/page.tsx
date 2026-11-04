"use client";



import Image from "next/image";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import {

  ArrowLeft,

  BadgeCheck,

  Check,

  CreditCard,

  HeartPulse,

  Mail,

  UserRound,

  UsersRound,

  X,

} from "lucide-react";

import { supabase } from "../../lib/supabase";



const AVATAR = [

  "01_spugna_gym.png",

  "02_stella_gym.png",

  "03_polpo_gym.png",

  "04_pinguino_gym.png",

  "05_guerriero_nero.png",

  "06_cyborg_bionda.png",

  "07_ragazza_bionda.png",

  "08_ragazza_castana.png",

  "09_minotauro.png",

  "10_gymrat_uomo.png",

  "11_guerriero_postapocalittico.png",

  "12_ragazzo_castano.png",

  "13_ragazzo_biondo.png",

  "14_topo_gymrat.png",

  "15_scoiattolo_spaziale.png",

  "16_guerriero_dorato.png",

  "17_spartano.png",

  "18_topo_gymrat_mascotte.png",

];



export default function ProfiloPage() {

  const router = useRouter();



  const [cliente, setCliente] = useState<any>(null);



  const [modaleAvatar, setModaleAvatar] = useState(false);



  const [avatarSelezionato, setAvatarSelezionato] =

    useState<string | null>(null);



  const [salvataggioAvatar, setSalvataggioAvatar] = useState(false);



  const [erroreAvatar, setErroreAvatar] = useState("");



  const [modaleNickname, setModaleNickname] = useState(false);

const [nickname, setNickname] = useState("");

const [salvataggioNickname, setSalvataggioNickname] = useState(false);

const [erroreNickname, setErroreNickname] = useState("");

const [storicoAperto, setStoricoAperto] = useState(false);

const [storicoAbbonamentoAperto, setStoricoAbbonamentoAperto] =

  useState(false);



const [storicoAbbonamento, setStoricoAbbonamento] = useState<any[]>([]);



const [caricamentoStoricoAbbonamento, setCaricamentoStoricoAbbonamento] =

  useState(false);

const [storicoQuotaAperto, setStoricoQuotaAperto] =

  useState(false);



const [storicoQuota, setStoricoQuota] =

  useState<any[]>([]);



const [caricamentoStoricoQuota, setCaricamentoStoricoQuota] =

  useState(false);
  const [storicoPersonalAperto, setStoricoPersonalAperto] =
  useState(false);

const [storicoPersonal, setStoricoPersonal] =
  useState<any[]>([]);

const [caricamentoStoricoPersonal, setCaricamentoStoricoPersonal] =
  useState(false);

  useEffect(() => {

    async function caricaProfilo() {

      const salvato =

        localStorage.getItem("cliente") || localStorage.getItem("utente");



      if (!salvato) {

        router.push("/login/accesso");

        return;

      }



      try {

        const base = JSON.parse(salvato);



        const { data, error } = await supabase

          .from("profiles")

          .select("*")

          .eq("id", base.id)

          .single();



        if (error || !data) {

          router.push("/login/accesso");

          return;

        }



        setCliente(data);

        setAvatarSelezionato(data.avatar_id || null);



        localStorage.setItem("cliente", JSON.stringify(data));

        localStorage.setItem("utente", JSON.stringify(data));

      } catch {

        router.push("/login/accesso");

      }

    }



    void caricaProfilo();

  }, [router]);



  async function salvaAvatar() {

    if (!cliente || !avatarSelezionato) return;



    setSalvataggioAvatar(true);

    setErroreAvatar("");



    try {

      const { error } = await supabase

        .from("profiles")

        .update({

          avatar_id: avatarSelezionato,

        })

        .eq("id", cliente.id);



      if (error) {

        setErroreAvatar("Non è stato possibile salvare l'avatar.");

        setSalvataggioAvatar(false);

        return;

      }



      const clienteAggiornato = {

        ...cliente,

        avatar_id: avatarSelezionato,

      };



      setCliente(clienteAggiornato);



      localStorage.setItem(

        "cliente",

        JSON.stringify(clienteAggiornato)

      );



      localStorage.setItem(

        "utente",

        JSON.stringify(clienteAggiornato)

      );



      setModaleAvatar(false);

    } catch {

      setErroreAvatar("Si è verificato un errore durante il salvataggio.");

    } finally {

      setSalvataggioAvatar(false);

    }

  }



  async function salvaNickname() {

  if (!cliente) return;



  const nicknamePulito = nickname.trim();



  if (nicknamePulito.length < 2) {

    setErroreNickname("Il nickname deve avere almeno 2 caratteri.");

    return;

  }



  if (nicknamePulito.length > 20) {

    setErroreNickname("Il nickname può contenere massimo 20 caratteri.");

    return;

  }



  setSalvataggioNickname(true);

  setErroreNickname("");



  try {

    const { error } = await supabase

      .from("profiles")

      .update({

        nickname: nicknamePulito,

      })

      .eq("id", cliente.id);



    if (error) {

      setErroreNickname("Non è stato possibile salvare il nickname.");

      return;

    }



    const clienteAggiornato = {

      ...cliente,

      nickname: nicknamePulito,

    };



    setCliente(clienteAggiornato);



    localStorage.setItem(

      "cliente",

      JSON.stringify(clienteAggiornato)

    );



    localStorage.setItem(

      "utente",

      JSON.stringify(clienteAggiornato)

    );



    setModaleNickname(false);

  } catch {

    setErroreNickname(

      "Si è verificato un errore durante il salvataggio."

    );

  } finally {

    setSalvataggioNickname(false);

  }

}

async function apriStoricoAbbonamento() {

 if (!cliente?.id) return;



setStoricoAperto(false);

setStoricoAbbonamentoAperto(true);

setCaricamentoStoricoAbbonamento(true);

setStoricoAbbonamento([]);

  try {

    const risposta = await fetch("/api/pagamenti/storico", {

      method: "POST",

      headers: {

        "Content-Type": "application/json",

      },

      body: JSON.stringify({

        clienteId: cliente.id,

      }),

    });



    const risultato = await risposta.json();



    if (!risposta.ok) {

      console.error(

        "Errore caricamento storico abbonamento:",

        risultato

      );

      return;

    }



    setStoricoAbbonamento(

      Array.isArray(risultato)

        ? risultato

        : risultato.pagamenti || risultato.storico || []

    );

  } catch (errore) {

    console.error(

      "Errore caricamento storico abbonamento:",

      errore

    );

  } finally {

    setCaricamentoStoricoAbbonamento(false);

  }

}

async function apriStoricoQuota() {

  if (!cliente?.id) return;



  setStoricoAperto(false);

  setStoricoQuotaAperto(true);

  setCaricamentoStoricoQuota(true);

  setStoricoQuota([]);



  try {

    const risposta = await fetch("/api/quota-associativa/storico", {

      method: "POST",

      headers: {

        "Content-Type": "application/json",

      },

      body: JSON.stringify({

        clienteId: cliente.id,

      }),

    });



    const risultato = await risposta.json();



    if (!risposta.ok) {

      console.error(

        "Errore caricamento storico quota:",

        risultato

      );

      return;

    }



    setStoricoQuota(

      Array.isArray(risultato)

        ? risultato

        : risultato.pagamenti || risultato.storico || []

    );

  } catch (errore) {

    console.error(

      "Errore caricamento storico quota:",

      errore

    );

  } finally {

    setCaricamentoStoricoQuota(false);

  }

}

async function apriStoricoPersonal() {
  if (!cliente?.id) return;

  setStoricoAperto(false);
  setStoricoPersonalAperto(true);
  setCaricamentoStoricoPersonal(true);
  setStoricoPersonal([]);

  try {
    const risposta = await fetch("/api/prenotazioni-pt/storico", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clienteId: cliente.id,
      }),
    });

    const risultato = await risposta.json();

    if (!risposta.ok) {
      console.error(
        "Errore caricamento storico My Personal:",
        risultato.error
      );

      setStoricoPersonal([]);
      return;
    }

    setStoricoPersonal(risultato.storico ?? []);
  } catch (errore) {
    console.error(
      "Errore caricamento storico My Personal:",
      errore
    );

    setStoricoPersonal([]);
  } finally {
    setCaricamentoStoricoPersonal(false);
  }
}
function apriNickname() {

  setNickname(cliente?.nickname || "");

  setErroreNickname("");

  setModaleNickname(true);

}



function chiudiNickname() {

  if (salvataggioNickname) return;



  setNickname(cliente?.nickname || "");

  setErroreNickname("");

  setModaleNickname(false);

}



  function apriAvatar() {

    setAvatarSelezionato(cliente?.avatar_id || null);

    setErroreAvatar("");

    setModaleAvatar(true);

  }



  function chiudiAvatar() {

    if (salvataggioAvatar) return;



    setAvatarSelezionato(cliente?.avatar_id || null);

    setErroreAvatar("");

    setModaleAvatar(false);

  }

useEffect(() => {

const modaleAperto =

  storicoAperto ||

  storicoAbbonamentoAperto ||

  storicoQuotaAperto ||

  modaleAvatar ||

  modaleNickname;



  if (!modaleAperto) {

    document.body.style.overflow = "";

    document.body.style.touchAction = "";

    return;

  }



  const scrollY = window.scrollY;



  document.body.style.position = "fixed";

  document.body.style.top = `-${scrollY}px`;

  document.body.style.left = "0";

  document.body.style.right = "0";

  document.body.style.width = "100%";

  document.body.style.overflow = "hidden";



  return () => {

    document.body.style.position = "";

    document.body.style.top = "";

    document.body.style.left = "";

    document.body.style.right = "";

    document.body.style.width = "";

    document.body.style.overflow = "";



    window.scrollTo(0, scrollY);

  };

}, [

  storicoAperto,

  storicoAbbonamentoAperto,

  storicoQuotaAperto,

  modaleAvatar,

  modaleNickname,

]);

  if (!cliente) {

    return (

      <main className="flex min-h-[100dvh] items-center justify-center bg-[#060708] text-white">

        <p className="font-bold text-zinc-400">

          Caricamento profilo...

        </p>

      </main>

    );

  }



  const codiceTessera =

    cliente.codice_tessera ||

    cliente.rfid_code ||

    `MF-${String(cliente.id || "").slice(0, 6).toUpperCase()}`;



  return (

    <main className="min-h-[100dvh] bg-[#060708] pb-12 text-white">

      {/* SFONDO */}

      <div className="pointer-events-none fixed inset-0">

        <div className="absolute left-1/2 top-1/4 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-red-950/20 blur-[140px]" />

      </div>



      {/* HEADER */}

      <header className="relative z-10 mx-auto flex w-full max-w-[760px] items-center justify-between px-5 py-5">

        <button

          type="button"

          onClick={() => router.push("/area-cliente")}

          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 transition hover:border-red-600"

          aria-label="Torna alla Home"

        >

          <ArrowLeft size={24} />

        </button>



        <Image

          src="/logo.png"

          alt="MinosFit"

          width={150}

          height={60}

          className="h-12 w-auto object-contain"

          priority

        />



        <div className="h-12 w-12" />

      </header>



      <section className="relative z-10 mx-auto w-full max-w-[680px] px-5">

        {/* PROFILO PRINCIPALE */}

        <div className="overflow-hidden rounded-[30px] border border-zinc-800 bg-gradient-to-b from-[#151617] to-[#090a0b] shadow-[0_25px_70px_rgba(0,0,0,0.55)]">

          <div className="h-1.5 bg-red-600" />



          <div className="px-6 pb-7 pt-8 text-center">

            <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full border-2 border-red-600 bg-zinc-950 shadow-[0_0_35px_rgba(220,38,38,0.25)]">

              {cliente.avatar_id ? (

                <Image

                  src={`/avatars/${cliente.avatar_id}`}

                  alt="Avatar profilo"

                  fill

                  sizes="112px"

                  className="object-cover"

                  priority

                />

              ) : (

                <div className="flex h-full w-full items-center justify-center">

                  <UserRound size={55} className="text-red-500" />

                </div>

              )}

            </div>



            <p className="mt-5 text-xs font-black uppercase tracking-[0.25em] text-red-500">

              Profilo MinosFit

            </p>



            <h1 className="mt-2 text-3xl font-black">

  {cliente.nome} {cliente.cognome}

</h1>



{cliente.nickname && (

  <p className="mt-2 text-lg font-black text-red-500">

    {cliente.nickname}

  </p>

)}



<p className="mt-2 text-sm font-bold text-zinc-500">

  {codiceTessera}

</p>



           <div className="mt-6 flex justify-center gap-3">

  <button

    type="button"

    onClick={apriAvatar}

    className="rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm font-black transition hover:border-red-600"

  >

    Cambia avatar

  </button>



  <button

    type="button"

    onClick={apriNickname}

    className="rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm font-black transition hover:border-red-600"

  >

    {cliente.nickname ? "Modifica nickname" : "Scegli nickname"}

  </button>

</div>

          </div>

        </div>



        {/* ACCOUNT */}

        <div className="mt-5 rounded-[26px] border border-zinc-800 bg-[#0d0e0f] p-5">

          <div className="mb-5 flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-950/40 text-red-500">

              <UserRound size={21} />

            </div>



            <div>

              <p className="text-xs font-black uppercase tracking-[0.2em] text-red-500">

                Account

              </p>



              <h2 className="font-black text-white">

                I tuoi dati

              </h2>

            </div>

          </div>



          <ProfiloDato

            icona={<UserRound size={19} />}

            etichetta="Nome e cognome"

            valore={`${cliente.nome || ""} ${cliente.cognome || ""}`}

          />



          <ProfiloDato

            icona={<Mail size={19} />}

            etichetta="Email"

            valore={cliente.email || "Non disponibile"}

          />

        </div>



        {/* TESSERA */}

        <div className="mt-5 rounded-[26px] border border-zinc-800 bg-[#0d0e0f] p-5">

          <div className="mb-5 flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-950/40 text-red-500">

              <BadgeCheck size={21} />

            </div>



            <div>

              <p className="text-xs font-black uppercase tracking-[0.2em] text-red-500">

                MinosFit

              </p>



              <h2 className="font-black text-white">

                La tua tessera

              </h2>

            </div>

          </div>



          <ProfiloDato

            icona={<BadgeCheck size={19} />}

            etichetta="Codice tessera"

            valore={codiceTessera}

          />



          <ProfiloDato

            icona={<CreditCard size={19} />}

            etichetta="Abbonamento"

            valore={cliente.abbonamento || "Non impostato"}

          />



          <ProfiloDato

            icona={<UsersRound size={19} />}

            etichetta="Scadenza quota associativa"

            valore={formattaData(cliente.quota_associativa_scadenza)}

          />



          <ProfiloDato

            icona={<HeartPulse size={19} />}

            etichetta="Scadenza certificato medico"

            valore={formattaData(cliente.certificato_scadenza)}

          />

        </div>

{/* STORICO PAGAMENTI */}

<button

  type="button"

  onClick={() => setStoricoAperto(true)}

  className="mt-5 flex w-full items-center justify-between rounded-[26px] border border-zinc-800 bg-[#0d0e0f] p-5 text-left transition hover:border-red-600/60"

>

  <div className="flex items-center gap-4">

    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-950/40 text-red-500">

      <CreditCard size={23} />

    </div>



    <div>

      <p className="text-xs font-black uppercase tracking-[0.2em] text-red-500">

        Pagamenti

      </p>



      <h2 className="mt-1 text-lg font-black text-white">

        Storico pagamenti

      </h2>



      <p className="mt-1 text-xs font-bold text-zinc-500">

        Abbonamento, quota associativa e My Personal

      </p>

    </div>

  </div>



  <span className="ml-3 text-2xl font-bold text-zinc-600">

    ›

  </span>

</button>

        {/* PERSONALIZZAZIONE */}

        <div className="mt-5 rounded-[26px] border border-red-600/20 bg-red-950/10 p-5">

          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-500">

            Personalizza il tuo profilo

          </p>



          <h2 className="mt-2 text-xl font-black">

            Rendilo un po&apos; più tuo 😎

          </h2>



       <p className="mt-2 text-sm leading-6 text-zinc-400">

  Scegli il tuo avatar MinosFit e personalizza il tuo nickname.

</p>





        </div>

      </section>



      {/* MODALE SELEZIONE AVATAR */}

      {modaleAvatar && (

        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-5">

          <button

            type="button"

            aria-label="Chiudi selezione avatar"

            onClick={chiudiAvatar}

            className="absolute inset-0"

          />



          <div className="relative z-10 flex max-h-[88dvh] w-full max-w-[650px] flex-col overflow-hidden rounded-t-[32px] border border-zinc-800 bg-[#0b0c0d] shadow-2xl sm:rounded-[32px]">

            {/* HEADER MODALE */}

            <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-5 py-5">

              <div>

                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-500">

                  MinosFit

                </p>



                <h2 className="mt-1 text-xl font-black">

                  Scegli il tuo avatar

                </h2>

              </div>



              <button

                type="button"

                onClick={chiudiAvatar}

                className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900"

              >

                <X size={21} />

              </button>

            </div>



            {/* GRIGLIA */}

            <div className="min-h-0 flex-1 overflow-y-auto p-5">

              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">

                {AVATAR.map((avatar) => {

                  const selezionato =

                    avatarSelezionato === avatar;



                  return (

                    <button

                      key={avatar}

                      type="button"

                      onClick={() =>

                        setAvatarSelezionato(avatar)

                      }

                      className={`relative aspect-square overflow-hidden rounded-full border-2 bg-zinc-950 transition ${

                        selezionato

                          ? "scale-[0.96] border-red-500 shadow-[0_0_25px_rgba(220,38,38,0.45)]"

                          : "border-zinc-800 hover:border-zinc-600"

                      }`}

                    >

                      <Image

                        src={`/avatars/${avatar}`}

                        alt="Avatar MinosFit"

                        fill

                        sizes="(max-width: 640px) 30vw, 140px"

                        className="object-cover"

                      />



                      {selezionato && (

                        <div className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-black bg-red-600 text-white">

                          <Check size={16} strokeWidth={3} />

                        </div>

                      )}

                    </button>

                  );

                })}

              </div>



              {erroreAvatar && (

                <p className="mt-5 text-center text-sm font-bold text-red-500">

                  {erroreAvatar}

                </p>

              )}

            </div>



            {/* SALVA */}

            <div className="shrink-0 border-t border-zinc-800 bg-[#0b0c0d] p-5">

              <button

                type="button"

                onClick={salvaAvatar}

                disabled={!avatarSelezionato || salvataggioAvatar}

                className="w-full rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"

              >

                {salvataggioAvatar

                  ? "Salvataggio..."

                  : "Salva avatar"}

              </button>

            </div>

          </div>

        </div>

      )}{/* MODALE STORICO QUOTA */}

{storicoQuotaAperto && (

  <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-5">

    <div className="relative flex max-h-[88dvh] w-full max-w-[600px] flex-col overflow-hidden rounded-t-[32px] border border-zinc-800 bg-[#0b0c0d] shadow-2xl sm:rounded-[32px]">



      {/* HEADER */}

      <div className="flex shrink-0 items-center gap-4 border-b border-zinc-800 px-5 py-5">

        <button

          type="button"

          onClick={() => {

            setStoricoQuotaAperto(false);

            setStoricoAperto(true);

          }}

          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900"

          aria-label="Torna allo storico pagamenti"

        >

          <ArrowLeft size={21} />

        </button>



        <div>

          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-500">

            Pagamenti

          </p>



          <h2 className="mt-1 text-xl font-black text-white">

            Storico quota associativa

          </h2>

        </div>

      </div>



      {/* CONTENUTO */}

      <div className="min-h-0 flex-1 overflow-y-auto p-5">

        {caricamentoStoricoQuota ? (

          <div className="py-12 text-center">

            <p className="font-bold text-zinc-500">

              Caricamento storico...

            </p>

          </div>

        ) : storicoQuota.length === 0 ? (

          <div className="py-12 text-center">

            <BadgeCheck

              size={42}

              className="mx-auto text-zinc-700"

            />



            <p className="mt-4 font-black text-white">

              Nessun pagamento trovato

            </p>



            <p className="mt-2 text-sm text-zinc-500">

              I pagamenti della quota associativa compariranno qui.

            </p>

          </div>

        ) : (

          <div className="space-y-3">

            {storicoQuota.map((pagamento, indice) => (

              <div

                key={pagamento.id || indice}

                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"

              >

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-500">

                      Quota associativa

                    </p>



                    <p className="mt-1 text-base font-black text-white">

                      {formattaDataPagamento(pagamento.pagato_il)}

                    </p>

                  </div>



                  {pagamento.importo != null && (

                    <p className="text-lg font-black text-white">

                      {formattaImporto(pagamento.importo)}

                    </p>

                  )}

                </div>



                <div className="mt-4 border-t border-zinc-800 pt-4">

                  <div className="flex items-center justify-between gap-4">

                    <span className="text-xs font-bold text-zinc-500">

                      Scadenza precedente

                    </span>



                    <span className="text-sm font-black text-zinc-200">

                      {formattaData(

                        pagamento.scadenza_precedente

                      )}

                    </span>

                  </div>



                  <div className="mt-3 flex items-center justify-between gap-4">

                    <span className="text-xs font-bold text-zinc-500">

                      Nuova scadenza

                    </span>



                    <span className="text-sm font-black text-red-500">

                      {formattaData(

                        pagamento.quota_scadenza

                      )}

                    </span>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>

  </div>

)}

            {/* MODALE STORICO ABBONAMENTO */}

      {storicoAbbonamentoAperto && (

        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-5">

          <div className="relative flex max-h-[88dvh] w-full max-w-[600px] flex-col overflow-hidden rounded-t-[32px] border border-zinc-800 bg-[#0b0c0d] shadow-2xl sm:rounded-[32px]">



            {/* HEADER */}

            <div className="flex shrink-0 items-center gap-4 border-b border-zinc-800 px-5 py-5">

              <button

                type="button"

                onClick={() => {

                  setStoricoAbbonamentoAperto(false);

                  setStoricoAperto(true);

                }}

                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900"

                aria-label="Torna allo storico pagamenti"

              >

                <ArrowLeft size={21} />

              </button>



              <div>

                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-500">

                  Pagamenti

                </p>



                <h2 className="mt-1 text-xl font-black text-white">

                  Storico abbonamento

                </h2>

              </div>

            </div>



            {/* CONTENUTO */}

            <div className="min-h-0 flex-1 overflow-y-auto p-5">

              {caricamentoStoricoAbbonamento ? (

                <div className="py-12 text-center">

                  <p className="font-bold text-zinc-500">

                    Caricamento storico...

                  </p>

                </div>

              ) : storicoAbbonamento.length === 0 ? (

                <div className="py-12 text-center">

                  <CreditCard

                    size={42}

                    className="mx-auto text-zinc-700"

                  />



                  <p className="mt-4 font-black text-white">

                    Nessun pagamento trovato

                  </p>



                  <p className="mt-2 text-sm text-zinc-500">

                    I pagamenti dell&apos;abbonamento compariranno qui.

                  </p>

                </div>

              ) : (

                <div className="space-y-3">

                  {storicoAbbonamento.map((pagamento, indice) => (

                    <div

                      key={pagamento.id || indice}

                      className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"

                    >

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-500">

                            Pagamento

                          </p>



                          <p className="mt-1 text-base font-black text-white">

                            {formattaDataPagamento(

                              pagamento.pagato_il ||

                                pagamento.created_at ||

                                pagamento.data_pagamento

                            )}

                          </p>

                        </div>



                        {pagamento.importo != null && (

                          <p className="text-lg font-black text-white">

                            {formattaImporto(pagamento.importo)}

                          </p>

                        )}

                      </div>



                      <div className="mt-4 border-t border-zinc-800 pt-4">

                        <div className="flex items-center justify-between gap-4">

                          <span className="text-xs font-bold text-zinc-500">

                            Scadenza precedente

                          </span>



                          <span className="text-sm font-black text-zinc-200">

                            {formattaData(

                              pagamento.scadenza_precedente

                            )}

                          </span>

                        </div>



                        <div className="mt-3 flex items-center justify-between gap-4">

                          <span className="text-xs font-bold text-zinc-500">

                            Nuova scadenza

                          </span>



                          <span className="text-sm font-black text-red-500">

                            {formattaData(

                              pagamento.scadenza_nuova

                            )}

                          </span>

                        </div>

                      </div>

                    </div>

                  ))}

                </div>

              )}

            </div>

          </div>

        </div>

      )}
{/* MODALE STORICO MY PERSONAL */}
{storicoPersonalAperto && (
  <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-5">
    <div className="relative flex max-h-[88dvh] w-full max-w-[600px] flex-col overflow-hidden rounded-t-[32px] border border-zinc-800 bg-[#0b0c0d] shadow-2xl sm:rounded-[32px]">

      {/* HEADER */}
      <div className="flex shrink-0 items-center gap-4 border-b border-zinc-800 px-5 py-5">
        <button
          type="button"
          onClick={() => {
            setStoricoPersonalAperto(false);
            setStoricoAperto(true);
          }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900"
          aria-label="Torna allo storico pagamenti"
        >
          <ArrowLeft size={21} />
        </button>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-500">
            Pagamenti
          </p>

          <h2 className="mt-1 text-xl font-black text-white">
            Storico My Personal
          </h2>
        </div>
      </div>

      {/* CONTENUTO */}
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {caricamentoStoricoPersonal ? (
          <div className="py-12 text-center">
            <p className="font-bold text-zinc-500">
              Caricamento storico...
            </p>
          </div>
        ) : storicoPersonal.length === 0 ? (
          <div className="py-12 text-center">
            <UsersRound
              size={42}
              className="mx-auto text-zinc-700"
            />

            <p className="mt-4 font-black text-white">
              Nessun acquisto trovato
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              Pacchetti e servizi Personal compariranno qui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {storicoPersonal.map((voce, indice) => {
              const nome =
                voce.tipo === "pacchetto_5"
                  ? "Pacchetto 5 sedute"
                  : voce.tipo === "pacchetto_10"
                  ? "Pacchetto 10 sedute"
                  : voce.tipo === "personal"
                  ? "My Personal"
                  : voce.tipo === "pt_singola"
                  ? "Seduta singola"
                  : "Servizio Personal";

              const stato = String(voce.stato || "—")
                .replaceAll("_", " ")
                .toUpperCase();

              return (
                <div
                  key={voce.id || indice}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"
                >
                  {/* TITOLO + PREZZO */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-500">
                        {nome}
                      </p>

                      <p className="mt-1 text-base font-black text-white">
                        {formattaDataPagamento(voce.data_acquisto)}
                      </p>
                    </div>

                    <p className="text-lg font-black text-white">
                      {formattaImporto(voce.prezzo)}
                    </p>
                  </div>

                  {/* DETTAGLI */}
                  <div className="mt-4 border-t border-zinc-800 pt-4">

                    {voce.operatore && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-bold text-zinc-500">
                          Personal
                        </span>

                        <span className="text-sm font-black text-zinc-200">
                          {voce.operatore}
                        </span>
                      </div>
                    )}

                    {(voce.tipo === "pacchetto_5" ||
                      voce.tipo === "pacchetto_10") && (
                      <div className="mt-3 flex items-center justify-between gap-4">
                        <span className="text-xs font-bold text-zinc-500">
                          Sedute utilizzate
                        </span>

                        <span className="text-sm font-black text-zinc-200">
                          {voce.lezioni_utilizzate || 0}/
                          {voce.lezioni_totali || 0}
                        </span>
                      </div>
                    )}

                    {voce.tipo === "personal" &&
                      voce.scadenza && (
                        <div className="mt-3 flex items-center justify-between gap-4">
                          <span className="text-xs font-bold text-zinc-500">
                            Scadenza
                          </span>

                          <span className="text-sm font-black text-red-500">
                            {formattaData(voce.scadenza)}
                          </span>
                        </div>
                      )}

                    {voce.tipo === "pt_singola" &&
                      voce.data_prenotazione && (
                        <div className="mt-3 flex items-center justify-between gap-4">
                          <span className="text-xs font-bold text-zinc-500">
                            Appuntamento
                          </span>

                          <span className="text-sm font-black text-zinc-200">
                            {formattaData(
                              voce.data_prenotazione
                            )}
                            {voce.ora_prenotazione
                              ? ` · ${String(
                                  voce.ora_prenotazione
                                ).slice(0, 5)}`
                              : ""}
                          </span>
                        </div>
                      )}

                    <div className="mt-3 flex items-center justify-between gap-4">
                      <span className="text-xs font-bold text-zinc-500">
                        Stato
                      </span>

                      <span className="text-sm font-black text-zinc-200">
                        {stato}
                      </span>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  </div>
)}
            {/* MODALE STORICO PAGAMENTI */}

      {storicoAperto && (

        <div className="fixed inset-0 z-[105] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-5">

          <button

            type="button"

            aria-label="Chiudi storico pagamenti"

            onClick={() => setStoricoAperto(false)}

            className="absolute inset-0"

          />



          <div className="relative z-10 flex max-h-[88dvh] w-full max-w-[600px] flex-col overflow-hidden rounded-t-[32px] border border-zinc-800 bg-[#0b0c0d] shadow-2xl sm:rounded-[32px]">



            <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-5 py-5">

              <div>

                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-500">

                  MinosFit

                </p>



                <h2 className="mt-1 text-xl font-black text-white">

                  Storico pagamenti

                </h2>

              </div>



              <button

                type="button"

                onClick={() => setStoricoAperto(false)}

                className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900"

              >

                <X size={21} />

              </button>

            </div>



            <div className="min-h-0 flex-1 overflow-y-auto p-5">

              <div className="space-y-3">



                {/* ABBONAMENTO */}

              <button

  type="button"

  onClick={apriStoricoAbbonamento}

  className="flex w-full items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 text-left transition hover:border-red-600"

>

                  <div className="flex items-center gap-4">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-950/40 text-red-500">

                      <CreditCard size={21} />

                    </div>



                    <div>

                      <p className="font-black text-white">

                        Storico abbonamento

                      </p>

                      <p className="mt-1 text-xs font-bold text-zinc-500">

                        Rinnovi e pagamenti abbonamento

                      </p>

                    </div>

                  </div>



                  <span className="text-2xl font-bold text-zinc-600">

                    ›

                  </span>

                </button>



                {/* QUOTA */}

                <button

  type="button"

  onClick={apriStoricoQuota}

  className="flex w-full items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 text-left transition hover:border-red-600"

>

                  <div className="flex items-center gap-4">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-950/40 text-red-500">

                      <BadgeCheck size={21} />

                    </div>



                    <div>

                      <p className="font-black text-white">

                        Storico quota associativa

                      </p>

                      <p className="mt-1 text-xs font-bold text-zinc-500">

                        Pagamenti della quota annuale

                      </p>

                    </div>

                  </div>



                  <span className="text-2xl font-bold text-zinc-600">

                    ›

                  </span>

                </button>



              {/* MY PERSONAL */}
<button
  type="button"
  onClick={apriStoricoPersonal}
  className="flex w-full items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 text-left transition hover:border-red-600"
>

                  <div className="flex items-center gap-4">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-950/40 text-red-500">

                      <UsersRound size={21} />

                    </div>



                    <div>

                      <p className="font-black text-white">

                        Storico My Personal

                      </p>

                      <p className="mt-1 text-xs font-bold text-zinc-500">

                        Pacchetti e servizi Personal

                      </p>

                    </div>

                  </div>



                  <span className="text-2xl font-bold text-zinc-600">

                    ›

                  </span>

                </button>



              </div>

            </div>

          </div>

        </div>

      )}

          {/* MODALE NICKNAME */}

      {modaleNickname && (

        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-5">

          <button

            type="button"

            aria-label="Chiudi modifica nickname"

            onClick={chiudiNickname}

            className="absolute inset-0"

          />



          <div className="relative z-10 w-full max-w-[500px] rounded-t-[32px] border border-zinc-800 bg-[#0b0c0d] p-6 shadow-2xl sm:rounded-[32px]">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-500">

                  Personalizza profilo

                </p>



                <h2 className="mt-1 text-2xl font-black text-white">

                  Il tuo nickname

                </h2>

              </div>



              <button

                type="button"

                onClick={chiudiNickname}

                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900"

              >

                <X size={21} />

              </button>

            </div>



            <p className="mt-4 text-sm leading-6 text-zinc-400">

              Scegli il nome che vuoi mostrare nel tuo profilo MinosFit.

            </p>



            <input

              type="text"

              value={nickname}

              onChange={(e) => {

                setNickname(e.target.value.slice(0, 20));

                setErroreNickname("");

              }}

              onKeyDown={(e) => {

                if (e.key === "Enter") {

                  void salvaNickname();

                }

              }}

              maxLength={20}

              autoFocus

              placeholder="Es. Gym Rat 🐀"

              className="mt-5 w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-5 py-4 text-base font-bold text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600"

            />



            <div className="mt-2 flex items-center justify-between">

              <p className="text-xs font-bold text-zinc-600">

                Minimo 2 caratteri

              </p>



              <p className="text-xs font-black text-zinc-500">

                {nickname.length}/20

              </p>

            </div>



            {erroreNickname && (

              <p className="mt-4 text-sm font-bold text-red-500">

                {erroreNickname}

              </p>

            )}



            <button

              type="button"

              onClick={salvaNickname}

              disabled={

                nickname.trim().length < 2 ||

                salvataggioNickname

              }

              className="mt-6 w-full rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"

            >

              {salvataggioNickname

                ? "Salvataggio..."

                : "Salva nickname"}

            </button>

          </div>

        </div>

      )}

      </main>

  );

}



function ProfiloDato({

  icona,

  etichetta,

  valore,

}: {

  icona: React.ReactNode;

  etichetta: string;

  valore: string;

}) {

  return (

    <div className="flex items-center gap-4 border-b border-zinc-800 py-4 last:border-b-0">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-red-500">

        {icona}

      </div>



      <div className="min-w-0">

        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">

          {etichetta}

        </p>



        <p className="mt-1 break-words text-[15px] font-black text-zinc-100">

          {valore}

        </p>

      </div>

    </div>

  );

}



function RigaStorico({
  etichetta,
  valore,
  evidenza = false,
}: {
  etichetta: string;
  valore: string;
  evidenza?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs font-bold text-zinc-500">{etichetta}</span>
      <span className={`text-right text-sm font-black ${evidenza ? "text-red-500" : "text-zinc-200"}`}>{valore}</span>
    </div>
  );
}

function formattaData(data: string | null | undefined) {

  if (!data) return "Non impostata";



  return new Date(`${data}T00:00:00`).toLocaleDateString("it-IT");

}

function formattaDataPagamento(data: string | null | undefined) {

  if (!data) return "Data non disponibile";



  return new Date(data).toLocaleDateString("it-IT");

}



function formattaImporto(importo: number | string) {

  const valore = Number(importo);



  if (Number.isNaN(valore)) return "—";



  const euro = valore > 1000 ? valore / 100 : valore;



  return euro.toLocaleString("it-IT", {

    style: "currency",

    currency: "EUR",

  });

}