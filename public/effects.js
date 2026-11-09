const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const rand = (min, max) => min + Math.random() * (max - min);

/* ---------- Nachthimmel: Sterne, Schnee, Sternschnuppen ---------- */
export function startSky(canvas) {
  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let flakes = [];
  let stars = [];
  let shooting = null;
  let nextShot = rand(3, 7);
  let wind = 0;
  let targetWind = 0;
  let last = 0;
  let frame = 0;

  const flake = anywhere => {
    const depth = Math.random();
    return {
      x: rand(0, width), y: anywhere ? rand(0, height) : -12, depth,
      radius: 0.8 + depth * 2.8, speed: 18 + depth * 56,
      sway: rand(0, 6.28), swaySpeed: rand(0.4, 1.2), alpha: 0.35 + depth * 0.55,
    };
  };

  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    width = innerWidth;
    height = innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const size = Math.min(1, (width * height) / (1280 * 720));
    flakes = Array.from({ length: Math.round(40 + 110 * size) }, () => flake(true));
    stars = Array.from({ length: Math.round(30 + 60 * size) }, () => ({
      x: rand(0, width), y: rand(0, height * 0.65), radius: rand(0.4, 1.3), phase: rand(0, 6.28), speed: rand(0.6, 2.2),
    }));
    draw(0);
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);
    for (const star of stars) {
      ctx.globalAlpha = 0.25 + 0.6 * ((Math.sin(time * star.speed + star.phase) + 1) / 2);
      ctx.fillStyle = '#ffe2c4';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, 6.283);
      ctx.fill();
    }
    ctx.fillStyle = '#fff4e6';
    for (const item of flakes) {
      ctx.globalAlpha = item.alpha;
      ctx.beginPath();
      ctx.arc(item.x, item.y, item.radius, 0, 6.283);
      ctx.fill();
      if (item.radius > 2.4) {
        ctx.globalAlpha = item.alpha * 0.18;
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius * 2.4, 0, 6.283);
        ctx.fill();
      }
    }
    if (shooting) {
      const { x, y, dx, dy, life } = shooting;
      const gradient = ctx.createLinearGradient(x, y, x - dx * 0.16, y - dy * 0.16);
      gradient.addColorStop(0, `rgba(255, 226, 196, ${Math.min(1, life * 1.6)})`);
      gradient.addColorStop(1, 'rgba(255, 154, 80, 0)');
      ctx.globalAlpha = 1;
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - dx * 0.16, y - dy * 0.16);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function step(now) {
    const seconds = now / 1000;
    const dt = Math.min(seconds - last, 0.05);
    last = seconds;
    wind += (targetWind - wind) * Math.min(1, dt * 2);
    for (const item of flakes) {
      item.sway += item.swaySpeed * dt;
      item.x += (wind * (0.3 + item.depth) * 70 + Math.sin(item.sway) * 14 * item.depth) * dt;
      item.y += item.speed * dt;
      if (item.y > height + 12) Object.assign(item, flake(false));
      if (item.x > width + 12) item.x = -12;
      else if (item.x < -12) item.x = width + 12;
    }
    nextShot -= dt;
    if (!shooting && nextShot <= 0) {
      const angle = rand(0.35, 0.6);
      shooting = { x: rand(width * 0.2, width), y: rand(0, height * 0.3), dx: Math.cos(angle) * -1100, dy: Math.sin(angle) * 1100, life: 0.9 };
      nextShot = rand(7, 15);
    }
    if (shooting) {
      shooting.x += shooting.dx * dt;
      shooting.y += shooting.dy * dt;
      shooting.life -= dt;
      if (shooting.life <= 0) shooting = null;
    }
    draw(seconds);
    frame = requestAnimationFrame(step);
  }

  function run() {
    cancelAnimationFrame(frame);
    if (reduced.matches) {
      draw(0);
      return;
    }
    last = performance.now() / 1000;
    frame = requestAnimationFrame(step);
  }

  addEventListener('resize', resize);
  addEventListener('pointermove', event => { targetWind = (event.clientX / innerWidth - 0.5) * 2; }, { passive: true });
  reduced.addEventListener('change', run);
  resize();
  run();
}

/* ---------- Konfetti (liegt im Top-Layer, also auch über geöffneten Türchen) ---------- */
const colors = ['#ff9a50', '#ffd095', '#fff2e6', '#ff6b3d', '#7ee0c3', '#f7c948', '#ffb27a'];
let layer;
let pieces = [];
let confettiFrame = 0;
let confettiLast = 0;

function showLayer() {
  layer ??= document.querySelector('#fx');
  if (!layer) return null;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  if (layer.width !== Math.round(innerWidth * ratio) || layer.height !== Math.round(innerHeight * ratio)) {
    layer.width = Math.round(innerWidth * ratio);
    layer.height = Math.round(innerHeight * ratio);
  }
  try { layer.hidePopover(); } catch { /* war nicht offen */ }
  try { layer.showPopover(); } catch { /* alter Browser: das Canvas bleibt unter dem Türchen */ }
  return layer;
}

// Holt ein laufendes Konfetti wieder nach vorn, nachdem ein Türchen aufgegangen ist.
export function raiseConfetti() {
  if (pieces.length) showLayer();
}

export function confetti(x, y, { count = 90, power = 1 } = {}) {
  if (reduced.matches || !showLayer()) return;
  for (let i = 0; i < count; i++) {
    const angle = rand(-Math.PI * 0.95, -Math.PI * 0.05);
    const speed = rand(260, 720) * power;
    pieces.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      size: rand(5, 10), rotation: rand(0, 6.28), spin: rand(-9, 9),
      color: colors[Math.floor(Math.random() * colors.length)], round: Math.random() < 0.25,
      age: 0, life: rand(1.6, 2.6),
    });
  }
  if (!confettiFrame) {
    confettiLast = performance.now();
    confettiFrame = requestAnimationFrame(confettiStep);
  }
}

export function burstFrom(element, options) {
  const box = element.getBoundingClientRect();
  confetti(box.left + box.width / 2, box.top + box.height / 2, options);
}

function confettiStep(now) {
  const dt = Math.min((now - confettiLast) / 1000, 0.05);
  confettiLast = now;
  const ctx = layer.getContext('2d');
  const ratio = layer.width / innerWidth;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  pieces = pieces.filter(piece => (piece.age += dt) < piece.life && piece.y < innerHeight + 30);
  for (const piece of pieces) {
    piece.vy += 900 * dt;
    piece.vx *= 1 - 1.4 * dt;
    piece.vy *= 1 - 0.6 * dt;
    piece.x += piece.vx * dt;
    piece.y += piece.vy * dt;
    piece.rotation += piece.spin * dt;
    ctx.save();
    ctx.globalAlpha = Math.min(1, (piece.life - piece.age) * 2.5);
    ctx.translate(piece.x, piece.y);
    ctx.rotate(piece.rotation);
    ctx.fillStyle = piece.color;
    if (piece.round) {
      ctx.beginPath();
      ctx.arc(0, 0, piece.size / 2, 0, 6.283);
      ctx.fill();
    } else {
      ctx.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2);
    }
    ctx.restore();
  }
  if (pieces.length) {
    confettiFrame = requestAnimationFrame(confettiStep);
  } else {
    confettiFrame = 0;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    try { layer.hidePopover(); } catch { /* egal */ }
  }
}

/* ---------- Bild neigt sich zur Maus ---------- */
export function tilt(root) {
  if (!matchMedia('(hover: hover)').matches) return;
  let pending = false;
  let px = 0;
  let py = 0;
  addEventListener('pointermove', event => {
    px = (event.clientX / innerWidth - 0.5) * 2;
    py = (event.clientY / innerHeight - 0.5) * 2;
    if (pending || reduced.matches) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      root.style.setProperty('--px', px.toFixed(3));
      root.style.setProperty('--py', py.toFixed(3));
    });
  }, { passive: true });
}

/* ---------- Beim Hineinscrollen einblenden ---------- */
export function revealOnScroll(elements) {
  if (!('IntersectionObserver' in window) || reduced.matches) {
    elements.forEach(element => element.classList.add('in'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.15 });
  elements.forEach(element => observer.observe(element));
}

/* ---------- Jubel, wenn ein Spiel gelingt ---------- */
const big = /^(Alle |Bingo!|Gelöst|Das geheime Weihnachtswort ist gelöst|Die Hallentür springt|Du gewinnst)/;
const small = /^(Richtig!|Genau|Tor für|Tor!)/;
const perfect = /^(\d+) von \1 richtig!/;
const seen = new WeakMap();

export function celebrateOnSuccess(root) {
  function check(node) {
    if (!(node instanceof HTMLElement) || !node.matches('.feedback, h3')) return;
    const text = node.textContent.trim();
    if (!text || seen.get(node) === text) return;
    seen.set(node, text);
    if (big.test(text) || perfect.test(text)) burstFrom(node, { count: 150, power: 1.15 });
    else if (small.test(text)) burstFrom(node, { count: 40, power: 0.7 });
  }
  new MutationObserver(records => {
    for (const record of records) {
      check(record.target.nodeType === 3 ? record.target.parentElement : record.target);
      record.addedNodes.forEach(node => {
        check(node);
        if (node instanceof HTMLElement) node.querySelectorAll('.feedback, h3').forEach(check);
      });
    }
  }).observe(root, { childList: true, subtree: true, characterData: true });
}
