# Trainle

Ein cozy Bahnhofsspiel in reinem HTML, CSS und JavaScript. Kein Build-Schritt, keine Abhängigkeiten.

Spielen: https://trainle.dicele.io/

## So geht's

1. **Fahrplan:** Fünf Linien fahren im Takt durch den Hauptbahnhof. Gib jeder Linie ein Gleis (1–3). Die Grafik zeigt, wo sich Züge in die Quere kommen.
2. **Der Tag (05:00–08:00):** Züge fahren ein. Ist ihr Gleis besetzt, kommen sie zu spät oder sind sie Extrazüge, warten sie in der **Einfahrt**. Tippe den Zug an und dann ein freies Gleis.
3. **Gefühle:** Wartende Züge werden gestresst. Tippe einen Zug an und **tröste** ihn (kostet ein 💛, alle 15 Minuten kommt eines dazu), gib ihm **mehr Zeit** oder lass ihn **früher los**.
4. **Stimmung:** Jeder zufriedene Zug hebt die Stimmung im Bahnhof. Es gibt kein Game Over, höchstens einen schlechten Tag.

## Die Charaktere

| Zug | Persönlichkeit | Eigenart |
|---|---|---|
| Rita (RE) | Der Gestresste | Hasst Warten, liebt frühe Abfahrt, hasst "mehr Zeit" |
| Sämi (S-Bahn) | Der Beschämte | Oft verspätet, schämt sich, Trost wirkt doppelt |
| Ivo (IC) | Der Arrogante | Will Gleis 1, sonst beleidigt |
| Gusti (Güterzug) | Der Gemütliche | Lässt sich Zeit, mag keine Hetze |
| Nora (Nachtzug) | Die Ängstliche | Fürchtet Dunkelheit und leere Perrons, Nachbarn beruhigen sie |

Stehen zwei entspannte Züge nebeneinander, werden sie Freunde.

## Modi

- **Tagesfahrt:** Gleiche Verspätungen und Extrazüge für alle an einem Tag, Ergebnis zum Teilen.
- **Freie Fahrt:** Jedes Mal ein neuer Tag.
- **Strenger Takt:** Kein Pausieren, Warten stresst mehr.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Seitenstruktur |
| `style.css` | Look und Animationen |
| `game.js` | Simulation, Charaktere, Planung, Gesichter, Ton und Musik (Web Audio) |
| `assets/logo.svg` | Logo |
| `assets/jingle.html` | Der Jingle einzeln zum Anhören |
| `KONZEPT.md` | Spielkonzept |

Gespeichert wird in `localStorage` unter `trainle-v1` (Bestwerte, Freundschaften, Ton).

Lokal starten: `python -m http.server 8131`, dann http://localhost:8131 öffnen.
