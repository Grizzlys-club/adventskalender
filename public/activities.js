import { apiFetch } from './api.js';
const art = './winter.svg';
const normal = value => value.trim().toLocaleLowerCase('de-CH');
const random = n => Math.floor(Math.random() * n);

function element(tag, text = '', className = '') {
  const node = document.createElement(tag);
  node.textContent = text;
  node.className = className;
  return node;
}

function button(text, action, className = '') {
  const node = element('button', text, className);
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
}

function status() {
  const node = element('p', '', 'feedback');
  node.setAttribute('role', 'status');
  return node;
}

function picture(alt) {
  const node = element('img');
  node.src = art;
  node.alt = alt;
  node.width = 720;
  node.height = 480;
  return node;
}

function answerForm(label, onAnswer, numeric = false) {
  const form = element('form', '', 'answer-form');
  const field = element('label', label);
  const input = element('input');
  input.type = numeric ? 'number' : 'text';
  input.required = true;
  input.autocomplete = 'off';
  field.append(input);
  const submit = element('button', 'Prüfen', 'primary');
  submit.type = 'submit';
  form.append(field, submit);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (onAnswer(input.value) === true) {
      input.disabled = true;
      submit.disabled = true;
    }
  });
  return form;
}

function shuffle(items) {
  const order = [...items];
  for (let i = order.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

function delayed(signal, action, ms) {
  const id = setTimeout(() => {
    signal.removeEventListener('abort', cancel);
    action();
  }, ms);
  function cancel() { clearTimeout(id); }
  signal.addEventListener('abort', cancel, { once: true });
}

function greeting(root, text) {
  const scene = element('div', '', 'greeting');
  const shutter = element('div', '', 'shutter');
  shutter.setAttribute('aria-hidden', 'true');
  scene.append(picture('Ein Grizzly mit orangefarbenem Schal vor dem Clubhaus'), element('strong', text), shutter);
  root.append(scene);
}

function memory(root, { pairs }, signal) {
  function start() {
    const board = element('div', '', 'memory');
    const feedback = status();
    let first;
    let busy = false;
    let matches = 0;
    let started;
    shuffle([...pairs, ...pairs]).forEach(([icon, label], index) => {
      const hide = () => {
        tile.textContent = '✦';
        tile.setAttribute('aria-label', `Karte ${index + 1}, verdeckt`);
      };
      const tile = button('', () => {
        if (busy || first === tile || tile.dataset.match) return;
        started ??= performance.now();
        tile.textContent = icon;
        tile.setAttribute('aria-label', label);
        if (!first) {
          first = tile;
          return;
        }
        if (first.textContent === icon) {
          first.dataset.match = tile.dataset.match = 'true';
          first.setAttribute('aria-disabled', 'true');
          tile.setAttribute('aria-disabled', 'true');
          first = undefined;
          matches++;
          feedback.textContent = matches === pairs.length
            ? `Alle Paare in ${((performance.now() - started) / 1000).toFixed(1)} Sekunden gefunden!`
            : `${matches} von ${pairs.length} Paaren gefunden.`;
          return;
        }
        busy = true;
        delayed(signal, () => {
          first.hide();
          hide();
          first = undefined;
          busy = false;
        }, 650);
      });
      tile.hide = hide;
      hide();
      board.append(tile);
    });
    root.replaceChildren(board, feedback, button('Neu mischen', start));
  }
  start();
}

function quiz(root, door) {
  let index = 0;
  let points = 0;
  function show(focus = false) {
    if (index === door.questions.length) {
      const result = element('h3', `${points} von ${index} richtig!`);
      root.replaceChildren(result, button('Nochmal spielen', () => {
        index = points = 0;
        show(true);
      }));
      result.tabIndex = -1;
      result.focus();
      return;
    }
    const [question, options, correct, explanation] = door.questions[index];
    const prompt = element('h3', question);
    const label = door.levels?.[Math.floor(index / 5)];
    const choices = element('div', '', 'choices');
    const feedback = status();
    options.forEach((text, i) => choices.append(button(text, () => {
      for (const option of choices.children) option.disabled = true;
      points += Number(i === correct);
      feedback.textContent = `${i === correct ? 'Richtig!' : `Richtig wäre «${options[correct]}».`} ${explanation ?? ''}`;
      const next = button(index + 1 === door.questions.length ? 'Ergebnis' : 'Weiter', () => {
        index++;
        show(true);
      }, 'primary');
      root.append(next);
      next.focus();
    })));
    root.replaceChildren(element('p', `${index + 1} / ${door.questions.length}${label ? ` · ${label}` : ''}`, 'eyebrow'), prompt, choices, feedback);
    if (focus) {
      prompt.tabIndex = -1;
      prompt.focus();
    }
  }
  show();
}

function shoot(root, { duel }, signal) {
  const zones = ['Links', 'Mitte', 'Rechts'];
  let round = 1;
  let attack = true;
  let goals = 0;
  let opponents = 0;
  let goalie = random(3);
  let blocked = false;
  let lastMove = 0;
  const feedback = status();
  const heading = element('p', '', 'eyebrow');
  const rink = element('div', '', 'rink');
  const actions = zones.map((zone, index) => button(zone, () => play(index)));
  rink.append(...actions);
  function show() {
    heading.textContent = `Runde ${round} / 5 · ${attack ? 'Schiessen' : 'Parieren'} · ${goals}:${opponents}`;
    actions.forEach((node, i) => {
      node.dataset.goalie = attack && goalie === i;
      node.disabled = blocked;
      node.setAttribute('aria-label', `${zoneLabel(i)}${attack && goalie === i ? ', vom Goalie gedeckt' : ''}`);
    });
  }
  function zoneLabel(index) { return `${attack ? 'Schuss' : 'Parade'} ${zones[index]}`; }
  function play(index) {
    if (blocked) return;
    blocked = true;
    if (attack) {
      const scored = index !== goalie;
      goals += Number(scored);
      feedback.textContent = scored ? 'Tor für die Grizzlys!' : 'Der Goalie hält!';
    } else {
      const target = random(3);
      opponents += Number(target !== index);
      feedback.textContent = target === index ? 'Gehalten!' : `Der Computer trifft ${zones[target].toLowerCase()}.`;
    }
    show();
    delayed(signal, () => {
      if (!duel || !attack) round++;
      if (round > 5) {
        heading.textContent = duel ? `Endstand ${goals}:${opponents}` : `${goals} von 5 verwandelt`;
        feedback.textContent = duel ? (goals === opponents ? 'Unentschieden.' : goals > opponents ? 'Du gewinnst!' : 'Der Computer gewinnt.') : 'Deine fünf Versuche sind gespielt.';
        rink.replaceWith(button('Nochmal spielen', () => shoot(root, { duel }, signal)));
        return;
      }
      attack = !duel || !attack;
      blocked = false;
      show();
    }, 750);
  }
  function move(now) {
    if (signal.aborted || !rink.isConnected) return;
    if (attack && !blocked && now - lastMove >= 1050) {
      goalie = (goalie + 1 + random(2)) % 3;
      lastMove = now;
      show();
    }
    requestAnimationFrame(move);
  }
  root.replaceChildren(heading, rink, feedback);
  show();
  requestAnimationFrame(move);
}

function reveal(root, { answers }, signal) {
  const photo = picture('Verschleiertes Wintermotiv');
  photo.className = 'reveal-picture';
  const feedback = status();
  let level = 0;
  let solved = false;
  function sharpen() {
    photo.style.filter = `blur(${Math.max(0, 24 - level * 4)}px)`;
    if (level < 6 && !solved) delayed(signal, () => { level++; sharpen(); }, 2500);
  }
  sharpen();
  root.append(photo, answerForm('Dein Tipp', value => {
    if (!answers.includes(normal(value))) {
      feedback.textContent = 'Versuch es nochmal. Das Bild wird gleich klarer.';
      return false;
    }
    solved = true;
    level = 6;
    sharpen();
    feedback.textContent = 'Genau, der Grizzly wartet vor dem Clubhaus!';
    return true;
  }), feedback);
}

function puzzle(root) {
  const levels = element('div', '', 'row');
  const board = element('div', '', 'puzzle');
  const feedback = status();
  let size;
  let pieces;
  let moves;
  function neighbours(index) {
    const row = Math.floor(index / size);
    const col = index % size;
    return [row > 0 ? index - size : -1, row + 1 < size ? index + size : -1,
      col > 0 ? index - 1 : -1, col + 1 < size ? index + 1 : -1].filter(i => i >= 0);
  }
  function swap(a, b) { [pieces[a], pieces[b]] = [pieces[b], pieces[a]]; }
  function start(n) {
    size = n;
    moves = 0;
    pieces = Array.from({ length: n * n }, (_, i) => i);
    let empty = pieces.length - 1;
    let previous = -1;
    do {
      for (let i = 0; i < n * n * 3; i++) {
        const options = neighbours(empty).filter(j => j !== previous);
        const next = options[random(options.length)];
        swap(empty, next);
        previous = empty;
        empty = next;
      }
    } while (pieces.every((piece, index) => piece === index));
    paint();
  }
  function paint(focus) {
    const solved = pieces.every((piece, index) => piece === index);
    feedback.textContent = solved ? `Gelöst in ${moves} Zügen!` : `${moves} Züge`;
    const empty = pieces.indexOf(pieces.length - 1);
    board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    board.replaceChildren(...pieces.map((piece, index) => {
      const tile = button('', () => {
        if (solved || !neighbours(empty).includes(index)) return;
        swap(index, empty);
        moves++;
        paint(empty);
      });
      tile.setAttribute('aria-label', index === empty && !solved ? 'Leeres Feld' : `Bildteil ${piece + 1}`);
      tile.disabled = index === empty && !solved;
      tile.style.backgroundSize = `${size * 100}% ${size * 100}%`;
      tile.style.backgroundPosition = `${(piece % size) / (size - 1) * 100}% ${Math.floor(piece / size) / (size - 1) * 100}%`;
      return tile;
    }));
    board.children[focus]?.focus();
  }
  [2, 3, 4].forEach(n => levels.append(button(`${n} × ${n}`, () => start(n))));
  root.append(levels, board, feedback);
  start(3);
}

function speed(root, door) {
  const track = element('div', '', 'shot-track');
  const ball = element('i', '⚪');
  track.append(ball);
  let animation;
  const play = button('Schuss abspielen', () => {
    animation?.cancel();
    const duration = door.distance / (door.speed / 3.6) * 8000;
    animation = ball.animate([{ left: 0 }, { left: 'calc(100% - 1.5rem)' }], { duration, fill: 'forwards' });
  });
  const feedback = status();
  root.append(element('p', `Distanz: ${door.distance} Meter`), track, play, answerForm('Dein Tipp in km/h', value => {
    feedback.textContent = `Die Simulation zeigt ${door.speed} km/h. Du liegst ${Math.abs(Number(value) - door.speed).toFixed(0)} km/h daneben.`;
    return true;
  }, true), feedback);
}

function arcade(root, { mode }, signal, finish) {
  const runner = mode === 'runner';
  const canvas = element('canvas');
  canvas.width = 600;
  canvas.height = 270;
  canvas.setAttribute('aria-label', runner ? 'Winter-Runner' : 'Fangspiel mit drei Spuren');
  const context = canvas.getContext('2d');
  const feedback = status();
  const controls = element('div', '', 'row');
  const items = [];
  let lane = 1;
  let running = false;
  let ended = false;
  let elapsed = 0;
  let previous;
  let next = .4;
  let jumpUntil = 0;
  let score = 0;
  let health = 3;
  const laneX = index => 100 + index * 200;
  const playerX = 100;
  const playerY = 224;
  const icon = (glyph, x, y, size = 32) => {
    context.font = `${size}px system-ui`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(glyph, x, y);
  };
  function paint() {
    context.fillStyle = '#36242b';
    context.fillRect(0, 0, 600, 270);
    context.fillStyle = '#d9c5c1';
    context.fillRect(0, 241, 600, 29);
    context.strokeStyle = '#74534f';
    if (!runner) [200, 400].forEach(x => {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, 241);
      context.stroke();
    });
    for (let i = 0; i < 35; i++) {
      context.fillStyle = '#fff0da';
      context.fillRect((i * 109) % 600, (i * 47 + elapsed * 16) % 240, 2, 2);
    }
    for (const item of items) {
      icon(item.hazard ? (runner ? '🪵' : '☃️') : (runner ? '⚪' : '🎁'),
        runner ? item.position : laneX(item.lane), runner ? playerY - (item.high ? 58 : 0) : item.position);
    }
    icon(runner ? '🐻' : '🎅', runner ? playerX : laneX(lane), playerY - (elapsed < jumpUntil ? 58 : 0), 39);
  }
  function press(step) {
    if (!running) return;
    if (runner) {
      if (elapsed >= jumpUntil) jumpUntil = elapsed + .72;
    } else {
      lane = Math.max(0, Math.min(2, lane + step));
    }
  }
  function frame(now) {
    if (!running || signal.aborted) return;
    const delta = previous === undefined ? 0 : Math.min(.05, (now - previous) / 1000);
    previous = now;
    elapsed += delta;
    if (elapsed >= next) {
      const hazard = random(4) === 0;
      items.push({ lane: random(3), position: runner ? 622 : -20, hazard, high: !hazard && random(3) === 0 });
      next += .65 + Math.random() * .4;
    }
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      const before = item.position;
      item.position += (runner ? -275 : 175) * delta;
      const crossed = runner ? before >= playerX && item.position < playerX : before <= playerY && item.position > playerY;
      if (!crossed) continue;
      const aligned = runner ? item.high === (elapsed < jumpUntil) : item.lane === lane;
      if (aligned) {
        if (item.hazard) health--;
        else score++;
      }
      items.splice(i, 1);
    }
    paint();
    const remaining = Math.max(0, Math.ceil(20 - elapsed));
    const scorecard = `${remaining} s · ${score} gesammelt · ${health} Leben`;
    if (feedback.textContent !== scorecard) feedback.textContent = scorecard;
    if (remaining && health) {
      requestAnimationFrame(frame);
    } else {
      running = false;
      ended = true;
      feedback.textContent = `Runde beendet. ${score} ${runner ? 'Bälle' : 'Geschenke'} gesammelt.`;
      controls.replaceChildren(finish
        ? button('Weiter', () => finish(`${score} gesammelt`), 'primary')
        : button('Nochmal spielen', () => arcade(root, { mode }, signal)));
      controls.firstChild.focus();
    }
  }
  const start = button('Spiel starten', () => {
    running = true;
    controls.replaceChildren(...(runner ? [button('Springen', () => press(0))]
      : [button('← Links', () => press(-1)), button('Rechts →', () => press(1))]));
    controls.firstChild.focus();
    requestAnimationFrame(frame);
  }, 'primary');
  canvas.addEventListener('pointerdown', event => {
    if (!running) return;
    if (runner) press(0);
    else {
      const bounds = canvas.getBoundingClientRect();
      lane = Math.min(2, Math.max(0, Math.floor((event.clientX - bounds.left) / bounds.width * 3)));
    }
  });
  root.addEventListener('keydown', onKey, { signal });
  function onKey(event) {
    if (!root.contains(canvas)) {
      root.removeEventListener('keydown', onKey);
      return;
    }
    if (!running || ended) return;
    const jump = runner && [' ', 'ArrowUp'].includes(event.key);
    if (jump || (!runner && ['ArrowLeft', 'ArrowRight'].includes(event.key))) {
      event.preventDefault();
      press(event.key === 'ArrowLeft' ? -1 : 1);
    }
  }
  controls.append(start);
  root.replaceChildren(canvas, feedback, controls);
  paint();
}

function word(root, door) {
  const hints = element('div', '', 'choices');
  const solved = Array(door.clues.length).fill('□');
  const progress = status();
  progress.textContent = solved.join(' ');
  door.clues.forEach(([prompt, options], index) => {
    const feedback = status();
    hints.append(answerForm(`${index + 1}. ${prompt} · Buchstabe ${door.letters[index] + 1}`, value => {
      if (!options.includes(normal(value))) {
        feedback.textContent = 'Dieser Begriff passt noch nicht.';
        return false;
      }
      solved[index] = normal(value)[door.letters[index]].toUpperCase();
      feedback.textContent = 'Richtig!';
      progress.textContent = solved.join(' ');
      return true;
    }), feedback);
  });
  const feedback = status();
  root.append(hints, progress, answerForm('Weihnachtswort', value => {
    if (solved.includes('□')) {
      feedback.textContent = 'Löse zuerst alle fünf Hinweise.';
      return false;
    }
    const correct = door.secret.includes(normal(value));
    feedback.textContent = correct ? 'Das geheime Weihnachtswort ist gelöst!' : 'Lies die markierten Buchstaben der Reihe nach.';
    return correct;
  }), feedback);
}

function reaction(root, { rounds }, signal, finish) {
  const times = [];
  const feedback = status();
  let phase = 'start';
  let readyAt;
  let turn = 0;
  const panel = button('Runde starten', () => {
    if (phase === 'wait') {
      phase = 'start';
      turn++;
      feedback.textContent = 'Zu früh! Diese Runde zählt noch nicht.';
      panel.textContent = 'Erneut starten';
    } else if (phase === 'ready') {
      const time = Math.round(performance.now() - readyAt);
      times.push(time);
      if (times.length === rounds) {
        const best = Math.min(...times);
        feedback.textContent = `Bestzeit: ${best} ms · Durchschnitt: ${Math.round(times.reduce((sum, n) => sum + n, 0) / rounds)} ms`;
        const next = finish ? button('Weiter', () => finish(`${best} ms`), 'primary')
          : button('Nochmal spielen', () => reaction(root, { rounds }, signal));
        panel.replaceWith(next);
        next.focus();
      } else {
        phase = 'start';
        panel.classList.remove('ready');
        panel.textContent = 'Nächste Runde starten';
        feedback.textContent = `Runde ${times.length} von ${rounds}: ${time} ms`;
      }
    } else {
      phase = 'wait';
      panel.textContent = 'Warten …';
      feedback.textContent = `Runde ${times.length + 1} von ${rounds}`;
      const current = ++turn;
      delayed(signal, () => {
        if (turn !== current) return;
        panel.textContent = 'JETZT!';
        panel.classList.add('ready');
        phase = 'ready';
        readyAt = performance.now();
      }, 950 + Math.random() * 2100);
    }
  }, 'reaction');
  root.replaceChildren(panel, feedback);
}

function series(root, door, signal) {
  let stage = 0;
  const scores = [];
  function next(score) {
    scores.push(score);
    stage++;
    show(true);
  }
  function show(focus = false) {
    const step = door.stages[stage];
    const heading = element('h3', step ? `Aufgabe ${stage + 1} von ${door.stages.length}` : 'Alle Aufgaben geschafft!');
    root.replaceChildren(heading);
    if (focus) {
      heading.tabIndex = -1;
      heading.focus();
    }
    if (!step) {
      root.append(element('p', scores.join(' · ')));
      if (door.final) greeting(root, 'Frohe Weihnachten, Grizzlys!');
      return;
    }
    const game = element('div', '', 'activity');
    root.append(game);
    if (step === 'reaction') reaction(game, door, signal, next);
    if (step === 'skill') {
      game.append(element('p', 'Sammle Geschenke und weiche den Schneebällen aus.'));
      const play = element('div', '', 'activity');
      game.append(play);
      arcade(play, { mode: 'catch' }, signal, next);
    }
    if (step === 'estimate' || step === 'finalRiddle') {
      const task = door.estimate ?? door.final;
      const feedback = status();
      game.append(element('p', task.prompt));
      if (door.estimate) game.append(picture('Winterbild mit geschmückter Tanne'));
      game.append(answerForm('Deine Antwort', value => {
        if (door.estimate) {
          feedback.textContent = `Es sind ${task.answer} Kugeln. Dein Tipp: ${value}.`;
        } else if (!task.answers.includes(normal(value))) {
          feedback.textContent = 'Versuche es nochmal.';
          return false;
        } else {
          feedback.textContent = 'Genau!';
        }
        const proceed = button('Weiter', () => next(door.estimate ? 'Schätzung abgegeben' : 'Rätsel gelöst'), 'primary');
        game.append(proceed);
        proceed.focus();
        return true;
      }, Boolean(door.estimate)), feedback);
    }
  }
  show();
}

function differences(root) {
  const details = [
    [20, 23, '⭐', '🌟'], [42, 28, '❄️', '✦'], [74, 22, '🌙', '🪐'],
    [82, 46, '🕯️', '🔔'], [17, 79, '🎁', '🎀'], [64, 88, '⚪', '🏑'],
    [89, 82, '🧣', '🧤'], [36, 51, '✨', '✨'], [48, 75, '🐾', '🐾'],
  ];
  const board = element('div', '', 'compare');
  const feedback = status();
  let count = 0;
  [false, true].forEach(changed => {
    const scene = element('div', '', 'scene');
    scene.setAttribute('aria-label', changed ? 'Bild mit Änderungen' : 'Vergleichsbild');
    details.forEach(([x, y, before, after], index) => {
      const item = changed ? button(after, () => {
        if (item.dataset.found) return;
        if (before === after) {
          feedback.textContent = `Hier ist alles gleich. ${count} von 7 gefunden.`;
          return;
        }
        count++;
        item.dataset.found = 'true';
        item.setAttribute('aria-pressed', 'true');
        feedback.textContent = count === 7 ? 'Alle sieben Unterschiede gefunden!' : `${count} von 7 gefunden.`;
      }, 'detail') : element('span', before, 'detail');
      if (changed) {
        item.setAttribute('aria-label', `Detail ${index + 1}: ${after}`);
        item.setAttribute('aria-pressed', 'false');
      }
      item.style.left = `${x}%`;
      item.style.top = `${y}%`;
      scene.append(item);
    });
    board.append(scene);
  });
  root.append(board, feedback);
}

function emoji(root, { clues }) {
  let index = 0;
  let solved = 0;
  function show() {
    if (index === clues.length) {
      root.replaceChildren(element('h3', `${solved} von ${clues.length} Begriffen erraten.`), button('Neu starten', () => emoji(root, { clues })));
      return;
    }
    const [icons, answers] = clues[index];
    const feedback = status();
    const hint = button('Lösung anzeigen', () => done(false));
    const form = answerForm('Unihockeybegriff', value => {
      if (!answers.includes(normal(value))) {
        feedback.textContent = 'Dieser Begriff passt noch nicht.';
        return false;
      }
      solved++;
      done(true);
      return true;
    });
    function done(correct) {
      for (const field of form.elements) field.disabled = true;
      feedback.textContent = correct ? 'Richtig!' : `Gesucht war «${answers[0]}».`;
      const next = button('Weiter', () => { index++; show(); }, 'primary');
      hint.replaceWith(next);
      next.focus();
    }
    root.replaceChildren(element('h3', `${index + 1} / ${clues.length} · ${icons}`), form, hint, feedback);
  }
  show();
}

function maze(root, { maze }, signal) {
  const field = element('div', '', 'maze');
  field.style.setProperty('--size', maze[0].length);
  const feedback = status();
  const controls = element('div', '', 'row');
  const directions = [['ArrowUp', '↑ Hoch', 0, -1], ['ArrowLeft', '← Links', -1, 0],
    ['ArrowDown', '↓ Runter', 0, 1], ['ArrowRight', '→ Rechts', 1, 0]];
  let y;
  let x;
  let moves;
  let done;
  function reset() {
    y = maze.findIndex(row => row.includes('B'));
    x = maze[y].indexOf('B');
    moves = 0;
    done = false;
    paint();
  }
  function move(dx, dy) {
    if (done || maze[y + dy]?.[x + dx] === '#' || !maze[y + dy]?.[x + dx]) return;
    x += dx;
    y += dy;
    moves++;
    done = maze[y][x] === 'G';
    paint();
  }
  function paint() {
    field.replaceChildren(...maze.flatMap((row, rowIndex) => [...row].map((cell, colIndex) =>
      element('div', x === colIndex && y === rowIndex ? '⚪' : cell === 'G' ? '🥅' : '',
        cell === '#' ? 'cell wall' : 'cell'))));
    feedback.textContent = done ? `Tor! ${moves} Züge.` : `${moves} Züge · Reihe ${y + 1}, Spalte ${x + 1}`;
  }
  for (const [, label, dx, dy] of directions) controls.append(button(label, () => move(dx, dy)));
  controls.append(button('Neu starten', reset));
  root.addEventListener('keydown', event => {
    const direction = directions.find(([key]) => key === event.key);
    if (!direction) return;
    event.preventDefault();
    move(direction[2], direction[3]);
  }, { signal });
  root.append(field, controls, feedback);
  reset();
}

function escapeHall(root, door) {
  const rooms = element('div', '', 'row');
  const clues = element('ul');
  const feedback = status();
  const visited = new Set();
  door.locations.forEach(([location, clue], index) => rooms.append(button(location, () => {
    if (visited.has(index)) return;
    visited.add(index);
    clues.append(element('li', `${location}: ${clue}`));
    feedback.textContent = `${visited.size} von 3 Hinweisen entdeckt.`;
  })));
  root.append(rooms, clues, element('p', 'Für das Schloss gilt diese Reihenfolge: Trikot, Bälle, Drittel.'), answerForm('Dreistelliger Code', value => {
    if (visited.size < door.locations.length) {
      feedback.textContent = 'Durchsuche zuerst alle drei Orte.';
      return false;
    }
    const correct = door.code.includes(normal(value));
    feedback.textContent = correct ? 'Die Hallentür springt auf. Du bist frei!' : 'Das Schloss bleibt zu. Prüfe die Reihenfolge.';
    return correct;
  }), feedback);
}

const bingoMarked = new Set();
function bingo(root, { tasks, days }, openDay) {
  const board = element('div', '', 'bingo');
  const feedback = status();
  const row = element('div', '', 'row');
  const patterns = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const label = element('label', 'Zum passenden Türchen ');
  const select = element('select');
  for (let index = 0; index < tasks.length; index++) {
    const option = element('option', `${days[index]}. Dezember · ${tasks[index]}`);
    option.value = days[index];
    select.append(option);
  }
  label.append(select);
  row.append(label, button('Öffnen', () => openDay(Number(select.value))));
  const tiles = tasks.map((task, index) => button(task, () => {
    if (bingoMarked.has(index)) bingoMarked.delete(index);
    else bingoMarked.add(index);
    paint();
  }));
  function paint() {
    tiles.forEach((tile, i) => tile.setAttribute('aria-pressed', bingoMarked.has(i)));
    const lines = patterns.filter(pattern => pattern.every(i => bingoMarked.has(i))).length;
    feedback.textContent = lines ? `Bingo! ${lines} ${lines === 1 ? 'Reihe' : 'Reihen'} geschafft.` : `${bingoMarked.size} von 9 Aufgaben markiert.`;
  }
  board.append(...tiles);
  root.append(board, feedback, row);
  paint();
}

async function vote(root, { candidates }, signal) {
  if (candidates.length < 2) {
    root.append(element('p', 'Die Torvideos und die Abstimmung werden ergänzt, sobald die freigegebenen Clips vorliegen.'));
    return;
  }
  const cards = element('div', '', 'cards');
  const feedback = status();
  let pending = false;
  let selected;
  const controls = new Map();
  candidates.forEach(candidate => {
    const card = element('article', '', 'card');
    const video = element('video');
    video.src = candidate.video;
    video.controls = true;
    video.preload = 'none';
    video.playsInline = true;
    video.setAttribute('aria-label', candidate.title);
    const action = button('Für dieses Tor stimmen', () => request(candidate.id));
    action.setAttribute('aria-label', `Für ${candidate.title} stimmen`);
    action.disabled = true;
    controls.set(candidate.id, action);
    card.append(element('h3', candidate.title), video, action);
    cards.append(card);
  });
  async function request(goal) {
    if (pending || selected) return;
    pending = true;
    controls.forEach(node => { node.disabled = true; });
    try {
      const response = await apiFetch('api/votes', goal ? {
        method: 'POST', body: JSON.stringify({ goal }), headers: { 'Content-Type': 'application/json' }, signal,
      } : { signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      selected = data.selected;
      if (selected) {
        feedback.textContent = 'Deine Stimme ist gespeichert.';
        controls.forEach((node, id) => {
          const total = data.totals.find(item => item.goal === id)?.total ?? 0;
          node.textContent = `${total} ${total === 1 ? 'Stimme' : 'Stimmen'}${selected === id ? ' · deine Wahl' : ''}`;
          node.removeAttribute('aria-label');
        });
      }
    } catch (error) {
      if (!signal.aborted) feedback.textContent = error.message;
    } finally {
      pending = false;
      controls.forEach(node => { node.disabled = Boolean(selected); });
    }
  }
  root.append(cards, element('p', 'Die Teilnahme ist anonym. Ein Cookie merkt sich deine Stimme in diesem Browser.'), feedback);
  await request();
}

function recap(root, door) {
  const cards = element('div', '', 'cards');
  door.moments.forEach(([icon, title, text]) => {
    const card = element('article', '', 'card');
    card.append(element('span', icon), element('h3', title), element('p', text));
    cards.append(card);
  });
  root.append(cards);
  if (!door.gallery.length) {
    root.append(picture('Illustration vom Grizzlys-Clubhaus im Winter'));
    return;
  }
  const gallery = element('div', '', 'cards');
  door.gallery.forEach(({ title, image, alt }) => {
    const figure = element('figure', '', 'card');
    const photo = element('img');
    photo.src = image;
    photo.alt = alt;
    photo.loading = 'lazy';
    figure.append(photo, element('figcaption', title));
    gallery.append(figure);
  });
  root.append(gallery);
}

const games = {
  welcome: root => greeting(root, 'Willkommen im Grizzlys-Advent!'),
  memory, quiz, shoot, reveal, arcade, puzzle, speed, word, series, differences, emoji, reaction, maze,
  vote: (root, door, signal) => { void vote(root, door, signal); },
  escape: escapeHall,
  bingo: (root, door, signal, openDay) => bingo(root, door, openDay),
  recap,
};

export function mountActivity(root, door, signal, openDay) {
  const activity = element('div', '', 'activity');
  root.replaceChildren(activity);
  // Only bingo needs a callback to navigate between doors.
  if (door.game === 'bingo') games.bingo(activity, door, signal, openDay);
  else games[door.game](activity, door, signal);
  if (door.source) {
    const link = element('a', 'Quelle ↗');
    link.href = door.source;
    link.target = '_blank';
    link.rel = 'noopener';
    root.append(link);
  }
}
