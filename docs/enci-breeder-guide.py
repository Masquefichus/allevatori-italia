#!/usr/bin/env python3
"""Generate PDF: Sistema di Certificazione degli Allevatori in Italia"""

from fpdf import FPDF

class PDF(FPDF):
    def header(self):
        if self.page_no() > 1:
            self.set_font("Helvetica", "I", 8)
            self.set_text_color(120, 120, 120)
            self.cell(0, 8, "Sistema di Certificazione e Riconoscimento degli Allevatori Cinofili in Italia", align="C")
            self.ln(12)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f"Pagina {self.page_no()}/{{nb}}", align="C")

    def ensure_space(self, mm=50):
        """Add page break only if less than mm millimeters remain."""
        if self.get_y() > 297 - self.b_margin - mm:
            self.add_page()

    def chapter_title(self, title, new_page=True):
        if new_page:
            self.add_page()
        else:
            self.ensure_space(60)
            self.ln(8)
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(40, 62, 82)
        self.cell(0, 12, title)
        self.ln(4)
        self.set_draw_color(40, 62, 82)
        self.set_line_width(0.8)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(8)

    def section_title(self, title):
        self.ensure_space(40)
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(60, 60, 60)
        self.cell(0, 10, title)
        self.ln(8)

    def subsection_title(self, title):
        self.ensure_space(25)
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(80, 80, 80)
        self.cell(0, 8, title)
        self.ln(6)

    def body_text(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(50, 50, 50)
        self.multi_cell(0, 5.5, text)
        self.ln(3)

    def bullet(self, text, indent=10):
        x = self.get_x()
        self.set_font("Helvetica", "", 10)
        self.set_text_color(50, 50, 50)
        self.set_x(x + indent)
        self.cell(4, 5.5, "-")
        self.multi_cell(0, 5.5, text)
        self.ln(1)

    def bold_bullet(self, bold_part, rest, indent=10):
        x = self.get_x()
        self.set_x(x + indent)
        self.set_font("Helvetica", "", 10)
        self.set_text_color(50, 50, 50)
        self.cell(4, 5.5, "-")
        self.set_font("Helvetica", "B", 10)
        self.write(5.5, bold_part)
        self.set_font("Helvetica", "", 10)
        self.write(5.5, rest)
        self.ln(7)

    def note_box(self, text):
        self.set_fill_color(240, 235, 227)
        self.set_draw_color(200, 190, 175)
        y_start = self.get_y()
        self.set_x(15)
        self.set_font("Helvetica", "I", 9)
        self.set_text_color(80, 70, 60)
        self.multi_cell(180, 5, text, border=1, fill=True)
        self.ln(5)

    def reference_item(self, title, url):
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(50, 50, 50)
        self.write(5, title + ": ")
        self.set_font("Helvetica", "", 9)
        self.set_text_color(40, 62, 82)
        self.write(5, url)
        self.ln(6)


pdf = PDF()
pdf.alias_nb_pages()
pdf.set_auto_page_break(auto=True, margin=20)

# ── Cover page ──
pdf.add_page()
pdf.ln(50)
pdf.set_font("Helvetica", "B", 28)
pdf.set_text_color(40, 62, 82)
pdf.multi_cell(0, 14, "Sistema di Certificazione\ne Riconoscimento degli\nAllevatori Cinofili in Italia", align="C")
pdf.ln(15)
pdf.set_font("Helvetica", "", 14)
pdf.set_text_color(100, 100, 100)
pdf.cell(0, 8, "Guida completa ai livelli di qualifica,", align="C")
pdf.ln(8)
pdf.cell(0, 8, "certificazione e obblighi normativi", align="C")
pdf.ln(30)
pdf.set_font("Helvetica", "", 11)
pdf.set_text_color(150, 150, 150)
pdf.cell(0, 7, "Documento di riferimento interno", align="C")
pdf.ln(7)
pdf.cell(0, 7, "AllevatoriItalia - Aprile 2026", align="C")

# ── 1. Introduzione ──
pdf.chapter_title("1. Introduzione")
pdf.body_text(
    "Il sistema di certificazione degli allevatori cinofili in Italia si articola su piu' livelli "
    "indipendenti che spesso vengono confusi tra loro. E' fondamentale comprendere che esistono "
    "due assi principali completamente separati:"
)
pdf.ln(2)
pdf.bold_bullet("Asse legale/amministrativo", " - Obblighi di legge gestiti dallo Stato (ASL, Comuni, Agenzia delle Entrate)")
pdf.bold_bullet("Asse associativo/qualitativo", " - Riconoscimenti volontari gestiti dall'ENCI e dalla FCI")
pdf.ln(3)
pdf.body_text(
    "Un allevatore puo' essere perfettamente in regola con la legge italiana senza avere alcun "
    "rapporto con l'ENCI. Viceversa, un allevatore con affisso ENCI deve comunque rispettare "
    "tutti gli obblighi di legge. I due sistemi sono complementari ma non intercambiabili."
)
pdf.note_box(
    "NOTA IMPORTANTE: L'ENCI (Ente Nazionale della Cinofilia Italiana) e' un'associazione privata "
    "riconosciuta dal Ministero dell'Agricoltura (MASAF), non un ente governativo. Il suo ruolo "
    "e' la gestione del Libro Genealogico (pedigree), non la regolamentazione legale dell'allevamento."
)

# ── 2. Obblighi Legali ──
pdf.chapter_title("2. Obblighi Legali e Amministrativi")

pdf.section_title("2.1 Requisiti minimi per tutti gli allevatori")
pdf.body_text("Indipendentemente dalla scala dell'attivita', ogni allevatore in Italia deve rispettare:")
pdf.bold_bullet("Microchip e Anagrafe Canina", " - Tutti i cani devono essere microchippati e registrati nella Banca Dati Nazionale del Ministero della Salute, tramite il servizio veterinario ASL. I cuccioli vanno microchippati entro 60 giorni dalla nascita e prima di qualsiasi cessione.")
pdf.bold_bullet("Registrazione ASL", " - L'attivita' di allevamento deve essere comunicata al Servizio Veterinario dell'ASL competente, che assegna un Codice Aziendale (formato: IT + codice ISTAT comune + sigla provincia + numero progressivo).")
pdf.bold_bullet("Norme di benessere animale", " - Rispetto delle normative nazionali e regionali sul benessere animale, igiene delle strutture, e standard di detenzione.")
pdf.bold_bullet("Cessione minima a 60 giorni", " - I cuccioli non possono essere ceduti prima dei 60 giorni di vita (Legge 281/1991 e successive modifiche).")

pdf.section_title("2.2 Allevatore Amatoriale vs Professionale")
pdf.body_text(
    "La distinzione e' definita dalla Legge 349/1993 e successive modificazioni, ed e' di natura "
    "esclusivamente fiscale/commerciale:"
)
pdf.subsection_title("Allevatore Amatoriale")
pdf.bullet("Meno di 5 fattrici e/o meno di 30 cuccioli/anno")
pdf.bullet("Non necessita di Partita IVA specifica per l'allevamento")
pdf.bullet("Redditi da vendita occasionale dichiarati come 'redditi diversi'")
pdf.bullet("Comunque soggetto a tutti gli obblighi ASL e di benessere animale")

pdf.subsection_title("Allevatore Professionale (Imprenditore Agricolo)")
pdf.bullet("5 o piu' fattrici oppure 30 o piu' cuccioli/anno")
pdf.bullet("Obbligatoria la Partita IVA (Codice ATECO 01.49.20)")
pdf.bullet("Iscrizione alla Camera di Commercio")
pdf.bullet("Regime fiscale agricolo o forfettario (sotto 85.000 EUR/anno)")
pdf.bullet("SCIA (Segnalazione Certificata di Inizio Attivita') al Comune")
pdf.bullet("Obblighi di fatturazione e dichiarazione fiscale completa")

pdf.note_box(
    "ATTENZIONE: La distinzione amatoriale/professionale e' puramente fiscale. Molti dei "
    "migliori allevatori italiani sono tecnicamente 'amatoriali' perche' producono poche "
    "cucciolate all'anno con altissimi standard qualitativi."
)

pdf.section_title("2.3 Ruolo dell'ASL")
pdf.body_text(
    "L'ASL (Azienda Sanitaria Locale) e' l'autorita' regolatoria effettiva per l'allevamento "
    "in Italia. Le sue funzioni includono:"
)
pdf.bullet("Ispezioni sanitarie e di benessere animale delle strutture")
pdf.bullet("Rilascio del Codice Aziendale / Codice Allevamento")
pdf.bullet("Gestione dell'Anagrafe Canina (microchip e registrazione)")
pdf.bullet("Controllo delle malattie zoonotiche e vaccinazioni")
pdf.bullet("Autorizzazione sanitaria per strutture sopra determinate dimensioni")
pdf.bullet("Rilascio del Passaporto Europeo per animali da compagnia")

# ── 3. Sistema ENCI ──
pdf.chapter_title("3. Il Sistema ENCI: Livelli di Riconoscimento", new_page=False)
pdf.body_text(
    "L'ENCI offre diversi livelli di coinvolgimento per gli allevatori, ciascuno con requisiti "
    "e benefici crescenti. E' fondamentale comprendere che questi livelli sono indipendenti "
    "dagli obblighi di legge e rappresentano riconoscimenti volontari nell'ambito della cinofilia."
)

pdf.section_title("3.1 Iscrizione cuccioli nel ROI (senza affisso)")
pdf.body_text(
    "Il livello base di interazione con l'ENCI. Qualsiasi proprietario di un cane con pedigree "
    "registrato nel ROI (Registro Origini Italiano, ex-LOI) o in un libro genealogico estero "
    "riconosciuto dalla FCI puo' far accoppiare il proprio cane e registrare i cuccioli con "
    "pedigree ENCI."
)
pdf.subsection_title("Cosa comporta:")
pdf.bullet("I cuccioli ricevono un nome individuale registrato, ma senza prefisso/suffisso di allevamento")
pdf.bullet("Pagamento delle tariffe ENCI per l'emissione dei pedigree")
pdf.bullet("Rispetto delle regole ENCI per la registrazione (dichiarazione di monta, denuncia di nascita)")
pdf.bullet("Microchippatura dei cuccioli prima della registrazione")
pdf.subsection_title("Cosa NON comporta:")
pdf.bullet("Nessuna identita' di allevamento (nessun 'brand')")
pdf.bullet("Nessun obbligo di screening sanitari oltre i requisiti legali")
pdf.bullet("Nessun accesso ai benefici riservati ai soci o ai titolari di affisso")

pdf.section_title("3.2 Socio ENCI")
pdf.body_text(
    "L'iscrizione come socio e' una forma di appartenenza associativa all'ENCI, indipendente "
    "dall'attivita' di allevamento."
)
pdf.subsection_title("Socio Aggregato")
pdf.bullet("Livello base di adesione, tramite un Gruppo Cinofilo locale")
pdf.bullet("Non richiede attivita' di allevamento")
pdf.bullet("Accesso a sconti su eventi e pubblicazioni ENCI")

pdf.subsection_title("Socio Allevatore")
pdf.body_text(
    "Livello superiore che richiede risultati dimostrabili negli ultimi 5 anni: almeno 4 "
    "soggetti con qualifica 'Molto Buono' o superiore in esposizioni e/o 'Buono' o superiore "
    "in prove di lavoro, da almeno 2 giudici diversi. Il socio allevatore non deve abitualmente "
    "commerciare cani non allevati da se'."
)
pdf.bullet("Diritto di voto nelle assemblee ENCI")
pdf.bullet("Accesso a servizi riservati")
pdf.bullet("Requisito per accedere alla certificazione di Allevatore Certificato")

pdf.section_title("3.3 Titolare di Affisso")
pdf.body_text(
    "L'affisso e' un nome di allevamento registrato (prefisso o suffisso) che viene apposto al "
    "nome di tutti i cuccioli prodotti dall'allevamento. E' registrato sia a livello nazionale "
    "(ENCI) che internazionale (FCI), garantendo unicita' e protezione mondiale."
)
pdf.subsection_title("Requisiti per ottenere l'affisso:")
pdf.bullet("Possedere almeno 2 fattrici della stessa razza")
pdf.bullet("Aver prodotto e registrato almeno 2 cucciolate nel ROI")
pdf.bullet("Accettare il Codice Etico dell'Allevatore ENCI")
pdf.bullet("Assenza di condanne penali relative al maltrattamento animale")
pdf.bullet("Costo: circa 100-200 EUR per la registrazione iniziale, piu' rinnovo annuale")
pdf.bullet("La richiesta viene inoltrata all'FCI per la protezione internazionale del nome")

pdf.subsection_title("Cosa significa in pratica:")
pdf.body_text(
    "L'affisso e' essenzialmente un 'marchio' dell'allevatore nel sistema dei pedigree. "
    "Ogni cane prodotto porta quel nome per tutta la vita, creando tracciabilita' e reputazione. "
    "Se un allevatore produce cani con problemi di salute o comportamentali, il suo affisso "
    "ne porta la responsabilita' in modo permanente e pubblico."
)

pdf.note_box(
    "DISTINZIONE CHIAVE: Avere un affisso NON significa essere 'certificato ENCI'. "
    "L'affisso e' un requisito necessario per la certificazione, ma non sufficiente. "
    "Molti allevatori hanno un affisso senza essere Allevatori Certificati."
)

pdf.subsection_title("Chi rilascia l'affisso: monopolio legale ENCI")
pdf.body_text(
    "L'ENCI detiene il monopolio legale sull'emissione degli affissi in Italia, sancito dal "
    "Decreto Legislativo n. 529 del 30 dicembre 1992, che designa l'ENCI come unica associazione "
    "autorizzata a gestire il Libro Genealogico italiano e a rilasciare pedigree ufficiali. "
    "La FCI non emette affissi direttamente: la richiesta deve sempre passare attraverso "
    "l'ENCI, che la inoltra alla FCI per la registrazione internazionale."
)
pdf.body_text(
    "Esistono registri alternativi (es. Alianz Italian Kennel Club - AIKC, Associazione "
    "Cinofila Italiana - ACI) che emettono propri 'kennel name', ma questi NON hanno valore "
    "legale in Italia. La base giuridica citata dall'AIKC (Direttiva UE 91/174/CEE) riguarda "
    "animali da allevamento zootecnico (bovini, suini, ovini), non cani. Sotto la legge "
    "italiana, un cane puo' essere venduto come 'di razza' solo con pedigree ENCI. "
    "Per la piattaforma, 'affisso' significa esclusivamente affisso ENCI/FCI."
)

pdf.ensure_space(80)
pdf.section_title("3.4 Allevatore Certificato ENCI")
pdf.body_text(
    "Questo e' il livello piu' alto di riconoscimento ENCI per un allevatore. Rappresenta "
    "un impegno significativo verso la qualita', la salute e la trasparenza nell'allevamento."
)
pdf.subsection_title("Requisiti:")
pdf.bullet("Essere Socio Allevatore ENCI in regola")
pdf.bullet("Essere Titolare di Affisso")
pdf.bullet("Aver sottoposto almeno 2 cani a verifica zootecnica con qualifiche idonee negli ultimi 5 anni")
pdf.bullet("Possedere una PEC (Posta Elettronica Certificata)")
pdf.bullet("Dichiarare eventuali iscrizioni al registro imprese")
pdf.bullet("Fornire tutte le autorizzazioni necessarie")
pdf.bullet("Accettare ispezioni per la verifica del codice etico, igiene e benessere animale")
pdf.bullet("Impegnarsi a collaborare tempestivamente con l'ufficio del Libro Genealogico")

pdf.subsection_title("Obblighi di mantenimento:")
pdf.bullet("Il 20% delle cucciolate negli ultimi 5 anni deve entrare in riproduzione selezionata")
pdf.bullet("Deposito di campioni biologici per tutti i riproduttori")
pdf.bullet("Partecipazione a corsi di aggiornamento e formazione continua")
pdf.bullet("Conformita' continua verificata tramite ispezioni")

pdf.subsection_title("Benefici:")
pdf.bullet("Inserimento nel registro pubblico degli Allevatori Certificati su enci.it")
pdf.bullet("Massima credibilita' e visibilita' nel mondo cinofilo")
pdf.bullet("Accesso a programmi e riconoscimenti esclusivi")

# ── 3.5 Database e Registri Online ENCI ──
pdf.section_title("3.5 Database e Registri Online ENCI")
pdf.body_text(
    "L'ENCI mette a disposizione diversi strumenti online per verificare le informazioni "
    "su cani, allevatori e cucciolate. Questi sono fondamentali sia per gli acquirenti "
    "che vogliono verificare la serieta' di un allevatore, sia per la piattaforma."
)

pdf.subsection_title("Libro Genealogico Online")
pdf.body_text(
    "Disponibile su enci.it/libro-genealogico/libro-genealogico-on-line. Gratuito ma richiede "
    "registrazione con Codice Fiscale italiano. Copre cani nati dal 1995 in poi. "
    "Ricerca per: nome del cane, microchip, numero ROI/LOI, razza, allevatore o proprietario."
)
pdf.body_text("Ogni scheda cane contiene 5 sezioni:")
pdf.bold_bullet("Pedigree", " - Albero genealogico a 4 generazioni, indicazione di consanguineita'")
pdf.bold_bullet("Anagrafica", " - Data nascita, microchip, razza, colore, allevatore, proprietario")
pdf.bold_bullet("Avvenimenti", " - Gradi HD/ED da radiografie ufficiali, stato deposito DNA")
pdf.bold_bullet("Risultati", " - Titoli espositivi, qualifiche morfologiche, titoli di lavoro")
pdf.bold_bullet("Discendenti", " - Tutte le cucciolate e i figli registrati del soggetto")

pdf.subsection_title("Registro Allevatori con Affisso")
pdf.body_text(
    "Disponibile su enci.it/allevatori/allevatori-con-affisso. Ricerca pubblica (senza login) "
    "per nome affisso, razza o regione. Ogni scheda mostra: nome allevamento, proprietario, "
    "contatti completi, stato certificazione, razze allevate, anno ultima cucciolata."
)

pdf.subsection_title("Accoppiamenti Recenti")
pdf.body_text(
    "Sezione che mostra le cucciolate dove e' stata presentata la dichiarazione di monta "
    "(Modello A) ma non ancora la denuncia di nascita (Modello B). Permette di vedere "
    "cucciolate in arrivo, ricercabili per nome stallone, nome fattrice o razza."
)

pdf.subsection_title("Campioni Proclamati")
pdf.body_text(
    "Database dei cani che hanno ottenuto titoli di campionato. Ricercabile per razza, "
    "tipo di titolo, anno di conseguimento o microchip."
)

pdf.subsection_title("Database di terze parti")
pdf.body_text(
    "Esistono anche database pedigree non ufficiali, alimentati dagli utenti: "
    "PedigreeDatabase.com, DogsFiles.com, PedigreeDex.com (ex Ingrus.net), "
    "e database razza-specifici (es. K9data.com per Retriever, CaneCorsoPedigree.com). "
    "Questi possono essere utili ma non sono fonti ufficiali e possono contenere errori."
)

pdf.note_box(
    "IMPLICAZIONE PER LA PIATTAFORMA: I numeri ROI dei riproduttori inseriti dagli allevatori "
    "possono essere verificati incrociando con il Libro Genealogico ENCI. Questo permette "
    "di validare titoli, screening sanitari e pedigree dichiarati, aumentando l'affidabilita' "
    "della piattaforma."
)

# ── 4. Screening Sanitari ──
pdf.chapter_title("4. Screening Sanitari e Certificazioni di Salute")
pdf.body_text(
    "Gli screening sanitari sui riproduttori sono uno degli indicatori piu' importanti della "
    "serieta' di un allevatore. In Italia esistono due centri di lettura ufficiali riconosciuti "
    "dall'ENCI, i cui risultati vengono annotati sul pedigree."
)

pdf.section_title("4.1 CeLeMaSche")
pdf.body_text(
    "Centrale di Lettura delle Malattie Scheletriche, fondata nel 1987 a Ferrara, affiliata "
    "all'AIVPA, riconosciuta da FCI e ENCI. Effettua letture ufficiali per:"
)
pdf.bold_bullet("HD (Displasia dell'Anca)", " - Classificazione da A (normale) a E (grave)")
pdf.bold_bullet("ED (Displasia del Gomito)", " - Classificazione da 0 (normale) a 3 (grave)")
pdf.bold_bullet("Spondilosi / Spondiloartrosi", "")
pdf.bold_bullet("OCD (Osteocondrite Dissecante)", "")
pdf.bold_bullet("Lussazione della Rotula", "")
pdf.bold_bullet("Sindrome di Wobbler", "")

pdf.section_title("4.2 FSA (Fondazione Salute Animale)")
pdf.body_text(
    "Secondo centro di lettura ufficiale riconosciuto dall'ENCI, con accreditamento "
    "internazionale GRSK. Oltre agli screening scheletrici, offre:"
)
pdf.bold_bullet("Certificazione oculopatie ereditarie", " - Esami condotti da oculisti accreditati per diagnosi di PRA, cataratta ereditaria, displasia retinica, etc.")
pdf.bold_bullet("Certificazione cardiopatie ereditarie", " - Ecocardiografia e Holter per patologie cardiovascolari congenite ed ereditarie")
pdf.bold_bullet("Test BAER", " - Brainstem Auditory Evoked Response per la diagnosi di sordita' congenita (eseguibile dai 35 giorni di vita)")

pdf.section_title("4.3 Test genetici e DNA")
pdf.body_text("I test genetici rappresentano un livello aggiuntivo di screening:")
pdf.bold_bullet("Deposito Campione Biologico ENCI", " - Obbligatorio dopo il 5* accoppiamento di uno stallone, per cani campioni e per tutti i riproduttori selezionati (dal 1 gennaio 2019). Conservato per 10 anni presso laboratori accreditati (IZSVe, NGB Genetics, CDVet, Genefast).")
pdf.bold_bullet("Verifica di Parentela", " - Analisi DNA che confronta il profilo genetico dei cuccioli con quello dei genitori dichiarati. Puo' essere volontaria o obbligatoria.")
pdf.bold_bullet("Pannelli genetici razza-specifici", " - Screening per 175-320+ varianti genetiche a seconda del pannello e della razza. Molti test sono obbligatori o raccomandati dall'ENCI e dai club di razza.")

# ── 5. Riproduzione Selezionata ──
pdf.chapter_title("5. Riproduzione Selezionata e Titoli")

pdf.section_title("5.1 Riproduttore Selezionato ENCI")
pdf.body_text(
    "Un cane iscritto nel Registro dei Riproduttori Selezionati ha soddisfatto requisiti "
    "specifici che variano per razza, ma generalmente includono:"
)
pdf.bullet("Iscrizione nel ROI")
pdf.bullet("Qualifica morfologica di almeno 'Molto Buono' (o 'Eccellente' per i maschi in alcune razze) in eventi ufficiali ENCI dopo i 18 mesi di eta'")
pdf.bullet("Screening sanitari per le patologie ereditarie rilevanti per la razza")
pdf.bullet("Deposito del campione biologico (DNA)")
pdf.body_text("Il proprietario riceve un certificato di distinzione dall'ENCI.")

pdf.section_title("5.2 Campione Riproduttore")
pdf.body_text(
    "Il titolo piu' prestigioso in ambito riproduttivo. Un cane che, accoppiato con almeno 2 "
    "partner diversi, ha prodotto almeno 3 Campioni Italiani di Bellezza oppure 6 soggetti "
    "qualificati 'Eccellente' da cucciolate diverse. Dimostra non solo qualita' individuale "
    "ma la capacita' di riprodurre costantemente qualita'."
)

pdf.section_title("5.3 Titoli Espositivi (sui cani prodotti)")
pdf.body_text(
    "I titoli conquistati dai cani prodotti da un allevamento sono un indicatore fondamentale "
    "della qualita' del programma di allevamento:"
)
pdf.bold_bullet("CAC", " - Certificato di Attitudine al Campionato Italiano di Bellezza")
pdf.bold_bullet("CACIB", " - Certificato di Attitudine al Campionato Internazionale di Bellezza (FCI)")
pdf.bold_bullet("Giovane Campione Italiano", " - 2 JCAC in 2 eventi diversi")
pdf.bold_bullet("Campione Italiano di Bellezza", " - 2 CAC (1 a raduno di razza + 1 a ENCI Winner/ACL)")
pdf.bold_bullet("Campione Internazionale (C.I.B.)", " - 2 CACIB, a distanza di almeno 1 anno, in 2 Paesi diversi, da 2 giudici diversi")
pdf.bold_bullet("ENCI Winner / World Champion / European Champion", " - Titoli annuali ai rispettivi eventi")

pdf.section_title("5.4 Titoli di Lavoro")
pdf.body_text("Per le razze da lavoro, i titoli di lavoro sono altrettanto importanti:")
pdf.bold_bullet("BH/BH-VT", " - Test di accompagnamento, prerequisito per titoli superiori")
pdf.bold_bullet("IGP (ex-IPO/SchH)", " - 3 livelli di utilita' e difesa: pista, obbedienza, difesa")
pdf.bold_bullet("CAE-1 / CAE-2", " - Test di affidabilita' e equilibrio psichico")
pdf.bold_bullet("ZTP", " - Test di idoneita' alla riproduzione (Zuchttauglichkeitsprufung)")
pdf.bold_bullet("Prove di lavoro razza-specifiche", " - Prove di caccia, pastorizia, salvataggio in acqua, ricerca tartufi, coursing, etc.")

# ── 6. Club di Razza ──
pdf.chapter_title("6. Societa' Specializzate e Club di Razza", new_page=False)
pdf.body_text(
    "Ogni razza o gruppo di razze ha una o piu' associazioni specializzate riconosciute dall'ENCI. "
    "L'appartenenza a queste associazioni indica competenza e impegno specifico per la razza."
)
pdf.subsection_title("Funzioni delle Societa' Specializzate:")
pdf.bullet("Proporre requisiti razza-specifici per la riproduzione selezionata")
pdf.bullet("Organizzare raduni (esposizioni speciali di razza)")
pdf.bullet("Gestire programmi sanitari specifici per la razza")
pdf.bullet("Assegnare trofei e riconoscimenti razza-specifici")
pdf.bullet("Definire codici etici piu' stringenti di quello generale ENCI")

pdf.body_text(
    "Essere membro del direttivo o referente di razza all'interno di una Societa' Specializzata "
    "rappresenta un ulteriore segnale di competenza e impegno."
)

pdf.section_title("6.1 Allevamento di Selezione")
pdf.body_text(
    "Alcune Societa' Specializzate riconoscono lo status di 'Allevamento di Selezione' agli "
    "allevatori che rispettano criteri particolarmente rigidi definiti dal club stesso. Questi "
    "criteri possono includere:"
)
pdf.bullet("Screening sanitari obbligatori specifici per la razza")
pdf.bullet("Valutazione morfologica di tutti i riproduttori")
pdf.bullet("Test caratteriali e attitudinali")
pdf.bullet("Numero massimo di cucciolate per fattrice")
pdf.bullet("Eta' minima dei riproduttori")

# ── 7. Formazione ──
pdf.chapter_title("7. Formazione Professionale", new_page=False)

pdf.section_title("7.1 Master Allevatore Cinofilo ENCI")
pdf.body_text(
    "Corso annuale di formazione professionale organizzato da ENCI/Pet Academy, strutturato "
    "in 3 moduli:"
)
pdf.bullet("Modulo 1: Riproduzione, libro genealogico, vaccinazioni, sviluppo psicofisico del cucciolo")
pdf.bullet("Modulo 2: Pediatria, malattie della crescita, selezione genetica, patologie ereditarie")
pdf.bullet("Modulo 3: Gestione professionale dell'allevamento")
pdf.body_text(
    "La partecipazione a corsi di aggiornamento puo' essere richiesta per il mantenimento "
    "dello status di Allevatore Certificato."
)

# ── 8. Documentazione Cuccioli ──
pdf.chapter_title("8. Documentazione alla Vendita del Cucciolo", new_page=False)
pdf.body_text(
    "La completezza della documentazione fornita al momento della vendita e' un indicatore "
    "composito della serieta' dell'allevatore. Un allevamento di alto livello fornisce:"
)
pdf.bullet("Pedigree ENCI (ROI) o ricevuta di richiesta")
pdf.bullet("Microchip con registrazione in Anagrafe Canina")
pdf.bullet("Libretto Sanitario / Passaporto UE con storia vaccinale")
pdf.bullet("Contratto di vendita scritto con garanzie sanitarie (tipicamente 12-24 mesi)")
pdf.bullet("Certificato veterinario di buona salute")
pdf.bullet("Copie dei certificati di screening sanitario dei genitori (HD, ED, occhi, cuore, DNA)")
pdf.bullet("Certificato di parentela DNA (se effettuato)")
pdf.bullet("Protocollo di alimentazione dettagliato")
pdf.bullet("Guida alla socializzazione e registrazione delle esperienze precoci")
pdf.bullet("Kit cucciolo: campione di cibo, copertina con odore della madre, giocattolo")
pdf.bullet("Clausola di non riproduzione per cuccioli 'pet quality' (eventuale)")
pdf.bullet("Impegno di assistenza post-vendita a vita")

# ── 8b. Caratteristiche del Cucciolo ──
pdf.chapter_title("8b. Caratteristiche Distintive del Cucciolo", new_page=False)
pdf.body_text(
    "A differenza dei genitori (riproduttori/fattrici), i cuccioli al momento della vendita "
    "(minimo 60 giorni di vita) non possiedono ancora qualifiche ENCI. Sono troppo giovani "
    "per esposizioni, screening sanitari o prove di lavoro. Gli indicatori di qualita' di un "
    "cucciolo derivano quindi dai genitori e dall'allevatore, non dal cucciolo stesso."
)

pdf.section_title("Cosa ha il cucciolo alla vendita")
pdf.body_text("Documentazione e identificazione gia' presenti al momento della cessione:")
pdf.bold_bullet("Microchip", " - Obbligatorio prima della cessione, registrato in Anagrafe Canina")
pdf.bold_bullet("Pedigree ROI", " - Se i genitori sono registrati (consegnato o in attesa di emissione)")
pdf.bold_bullet("Libretto sanitario", " - Con prima vaccinazione (6-8 settimane) e sverminazioni")
pdf.bold_bullet("Verifica di parentela DNA", " - Se il genitore ha superato le 5 monte o se l'allevatore la effettua volontariamente")

pdf.section_title("Cosa NON ha ancora il cucciolo")
pdf.body_text("Qualifiche che richiedono eta' adulta e che il cucciolo potra' ottenere in futuro:")
pdf.bullet("Qualifica morfologica - eta' minima 9 mesi (classe giovani)")
pdf.bullet("Screening sanitari ufficiali (HD/ED) - eta' minima 12-24 mesi a seconda della razza")
pdf.bullet("Titoli espositivi (CAC, Campione) - eta' minima 15 mesi (classe intermedia/aperta)")
pdf.bullet("Titoli di lavoro (BH, IGP) - eta' minima 12-15 mesi")
pdf.bullet("Riproduttore Selezionato - richiede qualifica + screening + DNA")

pdf.section_title("Caratteristiche individuali del cucciolo")
pdf.body_text(
    "Pur non avendo qualifiche formali, ogni cucciolo ha attributi propri che l'allevatore "
    "puo' descrivere nell'annuncio della cucciolata:"
)
pdf.bold_bullet("Sesso", " - Maschio o femmina")
pdf.bold_bullet("Colore e mantello", " - Varieta' cromatica, marcature, tipo di pelo")
pdf.bold_bullet("Valutazione dell'allevatore", " - 'Pet quality' (compagnia), 'Show quality' (esposizione), "
    "'Breeding quality' (riproduzione). Basata sulla conformazione rispetto allo standard di razza")
pdf.bold_bullet("Stato di disponibilita'", " - Disponibile, prenotato, riservato")
pdf.bold_bullet("Temperamento e carattere", " - Note comportamentali dall'osservazione nelle prime settimane "
    "(piu' estroverso, piu' calmo, piu' indipendente, etc.)")
pdf.bold_bullet("Socializzazione", " - Esposizione a bambini, altri animali, rumori domestici, "
    "ambienti esterni. Protocolli di stimolazione neurologica precoce (ENS/Bio Sensor)")
pdf.bold_bullet("Data di consegna prevista", " - Minimo 60 giorni di vita per legge, "
    "spesso 70-90 giorni per razze di taglia piccola")

pdf.section_title("Ruolo dei genitori: Padre (Stallone) e Madre (Fattrice)")
pdf.body_text(
    "In un annuncio di cucciolata, le informazioni sui genitori sono l'indicatore principale "
    "di qualita'. Padre e madre hanno le stesse qualifiche possibili (titoli, screening, DNA), "
    "ma con alcune differenze pratiche importanti:"
)

pdf.subsection_title("Fattrice (madre)")
pdf.bullet("Deve essere di proprieta' dell'allevatore (titolare dell'affisso)")
pdf.bullet("I cuccioli portano l'affisso del proprietario della fattrice")
pdf.bullet("Limiti ENCI sulla frequenza: massimo 1 cucciolata all'anno, limiti di eta'")
pdf.bullet("Le 2+ fattrici sono un requisito per ottenere l'affisso")

pdf.subsection_title("Stallone (padre)")
pdf.bullet("Puo' appartenere a un altro allevamento (monta esterna / stud service)")
pdf.bullet("Il deposito DNA diventa obbligatorio dopo la 5a monta")
pdf.bullet("Puo' essere di un affisso diverso da quello della fattrice -e' normale e comune")
pdf.bullet("Il proprietario dello stallone firma la dichiarazione di monta insieme al proprietario della fattrice")

pdf.subsection_title("Monta esterna (stud service)")
pdf.body_text(
    "E' molto comune che un allevatore selezioni uno stallone di un altro allevamento per la "
    "propria fattrice. Questo si chiama 'monta esterna' e avviene per diversi motivi: evitare "
    "consanguineita', introdurre caratteristiche genetiche desiderate, o utilizzare uno stallone "
    "di linea di sangue particolarmente pregiata. I cuccioli nascono comunque sotto l'affisso "
    "della fattrice. L'ENCI richiede una dichiarazione di monta firmata da entrambi i proprietari."
)
pdf.body_text(
    "In un annuncio, vedere due affissi diversi per padre e madre e' spesso segno di selezione "
    "attenta -l'allevatore ha cercato il match genetico migliore invece di usare solo i propri cani."
)

pdf.subsection_title("Informazioni da mostrare per ciascun genitore")
pdf.body_text("In un annuncio di cucciolata, per ogni genitore (padre e madre) si indicano:")
pdf.bullet("Nome registrato (con affisso) e nome da chiamata")
pdf.bullet("Numero di pedigree (ROI)")
pdf.bullet("Affisso di appartenenza (puo' differire tra padre e madre)")
pdf.bullet("Se di proprieta' dell'allevatore o esterno (monta esterna)")
pdf.bullet("Titoli espositivi e/o di lavoro")
pdf.bullet("Risultati screening sanitari (HD, ED, occhi, cuore)")
pdf.bullet("Test genetici / DNA depositato")
pdf.bullet("Foto")

pdf.note_box(
    "PUNTO CHIAVE: In un annuncio di cucciolata, la qualita' si dimostra attraverso i GENITORI "
    "(titoli, screening, pedigree) e l'ALLEVATORE (affisso, certificazione, reputazione), "
    "non attraverso qualifiche del cucciolo stesso. Un acquirente dovrebbe valutare "
    "l'allevamento e la linea di sangue, non solo il singolo cucciolo."
)

# ── 9. Riepilogo Gerarchia ──
pdf.chapter_title("9. Gerarchia Completa dei Segnali di Affidabilita'")
pdf.body_text(
    "Di seguito la gerarchia completa, dal livello minimo al massimo, dei segnali di "
    "affidabilita' e qualita' di un allevatore cinofilo in Italia:"
)
pdf.ln(3)

levels = [
    ("1.", "Livello base legale", "Vendita cuccioli con microchip e registrazione in Anagrafe Canina"),
    ("2.", "Pedigree", "Cuccioli registrati nel ROI con pedigree ENCI"),
    ("3.", "Registrazione ASL", "Codice Aziendale / Codice Allevamento assegnato dalla ASL"),
    ("4.", "Partita IVA", "Registrazione fiscale come imprenditore agricolo (se applicabile)"),
    ("5.", "Socio Allevatore ENCI", "Appartenenza associativa con risultati espositivi/lavorativi dimostrati"),
    ("6.", "Titolare di Affisso", "Nome di allevamento registrato ENCI/FCI - tracciabilita' e reputazione"),
    ("7.", "Screening sanitari", "Certificazioni CeLeMaSche/FSA sui riproduttori (HD, ED, occhi, cuore)"),
    ("8.", "Test genetici", "DNA depositato, parentela verificata, pannelli genetici razza-specifici"),
    ("9.", "Riproduttore Selezionato", "Riproduttori iscritti nel registro ENCI della riproduzione selezionata"),
    ("10.", "Club di razza", "Appartenenza attiva alla Societa' Specializzata di riferimento"),
    ("11.", "Titoli espositivi", "Cani prodotti con titoli di Campione e qualifiche in esposizione"),
    ("12.", "Titoli di lavoro", "Cani prodotti con titoli IGP, BH, prove di lavoro razza-specifiche"),
    ("13.", "Allevatore Certificato ENCI", "Massimo riconoscimento ENCI con obblighi di mantenimento"),
    ("14.", "Campione Riproduttore", "Riproduttori che producono costantemente soggetti di qualita' superiore"),
]

for num, title, desc in levels:
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(40, 62, 82)
    pdf.cell(10, 6, num)
    pdf.set_text_color(50, 50, 50)
    pdf.cell(65, 6, title)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(80, 80, 80)
    pdf.multi_cell(0, 6, desc)
    pdf.ln(2)

# ── 9b. Tabella Prerequisiti ──
pdf.chapter_title("9b. Tabelle dei Prerequisiti", new_page=False)
pdf.body_text(
    "Le qualifiche si dividono in due categorie distinte: quelle che si riferiscono "
    "all'ALLEVAMENTO (l'attivita'/struttura) e quelle che si riferiscono al singolo "
    "CANE (riproduttore o fattrice). Le due tabelle seguenti le separano chiaramente."
)
pdf.ln(2)

# ── Helper function to draw a table ──
def draw_table(pdf, title, header, rows, col_w, title_color=(40, 62, 82)):
    pdf.ensure_space(50)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(*title_color)
    pdf.cell(0, 8, title)
    pdf.ln(8)

    # Header
    pdf.set_font("Helvetica", "B", 7.5)
    pdf.set_fill_color(*title_color)
    pdf.set_text_color(255, 255, 255)
    for i, h in enumerate(header):
        pdf.cell(col_w[i], 8, h, border=1, fill=True, align="C")
    pdf.ln()

    pdf.set_font("Helvetica", "", 7)
    pdf.set_text_color(50, 50, 50)
    fill = False
    for row in rows:
        max_lines = max(cell.count("\n") + 1 for cell in row)
        row_h = max(8, max_lines * 4.5 + 3)

        if pdf.get_y() + row_h > 277:
            pdf.add_page()
            pdf.set_font("Helvetica", "B", 7.5)
            pdf.set_fill_color(*title_color)
            pdf.set_text_color(255, 255, 255)
            for i, h in enumerate(header):
                pdf.cell(col_w[i], 8, h, border=1, fill=True, align="C")
            pdf.ln()
            pdf.set_font("Helvetica", "", 7)
            pdf.set_text_color(50, 50, 50)
            fill = False

        if fill:
            pdf.set_fill_color(245, 242, 238)
        else:
            pdf.set_fill_color(255, 255, 255)

        y_start = pdf.get_y()
        x_start = pdf.get_x()
        for i, w in enumerate(col_w):
            pdf.rect(x_start + sum(col_w[:i]), y_start, w, row_h, style="DF")
        for i, (text, w) in enumerate(zip(row, col_w)):
            for j, line in enumerate(text.split("\n")):
                pdf.set_xy(x_start + sum(col_w[:i]) + 1.5, y_start + 1.5 + j * 4.5)
                pdf.cell(w - 3, 4, line)

        pdf.set_y(y_start + row_h)
        fill = not fill
    pdf.ln(5)

# ── Table A: Allevamento ──
col_w = [48, 58, 38, 26]
header = ["LIVELLO", "PREREQUISITI", "CHI RILASCIA", "TIPO"]

allevamento_rows = [
    ("Registrazione ASL\n(Codice Allevamento)", "Microchip sui cani", "ASL locale", "Obbligatorio"),
    ("Partita IVA", "5+ fattrici o\n30+ cuccioli/anno", "Agenzia Entrate", "Obbl. se\nsoglia"),
    ("Socio Aggregato\nENCI", "Nessuno", "ENCI (tramite\nGruppo Cinofilo)", "Volontario"),
    ("Socio Allevatore\nENCI", "4+ soggetti qualificati\nMolto Buono o Buono\n(ultimi 5 anni, 2 giudici)", "ENCI", "Volontario"),
    ("Affisso ENCI/FCI", "2+ fattrici stessa razza\n2+ cucciolate nel ROI\nCodice etico accettato", "ENCI / FCI", "Volontario"),
    ("Membro Club\ndi Razza", "Interesse per la razza\n(requisiti variano)", "Societa'\nSpecializzata", "Volontario"),
    ("Allevamento\ndi Selezione", "Affisso\n+ Requisiti specifici\ndel club di razza", "Societa'\nSpecializzata", "Volontario"),
    ("Allevatore\nCertificato ENCI", "Socio Allevatore\n+ Affisso\n+ 2 cani verificati\n+ PEC\n+ Accetta ispezioni", "ENCI", "Volontario"),
]

draw_table(pdf, "A. Qualifiche dell'ALLEVAMENTO (attivita'/struttura)", header, allevamento_rows, col_w, (40, 62, 82))

# ── Table B: Cane ──
cane_rows = [
    ("Microchip +\nAnagrafe Canina", "Nessuno", "ASL / Veterinario", "Obbligatorio"),
    ("Pedigree (ROI)", "Genitori registrati\nROI o FCI", "ENCI", "Volontario"),
    ("Qualifica\nmorfologica", "Pedigree ROI\n+ Eta' 9+ mesi\n+ Partecipazione a\nesposizione ENCI", "Giudice ENCI\nin esposizione", "Volontario"),
    ("Screening sanitari\nufficiali (HD, ED...)", "Pedigree ROI\n+ Eta' minima 12-24 mesi\n(senza pedigree: solo\nesame veterinario,\nnon ufficiale)", "CeLeMaSche\no FSA", "Volontario*"),
    ("Screening oculistici\ne cardiologici", "Pedigree ROI", "FSA (oculisti e\ncardiologi\naccreditati)", "Volontario*"),
    ("Deposito DNA\n(campione biologico)", "Pedigree ROI", "Lab accreditato\nENCI", "Obbl. dopo\n5* monta"),
    ("Titoli espositivi\n(CAC, Campione...)", "Pedigree ROI\n+ Qualifiche Eccellente\nin esposizioni ENCI", "ENCI / FCI", "Volontario"),
    ("Titoli di lavoro\n(BH, IGP, ZTP...)", "Pedigree ROI\n+ Superamento prove", "ENCI / FCI", "Volontario"),
    ("Riproduttore\nSelezionato", "Pedigree ROI\n+ Qualifica Molto Buono\n+ Screening sanitari\n+ Deposito DNA", "ENCI", "Volontario"),
    ("Campione\nRiproduttore", "Riproduttore Selezionato\n+ Accoppiato con 2+ partner\n+ 3 Campioni prodotti\no 6 Eccellenti", "ENCI", "Volontario"),
]

draw_table(pdf, "B. Qualifiche del CANE (riproduttore / fattrice)", header, cane_rows, col_w, (92, 60, 60))

# ── Relationship note ──
pdf.ensure_space(50)
pdf.note_box(
    "COME SI COLLEGANO: Le qualifiche del cane alimentano quelle dell'allevamento. "
    "Per esempio, per ottenere l'Affisso servono 2+ fattrici (qualifica cane: pedigree ROI). "
    "Per diventare Socio Allevatore servono 4+ soggetti qualificati (qualifica cane: qualifica morfologica). "
    "Per essere Allevatore Certificato servono 2 cani verificati (qualifica cane: riproduttore con screening). "
    "In sintesi: i cani acquisiscono qualifiche individuali, e l'allevamento accumula queste qualifiche "
    "per salire di livello."
)

# Dependency chain diagram (text-based)
pdf.section_title("Catena delle dipendenze")
pdf.body_text(
    "Schema che mostra come le qualifiche del cane (destra) alimentano "
    "le qualifiche dell'allevamento (sinistra):"
)
pdf.ln(2)

chain = [
    "  CANE                        ALLEVAMENTO",
    "  ----                        -----------",
    "",
    "  Pedigree ROI ------------> Iscrizione cuccioli",
    "       |                           |",
    "       v                           v",
    "  Qualifica Molto Buono      2+ cucciolate + 2+ fattrici",
    "  (4+ soggetti)                    |",
    "       |                      +---------+---------+",
    "       |                      |                   |",
    "       |                      v                   v",
    "       +------------>  SOCIO ALLEVATORE    AFFISSO ENCI",
    "                              |                   |",
    "  Screening sanitari          +---+---+-----------+",
    "  + Deposito DNA                  |",
    "  + Verifica zootecnica           v",
    "       |              ALLEVATORE CERTIFICATO ENCI",
    "       v",
    "  RIPRODUTTORE SELEZIONATO",
    "       |",
    "       v",
    "  CAMPIONE RIPRODUTTORE",
]

pdf.set_font("Courier", "", 7.5)
pdf.set_text_color(40, 62, 82)
for line in chain:
    pdf.set_x(20)
    pdf.cell(0, 4.5, line)
    pdf.ln()
pdf.ln(5)

pdf.set_font("Helvetica", "I", 9)
pdf.set_text_color(80, 80, 80)
pdf.body_text(
    "* Gli screening sanitari sono volontari in generale, ma obbligatori per accedere "
    "alla riproduzione selezionata e richiesti dai club di razza. Il deposito DNA diventa "
    "obbligatorio dopo il 5* accoppiamento di uno stallone."
)

# ── 10. Implicazioni per la piattaforma ──
pdf.chapter_title("10. Implicazioni per AllevatoriItalia", new_page=False)
pdf.body_text(
    "Sulla base di questa analisi, i campi piu' significativi da catturare nel profilo "
    "dell'allevatore sulla piattaforma sono:"
)

pdf.subsection_title("Campi del profilo allevatore consigliati:")
pdf.bold_bullet("codice_asl", " (testo) - Codice Aziendale assegnato dalla ASL")
pdf.bold_bullet("partita_iva", " (booleano) - Se registrato fiscalmente come allevatore professionale")
pdf.bold_bullet("affisso", " (testo) - Nome dell'allevamento registrato ENCI/FCI")
pdf.bold_bullet("enci_certified", " (booleano) - Se e' Allevatore Certificato ENCI")
pdf.bold_bullet("breed_club_memberships", " (array testo) - Societa' Specializzate di appartenenza")
pdf.bold_bullet("health_screenings", " (array testo) - Screening sanitari effettuati sui riproduttori")

pdf.subsection_title("Per le cucciolate:")
pdf.bold_bullet("Informazioni genitori", " - Nome, pedigree, titoli, screening sanitari, foto per padre e madre")
pdf.bold_bullet("Dettagli cuccioli", " - Data nascita, numero disponibili, sesso, colori")
pdf.bold_bullet("Documentazione inclusa", " - Pedigree, microchip, libretto, contratto, garanzia")
pdf.bold_bullet("Opzioni consegna", " - Consegna a domicilio, visita in allevamento richiesta")

# ── References ──
pdf.chapter_title("Riferimenti e Fonti")

pdf.section_title("ENCI - Ente Nazionale della Cinofilia Italiana")
pdf.reference_item("Sito ufficiale ENCI", "https://www.enci.it")
pdf.reference_item("Allevatori ENCI - Socio Allevatore", "https://www.enci.it/allevatori")
pdf.reference_item("Richiesta Allevatore Certificato", "https://www.enci.it/allevatori/richiesta-allevatore-certificato")
pdf.reference_item("FAQ Allevatore Certificato", "https://www.enci.it/media/8510/domande-e-risposte-utili.pdf")
pdf.reference_item("Libro Genealogico", "https://www.enci.it/libro-genealogico")
pdf.reference_item("Riproduzione Selezionata", "https://www.enci.it/libro-genealogico/riproduzione-selezionata-consultazione-registro")
pdf.reference_item("Campioni Proclamati", "https://www.enci.it/libro-genealogico/campioni-proclamati")
pdf.reference_item("Codice Etico dell'Allevatore", "https://www.enci.it/media/2115/f-7249_01.pdf")
pdf.reference_item("Regolamento Internazionale di Allevamento", "https://www.enci.it/media/2194/regolamento-internazionale-di-allevamento.pdf")
pdf.reference_item("Regolamento Esposizioni", "https://www.enci.it/media/8514/reg_sec2023.pdf")
pdf.reference_item("Patologie Genetiche", "https://www.enci.it/media/2178/p_patologiegenetiche.pdf")
pdf.reference_item("Associazioni Specializzate", "https://www.enci.it/delegazioni-e-soci-collettivi/associazioni-specializzate")
pdf.reference_item("Master Allevatore Cinofilo 2025/2026", "https://www.enci.it/enci/news/master-allevatore-cinofilo-2025-2026")

pdf.ln(5)
pdf.section_title("Centri di Lettura e Salute")
pdf.reference_item("CeLeMaSche", "https://www.celemasche.it")
pdf.reference_item("FSA - Fondazione Salute Animale", "https://www.fondazionesaluteanimale.it")
pdf.reference_item("IZSVe - Deposito Campione Biologico", "https://www.izsvenezie.it/servizi/servizi-specifici/deposito-campione-biologico-analisi-dna-canino/")

pdf.ln(5)
pdf.section_title("FCI - Federation Cynologique Internationale")
pdf.reference_item("FCI Kennel Name Directory", "https://www.fci.be/en/affixes/")
pdf.reference_item("FCI International Breeding Rules", "https://www.fci.be/medias/ELE-REG-en-15497.pdf")

pdf.ln(5)
pdf.section_title("Normativa Italiana")
pdf.reference_item("Legge 349/1993 - Allevamento amatoriale", "https://www.addalatina.it/download/legge-23-agosto-1993-n-349-allevamento-amatoriale-cani/")
pdf.reference_item("Normative apertura allevamento", "https://www.studiocaggegimazzeo.it/blog/dettaglio-news?a=aprire-un-allevamento-di-cani-normative-certificazioni-e-requisiti-di-benessere-animale")
pdf.reference_item("Adempimenti fiscali allevamento", "https://www.studiocaggegimazzeo.it/blog/dettaglio-news?a=aprire-un-allevamento-di-cani-gli-adempimenti-fiscali-da-conoscere")
pdf.reference_item("Allevamento professionale vs amatoriale", "https://www.kodami.it/lallevamento-di-cani-in-italia-amatoriale-e-professionale/")

pdf.ln(5)
pdf.section_title("Altre Risorse")
pdf.reference_item("Expodog - Piattaforma esposizioni", "https://www.expodog.com")
pdf.reference_item("Pet Academy - Formazione", "https://www.petacademy.it")
pdf.reference_item("BAER Test - Approfondimento", "https://blog.expodog.com/baer-test-cani-dalamta-a-cosa-serve-e-dove-farlo/")
pdf.reference_item("Registro Riproduttori", "https://rrci.it/i-riproduttori/")

# ── Save ──
output_path = "/Users/amadiscleva/Documents/GitHub/Cani/allevatori-italia/docs/certificazione-allevatori-italia.pdf"
pdf.output(output_path)
print(f"PDF saved to: {output_path}")
