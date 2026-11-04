"use client";

import { useRouter } from "next/navigation";

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

export default function TerminiPage() {
  const router = useRouter();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        padding: "24px 16px 60px",
      }}
    >
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            background: "#dc2626",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            padding: "11px 18px",
            fontWeight: 800,
            cursor: "pointer",
            marginBottom: "28px",
          }}
        >
          ← Indietro
        </button>

        <div style={{ marginBottom: "32px" }}>
          <p
            style={{
              color: "#ef4444",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              fontSize: "12px",
              marginBottom: "8px",
            }}
          >
            Minos Fit
          </p>

          <h1
            style={{
              fontSize: "32px",
              margin: 0,
              fontWeight: 900,
            }}
          >
            Termini e Condizioni
          </h1>

          <p
            style={{
              ...textStyle,
              color: "#999",
              marginTop: "12px",
            }}
          >
            Condizioni di utilizzo dell&apos;app Minos Fit e dei servizi
            collegati.
          </p>
        </div>

        <section style={sectionStyle}>
          <h2>1. Informazioni sull&apos;Associazione</h2>

          <p style={textStyle}>
            I presenti Termini e Condizioni disciplinano l&apos;utilizzo
            dell&apos;app Minos Fit e dei servizi messi a disposizione da:
          </p>

          <p style={textStyle}>
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

        <section style={sectionStyle}>
          <h2>2. Accettazione dei Termini</h2>

          <p style={textStyle}>
            La creazione di un account e l&apos;utilizzo dei servizi
            dell&apos;app richiedono la presa visione e l&apos;accettazione
            dei presenti Termini e Condizioni.
          </p>

          <p style={textStyle}>
            L&apos;utente è tenuto a fornire informazioni corrette,
            complete e aggiornate e a utilizzare l&apos;app nel rispetto
            della normativa applicabile, dei presenti Termini e delle
            regole previste da Minos Fit A.S.D.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>3. Account personale</h2>

          <p style={textStyle}>
            L&apos;account Minos Fit è personale e non può essere ceduto,
            condiviso o utilizzato da soggetti diversi dal titolare.
          </p>

          <p style={textStyle}>
            L&apos;utente è responsabile della custodia delle proprie
            credenziali di accesso e deve informare tempestivamente Minos
            Fit A.S.D. qualora sospetti un utilizzo non autorizzato del
            proprio account.
          </p>

          <p style={textStyle}>
            Minos Fit A.S.D. può effettuare verifiche sui dati forniti
            dall&apos;utente quando necessarie alla gestione
            dell&apos;iscrizione e dei servizi.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>4. Utenti minorenni</h2>

          <p style={textStyle}>
            L&apos;iscrizione di un utente minorenne è soggetta
            all&apos;autorizzazione del genitore o di chi esercita la
            responsabilità genitoriale o la tutela.
          </p>

          <p style={textStyle}>
            La richiesta può essere sottoposta a verifica da parte dello
            staff di Minos Fit A.S.D. prima dell&apos;attivazione
            dell&apos;account e dell&apos;accesso ai servizi.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>5. Iscrizione e quota associativa</h2>

          <p style={textStyle}>
            L&apos;accesso alle attività e ai servizi riservati agli
            associati può essere subordinato al completamento della
            procedura di ammissione e al pagamento della quota associativa
            prevista da Minos Fit A.S.D.
          </p>

          <p style={textStyle}>
            La quota associativa è distinta dagli eventuali corrispettivi
            relativi ad abbonamenti, corsi, servizi di personal training o
            altri servizi offerti dall&apos;Associazione.
          </p>

          <p style={textStyle}>
            Durata, importo, scadenza e condizioni applicabili sono quelli
            comunicati all&apos;utente al momento dell&apos;iscrizione o
            dell&apos;acquisto.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>6. Abbonamenti e rinnovi</h2>

          <p style={textStyle}>
            Gli abbonamenti consentono di utilizzare i servizi compresi
            nella formula scelta per il periodo di validità indicato al
            momento dell&apos;acquisto.
          </p>

          <p style={textStyle}>
            Alla scadenza, l&apos;abbonamento cessa di essere valido salvo
            rinnovo o diversa condizione espressamente comunicata
            all&apos;utente.
          </p>

          <p style={textStyle}>
            L&apos;eventuale disponibilità di rinnovi online, promozioni o
            condizioni particolari sarà indicata nell&apos;app o attraverso
            gli altri canali ufficiali di Minos Fit A.S.D.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>7. Pagamenti</h2>

          <p style={textStyle}>
            Alcuni pagamenti possono essere effettuati tramite siti,
            piattaforme o servizi esterni collegati all&apos;app.
          </p>

          <p style={textStyle}>
            In tali casi il pagamento viene gestito dal relativo fornitore
            secondo le proprie condizioni di utilizzo. Minos Fit A.S.D. può
            ricevere le informazioni necessarie a verificare
            l&apos;avvenuto pagamento e ad attivare o rinnovare il servizio
            acquistato.
          </p>

          <p style={textStyle}>
            Prima di confermare un acquisto, l&apos;utente è tenuto a
            verificare il servizio selezionato, il relativo prezzo, la
            durata e le eventuali condizioni specifiche indicate.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>8. Rimborsi e diritto di recesso</h2>

          <p style={textStyle}>
            La quota associativa e gli importi versati per abbonamenti e
            servizi non sono rimborsabili, salvo i casi in cui il rimborso
            o il diritto di recesso siano espressamente previsti dalla
            normativa applicabile.
          </p>

          <p style={textStyle}>
            Per i contratti conclusi a distanza si applicano, ove ne
            ricorrano i presupposti, le disposizioni sul diritto di recesso
            previste dal Codice del consumo.
          </p>

          <p style={textStyle}>
            L&apos;eventuale richiesta di recesso o rimborso può essere
            inviata a Minos Fit A.S.D. all&apos;indirizzo
            minosfitasd@gmail.com.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>9. Certificato medico</h2>

          <p style={textStyle}>
            Quando richiesto dalla normativa applicabile, dalla tipologia
            di attività sportiva svolta o dalle regole applicabili
            all&apos;attività dell&apos;Associazione, l&apos;utente deve
            essere in possesso di idonea certificazione medica in corso di
            validità.
          </p>

          <p style={textStyle}>
            L&apos;app può consentire il caricamento del certificato medico
            e la gestione delle relative date di rilascio e scadenza.
          </p>

          <p style={textStyle}>
            L&apos;utente è responsabile della correttezza e
            dell&apos;autenticità della documentazione trasmessa.
          </p>

          <p style={textStyle}>
            Qualora la certificazione richiesta risulti assente, scaduta,
            non valida o non verificabile, Minos Fit A.S.D. può impedire o
            sospendere la partecipazione alle attività per le quali tale
            certificazione è necessaria fino alla regolarizzazione della
            posizione.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>10. Prenotazioni e Personal Training</h2>

          <p style={textStyle}>
            L&apos;app può consentire la prenotazione di appuntamenti,
            sessioni di personal training e altri servizi offerti da Minos
            Fit A.S.D.
          </p>

          <p style={textStyle}>
            La disponibilità degli appuntamenti può variare in base agli
            orari della struttura, alla disponibilità dello staff e al
            servizio richiesto.
          </p>

          <p style={textStyle}>
            Eventuali condizioni specifiche relative a cancellazioni,
            modifiche, pacchetti o servizi acquistati vengono comunicate
            all&apos;utente in relazione al servizio interessato.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>11. Schede di allenamento e contenuti</h2>

          <p style={textStyle}>
            L&apos;app può mettere a disposizione schede di allenamento,
            programmi, indicazioni e altri contenuti collegati ai servizi
            offerti da Minos Fit A.S.D.
          </p>

          <p style={textStyle}>
            I programmi possono essere predisposti sulla base delle
            informazioni disponibili e non sostituiscono valutazioni,
            diagnosi, trattamenti o prescrizioni di natura medica o
            sanitaria.
          </p>

          <p style={textStyle}>
            L&apos;utente è tenuto a comunicare allo staff eventuali
            limitazioni rilevanti per lo svolgimento dell&apos;attività e
            a rispettare le indicazioni ricevute dai professionisti
            sanitari che lo seguono.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>12. Funzionalità di Intelligenza Artificiale</h2>

          <p style={textStyle}>
            L&apos;app può includere funzionalità basate su sistemi di
            intelligenza artificiale destinate a fornire assistenza,
            informazioni o supporto nell&apos;utilizzo dei servizi.
          </p>

          <p style={textStyle}>
            I contenuti generati mediante tali sistemi hanno finalità di
            supporto e possono contenere errori o informazioni incomplete.
          </p>

          <p style={textStyle}>
            Le funzionalità di intelligenza artificiale non sostituiscono
            il parere, la diagnosi, la prescrizione o il trattamento di un
            medico o di altro professionista sanitario qualificato.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>13. Accesso alla palestra</h2>

          <p style={textStyle}>
            L&apos;accesso alla struttura e ai servizi può essere
            subordinato alla presenza dei requisiti previsti per il
            servizio utilizzato, inclusi, ove applicabili, iscrizione
            regolare, quota associativa, abbonamento valido e
            certificazione medica richiesta.
          </p>

          <p style={textStyle}>
            Eventuali strumenti di accesso fisici o digitali messi a
            disposizione dell&apos;utente sono personali e non possono
            essere ceduti o utilizzati per consentire l&apos;accesso a
            terzi.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>14. Regole di comportamento</h2>

          <p style={textStyle}>
            L&apos;utente è tenuto a utilizzare gli spazi, le attrezzature
            e i servizi della palestra in modo corretto e rispettoso della
            sicurezza propria e altrui, dello staff e degli altri utenti.
          </p>

          <p style={textStyle}>
            Comportamenti illeciti, pericolosi, fraudolenti, gravemente
            scorretti o contrari alle regole della struttura possono
            comportare limitazioni o sospensioni dell&apos;accesso, nel
            rispetto della normativa applicabile e delle regole
            associative.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>15. Sospensione o chiusura dell&apos;account</h2>

          <p style={textStyle}>
            Minos Fit A.S.D. può sospendere o limitare l&apos;utilizzo
            dell&apos;account in caso di utilizzo improprio
            dell&apos;app, violazioni dei presenti Termini, problemi di
            sicurezza, dati falsi o altri motivi legittimi connessi alla
            gestione dei servizi.
          </p>

          <p style={textStyle}>
            L&apos;eventuale sospensione dell&apos;account non modifica i
            diritti inderogabili riconosciuti all&apos;utente dalla legge.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>16. Disponibilità dell&apos;app</h2>

          <p style={textStyle}>
            Minos Fit A.S.D. si impegna a mantenere l&apos;app e i relativi
            servizi disponibili e funzionanti, ma non può garantire
            l&apos;assenza assoluta di interruzioni, errori tecnici,
            manutenzioni o indisponibilità dipendenti da servizi di terzi.
          </p>

          <p style={textStyle}>
            Alcune funzionalità possono essere temporaneamente modificate,
            sospese o aggiornate per esigenze tecniche, di sicurezza o di
            evoluzione del servizio.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>17. Responsabilità</h2>

          <p style={textStyle}>
            Minos Fit A.S.D. risponde nei limiti previsti dalla normativa
            applicabile e nessuna disposizione dei presenti Termini deve
            essere interpretata come esclusione o limitazione di
            responsabilità nei casi in cui tale esclusione o limitazione
            non sia consentita dalla legge.
          </p>

          <p style={textStyle}>
            L&apos;utente rimane responsabile dell&apos;utilizzo corretto
            dell&apos;account, delle attrezzature e dei servizi, nonché del
            rispetto delle indicazioni di sicurezza e delle proprie
            eventuali prescrizioni o limitazioni sanitarie.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>18. Privacy e dati personali</h2>

          <p style={textStyle}>
            Il trattamento dei dati personali effettuato attraverso
            l&apos;app è descritto nell&apos;Informativa Privacy di Minos
            Fit A.S.D., resa disponibile separatamente all&apos;utente.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>19. Modifiche ai Termini</h2>

          <p style={textStyle}>
            I presenti Termini e Condizioni possono essere aggiornati per
            riflettere modifiche normative, organizzative o relative ai
            servizi offerti.
          </p>

          <p style={textStyle}>
            Qualora le modifiche richiedano una nuova accettazione da parte
            dell&apos;utente, questa potrà essere richiesta attraverso
            l&apos;app prima di proseguire nell&apos;utilizzo dei servizi
            interessati.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>20. Legge applicabile e diritti dell&apos;utente</h2>

          <p style={textStyle}>
            I presenti Termini sono disciplinati dalla legge italiana.
          </p>

          <p style={textStyle}>
            Restano in ogni caso impregiudicati i diritti inderogabili
            riconosciuti all&apos;utente dalla normativa applicabile,
            comprese, quando applicabili, le disposizioni previste a tutela
            del consumatore.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>21. Contatti</h2>

          <p style={textStyle}>
            Per informazioni relative ai presenti Termini e Condizioni è
            possibile contattare:
          </p>

          <p style={textStyle}>
            <strong>Minos Fit A.S.D.</strong>
            <br />
            Email: minosfitasd@gmail.com
          </p>
        </section>

        <p
          style={{
            textAlign: "center",
            color: "#777",
            fontSize: "13px",
            marginTop: "30px",
          }}
        >
          Ultimo aggiornamento: 7 ottobre 2026
        </p>
      </div>
    </main>
  );
}