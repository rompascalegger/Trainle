# Trainle

Ein cozy Bahnhofsspiel in reinem HTML, CSS und JavaScript. Kein Build-Schritt, keine Abhängigkeiten. Gebaut fürs Handy: Das Spielfeld passt ohne Scrollen auf den Bildschirm.

Spielen: https://trainle.dicele.io/

## So geht's

1. **Streckennetz:** Sechs Bahnhöfe mit Anspielungen auf die Schweiz (Olten, Luzern, Bern, Basel, Genf, Zürich), je drei Tage. Sterne schalten neue Bahnhöfe frei.
2. **Fahrplan:** Jede Linie fährt im Takt. Die Leitstelle schlägt Gleise vor (🪄 Automatisch), du kannst sie ändern.
3. **Abfahrtstafel:** Zeigt immer, wer wann auf welches Gleis kommt, mit Verspätungen.
4. **Einfahrt:** Ist ein Gleis besetzt, wartet der Zug. Tippe ihn an und dann ein freies Gleis. Nach 6 Minuten hilft das Stellwerk.
5. **Bedürfnisse:** Die Symbole über einem Zug zeigen, was er braucht. Der passende Knopf leuchtet:
   💛 Trösten · 🥐 Snack · 🔧 Wartung · 🫧 Waschen · 💬 Plaudern · 🎵 Ständchen · 😴 Mehr Zeit · ⏩ Früher los
6. **Passagiere** steigen ein und aus. Wer bei „Früher los“ noch am Perron steht, verpasst den Zug.
7. **Gleise haben Gefühle:** Lange unbesucht werden sie einsam, ohne Pause werden sie müde.
8. **Züge untereinander:** Nachbarn plaudern, werden Freunde, verlieben sich oder zanken.
9. **Fortschritt:** Jeder neu geschaffte Tag und jeder neue Bahnhof schaltet einen von 20 neuen Zügen frei. Taler gibst du im Laden aus: Gleise, Kiosk, Werkstatt, Herzen, Waschanlage, Blumen, Spieldose.

Es gibt kein Game Over. Leertaste pausiert.

## Die 25 Züge

Rita, Sämi, Ivo, Gusti, Nora zum Start, dazu nach und nach Heidi, Lotti, Fonsi, Opa Krokodil, Chäschtli, Schoggi, Max, Gotti, Toni, Céline, Flirti, Gletschi, Pendo, Bernina, Mia, Paulina, Brummi, Sternli, Rotpfeil und Ferdi. Jeder hat eine Persönlichkeit, Lieblingsbedürfnisse und eigene Sprüche. Alle stehen im 📖 Zugbuch.

## Modi

- **Streckennetz:** Karriere mit Freischaltungen.
- **Tagesfahrt:** Für alle am selben Tag gleich, mit Gastzügen und teilbarem Ergebnis.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Seitenstruktur und Dialoge |
| `style.css` | Look, Handy-Layout, Animationen |
| `data.js` | Züge, Bahnhöfe, Bedürfnisse, Extrazüge, Gespräche, Laden |
| `audio.js` | Spieldosen-Töne, Effekte und Musik (Web Audio) |
| `game.js` | Simulation, Fahrplan, Passagiere, Darstellung, Fortschritt |
| `assets/logo.svg` | Logo |
| `assets/jingle.html` | Der erste Jingle zum Anhören |
| `KONZEPT.md` | Spielkonzept |

Gespeichert wird in `localStorage` unter `trainle-v2`.

Lokal starten: `python -m http.server 8131`, dann http://localhost:8131 öffnen.
