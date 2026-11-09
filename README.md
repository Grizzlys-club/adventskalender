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

## Betrieb

Für die gemeinsame Abstimmung eine laufende Node-Instanz mit dauerhaftem Speicher verwenden. `VOTES_DB` kann auf einen beschreibbaren Pfad im persistenten Speicher zeigen. Standard ist `votes.sqlite`. Die App braucht einen Node-Server, damit gesperrte Inhalte und Abstimmung serverseitig geschützt bleiben.

## Öffentlich veröffentlichen (Render)

1. Auf render.com mit GitHub anmelden und **New → Blueprint** wählen.
2. Das Repository `Grizzlys-club/adventskalender` auswählen. Render liest `render.yaml` und baut das `Dockerfile`.
3. Nach dem Deploy ist die Seite unter einer `onrender.com`-Adresse öffentlich erreichbar. Die Abstimmung wird auf der Disk unter `/data` gespeichert.

Hinweis: Der Plan `starter` ist kostenpflichtig, weil die Disk dauerhaften Speicher braucht. Ohne Disk gehen die Stimmen bei jedem Neustart verloren.
