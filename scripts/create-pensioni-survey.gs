/**
 * Crea il sondaggio "Pensioni per cani — AllevatoriItalia" nel tuo Google Drive.
 *
 * COME USARLO:
 *  1. Vai su https://script.google.com → Nuovo progetto
 *  2. Incolla TUTTO questo file dentro Code.gs (sostituisci il contenuto esistente)
 *  3. Premi "Esegui" sulla funzione createPensioniSurvey
 *  4. Autorizza l'accesso quando richiesto
 *  5. Nei log (Visualizza → Log) trovi il link al form (edit + condivisione)
 */

function createPensioniSurvey() {
  const form = FormApp.create("Pensioni per cani — AllevatoriItalia");

  form
    .setDescription(
      "Stiamo lanciando una sezione dedicata alle pensioni per cani su AllevatoriItalia. " +
        "Vorremmo capire come lavorate e cosa vi servirebbe davvero. " +
        "Bastano 3 minuti — chi risponde avrà un profilo gratuito per 6 mesi nella beta."
    )
    .setCollectEmail(true)
    .setProgressBar(true)
    .setShowLinkToRespondAgain(false)
    .setConfirmationMessage(
      "Grazie! Ti contatteremo a breve con i dettagli per la beta."
    );

  // ── Sezione 1: Anagrafica ───────────────────────────────────────────
  form.addPageBreakItem().setTitle("La tua pensione");

  form.addTextItem().setTitle("Nome della pensione").setRequired(true);
  form.addTextItem().setTitle("Comune e provincia").setRequired(true);
  form.addTextItem().setTitle("Email di contatto").setRequired(true);

  // ── Sezione 2: Operatività ─────────────────────────────────────────
  form.addPageBreakItem().setTitle("Come lavorate oggi");

  form
    .addMultipleChoiceItem()
    .setTitle("Da quanti anni operate?")
    .setChoiceValues(["Meno di 1 anno", "1–3 anni", "4–10 anni", "Oltre 10 anni"]);

  form
    .addMultipleChoiceItem()
    .setTitle("Quanti cani potete ospitare contemporaneamente?")
    .setChoiceValues(["1–5", "6–15", "16–30", "Oltre 30"]);

  form
    .addCheckboxItem()
    .setTitle("Servizi offerti (selezione multipla)")
    .setChoiceValues([
      "Pensione lunga degenza",
      "Daycare / asilo giornaliero",
      "Addestramento",
      "Toelettatura",
      "Trasporto cane",
      "Cuccioli sotto i 6 mesi",
      "Cani anziani / con esigenze sanitarie",
      "Cani con problemi comportamentali",
    ]);

  // ── Sezione 3: Acquisizione clienti ─────────────────────────────────
  form.addPageBreakItem().setTitle("Come trovate i clienti");

  form
    .addCheckboxItem()
    .setTitle("Da dove arrivano principalmente i nuovi clienti? (max 3)")
    .setChoiceValues([
      "Passaparola / amici",
      "Veterinari di zona",
      "Ricerca Google",
      "Facebook / Instagram",
      "Sito web della pensione",
      "Portali esistenti (Holidog, Rover…)",
      "Volantini / passaggio davanti alla struttura",
      "Altro",
    ]);

  form
    .addCheckboxItem()
    .setTitle("Come gestite le richieste di prenotazione? (selezione multipla)")
    .setChoiceValues([
      "Telefono",
      "WhatsApp",
      "Email",
      "Modulo sul nostro sito",
      "Calendario online (es. Google Calendar)",
      "Software gestionale dedicato",
      "Quaderno / agenda cartacea",
    ]);

  // ── Sezione 4: Pain points ─────────────────────────────────────────
  form.addPageBreakItem().setTitle("Cosa vi pesa di più");

  form
    .addCheckboxItem()
    .setTitle("Quali sono i 3 problemi più grandi nella gestione/promozione? (max 3)")
    .setChoiceValues([
      "Far conoscere la pensione a nuovi clienti",
      "Riempire i periodi di bassa stagione",
      "Gestire richieste che poi non si concretizzano",
      "Recensioni e reputazione online",
      "Concorrenza con pensioni abusive",
      "Tempo speso al telefono / WhatsApp",
      "Pagamenti, caparre, no-show",
      "Altro",
    ]);

  // ── Sezione 5: Interesse piattaforma ───────────────────────────────
  form.addPageBreakItem().setTitle("La piattaforma");

  form
    .addScaleItem()
    .setTitle(
      "Quanto sei interessato a un portale con profilo ottimizzato per Google, " +
        "richieste di prenotazione strutturate e recensioni verificate?"
    )
    .setBounds(1, 5)
    .setLabels("Per niente", "Molto");

  form
    .addCheckboxItem()
    .setTitle("Quali funzionalità ti sarebbero più utili? (selezione multipla)")
    .setChoiceValues([
      "Profilo pubblico ottimizzato per Google",
      "Richieste di prenotazione strutturate (date, taglia, esigenze)",
      "Calendario di disponibilità in tempo reale",
      "Recensioni verificate dei clienti",
      "Chat diretta con il cliente",
      "Galleria foto della struttura",
      "Badge ENCI / certificazioni / assicurazione",
      "Gestione pagamenti e caparre online",
      "Statistiche su visualizzazioni e contatti",
    ]);

  form
    .addParagraphTextItem()
    .setTitle("Cosa ti convincerebbe DAVVERO a iscriverti?")
    .setRequired(false);

  // ── Sezione 6: Modello economico ───────────────────────────────────
  form.addPageBreakItem().setTitle("Modello economico");

  form
    .addMultipleChoiceItem()
    .setTitle("Preferiresti pagare con:")
    .setChoiceValues([
      "Abbonamento mensile fisso, zero commissioni",
      "Gratis + commissione % sulle prenotazioni",
      "Mix: piccolo canone + commissione ridotta",
      "Solo pay-per-lead (paghi per richieste qualificate)",
    ]);

  form
    .addMultipleChoiceItem()
    .setTitle("Quanto saresti disposto a pagare al mese se ti porta clienti?")
    .setChoiceValues([
      "Solo se gratuito",
      "Fino a 15€/mese",
      "15–30€/mese",
      "30–60€/mese",
      "Oltre 60€/mese se i risultati sono concreti",
    ]);

  // ── Sezione 7: Next step ───────────────────────────────────────────
  form.addPageBreakItem().setTitle("Prossimi passi");

  form
    .addMultipleChoiceItem()
    .setTitle("Vuoi entrare nella beta con profilo gratuito per 6 mesi?")
    .setChoiceValues(["Sì, contattatemi", "Forse, fatemi sapere", "No grazie"]);

  form
    .addTextItem()
    .setTitle("Numero di telefono per follow-up (opzionale)")
    .setRequired(false);

  // Log dei link utili
  const editUrl = form.getEditUrl();
  const publicUrl = form.getPublishedUrl();
  Logger.log("Edit URL:    " + editUrl);
  Logger.log("Public URL:  " + publicUrl);
  Logger.log("\nApri 'Visualizza → Log' se non li vedi.");
}
