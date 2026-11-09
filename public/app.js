import { mountActivity } from './activities.js';
import { apiFetch } from './api.js';
import { startSky, confetti, burstFrom, raiseConfetti, tilt, revealOnScroll, celebrateOnSuccess } from './effects.js';

const grid = document.querySelector('#doors');
const count = document.querySelector('#count');
const countdown = document.querySelector('#countdown');
const dialog = document.querySelector('#door-dialog');
const content = document.querySelector('#activity');
const date = new Intl.DateTimeFormat('de-CH', { day: 'numeric', month: 'long', timeZone: 'Europe/Zurich' });
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let calendar;
let syncedAt = 0;
let refreshing = false;
let opening = false;
let active;
let lastTrigger;

// Ein Symbol pro Türchen. Es erscheint erst, wenn die Tür aufgeht.
const icons = ['🐻', '🃏', '🧠', '🥅', '🔍', '🎅', '📣', '🧩', '⚡', '🏃', '🔤', '🏆', '👀', '🏑', '😎', '⏱️', '🌀', '🎥', '📋', '🚪', '🎯', '🎓', '📸', '🎄'];

const storeKey = 'grizzlys-advent-2026-visited';
const visited = new Set();
try {
  JSON.parse(localStorage.getItem(storeKey) ?? '[]').forEach(day => visited.add(day));
} catch { /* Speicher nicht verfügbar */ }
function remember(day) {
  visited.add(day);
  try { localStorage.setItem(storeKey, JSON.stringify([...visited])); } catch { /* egal */ }
}

/* ---------- Titel buchstabenweise einblenden ---------- */
function splitTitle() {
  const heading = document.querySelector('#title');
  heading.setAttribute('aria-label', heading.textContent.replace(/\s+/g, ' ').trim());
  let index = 0;
  heading.querySelectorAll('.line').forEach(line => {
    line.replaceChildren(...[...line.textContent].map(char => {
      const letter = document.createElement('span');
      letter.className = 'ch';
      letter.setAttribute('aria-hidden', 'true');
      letter.style.setProperty('--i', String(index++));
      letter.textContent = char === ' ' ? ' ' : char;
      return letter;
    }));
  });
}

/* ---------- Türchen ---------- */
const doors = Array.from({ length: 24 }, (_, index) => {
  const day = index + 1;
  const button = document.createElement('button');
  button.className = 'door';
  button.disabled = true;
  button.style.setProperty('--i', String(index));
  button.innerHTML = `
    <span class="door-light"></span>
    <span class="door-inner"><i>${icons[index]}</i><small>Türchen ${day}</small></span>
    <span class="door-panel"><b>${String(day).padStart(2, '0')}</b><small class="label">Geschlossen</small></span>
    <span class="door-badge"></span>`;
  button.addEventListener('click', () => openDoor(day, button));
  button.addEventListener('pointermove', event => {
    const box = button.getBoundingClientRect();
    button.style.setProperty('--mx', `${event.clientX - box.left}px`);
    button.style.setProperty('--my', `${event.clientY - box.top}px`);
  });
  grid.append(button);
  return { button, label: button.querySelector('.label') };
});

function paintDoor(index) {
  const { button, label } = doors[index];
  const day = index + 1;
  const open = index < calendar.unlocked;
  button.disabled = !open;
  button.dataset.open = open;
  button.dataset.new = String(open && calendar.next !== null && index === calendar.unlocked - 1);
  button.dataset.visited = String(open && visited.has(day));
  label.textContent = !open ? 'Geschlossen' : visited.has(day) ? 'Gespielt' : 'Öffnen';
  button.setAttribute('aria-label', `Türchen ${day}, ${open ? (visited.has(day) ? 'geöffnet, nochmal spielen' : 'öffnen') : 'geschlossen'}`);
}

async function refresh() {
  if (refreshing) return;
  refreshing = true;
  try {
    const response = await apiFetch('api/calendar');
    if (!response.ok) throw new Error();
    calendar = await response.json();
    syncedAt = performance.now();
    count.textContent = `${calendar.unlocked} / 24 offen`;
    doors.forEach((_, index) => paintDoor(index));
    updateCountdown();
  } catch {
    countdown.textContent = 'Kalenderzeit nicht erreichbar. Neuer Versuch folgt.';
  } finally {
    refreshing = false;
  }
}

/* ---------- Countdown ---------- */
const tiles = {
  d: document.querySelector('#cd-d'), h: document.querySelector('#cd-h'),
  m: document.querySelector('#cd-m'), s: document.querySelector('#cd-s'),
};
const tileBox = document.querySelector('#cd-tiles');
const tileLabel = document.querySelector('#cd-label');

function setTile(node, value) {
  if (node.textContent === value) return;
  node.textContent = value;
  node.classList.remove('tick');
  void node.offsetWidth;
  node.classList.add('tick');
}

function updateCountdown() {
  if (!calendar) return;
  if (calendar.next === null) {
    countdown.textContent = calendar.preview ? 'Vorschau-Modus: Türchen sind zum Testen offen.' : 'Alle Türchen bleiben offen.';
    tileBox.hidden = true;
    tileLabel.textContent = calendar.preview ? 'Vorschau-Modus' : 'Alle 24 Türchen sind offen. Viel Spass!';
    return;
  }
  const remaining = calendar.next - calendar.now - (performance.now() - syncedAt);
  tileBox.hidden = false;
  tileLabel.textContent = calendar.unlocked === 0 ? 'Bis zum ersten Türchen' : `Bis Türchen ${calendar.unlocked + 1}`;
  const seconds = Math.max(0, Math.floor(remaining / 1000));
  setTile(tiles.d, String(Math.floor(seconds / 86400)).padStart(2, '0'));
  setTile(tiles.h, String(Math.floor(seconds % 86400 / 3600)).padStart(2, '0'));
  setTile(tiles.m, String(Math.floor(seconds % 3600 / 60)).padStart(2, '0'));
  setTile(tiles.s, String(seconds % 60).padStart(2, '0'));
  if (remaining <= 0) {
    countdown.textContent = 'Nächstes Türchen wird freigeschaltet …';
    return;
  }
  const minutes = Math.ceil(remaining / 60000);
  const duration = minutes >= 1440 ? `${Math.floor(minutes / 1440)} T ${Math.floor(minutes % 1440 / 60)} Std`
    : minutes >= 60 ? `${Math.floor(minutes / 60)} Std ${minutes % 60} Min`
      : `${minutes} Min`;
  const message = `${date.format(calendar.next)} · in ${duration}`;
  if (countdown.textContent !== message) countdown.textContent = message;
}

/* ---------- Türchen öffnen ---------- */
async function openDoor(day, trigger) {
  if (dialog.open || opening) return;
  opening = true;
  lastTrigger = trigger;
  try {
    if (!reduced.matches) {
      trigger.classList.add('opening');
      burstFrom(trigger, { count: 45, power: 0.8 });
      await new Promise(resolve => setTimeout(resolve, 480));
      trigger.classList.remove('opening');
    }
  } finally {
    opening = false;
  }
  if (dialog.open) return;
  active = new AbortController();
  const { signal } = active;
  document.querySelector('#door-tag').textContent = `${day}. Dezember`;
  document.querySelector('#door-title').textContent = 'Türchen wird geladen';
  document.querySelector('#door-intro').textContent = '';
  content.replaceChildren();
  dialog.showModal();
  raiseConfetti();
  try {
    const response = await apiFetch(`api/doors/${day}`, { signal });
    const door = await response.json();
    if (signal.aborted) return;
    if (!response.ok) throw new Error(door.error);
    document.querySelector('#door-tag').textContent = `${day}. Dezember · ${door.type}`;
    document.querySelector('#door-title').textContent = door.title;
    document.querySelector('#door-intro').textContent = door.intro;
    remember(day);
    if (calendar) paintDoor(day - 1);
    confetti(innerWidth / 2, innerHeight * 0.3, { count: 110, power: 1 });
    mountActivity(content, door, signal, next => {
      dialog.close();
      // Wait for the previous activity's close event before opening another door.
      dialog.addEventListener('close', () => openDoor(next, doors[next - 1].button), { once: true });
    });
  } catch (error) {
    if (!signal.aborted) content.textContent = error.message || 'Das Türchen konnte nicht geladen werden.';
  }
}
dialog.addEventListener('close', () => {
  active?.abort();
  content.replaceChildren();
  lastTrigger?.focus();
});

/* ---------- Start ---------- */
splitTitle();
startSky(document.querySelector('#snow'));
tilt(document.querySelector('#hero'));
revealOnScroll([...grid.children]);
celebrateOnSuccess(content);

const heroArt = document.querySelector('#hero-art');
heroArt.addEventListener('click', () => {
  heroArt.classList.remove('wiggle');
  void heroArt.offsetWidth;
  heroArt.classList.add('wiggle');
  burstFrom(heroArt, { count: 120, power: 1.1 });
});
document.querySelector('#paw').addEventListener('click', event => burstFrom(event.currentTarget, { count: 50 }));

void refresh();
setInterval(() => {
  if (!calendar || performance.now() - syncedAt >= 30000 ||
      (calendar.next !== null && calendar.now + performance.now() - syncedAt >= calendar.next)) {
    void refresh();
  }
  updateCountdown();
}, 1000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) void refresh();
});
