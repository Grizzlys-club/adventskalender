import { recap } from './media.mjs';

const clubQuiz = [
  ['Welche Sportart spielen die Grizzlys?', ['Eishockey', 'Unihockey', 'Handball'], 1],
  ['An welchem See sind die Grizzlys zu Hause?', ['Greifensee', 'Zürichsee', 'Pfäffikersee'], 0],
  ['Seit welchem Jahr gibt es die Grizzlys?', ['2005', '2020', '2015'], 2],
  ['Welche dieser Gemeinden gehört zum Grizzlys-Gebiet?', ['Horgen', 'Fällanden', 'Bülach'], 1],
  ['Welche weitere Gemeinde gehört dazu?', ['Schwerzenbach', 'Winterthur', 'Thalwil'], 0],
  ['Wie heisst der dritte Standort am Greifensee?', ['Meilen', 'Dübendorf', 'Volketswil'], 2],
  ['In welcher Altersstufe fand 2015 das erste Training statt?', ['U16', 'U9', 'U13'], 1],
  ['Wie viele Kinder waren laut Vereins-FAQ beim ersten Training dabei?', ['Vier', 'Acht', 'Zwölf'], 0],
  ['Wo liegen die Wurzeln des Vereins?', ['Bei einem Schulsporttag', 'Bei einem Eishockeyclub', 'In der Jugendarbeit der Kirche Wigarten'], 2],
  ['Wie heisst das Grizzlys-Plauschteam?', ['Masters', 'Open', 'Allstars'], 1],
];
const rulesQuiz = [
  ['Der Ball überquert die Seitenbande. Wie geht es weiter?', ['Bully in der Mitte', 'Einschlag für das andere Team', 'Penalty'], 1, 'Das Team, das den Ball zuletzt berührt hat, gibt den Einschlag ab.'],
  ['Ein Feldspieler spielt den Ball absichtlich mit der Hand. Erlaubt?', ['Ja', 'Nur in der eigenen Hälfte', 'Nein'], 2, 'Feldspieler dürfen den Ball nicht mit Hand oder Arm spielen.'],
  ['Der Goalie ist bereit. Darf ein Penalty direkt aufs Tor geschossen werden?', ['Ja', 'Nein, der Ball muss zuerst zur Seite', 'Nur nach einem Doppelpass'], 0, 'Ein Direktschuss ist beim Penalty erlaubt.'],
  ['Das Team, gegen das ein Foul begangen wurde, hat eine freie Torchance. Was kann der Schiedsrichter tun?', ['Die Uhr zurückstellen', 'Vorteil laufen lassen', 'Den Ball neu einwerfen'], 1, 'Der Vorteil lässt die bessere Chance bestehen.'],
  ['Kann ein Freischlag direkt zu einem Tor führen?', ['Nein', 'Nur über die Bande', 'Ja'], 2, 'Ein direkter Treffer aus einem Freischlag zählt.'],
];
const tactics = [
  ['Zwei gegen eins. Der Verteidiger kommt auf dich zu. Deine Mitspielerin ist frei.', ['Früh abspielen', 'In den Verteidiger laufen', 'Abdrehen und warten'], 0, 'Der Pass nutzt den freien Raum, bevor die Lücke zugeht.'],
  ['Dein Mitspieler an der Bande wird von zwei Gegnern bedrängt.', ['Hinter ihm stehen bleiben', 'Diagonal eine freie Passlinie anbieten', 'Ebenfalls an die Bande laufen'], 1, 'Ein diagonaler Winkel bietet einen einfachen Ausweg aus dem Druck.'],
  ['Du hast den Ball vor dem eigenen Tor und wirst angelaufen.', ['Blind durch die Mitte passen', 'Rückwärts ins Tor laufen', 'Den freien Pass an die Seite wählen'], 2, 'Ein seitlicher Pass hält den Ball aus der gefährlichen Mitte.'],
  ['Dein Team gewinnt den Ball, die andere Seite ist frei.', ['Die Seite wechseln', 'Mit allen an derselben Bande bleiben', 'Den Ball stoppen und warten'], 0, 'Der Seitenwechsel nutzt den Raum, bevor die Gegner verschieben.'],
  ['Beim Konter ohne Ball sind schon zwei Mitspieler auf deiner Seite.', ['Zu ihnen hinlaufen', 'Breite halten und dich anspielbar machen', 'Stehen bleiben'], 1, 'Breite zieht die Verteidigung auseinander und öffnet Passwege.'],
];
const emoji = [
  ['🥅🎯', ['tor', 'treffer']], ['🧤🥅', ['goalie', 'torhüter', 'torhueter']],
  ['🟠💨', ['schuss', 'torschuss']], ['🤝🏑', ['pass', 'zuspiel']],
  ['🏑↔️🏑', ['doppelpass']], ['⏱️🪑', ['zeitstrafe', 'strafe']],
  ['🧱🔄', ['bandenpass', 'bandenspiel']], ['🥅❌🧤', ['parade', 'save']],
  ['1️⃣⚔️1️⃣', ['zweikampf', 'duell']], ['🔔➡️🥅', ['penalty', 'strafstoss']],
  ['🔁🏃', ['wechsel', 'spielerwechsel']], ['🎩3️⃣🥅', ['hattrick', 'hat-trick']],
];

export const doors = [
  { title: 'Das Rudel erwacht', type: 'Special', game: 'welcome', intro: 'Ein warmer Lichtschein fällt in den Schnee. Wer öffnet da die Tür zum Grizzlys-Advent?' },
  { title: 'Grizzlys Memory', type: 'Minigame', game: 'memory', intro: 'Decke alle acht Paare auf. Wie schnell schaffst du es?', pairs: [['🏑', 'Stock'], ['⚪', 'Ball'], ['👕', 'Trikot'], ['🐻', 'Grizzly'], ['🥅', 'Tor'], ['🧤', 'Goaliehandschuh'], ['❄️', 'Schnee'], ['🎄', 'Tanne']] },
  { title: 'Wer kennt die Grizzlys?', type: 'Quiz', game: 'quiz', intro: 'Zehn Fragen über unser Rudel am Greifensee.', questions: clubQuiz, source: 'https://www.grizzlys.club/faq/' },
  { title: 'Penalty-König', type: 'Minigame', game: 'shoot', intro: 'Du hast fünf Penaltys. Beobachte den Goalie und ziele in eine freie Zone.' },
  { title: 'Grizzlys Bilderrätsel', type: 'Rätsel', game: 'reveal', intro: 'Das Motiv wird nach und nach scharf. Rate, wer im Schnee vor der Hütte steht.', answers: ['bär', 'baer', 'grizzly', 'grizzlys', 'der grizzly'] },
  { title: 'Samichlaus-Special', type: 'Special', game: 'arcade', mode: 'catch', intro: 'Sammle Geschenke und weiche Schneebällen aus. Nutze die Pfeile oder tippe auf eine Spur.' },
  { title: 'Unihockey-Regelcheck', type: 'Quiz', game: 'quiz', intro: 'Du pfeifst. Wie würdest du in diesen fünf Situationen entscheiden?', questions: rulesQuiz, source: 'https://www.floorball.sport/wp-content/uploads/2026/02/Rules-of-the-Game-2026-with-all-changes-260209.pdf' },
  { title: 'Grizzlys Puzzle', type: 'Minigame', game: 'puzzle', intro: 'Schiebe die Teile ins freie Feld, bis das Winterbild wieder stimmt.' },
  { title: 'Schussgeschwindigkeit', type: 'Challenge', game: 'speed', intro: 'Die simulierte Kamera zeigt einen Schuss in achtfacher Zeitlupe. Schätze die echte Geschwindigkeit der Simulation.', distance: 12, speed: 86 },
  { title: 'Grizzlys Winter-Runner', type: 'Minigame', game: 'arcade', mode: 'runner', intro: 'Sammle Unihockeybälle und spring über Hindernisse. Tippe ins Spielfeld oder drücke die Leertaste.' },
  { title: 'Das geheime Wort', type: 'Rätsel', game: 'word', intro: 'Löse die Hinweise. Die markierten Buchstaben ergeben ein Weihnachtswort.', clues: [['Damit spielst du den Ball.', ['stock', 'schläger', 'schlaeger']], ['Ein Schuss ins Tor ist ein …', ['treffer']], ['So nennt man einen direkten Treffer ins eigene Tor.', ['eigentor']], ['Dorthin soll der Ball.', ['tor']], ['Dort sitzt dein Team zwischen den Einsätzen.', ['bank']]], letters: [0, 0, 0, 2, 2], secret: ['stern'] },
  { title: 'Halbzeit-Challenge', type: 'Challenge', game: 'series', intro: 'Drei Prüfungen warten auf dich.', stages: ['reaction', 'estimate', 'skill'], estimate: { prompt: 'Wie viele Kugeln schmücken die Tanne im Winterbild?', answer: 12 }, rounds: 1 },
  { title: 'Finde die Unterschiede', type: 'Rätsel', game: 'differences', intro: 'Tippe im rechten Bild auf sieben veränderte Details.' },
  { title: 'Grizzlys Shootout', type: 'Minigame', game: 'shoot', duel: true, intro: 'Schiesse und pariere abwechselnd. Fünf Runden gegen den Computer.' },
  { title: 'Emoji-Unihockey', type: 'Rätsel', game: 'emoji', intro: 'Zwölf Emoji-Kombinationen stehen für Begriffe aus dem Unihockey.', clues: emoji },
  { title: 'Der schnellste Grizzly', type: 'Challenge', game: 'reaction', rounds: 5, intro: 'Warte auf das Signal und tippe dann möglichst schnell. Fünf Runden zählen.' },
  { title: 'Grizzlys Labyrinth', type: 'Minigame', game: 'maze', intro: 'Rolle den Ball durch das Schneelabyrinth bis ins Tor.', maze: ['#######', '#B#...#', '#.#.#.#', '#...#.#', '###.#.#', '#G....#', '#######'] },
  { title: 'Tor des Jahres', type: 'Community', game: 'vote', intro: 'Schau dir die nominierten Grizzlys-Tore an und stimme für deinen Favoriten.' },
  { title: 'Grizzlys Taktikmeister', type: 'Taktik', game: 'quiz', intro: 'Fünf Spielsituationen. Wie öffnest du Räume für dein Team?', questions: tactics },
  { title: 'Escape the Hall', type: 'Minigame', game: 'escape', intro: 'Die Sporthalle ist verschlossen. Finde drei Hinweise und öffne den Ausgang.', locations: [['Garderobe', 'Die Nummer auf dem orangefarbenen Trikot ist 7.'], ['Materialschrank', 'In der Kiste liegen 4 Unihockeybälle.'], ['Anzeigetafel', 'Die Anzeige zeigt das 2. Drittel.']], code: ['742'] },
  { title: 'Grizzlys Weihnachts-Bingo', type: 'Challenge', game: 'bingo', intro: 'Erledige die Aufgaben und markiere sie. Drei in einer Reihe ergeben Bingo.', tasks: ['Finde ein Memory-Paar', 'Löse eine Quizfrage', 'Triff beim Penalty', 'Spiele eine Runde Reaktionstest', 'Finde einen Bildunterschied', 'Sammle ein Geschenk', 'Löse ein Emoji-Rätsel', 'Schiebe ein Puzzleteil', 'Bewege den Ball im Labyrinth'], days: [2, 3, 4, 16, 13, 6, 15, 8, 17] },
  { title: 'Das grosse Grizzlys-Quiz', type: 'Quiz', game: 'quiz', intro: '15 Fragen zu Verein, Saison und Spielregeln.', questions: [...clubQuiz.slice(0, 5), ...rulesQuiz, ...clubQuiz.slice(5, 8), ['Welchen Rang erreichte die U13 bei den BESJ-Masters 2026?', ['Rang 1', 'Rang 2', 'Rang 5'], 1], ['Auf welches Format wechselten die Kleinfeld-Herren 2026?', ['Grossfeld', 'Beachfloorball', 'Eishockey'], 0]], levels: ['Aufwärmen', 'Matchtempo', 'Meisterrunde'], source: 'https://www.grizzlys.club/storyline/' },
  { title: 'Grizzlys Jahresrückblick', type: 'Special', game: 'recap', intro: 'Drei Momente aus dem Grizzlys-Jahr 2026.', moments: [['🏅', 'U13-Masters', 'Die U13 wurde BESJ-Vize-Schweizermeister.'], ['🏑', 'Grossfeld', 'Die Herren wechselten vom Klein- aufs Grossfeld.'], ['🐾', 'Saison 2026/27', 'Das Rudel startete mit Kinder-, Jugend- und Erwachsenenteams in die neue Saison.']], gallery: recap, source: 'https://www.grizzlys.club/storyline/' },
  { title: 'Das grosse Weihnachtsfinale', type: 'Finale', game: 'series', intro: 'Sammle die letzten Funken fürs Weihnachtslicht im Grizzlys-Clubhaus.', stages: ['skill', 'reaction', 'finalRiddle'], rounds: 1, final: { prompt: 'Ich leuchte an der Spitze der Tanne und am klaren Winterhimmel. Was bin ich?', answers: ['stern', 'ein stern', 'weihnachtsstern'] } },
];
