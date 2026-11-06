import { CONFIG } from './config.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const gsap = window.gsap;
const ST = window.ScrollTrigger;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
const pretty = n => n.replace(/[-_]+/g, ' ').trim();
let lenis = null;

/* ===================== SFX (synth, no files) ===================== */
const sfx = {
  on: store.get('ak-sfx') === '1', ctx: null,
  tone(f1, f2, dur, type = 'square', vol = .04, at = 0) {
    if (!this.on) return;
    try {
      this.ctx ||= new (window.AudioContext || window.webkitAudioContext)();
      const t = this.ctx.currentTime + at, o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + dur + .02);
    } catch {}
  },
  hover() { this.tone(900, 1300, .05, 'square', .015); },
  click() { this.tone(260, 900, .12, 'triangle', .08); },
  jingle() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, f * 1.01, .22, 'triangle', .06, i * .11)); },
};
const soundBtn = $('#soundBtn');
const paintSound = () => { soundBtn.setAttribute('aria-pressed', sfx.on); soundBtn.querySelector('b').textContent = sfx.on ? 'ON' : 'OFF'; };
paintSound();
soundBtn.addEventListener('click', () => { sfx.on = !sfx.on; store.set('ak-sfx', sfx.on ? '1' : '0'); paintSound(); sfx.click(); });

/* ===================== TEXT SPLIT ===================== */
$$('[data-split]').forEach(el => {
  el.innerHTML = el.textContent.trim().split(/\s+/).map(w =>
    `<span class="word">${[...w].map(c => `<span class="char">${esc(c)}</span>`).join('')}</span>`).join(' ');
});

/* ===================== CITY SKYLINE (procedural) ===================== */
function rng(seed) { return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646; }
function skyline(svg, seed, minH, maxH, windows) {
  const r = rng(seed); let x = 0, out = '';
  while (x < 1600) {
    const w = 30 + r() * 70, h = minH + r() * (maxH - minH), y = 300 - h;
    out += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}"/>`;
    if (r() > .7) out += `<rect x="${(x + w / 2 - 2).toFixed(0)}" y="${(y - 26).toFixed(0)}" width="4" height="26"/>`;
    if (windows) for (let wy = y + 10; wy < 290; wy += 14) for (let wx = x + 6; wx < x + w - 8; wx += 12) if (r() > .82) out += `<rect class="win" x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="5" height="7"/>`;
    x += w + r() * 6;
  }
  svg.innerHTML = out;
}
skyline($('.hero__city--far'), 7, 90, 260, false);
skyline($('.hero__city--near'), 42, 50, 170, true);

/* ===================== PROFILE STATS ===================== */
$('#stats').innerHTML = CONFIG.stats.map(s => `
  <li class="stat"><div class="stat__top"><span>${esc(s.label)}</span><b>${s.value}</b></div>
  <div class="stat__bar">${Array.from({ length: 10 }, (_, i) => `<i class="${i < Math.round(s.value / 10) ? 'on' : ''}"></i>`).join('')}</div></li>`).join('');

/* ===================== WEAPON WHEEL ===================== */
const wheel = $('#wheel');
(function buildWheel() {
  const N = CONFIG.arsenal.length, R = 190, r = 96, gap = 1.6;
  const pt = (rad, deg) => [rad * Math.cos((deg - 90) * Math.PI / 180), rad * Math.sin((deg - 90) * Math.PI / 180)].map(v => v.toFixed(2));
  let html = `<defs><linearGradient id="segGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffc65c"/><stop offset=".5" stop-color="#ff2d95"/><stop offset="1" stop-color="#7b3cf0"/></linearGradient></defs>
    <circle class="wheel__ring" r="198"/><circle class="wheel__ring" r="88"/>`;
  CONFIG.arsenal.forEach((a, i) => {
    const a0 = i * 360 / N + gap, a1 = (i + 1) * 360 / N - gap, large = a1 - a0 > 180 ? 1 : 0;
    const [x0, y0] = pt(R, a0), [x1, y1] = pt(R, a1), [x2, y2] = pt(r, a1), [x3, y3] = pt(r, a0);
    const [ox0, oy0] = pt(R - 3, a0 + 1), [ox1, oy1] = pt(R - 3, a1 - 1);
    const [tx, ty] = pt((R + r) / 2, (a0 + a1) / 2);
    html += `<g class="seg" tabindex="0" role="button" aria-label="${esc(a.name)}, proficiency ${a.ammo} percent" data-i="${i}">
      <path d="M${x0} ${y0} A${R} ${R} 0 ${large} 1 ${x1} ${y1} L${x2} ${y2} A${r} ${r} 0 ${large} 0 ${x3} ${y3}Z"/>
      <path class="seg__ring" d="M${ox0} ${oy0} A${R - 3} ${R - 3} 0 ${large} 1 ${ox1} ${oy1}"/>
      <text x="${tx}" y="${ty}">${esc(a.name.toUpperCase())}</text></g>`;
  });
  wheel.innerHTML = html;
})();
let wheelIdx = -1;
function selectSeg(i, sound = true) {
  if (i === wheelIdx) return;
  wheelIdx = i;
  const a = CONFIG.arsenal[i];
  $$('.seg', wheel).forEach((g, j) => g.classList.toggle('is-active', j === i));
  $('#wheelName').textContent = a.name;
  $('#wheelInfo').textContent = a.info;
  $('#wheelAmmo').style.width = a.ammo + '%';
  if (sound) sfx.hover();
}
selectSeg(0, false);
$$('.seg', wheel).forEach(g => {
  const i = +g.dataset.i;
  g.addEventListener('pointerenter', () => selectSeg(i));
  g.addEventListener('focus', () => selectSeg(i));
  g.addEventListener('click', () => { selectSeg(i); sfx.click(); });
  g.addEventListener('keydown', e => {
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!d) return;
    e.preventDefault();
    $$('.seg', wheel)[(i + d + CONFIG.arsenal.length) % CONFIG.arsenal.length].focus();
  });
});

/* ===================== STORY ===================== */
$('#storyTrack').innerHTML = CONFIG.story.map((c, i) => `
  <li class="chapter" data-num="${esc(c.chapter)}" style="--cg: linear-gradient(160deg, hsl(${330 + i * 28} 90% 58% / .9), hsl(${260 + i * 20} 70% 22%))">
    <span class="chapter__year">${esc(c.year)}</span><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></li>`).join('');

/* ===================== PHONE ===================== */
const mail = `mailto:${CONFIG.email}`;
const apps = [
  { label: 'Mail', url: mail, icon: '@' },
  { label: 'Missions', url: '#missions', icon: '★' },
  { label: 'Map', url: '#hero', icon: '⌖' },
  ...CONFIG.socials.filter(s => s.url).map(s => ({ ...s, icon: { gh: 'GH', in: 'in', itch: 'IO', cv: 'CV' }[s.icon] || s.label[0] })),
];
$('#apps').innerHTML = apps.map(a => {
  const ext = /^https?:/.test(a.url);
  return `<a class="app" href="${esc(a.url)}"${ext ? ' target="_blank" rel="noopener"' : ''}><span class="app__icon">${esc(a.icon)}</span>${esc(a.label)}</a>`;
}).join('');
$('#callBtn').href = mail;

$('#sms').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target), name = String(f.get('name')).trim(), msg = String(f.get('message')).trim();
  const err = $('#smsErr');
  if (!name || !msg) { err.textContent = !name ? 'Need a name to save your contact.' : 'Message is empty — what\'s the mission?'; sfx.tone(200, 120, .2, 'sawtooth', .05); return; }
  err.textContent = '';
  sfx.click();
  location.href = `${mail}?subject=${encodeURIComponent(`New mission from ${name}`)}&body=${encodeURIComponent(msg)}`;
  toast('TEXT SENT', 'OPENING YOUR MAIL APP');
});

/* ===================== CLOCK ===================== */
const tick = () => {
  const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  $('#clock').textContent = t; $('#phoneClock').textContent = t;
};
tick(); setInterval(tick, 15000);
$('#year').textContent = new Date().getFullYear();

/* ===================== MISSIONS ===================== */
const shot = url => `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1280&viewport.height=860`;
let missions = [];

async function loadMissions() {
  const timeout = ms => AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined;
  try {
    const r = await fetch('/api/projects', { signal: timeout(8000) });
    if (r.ok) { const d = await r.json(); if (d.missions?.length) return d.missions; }
  } catch {}
  if (CONFIG.githubUser) {
    try {
      const r = await fetch(`https://api.github.com/users/${encodeURIComponent(CONFIG.githubUser)}/repos?per_page=100&sort=pushed`, { signal: timeout(8000) });
      if (r.ok) {
        return (await r.json())
          .filter(x => !x.fork && /vercel\.app/i.test(x.homepage || ''))
          .map(x => ({ id: x.id, name: x.name, url: x.homepage.startsWith('http') ? x.homepage : `https://${x.homepage}`, repo: x.html_url,
            framework: (x.language || 'web').toLowerCase(), description: x.description, language: x.language, stars: x.stargazers_count,
            topics: x.topics || [], updatedAt: Date.parse(x.pushed_at) }));
      }
    } catch {}
  }
  return [];
}

function missionCard(m, i) {
  const hue = (i * 47) % 360;
  const tags = [`<span class="tag tag--live">Live</span>`, `<span class="tag">${esc(m.framework)}</span>`];
  if (m.language && m.language.toLowerCase() !== String(m.framework).toLowerCase()) tags.push(`<span class="tag">${esc(m.language)}</span>`);
  if (m.stars) tags.push(`<span class="tag">★ ${esc(m.stars)}</span>`);
  return `<button type="button" class="mission" data-i="${i}" data-fw="${esc(m.framework)}" style="--art: linear-gradient(135deg, hsl(${hue} 90% 60%), hsl(${(hue + 70) % 360} 80% 35%))" aria-label="Open briefing for ${esc(pretty(m.name))}">
    <div class="mission__art"><span class="mission__mono" aria-hidden="true">${esc(pretty(m.name).slice(0, 2).toUpperCase())}</span>
      <img src="${esc(shot(m.url))}" alt="" loading="lazy" decoding="async" onerror="this.remove()"></div>
    <span class="mission__go" aria-hidden="true">↗</span>
    <div class="mission__body">
      <span class="mission__no">MISSION ${String(i + 1).padStart(2, '0')}</span>
      <h3 class="mission__name">${esc(pretty(m.name))}</h3>
      ${m.description ? `<p class="mission__desc">${esc(m.description)}</p>` : ''}
      <div class="mission__tags">${tags.join('')}</div>
    </div></button>`;
}

function renderMissions(list) {
  missions = list;
  const grid = $('#missionGrid');
  $('#missionCount').textContent = list.length || '—';
  if (!list.length) {
    grid.innerHTML = Array.from({ length: 3 }, () => `<div class="mission mission--locked"><span class="mission__mono" aria-hidden="true">🔒</span>
      <div class="mission__body"><span class="mission__no">LOCKED</span><h3 class="mission__name">Mission locked</h3></div></div>`).join('') +
      `<p class="missions__note">Missions stream live from Vercel. Set <code>VERCEL_TOKEN</code> on the deployment, or add <code>githubUser</code> in <code>js/config.js</code>.</p>`;
    $('#filters').innerHTML = '';
    return;
  }
  grid.innerHTML = list.map(missionCard).join('');
  const fws = [...new Set(list.map(m => m.framework))];
  $('#filters').innerHTML = fws.length > 1 ? ['all', ...fws].map((f, i) =>
    `<button class="chip" role="tab" aria-selected="${i === 0}" data-f="${esc(f)}">${esc(f)}</button>`).join('') : '';
  $$('.mission', grid).forEach(el => {
    el.addEventListener('click', () => openBrief(missions[+el.dataset.i]));
    bindTilt(el, 8);
  });
  if (gsap && ST) {
    const cards = $$('.mission', grid);
    gsap.set(cards, { opacity: 0, y: 90, rotateX: -12 });
    ST.batch(cards, { start: 'top 92%', once: true, onEnter: b => gsap.to(b, { opacity: 1, y: 0, rotateX: 0, duration: 1, stagger: .12, ease: 'expo.out', clearProps: 'rotateX' }) });
    ST.refresh();
  }
}
window.AK = { renderMissions }; // handy for previewing layouts from the console

$('#filters').addEventListener('click', e => {
  const chip = e.target.closest('.chip'); if (!chip) return;
  sfx.click();
  $$('.chip').forEach(c => c.setAttribute('aria-selected', c === chip));
  const f = chip.dataset.f;
  const cards = $$('.mission');
  cards.forEach(c => { c.hidden = !(f === 'all' || c.dataset.fw === f); });
  if (gsap) gsap.fromTo(cards.filter(c => !c.hidden), { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: .05, duration: .5, ease: 'power3.out' });
  ST?.refresh();
});

/* briefing dialog */
const brief = $('#brief');
function openBrief(m) {
  sfx.click();
  $('#briefArt').innerHTML = `<img src="${esc(shot(m.url))}" alt="Screenshot of ${esc(pretty(m.name))}" onerror="this.remove()">`;
  $('#briefTitle').textContent = pretty(m.name);
  $('#briefDesc').textContent = m.description || 'Classified. Deploy and find out.';
  const rows = [['Status', 'Live'], ['Framework', m.framework], m.language && ['Language', m.language],
    m.updatedAt && ['Last deploy', new Date(m.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })],
    ['Location', m.url.replace(/^https?:\/\//, '')], m.topics?.length && ['Intel', m.topics.slice(0, 5).join(' · ')]].filter(Boolean);
  $('#briefMeta').innerHTML = rows.map(([k, v]) => `<li><span>${esc(k)}</span><span>${esc(v)}</span></li>`).join('');
  $('#briefCtas').innerHTML = `<a class="btn btn--primary" href="${esc(m.url)}" target="_blank" rel="noopener"><span>Play mission</span><kbd>↗</kbd></a>` +
    (m.repo ? `<a class="btn btn--ghost" href="${esc(m.repo)}" target="_blank" rel="noopener"><span>Source</span></a>` : '');
  brief.showModal();
  lenis?.stop();
  if (gsap) gsap.from(brief, { scale: .9, opacity: 0, duration: .45, ease: 'back.out(1.6)' });
}
brief.addEventListener('close', () => lenis?.start());
$('#briefClose').addEventListener('click', () => brief.close());
brief.addEventListener('click', e => { if (e.target === brief) brief.close(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && brief.open) brief.close(); }); // some browsers ignore Esc on dialogs opened after animations

/* ===================== INTERACTIONS ===================== */
function bindTilt(el, max = 10) {
  if (!finePointer || reduce || !gsap) return;
  let glare = $('.glare', el);
  if (!glare && el.matches('[data-tilt]')) { glare = document.createElement('span'); glare.className = 'glare'; el.append(glare); }
  el.addEventListener('pointermove', e => {
    const b = el.getBoundingClientRect(), px = (e.clientX - b.left) / b.width, py = (e.clientY - b.top) / b.height;
    gsap.to(el, { rotateY: (px - .5) * max, rotateX: (.5 - py) * max, transformPerspective: 900, scale: 1.02, duration: .5, ease: 'power3.out' });
    el.style.setProperty('--gx', px * 100 + '%'); el.style.setProperty('--gy', py * 100 + '%');
  });
  el.addEventListener('pointerleave', () => gsap.to(el, { rotateY: 0, rotateX: 0, scale: 1, duration: .8, ease: 'elastic.out(1, .5)' }));
}
$$('[data-tilt]').forEach(el => bindTilt(el, 12));

if (finePointer && gsap && !reduce) {
  $$('[data-magnetic]').forEach(el => {
    el.addEventListener('pointermove', e => {
      const b = el.getBoundingClientRect();
      gsap.to(el, { x: (e.clientX - b.left - b.width / 2) * .3, y: (e.clientY - b.top - b.height / 2) * .45, duration: .4, ease: 'power3.out' });
    });
    el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: .9, ease: 'elastic.out(1, .4)' }));
  });
  const cur = $('.cursor');
  const cx = gsap.quickTo(cur, 'x', { duration: .25, ease: 'power3' }), cy = gsap.quickTo(cur, 'y', { duration: .25, ease: 'power3' });
  addEventListener('pointermove', e => { cx(e.clientX); cy(e.clientY); });
}
const hoverables = 'a, button, [role="button"], .mission, input, textarea';
document.addEventListener('pointerover', e => {
  const t = e.target.closest(hoverables);
  $('.cursor').classList.toggle('is-hover', !!t);
  if (t && !t.contains(e.relatedTarget) && t.matches('.btn, .hud__nav a, .chip, .app')) sfx.hover();
});
// click ripple clipped to the skewed button shape
document.addEventListener('pointerdown', e => {
  const btn = e.target.closest('.btn'); if (!btn) return;
  let fx = btn.querySelector('.btn__fx');
  if (!fx) { fx = document.createElement('i'); fx.className = 'btn__fx'; fx.style.cssText = 'position:absolute;inset:0;overflow:hidden;transform:skewX(-14deg);pointer-events:none;z-index:-1'; btn.prepend(fx); }
  const b = btn.getBoundingClientRect(), s = Math.max(b.width, b.height), rip = document.createElement('span');
  rip.className = 'ripple';
  rip.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - b.left - s / 2}px;top:${e.clientY - b.top - s / 2}px`;
  fx.append(rip); setTimeout(() => rip.remove(), 650);
  sfx.click();
});

/* pause menu */
const pause = $('#pause'), menuBtn = $('#menuBtn');
function setMenu(open) {
  pause.classList.toggle('is-open', open);
  pause.setAttribute('aria-hidden', !open);
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  open ? lenis?.stop() : lenis?.start();
  document.body.style.overflow = open ? 'hidden' : '';
  if (open && gsap) gsap.from($$('.pause nav a'), { x: -60, opacity: 0, stagger: .05, duration: .6, ease: 'expo.out', delay: .15 });
}
menuBtn.addEventListener('click', () => setMenu(!pause.classList.contains('is-open')));
pause.addEventListener('click', () => setMenu(false));
addEventListener('keydown', e => { if (e.key === 'Escape' && pause.classList.contains('is-open')) setMenu(false); });

/* smooth anchor travel */
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]'); if (!a) return;
  const target = a.getAttribute('href') === '#hero' ? 0 : $(a.getAttribute('href'));
  if (target === null) return;
  e.preventDefault();
  if (pause.classList.contains('is-open')) setMenu(false);
  if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.6 });
  else target === 0 ? scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }) : target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
});

/* toast */
const toastEl = $('#toast');
let toastTl;
function toast(title, sub = 'RESPECT +') {
  $('.toast__title', toastEl).textContent = title;
  $('.toast__sub', toastEl).textContent = sub;
  sfx.jingle();
  if (!gsap) return;
  toastTl?.kill();
  toastTl = gsap.timeline()
    .fromTo(toastEl, { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: .45, ease: 'back.out(2)' })
    .fromTo('.toast__sub', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .3 }, '-=.15')
    .to(toastEl, { opacity: 0, y: -30, duration: .5, delay: 1.3, ease: 'power2.in' })
    .set(toastEl, { y: 0 });
}

/* cheats: type HIRE or NEON */
let keys = '';
const cheat = $('#cheat');
addEventListener('keydown', e => {
  if (e.target.closest('input, textarea') || e.key.length !== 1) return;
  keys = (keys + e.key.toUpperCase()).slice(-8);
  const show = msg => { cheat.textContent = msg; cheat.classList.add('show'); sfx.jingle(); setTimeout(() => cheat.classList.remove('show'), 2600); };
  if (keys.endsWith('HIRE')) {
    keys = ''; show('Cheat activated: Hire me');
    $('#stars').classList.add('flash'); $$('#stars i').forEach(i => i.classList.add('on'));
    lenis ? lenis.scrollTo('#contact', { duration: 2 }) : $('#contact').scrollIntoView({ behavior: 'smooth' });
  } else if (keys.endsWith('NEON')) {
    keys = ''; document.body.classList.toggle('cheat-neon'); show('Cheat activated: Neon mode');
  }
});

/* ===================== LOADER → INTRO ===================== */
const loader = $('#loader'), startBtn = $('#startBtn'), bar = $('.loader__bar i'), barWrap = $('.loader__bar');
const tipEl = $('.loader__tip');
let tipI = Math.floor(Math.random() * CONFIG.tips.length);
const nextTip = () => { tipEl.textContent = CONFIG.tips[tipI++ % CONFIG.tips.length]; };
nextTip();
const tipTimer = setInterval(nextTip, 2600);

const tasks = [
  document.fonts?.ready ?? Promise.resolve(),
  $('.hero__char img').decode().catch(() => {}),
  loadMissions().then(renderMissions),
];
let done = 0;
const setProgress = p => { bar.style.width = p + '%'; barWrap.setAttribute('aria-valuenow', Math.round(p)); };
tasks.forEach(t => t.finally(() => setProgress((++done / tasks.length) * 100)));
const seen = sessionStorage.getItem('ak-seen');

function ready() {
  clearInterval(tipTimer);
  startBtn.disabled = false;
  startBtn.querySelector('span').textContent = 'Press start';
  startBtn.insertAdjacentHTML('beforeend', '<kbd>↵</kbd>');
  startBtn.focus({ preventScroll: true });
  if (gsap) gsap.fromTo(startBtn, { scale: .8 }, { scale: 1, duration: .6, ease: 'elastic.out(1, .4)' });
}
const minTime = new Promise(r => setTimeout(r, reduce ? 300 : seen ? 1500 : 2600));
Promise.allSettled([...tasks, minTime]).then(ready);

if (gsap && !reduce) {
  gsap.timeline()
    .fromTo('.loader__presents', { opacity: 0, letterSpacing: '0em' }, { opacity: 1, duration: seen ? .2 : 1.2, ease: 'power2.out' })
    .fromTo('.loader__name', { letterSpacing: '.2em' }, { letterSpacing: '.42em', duration: seen ? .2 : 1.6, ease: 'power2.out' }, 0)
    .to('.loader__presents', { opacity: 0, duration: .5 }, seen ? .3 : 1.6)
    .to('.loader__main', { opacity: 1, duration: .6 })
    .from('.logo-badge', { scale: 0, rotate: -180, duration: .9, ease: 'back.out(1.7)' }, '<');
} else {
  $('.loader__presents').style.display = 'none';
  $('.loader__main').style.opacity = 1;
}

let started = false;
function start() {
  if (started || startBtn.disabled) return;
  started = true;
  sessionStorage.setItem('ak-seen', '1');
  sfx.jingle();
  document.body.classList.remove('is-loading');
  if (!gsap) { loader.remove(); return; }
  const tl = gsap.timeline({ onComplete: () => loader.remove() });
  tl.to(loader, { clipPath: 'circle(0% at 50% 50%)', duration: reduce ? .01 : 1.1, ease: 'expo.inOut' }, 0);
  if (!reduce) {
    tl.from('.hero__sky', { opacity: 0, duration: 1.2 }, .3)
      .from('.hero__sun', { y: 260, scale: .7, duration: 1.8, ease: 'power3.out' }, .35)
      .from('.hero__city--far', { yPercent: 60, opacity: 0, duration: 1.4, ease: 'power3.out' }, .55)
      .from('.hero__city--near', { yPercent: 80, duration: 1.3, ease: 'power3.out' }, .65)
      .from('.hero__palms', { yPercent: 25, opacity: 0, duration: 1.4, ease: 'power3.out' }, .7)
      .from('.hero__char', { x: 220, opacity: 0, duration: 1.3, ease: 'expo.out' }, .9)
      .from('.hero__tag', { scale: 0, rotate: -30, duration: .7, ease: 'back.out(2)' }, 1.5)
      .from('.hero__title .char', { yPercent: 120, rotateX: -90, opacity: 0, duration: .9, stagger: .045, ease: 'back.out(1.8)' }, .9)
      .from(['.kicker', '.hero__lead', '.hero__ctas .btn'], { y: 30, opacity: 0, duration: .8, stagger: .1, ease: 'power3.out' }, 1.4)
      .from('.hud', { yPercent: -120, duration: .8, ease: 'expo.out' }, 1.5)
      .from('.ticker', { yPercent: 120, duration: .8, ease: 'expo.out' }, 1.7);
  }
  initScroll();
}
startBtn.addEventListener('click', start);
addEventListener('keydown', e => { if (e.key === 'Enter' && !started && !startBtn.disabled) { e.preventDefault(); start(); } });

/* ===================== SCROLL WORLD ===================== */
function initScroll() {
  if (!gsap || !ST) return;
  gsap.registerPlugin(ST);
  if (window.Lenis && !reduce) {
    lenis = new window.Lenis({ lerp: .09, smoothWheel: true });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    window.AK.lenis = lenis;
  }

  const hud = $('#hud'), stars = $$('#stars i'), cashEl = $('#cash'), armor = $('.radar__bars .ar b');
  const cash = { v: 0 }, setCash = gsap.quickTo(cash, 'v', { duration: .8, ease: 'power2.out', onUpdate: () => { cashEl.textContent = Math.round(cash.v).toLocaleString('en-US'); } });
  ST.create({
    start: 0, end: 'max',
    onUpdate: s => {
      hud.classList.toggle('is-scrolled', s.scroll() > 40);
      if (!$('#stars').classList.contains('flash')) stars.forEach((st, i) => st.classList.toggle('on', s.progress > (i + .5) / 5.2));
      setCash(s.progress * 1_000_000);
      armor.style.transform = `scaleX(${.15 + s.progress * .85})`;
    },
  });

  // radar only shows once you leave the hero so it never covers the CTAs
  ST.create({ trigger: '#hero', start: 'bottom 70%', end: 'max', onToggle: s => gsap.to('.radar', { autoAlpha: s.isActive ? 1 : 0, x: s.isActive ? 0 : -60, duration: .5, ease: 'expo.out' }) });

  // radar blips + active section
  const sections = $$('[data-blip]'), disc = $('.radar__disc'), you = $('.radar__you');
  const navLinks = $$('.hud__nav a');
  sections.forEach((sec, i) => {
    const ang = (i / sections.length) * Math.PI * 2 - Math.PI / 2;
    const b = document.createElement('button');
    b.className = 'radar__blip';
    b.style.left = 50 + Math.cos(ang) * 34 + '%'; b.style.top = 50 + Math.sin(ang) * 34 + '%';
    b.setAttribute('aria-label', `Fast travel to ${sec.dataset.blip}`);
    b.innerHTML = `<span>${esc(sec.dataset.blip)}</span>`;
    b.addEventListener('click', () => lenis ? lenis.scrollTo(i === 0 ? 0 : sec, { duration: 1.6 }) : sec.scrollIntoView({ behavior: 'smooth' }));
    disc.append(b);
    ST.create({
      trigger: sec, start: 'top 55%', end: 'bottom 55%',
      onToggle: s => {
        if (!s.isActive) return;
        $$('.radar__blip').forEach((x, j) => x.classList.toggle('is-active', j === i));
        navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + sec.id));
        you.style.transform = `rotate(${(i / sections.length) * 360}deg)`;
      },
    });
  });

  // mission-passed toasts, once per section
  const toasts = { profile: 'PROFILE UNLOCKED', missions: 'MISSIONS AVAILABLE', arsenal: 'NEW WEAPONS', story: 'STORY CONTINUES', contact: 'INCOMING CALL' };
  Object.entries(toasts).forEach(([id, t]) => ST.create({ trigger: '#' + id, start: 'top 40%', once: true, onEnter: () => toast(t) }));

  if (reduce) return;

  // hero parallax
  gsap.timeline({ scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } })
    .to('.hero__sun', { y: 220, ease: 'none' }, 0)
    .to('.hero__city--far', { y: 90, ease: 'none' }, 0)
    .to('.hero__city--near', { y: 40, ease: 'none' }, 0)
    .to('.hero__char', { y: -90, scale: 1.06, ease: 'none' }, 0)
    .to('.hero__content', { y: -140, opacity: .2, ease: 'none' }, 0)
    .to('.hero__stars', { y: 120, ease: 'none' }, 0);

  // section titles
  $$('.section__title, .footer__big').forEach(t => gsap.from($$('.char', t), {
    yPercent: 110, opacity: 0, rotate: 8, duration: .8, stagger: .025, ease: 'back.out(1.6)',
    scrollTrigger: { trigger: t, start: 'top 88%' },
  }));
  $$('.section__num').forEach(n => gsap.from(n, { x: -60, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: n, start: 'top 88%' } }));
  $$('.section__sub').forEach(n => gsap.from(n, { y: 20, opacity: 0, duration: .8, delay: .3, scrollTrigger: { trigger: n, start: 'top 90%' } }));

  // profile
  gsap.from('.profile__art', { x: -120, rotate: -14, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.profile__grid', start: 'top 80%' } });
  gsap.from('.profile__meta > div', { y: 40, opacity: 0, stagger: .08, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: '.profile__meta', start: 'top 85%' } });
  gsap.from('.profile__bio', { y: 30, opacity: 0, duration: .8, scrollTrigger: { trigger: '.profile__bio', start: 'top 90%' } });
  $$('.stat').forEach(s => gsap.from($$('.stat__bar i.on', s), { scaleY: 0, opacity: 0, stagger: .05, duration: .3, ease: 'back.out(3)', scrollTrigger: { trigger: s, start: 'top 92%' } }));

  // weapon wheel
  gsap.from('.seg', { scale: 0, rotate: -60, opacity: 0, transformOrigin: '0px 0px', stagger: .06, duration: .8, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.wheel', start: 'top 75%' } });
  gsap.from('.wheel__ring', { rotate: 180, opacity: 0, transformOrigin: '0px 0px', duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.wheel', start: 'top 75%' } });
  gsap.from('.wheel__center', { opacity: 0, scale: .6, duration: .8, delay: .5, ease: 'back.out(2)', scrollTrigger: { trigger: '.wheel', start: 'top 75%' } });

  // story: horizontal drive on desktop, cascade on mobile
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const track = $('#storyTrack');
    const dist = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth + parseFloat(getComputedStyle($('#story')).paddingLeft) * 2);
    gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '#story', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true } });
  });
  mm.add('(max-width: 900px)', () => {
    $$('.chapter').forEach(c => gsap.from(c, { x: -50, opacity: 0, duration: .8, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 88%' } }));
  });

  // phone
  gsap.from('.phone', { y: 160, rotate: 14, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.contact__grid', start: 'top 80%' } });
  gsap.from('.app', { scale: 0, opacity: 0, stagger: .06, duration: .5, delay: .5, ease: 'back.out(2.5)', scrollTrigger: { trigger: '.contact__grid', start: 'top 80%' } });
  gsap.from('.bubble, .field, .sms .btn', { x: -40, opacity: 0, stagger: .12, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: '.sms', start: 'top 85%' } });

  document.fonts?.ready.then(() => ST.refresh());
  addEventListener('load', () => ST.refresh());
}
