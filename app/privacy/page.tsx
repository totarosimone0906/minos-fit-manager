"use client";

import { useRouter } from "next/navigation";

export default function PrivacyPage() {
  const router = useRouter();

  const sectionStyle = {
    background: "#111",
    border: "1px solid #242424",
    borderRadius: "16px",
    padding: "22px",
    marginBottom: "16px",
  };

  const textStyle = {
    color: "#d0d0d0",
    lineHeight: 1.7,
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "white",
        padding: "24px 18px 50px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "760px",
          margin: "0 auto",
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: "transparent",
            border: "none",
            color: "#ff2b2b",
            fontSize: "16px",
            fontWeight: 700,
            padding: "8px 0",
            cursor: "pointer",
          }}
        >
          ← Indietro
        </button>

        <h1
          style={{
            fontSize: "30px",
            marginTop: "24px",
            marginBottom: "8px",
          }}
        >
          Informativa Privacy
        </h1>

        <p
          style={{
            color: "#999",
            lineHeight: 1.6,
            marginBottom: "30px",
          }}
        >
          Informativa sul trattamento dei dati personali ai sensi del
          Regolamento (UE) 2016/679 (GDPR).
        </p>

        {/* 1 */}
        <section style={sectionStyle}>
          <h2>1. Titolare del trattamento</h2>

          <p style={textStyle}>
            Il Titolare del trattamento dei dati personali è:
            <br />
            <strong>Minos Fit A.S.D.</strong>
            <br />
            Via Ranza 4, 28060 Casalvolone (NO), Italia
            <br />
            P. IVA: 00000000
            <br />
            Codice Fiscale: 94088740033
            <br />
            Email: minosfitasd@gmail.com
          </p>
        </section>

        {/* 2 */}
        <section style={sectionStyle}>
          <h2>2. Dati personali trattati</h2>

          <p style={textStyle}>
            Attraverso l&apos;app Minos Fit possono essere raccolti e trattati,
            nei limiti necessari all&apos;erogazione dei servizi, dati
            anagrafici e di contatto, codice fiscale, informazioni relative
            all&apos;iscrizione e all&apos;abbonamento, prenotazioni,
            informazioni relative alle schede di allenamento e alle attività
            svolte presso la struttura.
          </p>

          <p style={textStyle}>
            Possono inoltre essere trattati documenti e informazioni relativi
            alla certificazione medica richiesta per lo svolgimento
            dell&apos;attività sportiva. Tali informazioni sono gestite con
            particolare attenzione e utilizzate esclusivamente per le finalità
            connesse alla verifica dell&apos;idoneità e agli obblighi
            applicabili all&apos;attività sportiva.
          </p>
        </section>

        {/* 3 */}
        <section style={sectionStyle}>
          <h2>3. Finalità del trattamento</h2>

          <p style={textStyle}>
            I dati personali vengono trattati per gestire la registrazione e
            l&apos;account dell&apos;utente, l&apos;iscrizione alla palestra,
            gli abbonamenti e le relative scadenze, i certificati medici, le
            prenotazioni dei servizi, le schede di allenamento, le
            comunicazioni con lo staff e le funzionalità necessarie al
            funzionamento dell&apos;app Minos Fit.
          </p>
        </section>

        {/* 4 */}
        <section style={sectionStyle}>
          <h2>4. Base giuridica del trattamento</h2>

          <p style={textStyle}>
            Il trattamento dei dati personali avviene sulla base delle
            condizioni previste dal Regolamento (UE) 2016/679 (GDPR), in
            funzione delle diverse finalità perseguite.
          </p>

          <p style={textStyle}>
            In particolare, i dati necessari alla registrazione, alla gestione
            dell&apos;account, dell&apos;iscrizione, dell&apos;abbonamento,
            delle prenotazioni e dei servizi richiesti dall&apos;utente sono
            trattati nell&apos;ambito dell&apos;esecuzione del rapporto
            associativo e dell&apos;erogazione dei servizi richiesti.
          </p>

          <p style={textStyle}>
            Alcuni dati possono inoltre essere trattati per adempiere a
            obblighi previsti dalla legge o da altre disposizioni applicabili
            a Minos Fit A.S.D.
          </p>

          <p style={textStyle}>
            Per i trattamenti che richiedono una specifica base giuridica o il
            consenso dell&apos;interessato, inclusi quelli relativi a
            particolari categorie di dati personali quando applicabile, il
            trattamento viene effettuato nel rispetto delle condizioni
            previste dalla normativa vigente.
          </p>
        </section>

        {/* 5 */}
        <section style={sectionStyle}>
          <h2>5. Dati relativi alla salute e certificati medici</h2>

          <p style={textStyle}>
            Nell&apos;ambito della gestione dell&apos;attività sportiva, Minos
            Fit A.S.D. può trattare dati relativi alla salute dell&apos;utente
            contenuti nella certificazione medica richiesta per lo svolgimento
            dell&apos;attività sportiva.
          </p>

          <p style={textStyle}>
            Attraverso l&apos;app l&apos;utente può trasmettere il proprio
            certificato medico e le informazioni ad esso associate, quali la
            data di rilascio e la data di scadenza. Il documento viene
            utilizzato esclusivamente per la gestione e la verifica della
            certificazione richiesta per lo svolgimento dell&apos;attività
            sportiva e per la gestione della relativa scadenza.
          </p>

          <p style={textStyle}>
            L&apos;accesso a tali informazioni è limitato ai soggetti
            autorizzati nell&apos;ambito dell&apos;organizzazione di Minos Fit
            A.S.D. e agli eventuali fornitori tecnici che trattano i dati per
            conto dell&apos;Associazione, nei limiti necessari
            all&apos;erogazione del servizio.
          </p>

          <p style={textStyle}>
            I dati relativi alla salute non vengono utilizzati per finalità
            pubblicitarie o di marketing.
          </p>
        </section>

        {/* 6 */}
        <section style={sectionStyle}>
          <h2>6. Utenti minorenni</h2>

          <p style={textStyle}>
            L&apos;app Minos Fit può essere utilizzata anche nell&apos;ambito
            dell&apos;iscrizione di utenti minorenni. In tali casi vengono
            trattati esclusivamente i dati necessari alla gestione
            dell&apos;iscrizione, dell&apos;attività sportiva e dei servizi
            messi a disposizione dall&apos;Associazione.
          </p>

          <p style={textStyle}>
            Quando richiesto dalla normativa applicabile, l&apos;iscrizione
            del minore e le operazioni che richiedono il consenso sono
            effettuate con l&apos;intervento del genitore o di chi esercita la
            responsabilità genitoriale.
          </p>

          <p style={textStyle}>
            Le richieste di registrazione relative a utenti minorenni possono
            essere sottoposte a verifica da parte dello staff di Minos Fit
            A.S.D. prima dell&apos;attivazione dell&apos;account.
          </p>

          <p style={textStyle}>
            Anche l&apos;eventuale certificazione medica del minore è trattata
            esclusivamente per le finalità connesse allo svolgimento
            dell&apos;attività sportiva e secondo le modalità indicate nella
            presente informativa.
          </p>
        </section>

        {/* 7 */}
        <section style={sectionStyle}>
          <h2>7. Funzionalità di Intelligenza Artificiale</h2>

          <p style={textStyle}>
            L&apos;app Minos Fit può mettere a disposizione dell&apos;utente
            funzionalità basate su sistemi di intelligenza artificiale, ad
            esempio per fornire assistenza, informazioni o supporto
            nell&apos;utilizzo dei servizi dell&apos;app.
          </p>

          <p style={textStyle}>
            Per il funzionamento di tali servizi, i contenuti inseriti
            dall&apos;utente nelle funzionalità di intelligenza artificiale
            possono essere elaborati mediante servizi tecnologici forniti da
            soggetti terzi. I dati trasmessi sono limitati a quelli necessari
            al funzionamento della specifica funzionalità.
          </p>

          <p style={textStyle}>
            L&apos;utente è invitato a non inserire volontariamente nella chat
            o negli strumenti di intelligenza artificiale certificati medici,
            documenti sanitari o altri dati personali particolarmente
            sensibili, salvo che una specifica funzionalità dell&apos;app sia
            espressamente predisposta per tale finalità e vengano fornite le
            relative informazioni sul trattamento.
          </p>

          <p style={textStyle}>
            Le risposte generate mediante sistemi di intelligenza artificiale
            hanno finalità di supporto e non sostituiscono valutazioni,
            diagnosi, prescrizioni o indicazioni fornite da professionisti
            sanitari qualificati.
          </p>
        </section>

        {/* 8 */}
        <section style={sectionStyle}>
          <h2>8. Pagamenti e servizi esterni</h2>

          <p style={textStyle}>
            L&apos;app Minos Fit può consentire all&apos;utente di accedere a
            siti, piattaforme o servizi esterni per effettuare pagamenti
            relativi ad abbonamenti, rinnovi o altri servizi offerti da Minos
            Fit A.S.D.
          </p>

          <p style={textStyle}>
            Quando il pagamento viene effettuato attraverso una piattaforma
            esterna, l&apos;utente viene indirizzato al servizio del relativo
            fornitore. I dati necessari all&apos;esecuzione del pagamento,
            inclusi gli eventuali dati relativi allo strumento di pagamento,
            sono inseriti e trattati direttamente dal fornitore del servizio
            di pagamento secondo la propria informativa privacy.
          </p>

          <p style={textStyle}>
            Minos Fit A.S.D. non acquisisce né conserva attraverso l&apos;app
            i dati completi delle carte di pagamento utilizzate sulle
            piattaforme esterne.
          </p>

          <p style={textStyle}>
            Minos Fit A.S.D. può ricevere dal fornitore le informazioni
            necessarie alla gestione del servizio acquistato, come
            l&apos;esito del pagamento, l&apos;importo, la data
            dell&apos;operazione e gli eventuali riferimenti della
            transazione.
          </p>

          <p style={textStyle}>
            I siti e i servizi esterni sono soggetti alle rispettive
            condizioni di utilizzo e informative sul trattamento dei dati
            personali, che l&apos;utente è invitato a consultare prima di
            utilizzare il relativo servizio.
          </p>
        </section>

        {/* 9 */}
        <section style={sectionStyle}>
          <h2>9. Fornitori tecnici e soggetti che trattano i dati</h2>

          <p style={textStyle}>
            Per il funzionamento dell&apos;app Minos Fit, Minos Fit A.S.D. può
            avvalersi di fornitori esterni di servizi tecnologici che possono
            trattare dati personali per conto dell&apos;Associazione, nei
            limiti necessari alla fornitura dei rispettivi servizi.
          </p>

          <p style={textStyle}>
            In particolare, l&apos;app utilizza servizi forniti da Supabase
            per funzionalità quali autenticazione degli utenti, gestione del
            database e archiviazione dei documenti e dei file caricati
            attraverso l&apos;app.
          </p>

          <p style={textStyle}>
            Il progetto principale utilizzato dall&apos;app Minos Fit è
            configurato nella regione europea AWS eu-west-1 (Irlanda). I dati
            principali gestiti attraverso tale infrastruttura sono pertanto
            ospitati all&apos;interno dell&apos;Unione Europea.
          </p>

          <p style={textStyle}>
            Tali fornitori trattano i dati secondo gli accordi applicabili e
            le istruzioni ricevute, adottando misure tecniche e organizzative
            per la protezione delle informazioni trattate.
          </p>

          <p style={textStyle}>
            Ulteriori fornitori potranno essere utilizzati per specifiche
            funzionalità dell&apos;app, come servizi di pagamento,
            comunicazione o intelligenza artificiale. La presente informativa
            sarà aggiornata quando necessario per riflettere modifiche
            rilevanti ai servizi utilizzati.
          </p>
        </section>

        {/* 10 */}
        <section style={sectionStyle}>
          <h2>10. Conservazione e sicurezza dei dati</h2>

          <p style={textStyle}>
            I dati personali sono conservati per il periodo necessario al
            raggiungimento delle finalità per le quali sono stati raccolti e,
            successivamente, per gli eventuali periodi richiesti dalla
            normativa applicabile o necessari alla tutela dei diritti di
            Minos Fit A.S.D. e degli interessati.
          </p>

          <p style={textStyle}>
            Per quanto riguarda i certificati medici e i relativi dati, i
            tempi di conservazione possono variare in funzione della tipologia
            di certificazione e degli eventuali obblighi normativi
            applicabili. I documenti non vengono conservati oltre il periodo
            necessario, salvo che la loro ulteriore conservazione sia
            richiesta dalla legge o risulti necessaria per la tutela di un
            diritto.
          </p>

          <p style={textStyle}>
            Minos Fit A.S.D. adotta misure tecniche e organizzative
            finalizzate a proteggere i dati personali da accessi non
            autorizzati, perdita, alterazione, divulgazione o utilizzo
            illecito.
          </p>

          <p style={textStyle}>
            L&apos;accesso ai certificati medici e agli altri dati personali
            dell&apos;utente è limitato ai soggetti autorizzati e ai fornitori
            tecnici che necessitano di trattare tali informazioni per
            l&apos;erogazione dei servizi.
          </p>
        </section>

        {/* 11 */}
        <section style={sectionStyle}>
          <h2>11. Diritti dell&apos;interessato</h2>

          <p style={textStyle}>
            Nei casi previsti dal Regolamento (UE) 2016/679 (GDPR),
            l&apos;interessato può esercitare i propri diritti in relazione ai
            dati personali trattati, tra cui il diritto di accesso, rettifica,
            cancellazione, limitazione del trattamento, opposizione e
            portabilità dei dati.
          </p>

          <p style={textStyle}>
            Qualora il trattamento sia basato sul consenso,
            l&apos;interessato può revocare il proprio consenso in qualsiasi
            momento, senza pregiudicare la liceità del trattamento effettuato
            prima della revoca.
          </p>

          <p style={textStyle}>
            Per esercitare i propri diritti o richiedere informazioni sul
            trattamento dei dati personali è possibile contattare Minos Fit
            A.S.D. all&apos;indirizzo:
            <br />
            <strong>minosfitasd@gmail.com</strong>
          </p>

          <p style={textStyle}>
            L&apos;interessato ha inoltre il diritto di proporre reclamo
            all&apos;Autorità Garante per la protezione dei dati personali,
            qualora ritenga che il trattamento dei propri dati personali
            avvenga in violazione della normativa applicabile.
          </p>
        </section>

        {/* 12 */}
        <section style={sectionStyle}>
          <h2>12. Aggiornamenti dell&apos;informativa</h2>

          <p style={textStyle}>
            La presente informativa può essere aggiornata per adeguarla a
            modifiche normative o all&apos;introduzione di nuove funzionalità
            dell&apos;app. La versione aggiornata sarà resa disponibile
            attraverso l&apos;app Minos Fit.
          </p>

          <p style={{ ...textStyle, marginBottom: 0 }}>
            <strong>Ultimo aggiornamento: 3 ottobre 2026</strong>
          </p>
        </section>
      </div>
    </main>
  );
}