'use strict';
// Trainle: Daten für Züge, Bahnhöfe, Bedürfnisse und Gespräche.
window.TRAINLE_DATA = (() => {
  // ---------- Bedürfnisse ----------
  const NEEDS = {
    trost:    { icon: '💛', label: 'Trösten',   say: ['Ich bin so traurig…', 'Kannst du kurz für mich da sein?'] },
    snack:    { icon: '🥐', label: 'Snack',     say: ['Mein Magen knurrt…', 'Hat jemand ein Gipfeli?', 'Hunger!'] },
    wartung:  { icon: '🔧', label: 'Wartung',   say: ['Irgendwas klappert…', 'Autsch, mein Rad!', 'Ich quietsche so komisch.'] },
    wasch:    { icon: '🫧', label: 'Waschen',   say: ['Ich bin ganz staubig…', 'Igitt, ein Fleck!', 'Ich will glänzen!'] },
    plaudern: { icon: '💬', label: 'Plaudern',  say: ['Redet jemand mit mir?', 'Mir ist langweilig…', 'Erzähl mir was!'] },
    musik:    { icon: '🎵', label: 'Ständchen', say: ['Ein Liedli wäre schön…', 'Summst du mir was vor?'] },
    ruhe:     { icon: '😴', label: 'Mehr Zeit', say: ['Ich bin so müde…', 'Noch fünf Minuten…', 'Gähn…'] },
  };
  const NEED_KEYS = ['snack', 'wartung', 'wasch', 'plaudern', 'musik', 'ruhe'];

  // ---------- Bahnhöfe (fiktiv, mit Anspielungen) ----------
  const STATIONS = [
    {
      id: 'olten', name: 'Olten', title: 'Knotenpunkt Olten', deco: '🚉', sky: '#cfeefb', ground: '#e9dcc3',
      tagline: 'Alle Wege führen über Olten. Hier steigt die ganze Schweiz um.',
      startTracks: 2, maxTracks: 4, need: 0, lines: 4, slow: 1,
      dest: ['Basel', 'Bern', 'Zürich', 'Luzern', 'Biel', 'Aarau', 'Solothurn'],
      talk: [['Umsteigen in Olten, wie immer.', 'Alle Wege führen über Olten!'], ['Kennst du jemanden, der in Olten aussteigt?', 'Nein. Alle steigen nur um!']],
    },
    {
      id: 'luzern', name: 'Luzern', title: 'Bahnhof am See', deco: '🏞️', sky: '#c9ecf7', ground: '#e5dccb',
      tagline: 'Das alte Portal steht noch am See, und der Wasserturm schaut zu.',
      startTracks: 3, maxTracks: 4, need: 5, lines: 4, slow: 1,
      dest: ['Engelberg', 'Arth-Goldau', 'Interlaken', 'Zug', 'Olten', 'Sursee', 'Stans'],
      talk: [['Hast du heute den See gesehen?', 'Er glitzert wie verrückt!'], ['Ich bin über die Kapellbrücke gerollt.', 'Das geht doch gar nicht!']],
    },
    {
      id: 'bern', name: 'Bern', title: 'Bahnhof der Bundesstadt', deco: '🐻', sky: '#d6f0ff', ground: '#eadfca',
      tagline: 'In Bern läuft die Zeit ein bisschen langsamer. Die Bären winken vom Perron.',
      startTracks: 3, maxTracks: 5, need: 12, lines: 5, slow: 1.15,
      dest: ['Thun', 'Interlaken', 'Fribourg', 'Biel', 'Brig', 'Zürich', 'Belp'],
      talk: [['Ich hab einen Bären gesehen!', 'Hat er gewinkt?'], ['Nume nid gsprängt.', 'Genau. Gemütlich.']],
    },
    {
      id: 'basel', name: 'Basel', title: 'Bahnhof am Rheinknie', deco: '🥨', sky: '#d3ecf8', ground: '#e6dbc6',
      tagline: 'Drei Länder, ein Bahnhof. Es riecht nach Läckerli.',
      startTracks: 3, maxTracks: 5, need: 20, lines: 5, slow: 1,
      dest: ['Mulhouse', 'Freiburg', 'Liestal', 'Olten', 'Zürich', 'Delémont', 'Rheinfelden'],
      talk: [['Ich fahr später nach Frankreich.', 'Bring mir Läckerli mit!'], ['Grüezi, bonjour, guten Tag!', 'Du kannst ja drei Sprachen!']],
    },
    {
      id: 'genf', name: 'Genf', title: 'Gare au Bord du Lac', deco: '⛲', sky: '#d9f1ff', ground: '#ece1cd',
      tagline: 'Bonjour! Der Wasserstrahl grüsst über den See.',
      startTracks: 4, maxTracks: 5, need: 28, lines: 6, slow: 1,
      dest: ['Lausanne', 'Lyon', 'Flughafen', 'Nyon', 'Neuchâtel', 'Sion', 'Annemasse'],
      talk: [['Bonjour! Ça roule?', 'Ça roule, et toi?'], ['Der Wasserstrahl ist heute extra hoch!', 'Pass auf, dass du nicht nass wirst!']],
    },
    {
      id: 'zuerich', name: 'Zürich', title: 'Der grosse Hauptbahnhof', deco: '👼', sky: '#cdeaf8', ground: '#e8dcc6',
      tagline: 'Der bunte Engel schwebt über der Halle und passt auf alle auf.',
      startTracks: 4, maxTracks: 6, need: 36, lines: 7, slow: 1,
      dest: ['Winterthur', 'St. Gallen', 'Chur', 'Schaffhausen', 'Flughafen', 'Lugano', 'Genf', 'Zug'],
      talk: [['Hast du den Engel in der Halle gesehen?', 'Er passt auf uns alle auf.'], ['So viele Gleise hier!', 'Ich verlauf mich jedes Mal.']],
    },
  ];

  // ---------- Züge ----------
  // n: Gewichte der Bedürfnisse (snack, wartung, wasch, plaudern, musik, ruhe), Standard 1 / 0.4 / 0.6 / 0.8 / 0.6 / 0.6
  // tr: Eigenschaften, die die Spiellogik kennt
  const T = (o) => Object.assign({ cars: 2, dwell: 4, takt: 30, wait: 2.2, n: {}, tr: [], lateP: 0.2, lateMax: 4, early: 0, more: 0 }, o);
  const TRAINS = [
    T({ id: 'rita', name: 'Rita', kind: 'RE', pers: 'Die Gestresste', color: '#ff7a6b', accent: '#c94c3f', cars: 2, dwell: 4, takt: 30, wait: 4, early: -12, more: 12,
      desc: 'Immer knapp dran. Hasst Warten, liebt frühe Abfahrt.', n: { ruhe: 0.1, plaudern: 0.3 },
      say: { arrive: ['Schnell, schnell, schnell!', 'Wo ist mein Gleis?!'], wait: ['Ich hab KEINE Zeit dafür!', 'Tick. Tack. TICK. TACK.'], happy: ['Pünktlich! Ich liebe den Takt!'], sad: ['Das war ein Desaster…'], early: 'JA! Endlich los!', more: 'MEHR Zeit?! Neeein!', thanks: ['Danke! Weiter, weiter!', 'Okay. Atmen. Danke.'] } }),
    T({ id: 'saemi', name: 'Sämi', kind: 'S', pers: 'Der Beschämte', color: '#6fa8ff', accent: '#3d72c4', cars: 1, dwell: 3, takt: 30, wait: 2.2, lateP: 0.55, lateMax: 7, tr: ['shy-late'],
      desc: 'Oft verspätet und schämt sich dafür. Trost wirkt doppelt.', n: { plaudern: 1.2 },
      say: { arrive: ['Ich bin… pünktlich? Wirklich?'], late: ['Tut mir leid, tut mir so leid…', 'Bitte nicht hinschauen…'], wait: ['Ich stör hoffentlich nicht…'], happy: ['Heute war ein guter Tag!'], sad: ['Entschuldigung an alle…'], early: 'Sorry fürs Drängeln!', more: 'Oh, das ist lieb von dir.', thanks: ['Du bist nicht böse auf mich?', 'Danke… wirklich.'] } }),
    T({ id: 'ivo', name: 'Ivo', kind: 'IC', pers: 'Der Arrogante', color: '#f7f3ea', accent: '#e5484d', cars: 3, dwell: 5, takt: 60, wait: 3, wish: 0, lateP: 0.15,
      desc: 'Will Gleis 1. Alles andere ist eine Beleidigung.', n: { wasch: 1.4, plaudern: 0.3 }, tr: ['proud'],
      say: { arrive: ['Gleis 1, selbstverständlich.'], wrong: 'Gleis {n}?! Für MICH?', wait: ['Wissen Sie, wer ich bin?', 'Unerhört.'], happy: ['Akzeptabel.'], sad: ['Ich werde mich beschweren.'], early: 'Ein IC wartet auf niemanden.', more: 'Man lässt mich gebührend wirken.', thanks: ['Na gut. Danke.', 'Das war… angemessen.'] } }),
    T({ id: 'gusti', name: 'Gusti', kind: 'Güterzug', pers: 'Der Gemütliche', color: '#c9925a', accent: '#8a5f33', cars: 3, dwell: 9, takt: 60, wait: 0.8, early: 12, more: -10,
      desc: 'Lässt sich Zeit, redet mit allen. Mag keine Hetze.', n: { snack: 1.5, plaudern: 1.3 },
      say: { arrive: ['Moooorgen zusammen!', 'Grüessech mitenand!'], wait: ['Kein Stress, kein Stress.'], happy: ['Schöner Tag zum Rollen.'], sad: ['Etwas hektisch heute…'], early: 'Jetzt schon? Hmpf.', more: 'Oh, noch ein Käffeli!', thanks: ['Du bist ein Schatz.', 'Merci vielmal!'] } }),
    T({ id: 'nora', name: 'Nora', kind: 'Nachtzug', pers: 'Die Ängstliche', color: '#7b7fd6', accent: '#4b4f9e', cars: 2, dwell: 7, takt: 60, wait: 2.5, early: 10, more: -8, tr: ['dark'],
      desc: 'Fürchtet Dunkelheit und leere Perrons. Nachbarn beruhigen sie.', n: { musik: 1.4, plaudern: 1 },
      say: { arrive: ['Ist… ist hier jemand?'], dark: ['Es ist so dunkel…', 'Was war das für ein Geräusch?'], alone: ['Ganz allein am Perron…'], wait: ['Bitte lass mich rein…'], happy: ['Das war gar nicht so schlimm!'], sad: ['Ich will nach Hause…'], early: 'Oh nein, schon los?', more: 'Danke… noch nicht raus.', thanks: ['Bleibst du kurz bei mir?', 'Viel besser, danke.'] } }),

    // ----- 20 neue Züge -----
    T({ id: 'heidi', name: 'Heidi', kind: 'Zahnradbahn', pers: 'Die Heimwehkranke', color: '#e8504f', accent: '#9b2c2c', cars: 1, dwell: 5, takt: 60, wait: 2,
      desc: 'Vermisst die Berge. Ein Ständchen hilft immer.', n: { musik: 3, plaudern: 1 }, tr: ['homesick'],
      say: { arrive: ['So flach hier unten…'], wait: ['Ich vermisse die Alpwiesen.'], happy: ['Fast wie auf der Alp!'], sad: ['Ich will zurück in die Berge…'], early: 'Ab in die Berge!', more: 'Noch kurz die Aussicht geniessen.', thanks: ['Holleradiii, danke!', 'Das klingt wie daheim.'] } }),
    T({ id: 'lotti', name: 'Lotti', kind: 'Dosto', pers: 'Die Plaudertasche', color: '#ffd166', accent: '#d39b1e', cars: 2, dwell: 3, takt: 30, wait: 2.2, tr: ['chatty'],
      desc: 'Redet ununterbrochen. Nachbarn freuen sich oder werden genervt.', n: { plaudern: 3 },
      say: { arrive: ['Hallooo! Hab ich was verpasst?'], wait: ['Weisst du, was ich gehört hab?'], happy: ['Was für ein Tag! Ich muss das allen erzählen!'], sad: ['Niemand hat mit mir geredet…'], early: 'Tschüssi! Bis später!', more: 'Super, dann erzähl ich noch was!', thanks: ['Endlich jemand zum Reden!', 'Du bist so lieb!'] } }),
    T({ id: 'fonsi', name: 'Fonsi', kind: 'Panoramazug', pers: 'Der Geniesser', color: '#f4a261', accent: '#c06d2c', cars: 2, dwell: 6, takt: 60, wait: 1.6, more: -6,
      desc: 'Hat immer Hunger. Fondue, Gipfeli, egal.', n: { snack: 3.5, ruhe: 1 },
      say: { arrive: ['Riecht es hier nach Gipfeli?'], wait: ['Ich bin so hungrig, ich könnte einen Kiosk essen.'], happy: ['Mmmh, ein feiner Tag!'], sad: ['Mein Magen ist leer und traurig.'], early: 'Aber… der Znüni!', more: 'Noch ein Bissen!', thanks: ['Mmmh! Himmlisch!', 'Ein Gipfeli! Ich liebe dich!'] } }),
    T({ id: 'krokodil', name: 'Opa Krokodil', kind: 'Krokodil', pers: 'Der Nostalgiker', color: '#6aa84f', accent: '#3f7a2c', cars: 2, dwell: 7, takt: 60, wait: 1.2, more: -8, early: 8, lateP: 0.35, tr: ['old'],
      desc: 'Uralt und weise. Klappert oft und erzählt gern von früher.', n: { wartung: 3, plaudern: 1.5 },
      say: { arrive: ['Früher war hier nur Wiese.'], wait: ['Geduld, Jungspund, Geduld.'], happy: ['Wie in den guten alten Zeiten!'], sad: ['Meine alten Räder…'], early: 'So eilig hatten wir es früher nie.', more: 'Ah, Zeit für eine Geschichte.', thanks: ['Danke, Kind. Das tut den alten Knochen gut.', 'Wie neu!'] } }),
    T({ id: 'chaeschtli', name: 'Chäschtli', kind: 'Rangierlok', pers: 'Der Kleine', color: '#ffb4c6', accent: '#d9738f', cars: 0, dwell: 4, takt: 30, wait: 2.4, tr: ['small'],
      desc: 'Die kleinste Lok im Bahnhof. Will so gross sein wie die anderen.', n: { plaudern: 1.5, musik: 1 },
      say: { arrive: ['Bin ich auch ein richtiger Zug?'], wait: ['Hat mich jemand gesehen? Ich bin hier unten!'], happy: ['Ich war ein richtiger Zug heute!'], sad: ['Niemand nimmt mich ernst…'], early: 'Tschu-tschu! Ich bin schnell!', more: 'Darf ich noch ein bisschen bleiben?', thanks: ['Du hast mich gesehen!', 'Juhuu!'] } }),
    T({ id: 'schoggi', name: 'Schoggi', kind: 'Schoggi-Express', pers: 'Der Süsse', color: '#8d5b3e', accent: '#5e3a26', cars: 2, dwell: 6, takt: 60, wait: 1.5, tr: ['share'],
      desc: 'Riecht nach Schokolade und teilt sie mit hungrigen Nachbarn.', n: { wasch: 1.2, plaudern: 1 },
      say: { arrive: ['Wer will Schoggi?'], wait: ['Meine Schoggi schmilzt gleich…'], happy: ['Ein süsser Tag!'], sad: ['Alles ist geschmolzen…'], early: 'Bis bald, ihr Süssen!', more: 'Noch ein Stückli verteilen!', thanks: ['Du bist süsser als Schoggi!', 'Merci!'] } }),
    T({ id: 'max', name: 'Max', kind: 'IR', pers: 'Der Ehrgeizige', color: '#ff4d6d', accent: '#b8213d', cars: 2, dwell: 4, takt: 30, wait: 3.2, early: -15, more: 10,
      desc: 'Will immer der Schnellste sein. Früher losfahren macht ihn glücklich.', n: { ruhe: 0.1, wasch: 1 }, tr: ['fast'],
      say: { arrive: ['Bestzeit! Habt ihr das gesehen?'], wait: ['Ich verliere wertvolle Sekunden!'], happy: ['Rekord! Ich bin der Beste!'], sad: ['Das war keine Bestzeit…'], early: 'Startschuss! Los!', more: 'Pause? Ich brauche keine Pause!', thanks: ['Danke, Coach!', 'Volle Kraft!'] } }),
    T({ id: 'gotti', name: 'Gotti', kind: 'Regio', pers: 'Die Fürsorgliche', color: '#7fc8a9', accent: '#4a9478', cars: 2, dwell: 5, takt: 30, wait: 1.2, tr: ['care'],
      desc: 'Kümmert sich um alle. Tröstet gestresste Nachbarn.', n: { snack: 0.6, plaudern: 1 },
      say: { arrive: ['Hallo ihr Lieben! Alle gut gefrühstückt?'], wait: ['Ich warte gern, Schatz.'], happy: ['Allen geht es gut. Das ist das Wichtigste.'], sad: ['Ich mach mir Sorgen um alle…'], early: 'Pass auf dich auf!', more: 'Dann kann ich noch nach allen schauen.', thanks: ['Du bist ein Goldschatz.', 'Merci, Liebes.'] } }),
    T({ id: 'toni', name: 'Toni', kind: 'Tunnelzug', pers: 'Der Schüchterne', color: '#7d8b9c', accent: '#4f5a68', cars: 3, dwell: 7, takt: 60, wait: 2, tr: ['shy'],
      desc: 'Fährt am liebsten durch dunkle Tunnel. Zu viele Nachbarn machen ihn nervös.', n: { ruhe: 1.6, plaudern: 0.2 },
      say: { arrive: ['…hallo.'], wait: ['Alle schauen mich an…'], happy: ['Das war… schön.'], sad: ['Zu viel Trubel…'], early: 'Ab in den Tunnel!', more: 'Danke. Ruhe tut gut.', thanks: ['…danke.', 'Das war nett.'] } }),
    T({ id: 'celine', name: 'Céline', kind: 'EC', pers: 'Die Elegante', color: '#b39ddb', accent: '#7e65b5', cars: 3, dwell: 5, takt: 60, wait: 2.6,
      desc: 'Kommt aus Paris, spricht Französisch und liebt Croissants.', n: { snack: 1.6, wasch: 1.6 },
      say: { arrive: ['Bonjour tout le monde!'], wait: ['Oh là là, ça dure…'], happy: ['C’était magnifique!'], sad: ['Quelle journée…'], early: 'Au revoir!', more: 'Un petit café, alors.', thanks: ['Merci beaucoup!', 'Tu es un ange.'] } }),
    T({ id: 'flirti', name: 'Flirti', kind: 'FLIRT', pers: 'Der Verliebte', color: '#ff8fab', accent: '#d65c7c', cars: 2, dwell: 3, takt: 30, wait: 2.4, love: 'celine', tr: ['love'],
      desc: 'Hoffnungslos verliebt in Céline. Neben ihr schwebt er auf Wolken.', n: { plaudern: 1.4, musik: 1.4 },
      say: { arrive: ['Ist Céline heute da?'], wait: ['Ich träume von Céline…'], happy: ['Ich hab sie gesehen! Hach!'], sad: ['Sie hat mich nicht bemerkt…'], early: 'Vielleicht seh ich sie unterwegs!', more: 'Vielleicht kommt sie noch…', thanks: ['Du verstehst mich!', 'Hach, danke.'] } }),
    T({ id: 'gletschi', name: 'Gletschi', kind: 'Panorama-Express', pers: 'Die Diva', color: '#e05a66', accent: '#a32a36', cars: 3, dwell: 8, takt: 60, wait: 2.4, more: -10, early: 10, tr: ['diva'],
      desc: 'Der langsamste Schnellzug der Welt. Will immer glänzen und lange bleiben.', n: { wasch: 3, ruhe: 1.2 },
      say: { arrive: ['Applaus, bitte!'], wait: ['Eine Diva wartet nicht!'], happy: ['Ich habe gestrahlt wie ein Gletscher!'], sad: ['Ich sehe furchtbar aus…'], early: 'Was? Mein Auftritt ist noch nicht vorbei!', more: 'Endlich genug Zeit für mein Publikum.', thanks: ['Ich glänze!', 'Bezaubernd, danke.'] } }),
    T({ id: 'pendo', name: 'Pendo', kind: 'Pendolino', pers: 'Der Charmeur', color: '#5ec2d6', accent: '#2f8fa3', cars: 3, dwell: 5, takt: 60, wait: 2, tr: ['charm'],
      desc: 'Kommt aus dem Tessin, neigt sich in jede Kurve und macht allen Komplimente.', n: { wasch: 1.6, plaudern: 1.2 },
      say: { arrive: ['Ciao bella stazione!'], wait: ['Pazienza, pazienza…'], happy: ['Che bella giornata!'], sad: ['Mamma mia…'], early: 'Arrivederci!', more: 'Ancora un momento, grazie.', thanks: ['Grazie mille!', 'Sei gentilissimo!'] } }),
    T({ id: 'bernina', name: 'Bernina', kind: 'Bergbahn', pers: 'Die Abenteurerin', color: '#e76f51', accent: '#ad4529', cars: 2, dwell: 5, takt: 60, wait: 2.6, early: -8, tr: ['adventure'],
      desc: 'Fährt über Pässe und Gletscher. Warten langweilt sie furchtbar.', n: { plaudern: 1.5, musik: 1.3, snack: 1.2 },
      say: { arrive: ['Was für ein Abenteuer heute!'], wait: ['Laaangweilig!'], happy: ['Auf zum nächsten Pass!'], sad: ['Kein einziges Abenteuer…'], early: 'Juhuu, los geht’s!', more: 'Hmm, na gut.', thanks: ['Abenteuerlich gut!', 'Danke, Kumpel!'] } }),
    T({ id: 'mia', name: 'Mia', kind: 'Milchzug', pers: 'Die Frühaufsteherin', color: '#fdfcdc', accent: '#74c0fc', cars: 2, dwell: 6, takt: 60, wait: 1.5, tr: ['morning'],
      desc: 'Im Morgengrauen putzmunter, danach todmüde.', n: { ruhe: 2, snack: 1 },
      say: { arrive: ['Guten Morgen! Frische Milch!'], wait: ['Die Milch wird warm…'], happy: ['Alle Kannen geliefert!'], sad: ['Die Milch ist sauer geworden…'], early: 'Muuuh! Los!', more: 'Gähn… danke.', thanks: ['Danke! Muuuh!', 'Wie frisch gemolken!'] } }),
    T({ id: 'paulina', name: 'Paulina', kind: 'IR', pers: 'Die Perfektionistin', color: '#4dabf7', accent: '#1c7ed6', cars: 2, dwell: 4, takt: 30, wait: 2.6, lateP: 0.1, early: 8, more: 8, tr: ['perfect'],
      desc: 'Auf die Sekunde genau. Verspätungen sind für sie eine Katastrophe.', n: { wasch: 1.6 },
      say: { arrive: ['Exakt nach Fahrplan.'], late: ['Das… das darf nicht sein!'], wait: ['Das steht so nicht im Fahrplan!'], happy: ['Perfekt. Einfach perfekt.'], sad: ['Alles durcheinander!'], early: 'Zu früh ist auch unpünktlich!', more: 'Das ist nicht im Plan…', thanks: ['Korrekt. Danke.', 'Ordnung muss sein.'] } }),
    T({ id: 'brummi', name: 'Brummi', kind: 'Bauzug', pers: 'Der Brummige', color: '#f59f00', accent: '#b87300', cars: 2, dwell: 8, takt: 60, wait: 2.4, tr: ['grumpy'],
      desc: 'Brummt alle an. Trost wirkt erst richtig nach einem Snack.', n: { snack: 2, wartung: 1.5 },
      say: { arrive: ['Hmpf. Morgen.'], wait: ['Brmmm.'], happy: ['…war gar nicht so übel.'], sad: ['Hab ich doch gesagt.'], early: 'Endlich.', more: 'Brmm. Na gut.', thanks: ['Hmpf. …Danke.', 'Brmm. Nett.'] } }),
    T({ id: 'sternli', name: 'Sternli', kind: 'Schlafwagen', pers: 'Die Träumerin', color: '#4c43a8', accent: '#2c267a', cars: 3, dwell: 7, takt: 60, wait: 1.4, more: -10, early: 8,
      desc: 'Kommt nachts aus Wien und träumt mit offenen Augen. Liebt Wiegenlieder.', n: { ruhe: 2.4, musik: 2 },
      say: { arrive: ['Ich hab von Sternschnuppen geträumt…'], wait: ['Zählt jemand Schäfchen mit mir?'], happy: ['Wie ein schöner Traum.'], sad: ['Ein Albtraum…'], early: 'Aber ich träume noch…', more: 'Noch ein bisschen träumen…', thanks: ['Wie ein Wiegenlied.', 'Danke… zzz.'] } }),
    T({ id: 'rotpfeil', name: 'Rotpfeil', kind: 'Roter Pfeil', pers: 'Die Grande Dame', color: '#d62839', accent: '#8f1622', cars: 1, dwell: 5, takt: 60, wait: 2.6, wish: 0, rival: 'ivo', tr: ['proud'],
      desc: 'Ein Triebwagen aus den 1930ern. Besteht auf Gleis 1 und streitet mit Ivo.', n: { wasch: 1.8, wartung: 1.2 },
      say: { arrive: ['Man erwartet mich auf Gleis 1.'], wrong: 'Gleis {n}? Wie gewöhnlich.', wait: ['Zu meiner Zeit…'], happy: ['Ganz famos.'], sad: ['Welch ein Affront.'], early: 'Adieu.', more: 'Wie aufmerksam.', thanks: ['Sehr freundlich, mein Kind.', 'Danke, sehr kultiviert.'] } }),
    T({ id: 'ferdi', name: 'Ferdi', kind: 'Föhn-Express', pers: 'Der Launische', color: '#9bd0ff', accent: '#5a9bd6', cars: 2, dwell: 4, takt: 30, wait: 2.2, tr: ['moody'],
      desc: 'Wetterfühlig. Seine Wünsche ändern sich mit dem Wind.', n: { snack: 1.2, wasch: 1.2, plaudern: 1.2, musik: 1.2, ruhe: 1.2 },
      say: { arrive: ['Föhn heute. Ich spür’s im Kopf.'], wait: ['Jetzt will ich… nein, doch nicht.'], happy: ['Heute war schönes Wetter!'], sad: ['Nebel im Gemüt…'], early: 'Mit dem Wind!', more: 'Oder doch nicht? Doch!', thanks: ['Oh! Genau das wollte ich!', 'Wie Sonnenschein!'] } }),
  ];

  // Freischalt-Reihenfolge der neuen Züge
  const UNLOCK_ORDER = ['heidi', 'lotti', 'fonsi', 'krokodil', 'chaeschtli', 'schoggi', 'max', 'gotti', 'toni', 'celine',
    'flirti', 'gletschi', 'pendo', 'bernina', 'mia', 'paulina', 'brummi', 'sternli', 'rotpfeil', 'ferdi'];
  const START_TRAINS = ['rita', 'saemi', 'ivo', 'gusti', 'nora'];

  // ---------- Extrazüge ----------
  const EXTRAS = [
    { id: 'schulreise', label: 'Schulreise', icon: '🎒', pax: 10, need: 'musik', text: 'Eine Schulklasse singt im Zug!' },
    { id: 'fussball', label: 'Fussball-Extrazug', icon: '⚽', pax: 12, need: 'snack', text: 'Die Fans haben Hunger!' },
    { id: 'chlaus', label: 'Chlausezug', icon: '🎅', pax: 4, need: null, gift: 'heart', text: 'Der Samichlaus bringt ein Herz mit!' },
    { id: 'hochzeit', label: 'Hochzeitszug', icon: '💐', pax: 8, need: 'wasch', gift: 'joy', text: 'Alle Nachbarn freuen sich mit!' },
    { id: 'wander', label: 'Wanderzug', icon: '🥾', pax: 9, need: 'ruhe', text: 'Müde Wanderer mit roten Socken.' },
    { id: 'kaese', label: 'Käsezug', icon: '🧀', pax: 2, need: 'snack', gift: 'snack', text: 'Er bringt Snacks für den Kiosk!' },
  ];

  // ---------- Gespräche zwischen Zügen ----------
  const PAIR_TALK = {
    'ivo+rotpfeil': [['Gleis 1 gehört mir.', 'Träum weiter, Jungspund.'], ['Ich bin moderner als du.', 'Und ich hab Stil, mein Lieber.']],
    'celine+flirti': [['Céline… du glänzt heute so.', 'Oh, Flirti, arrête!'], ['Darf ich dich zum Kaffee einladen?', 'Peut-être…']],
    'max+rita': [['Wetten, ich bin zuerst weg?', 'Wette angenommen!'], ['Schneller, Rita!', 'Ich BIN schnell!']],
    'brummi+lotti': [['…und dann hat sie gesagt…', 'Brmm. Ruhe bitte.']],
    'chaeschtli+ivo': [['Wenn ich gross bin, werd ich wie du!', 'Hmpf. …Du bist schon ganz gut so.']],
    'krokodil+gletschi': [['Ich kenne dich noch als kleinen Zug.', 'Psst! Nicht so laut, Opa!']],
    'nora+sternli': [['Hast du auch Angst im Dunkeln?', 'Nein, im Dunkeln leuchten die Sterne.']],
    'heidi+bernina': [['Vermisst du auch die Berge?', 'Jeden Tag! Bald fahren wir hoch.']],
    'fonsi+schoggi': [['Riechst du das auch?', 'Das bin ich! Nimm ein Stück!']],
    'mia+gusti': [['Frische Milch für deinen Kaffee?', 'Du bist die Beste, Mia!']],
    'paulina+saemi': [['Du bist schon wieder zu spät.', 'Ich weiss… tut mir leid…']],
  };
  const GENERIC_TALK = {
    friend: [['Schön, dich zu sehen!', 'Gleichfalls! Wie läuft’s?'], ['Gute Fahrt nachher!', 'Dir auch, mein Freund!'], ['Weisst du noch, letzte Woche?', 'Haha, ja! Legendär!']],
    neutral: [['Schönes Wetter heute.', 'Ja, ganz nett.'], ['Wohin fährst du?', 'Nach {dest}. Und du?'], ['Viel los heute.', 'Wie immer um diese Zeit.']],
    care: [['Hast du genug gegessen, Liebes?', 'Ja, Gotti…'], ['Alles gut bei dir?', 'Jetzt schon, danke!']],
    share: [['Magst du ein Stück Schoggi?', 'Oh ja, danke!']],
    chatty: [['…und dann bin ich nach Chur gefahren und…', 'Haha, erzähl weiter!']],
    chattyBad: [['…und dann bin ich nach Chur gefahren und…', 'Bitte… etwas leiser.']],
    rival: [['Hmpf.', 'Selber hmpf.']],
    charm: [['Du siehst heute wunderbar aus!', 'Oh, danke Pendo!']],
    old: [['Früher, als ich jung war…', 'Erzähl, Opa Krokodil!']],
  };

  // ---------- Gleise ----------
  const TRACK_SAY = {
    lonely: ['Hallo? Kommt heute noch jemand?', 'Mir ist so langweilig…', 'Niemand besucht mich…'],
    visit: ['Juhuu, Besuch!', 'Endlich! Willkommen!', 'Oh, wie schön!'],
    tired: ['Ich brauch e Pause…', 'Puh, so viel Verkehr!'],
  };
  const TRACK_NAMES = ['Gertrud', 'Bruno', 'Vreni', 'Hansruedi', 'Elsbeth', 'Kurt'];

  // ---------- Laden ----------
  const SHOP = [
    { id: 'kiosk', icon: '🥐', name: 'Kiosk', desc: 'Mehr Snacks auf Vorrat, schnellerer Nachschub.', cost: [30, 60, 110] },
    { id: 'werkstatt', icon: '🔧', name: 'Werkstatt', desc: 'Schnellere Reparatur, ab Stufe 2 zwei Mechanikerinnen.', cost: [40, 90] },
    { id: 'herz', icon: '💛', name: 'Grosses Herz', desc: 'Ein Herz mehr zum Trösten.', cost: [35, 80] },
    { id: 'wasch', icon: '🫧', name: 'Waschanlage', desc: 'Züge sind schneller sauber.', cost: [25, 60] },
    { id: 'blumen', icon: '🌷', name: 'Blumen und Bänkli', desc: 'Gleise fühlen sich weniger einsam, Passagiere sind geduldiger.', cost: [30, 70] },
    { id: 'spieldose', icon: '🎵', name: 'Spieldose', desc: 'Ständchen sind schneller wieder bereit.', cost: [25, 55] },
  ];

  return { NEEDS, NEED_KEYS, STATIONS, TRAINS, UNLOCK_ORDER, START_TRAINS, EXTRAS, PAIR_TALK, GENERIC_TALK, TRACK_SAY, TRACK_NAMES, SHOP };
})();
