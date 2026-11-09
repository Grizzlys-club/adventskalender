# Grizzlys Adventskalender 2026

Ein Adventskalender für Unihockey am Greifensee mit 24 Türchen, ohne Benutzerkonten oder Preise.

## Starten und testen

Voraussetzung ist Node.js 24 oder neuer. Der Kalender braucht keine externen Pakete.

```sh
npm start
npm test
```

Im Browser `http://localhost:3000` öffnen. Der Server akzeptiert `PORT` für den HTTP-Port. Die Freigabe basiert auf der Serverzeit. Das erste Türchen öffnet am 1. Dezember 2026 um 00.00 Uhr in Zürich. Ab dem 24. Dezember bleiben alle Türchen offen.

Für eine lokale Vorschau aller Türchen die Testuhr auf den 24. Dezember stellen. Dieser Befehl bindet den Vorschau-Server ausschliesslich an die lokale Adresse.

```sh
node --input-type=module -e 'import {calendarServer} from "./server.mjs"; calendarServer({clock: () => Date.parse("2026-12-24T00:00:00+01:00"), database: ":memory:"}).listen(3001, "127.0.0.1")'
```

## Vereinsmedien

- **18. Dezember** · Mindestens zwei freigegebene Torvideos in `goals` in `media.mjs` eintragen. Jedes Video braucht eine stabile ID, einen Titel und eine direkt im Browser abspielbare HTTPS-Adresse. Ohne Videos zeigt das Türchen einen Hinweis. Eine Stimme pro Browser wird über ein anonymes Cookie zugeordnet.
- **23. Dezember** · Für die Galerie freigegebene Vereinsfotos mit Titel, HTTPS-Adresse und Alternativtext in `recap` in `media.mjs` eintragen. Bis dahin erscheinen der illustrierte Rückblick und drei belegte Vereinsmomente.

## Öffentlich schalten mit GitHub Pages (gratis, einfachster Weg)

Die Seite läuft auch ohne eigenen Server. Bei jedem Push auf `main` testet GitHub den Code, baut `dist/` und veröffentlicht die Seite unter `https://grizzlys-club.github.io/adventskalender/`.

Einmalig einrichten: Im Repository **Settings → Pages → Build and deployment → Source: GitHub Actions** wählen. Danach unter **Actions** den Lauf «Seite veröffentlichen» abwarten oder ihn von Hand starten.

Lokal ausprobieren:

```sh
npm run build
python3 -m http.server 8000 -d dist
```

Dann `http://localhost:8000` öffnen.

**Vorschau vor dem 1. Dezember:** `?vorschau=24` an die Adresse hängen, zum Beispiel `https://grizzlys-club.github.io/adventskalender/?vorschau=24`. Dann sind alle Türchen bis zur genannten Nummer zum Testen offen. Das funktioniert nur in dieser statischen Version.

**Was bei GitHub Pages anders ist:**

- Die Freigabe richtet sich nach der Uhr im Browser und nicht nach der Serverzeit. Die Türchen-Inhalte stehen in `data/doors.json` und sind für Neugierige im Quelltext einsehbar.
- Die gemeinsame Abstimmung bei Türchen 18 braucht den Node-Server und ist auf Pages nicht verfügbar. Solange in `media.mjs` keine Torvideos eingetragen sind, spielt das keine Rolle.
- Wer Spoiler und Abstimmung sauber schützen will, betreibt den Node-Server (siehe Betrieb).

## Betrieb

Für die gemeinsame Abstimmung und geschützte Türchen eine laufende Node-Instanz mit dauerhaftem Speicher verwenden. `VOTES_DB` kann auf einen beschreibbaren Pfad im persistenten Speicher zeigen. Standard ist `votes.sqlite`. Die App braucht einen Node-Server, damit gesperrte Inhalte und Abstimmung serverseitig geschützt bleiben.

## Alternative mit eigenem Server: Render (kostenpflichtig)

1. Auf render.com mit GitHub anmelden und **New → Blueprint** wählen.
2. Das Repository `Grizzlys-club/adventskalender` auswählen. Render liest `render.yaml` und baut das `Dockerfile`.
3. Nach dem Deploy ist die Seite unter einer `onrender.com`-Adresse öffentlich erreichbar. Die Abstimmung wird auf der Disk unter `/data` gespeichert.

Hinweis: Der Plan `starter` ist kostenpflichtig, weil die Disk dauerhaften Speicher braucht. Ohne Disk gehen die Stimmen bei jedem Neustart verloren.
