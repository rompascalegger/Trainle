'use strict';
(() => {
  const D = window.TRAINLE_DATA;
  const Snd = window.TrainleAudio;
  const $ = (s) => document.querySelector(s);
  const mk = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };

  // ---------- Konstanten ----------
  const SEC_PER_MIN = 3;        // Echtzeit-Sekunden pro Spielminute bei 1×
  const DAY_LEN = 120;          // Spielminuten pro Tag
  const START_MIN = 5 * 60 + 45; // 05:45
  const WAIT_AUTO = 6;          // dann teilt das Stellwerk selbst ein
  const STORE = 'trainle-v2';
  const DEF_W = { snack: 1, wartung: 0.4, wasch: 0.6, plaudern: 0.8, musik: 0.6, ruhe: 0.6 };
  const NEED_GAIN = { trost: 25, snack: 18, wartung: 16, wasch: 15, plaudern: 15, musik: 20, ruhe: 15 };
  const MULT = {
    saemi: { trost: 1.6 }, fonsi: { snack: 1.5 }, heidi: { musik: 1.6 }, lotti: { plaudern: 1.6 },
    gletschi: { wasch: 1.5 }, sternli: { musik: 1.4, ruhe: 1.3 }, ivo: { trost: 0.5 }, rotpfeil: { trost: 0.5 },
    chaeschtli: { trost: 1.3, plaudern: 1.3 }, celine: { snack: 1.3 },
  };
  const LOOK = { ivo: 'proud', rotpfeil: 'proud', nora: 'shy', toni: 'shy', gusti: 'sleepy', sternli: 'sleepy', mia: 'sleepy',
    brummi: 'grumpy', chaeschtli: 'cute', gletschi: 'lashes', celine: 'lashes', saemi: 'blush', flirti: 'blush', heidi: 'blush' };
  const PAX_COLORS = ['#ff9aa2', '#ffdac1', '#b5ead7', '#c7ceea', '#ffd166', '#a0c4ff', '#cdb4db', '#f4a261', '#90be6d'];
  const TRAIN = Object.fromEntries(D.TRAINS.map((t) => [t.id, t]));

  // ---------- Hilfsfunktionen ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = (v, r = Math.random) => (Array.isArray(v) ? v[Math.floor(r() * v.length)] : v);
  const hhmm = (m) => {
    const t = START_MIN + Math.floor(m);
    return String(Math.floor(t / 60) % 24).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
  };
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  const prettyDate = (s) => { const [y, m, d] = s.split('-'); return `${+d}.${+m}.${y}`; };
  const pairKey = (a, b) => [a, b].sort().join('+');
  const has = (T, trait) => T.tr.includes(trait);

  // ---------- Speicher ----------
  function freshStore() {
    return { v: 2, taler: 0, unlocked: D.START_TRAINS.slice(), seen: [], stars: {}, up: {}, tracks: {}, friends: {}, best: {}, sound: true, music: true, seenHelp: false };
  }
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (raw && raw.v === 2) return Object.assign(freshStore(), raw);
    } catch (e) { /* leer */ }
    return freshStore();
  }
  const store = load();
  function save() { try { localStorage.setItem(STORE, JSON.stringify(store)); } catch (e) { /* egal */ } }
  const upLvl = (id) => store.up[id] || 0;
  const totalStars = () => Object.values(store.stars).reduce((a, b) => a + b, 0);
  const stationOpen = (st) => totalStars() >= st.need;
  const tracksFor = (st) => Math.min(st.maxTracks, st.startTracks + (store.tracks[st.id] || 0));

  // ---------- Gesichter ----------
  function faceSVG(T, stress, extra) {
    const look = LOOK[T.id] || '';
    const b = stress < 30 ? 0 : stress < 55 ? 1 : stress < 80 ? 2 : 3;
    const ink = '#2b2440';
    let s = '<svg viewBox="0 0 60 60" aria-hidden="true">';
    if (b >= 2 || look === 'shy') s += `<path d="M14 17 l9 3 M46 17 l-9 3" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`;
    else if (look === 'grumpy') s += `<path d="M14 16 l10 5 M46 16 l-10 5" stroke="${ink}" stroke-width="3.2" stroke-linecap="round"/>`;
    else if (look === 'proud') s += `<path d="M14 19 l9 -2 M37 17 l9 2" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`;
    if (b === 3) {
      s += `<path d="M14 28 q5 -5 10 0 M36 28 q5 -5 10 0" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      s += '<path d="M17 31 q-3 6 0 8 q3 -2 0 -8z M43 31 q-3 6 0 8 q3 -2 0 -8z" fill="#7cc8ff"/>';
    } else if (extra === 'love') {
      s += '<path d="M19 33 l-6 -6 a3.5 3.5 0 0 1 6 -4 a3.5 3.5 0 0 1 6 4z M41 33 l-6 -6 a3.5 3.5 0 0 1 6 -4 a3.5 3.5 0 0 1 6 4z" fill="#ff5c8a"/>';
    } else {
      const big = look === 'cute' || look === 'shy';
      const ry = big ? 6.5 : 5.2, rx = big ? 5.5 : 4.6;
      s += `<g class="eyes"><ellipse cx="19" cy="28" rx="${rx}" ry="${ry}" fill="${ink}"/><ellipse cx="41" cy="28" rx="${rx}" ry="${ry}" fill="${ink}"/>`;
      s += `<circle cx="21" cy="25.5" r="${big ? 2.3 : 1.7}" fill="#fff"/><circle cx="43" cy="25.5" r="${big ? 2.3 : 1.7}" fill="#fff"/>`;
      if (big) s += '<circle cx="17.5" cy="30.5" r="1" fill="#fff"/><circle cx="39.5" cy="30.5" r="1" fill="#fff"/>';
      s += '</g>';
      if ((look === 'proud' || look === 'sleepy') && b < 2) s += `<rect x="12" y="20" width="14" height="${look === 'sleepy' ? 5.5 : 4.5}" fill="var(--c)"/><rect x="34" y="20" width="14" height="${look === 'sleepy' ? 5.5 : 4.5}" fill="var(--c)"/><path d="M13 ${look === 'sleepy' ? 25.5 : 24.5} q6 2 12 0 M35 ${look === 'sleepy' ? 25.5 : 24.5} q6 2 12 0" stroke="${ink}" stroke-width="2"/>`;
      if (look === 'lashes') s += `<path d="M13 23 l-3 -3 M15 21 l-1 -4 M47 23 l3 -3 M45 21 l1 -4" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`;
    }
    const blush = look === 'blush' || look === 'cute' || b === 0 || extra === 'love';
    if (blush) s += `<ellipse cx="10" cy="38" rx="5" ry="3" fill="#ff7a9a" opacity="${look === 'blush' ? 0.75 : 0.45}"/><ellipse cx="50" cy="38" rx="5" ry="3" fill="#ff7a9a" opacity="${look === 'blush' ? 0.75 : 0.45}"/>`;
    const mouth = [
      look === 'cute' ? 'M24 40 q6 8 12 0z' : 'M21 40 q9 9 18 0',
      look === 'grumpy' ? 'M22 44 q8 -4 16 0' : 'M23 42 q7 3 14 0',
      'M20 44 q5 -5 10 0 q5 5 10 0',
      'M20 46 q10 -9 20 0',
    ][b];
    s += `<path d="${mouth}" stroke="${ink}" stroke-width="3" fill="${look === 'cute' && b === 0 ? '#ff7a9a' : 'none'}" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (b >= 2) s += `<path d="M52 9 q-5 8 0 11 q5 -3 0 -11z" fill="#9fd8ff" stroke="${ink}" stroke-width="1.5"/>`;
    return s + '</svg>';
  }
  const moodEmoji = (h) => (h >= 80 ? '😊' : h >= 60 ? '🙂' : h >= 40 ? '😐' : h >= 20 ? '😟' : '😢');

  function clockSVG(m) {
    const t = START_MIN + m, h = (t / 60) % 12, mi = t % 60;
    const ha = (h / 12) * Math.PI * 2, ma = (mi / 60) * Math.PI * 2;
    const hx = 20 + Math.sin(ha) * 8, hy = 20 - Math.cos(ha) * 8, mx = 20 + Math.sin(ma) * 12, my = 20 - Math.cos(ma) * 12;
    let s = '<circle cx="20" cy="20" r="17" fill="#fff" stroke="#2b2440" stroke-width="3"/>';
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; s += `<line x1="${20 + Math.sin(a) * 13}" y1="${20 - Math.cos(a) * 13}" x2="${20 + Math.sin(a) * 15}" y2="${20 - Math.cos(a) * 15}" stroke="#2b2440" stroke-width="${i % 3 ? 1 : 2}"/>`; }
    s += `<line x1="20" y1="20" x2="${hx}" y2="${hy}" stroke="#2b2440" stroke-width="3" stroke-linecap="round"/>`;
    s += `<line x1="20" y1="20" x2="${mx}" y2="${my}" stroke="#2b2440" stroke-width="2" stroke-linecap="round"/>`;
    s += `<line x1="20" y1="20" x2="${mx}" y2="${my}" stroke="#e5484d" stroke-width="1" /><circle cx="${mx}" cy="${my}" r="2.4" fill="#e5484d"/>`;
    return s;
  }

  // ---------- Spielzustand ----------
  let S = null;

  function dayConfig(mode, stIdx, d) {
    const st = D.STATIONS[stIdx];
    let roster, seedStr;
    if (mode === 'daily') {
      seedStr = 'daily-' + todayStr();
      const r = mulberry32(hashStr(seedStr));
      const pool = D.TRAINS.slice().sort(() => r() - 0.5);
      roster = pool.slice(0, st.lines + 1);
    } else {
      seedStr = `${st.id}-${d}-${store.unlocked.length}`;
      const r = mulberry32(hashStr(seedStr));
      const unl = store.unlocked.map((id) => TRAIN[id]);
      const newest = unl[unl.length - 1];
      const rest = unl.slice(0, -1).sort(() => r() - 0.5);
      roster = [newest].concat(rest).slice(0, Math.min(unl.length, st.lines + d));
    }
    return { st, roster, seedStr, tracks: mode === 'daily' ? st.startTracks : tracksFor(st) };
  }

  function newDay(mode, stIdx, d) {
    const cfg = dayConfig(mode, stIdx, d);
    const rng = mulberry32(hashStr(cfg.seedStr + '-runs'));
    const lines = cfg.roster.map((T) => buildLine(T, rng));
    S = {
      mode, stIdx, d, st: cfg.st, rng, lines, nTracks: cfg.tracks, plan: {},
      t: 0, speed: 1, paused: false, running: false, ended: false,
      mood: 72, trainMood: 72, hearts: 3 + upLvl('herz'), heartsMax: 3 + upLvl('herz'), heartT: 0,
      snacks: 3 + upLvl('kiosk'), snackMax: 3 + upLvl('kiosk'), snackT: 0,
      mechanics: 1 + (upLvl('werkstatt') >= 2 ? 1 : 0), washers: 1, musicCD: 0,
      tracks: [], runs: [], queue: [], selected: null, results: [], earned: 0, missed: 0,
      pairCD: {}, newFriends: [], panelKey: '', boardKey: '', talkT: 0,
    };
    autoPlan();
    S.runs = buildRuns(rng);
    showPlan();
  }

  function buildLine(T, rng) {
    const jitter = Math.round(rng() * 10 - 5);
    const knot = T.takt === 60 && rng() < 0.5 ? 30 : 0;
    const base = 15 + knot + jitter;
    const times = [];
    for (let x = base - 120; x <= 108; x += T.takt) if (x >= 3) times.push(x);
    return { T, times, dest: pick(D.STATIONS[0].dest, rng) };
  }

  function buildRuns(rng) {
    const runs = [];
    let id = 0;
    const mkRun = (T, plan, delay, extra, dest) => ({
      id: id++, T, plan, delay, arr: plan + delay, dwell: T.dwell + (extra ? 2 : 0), extra, dest,
      state: 'sched', stress: 14 + Math.floor(rng() * 10) + (has(T, 'dark') ? 8 : 0), needs: [], track: -1,
      waitT: 0, dwellLeft: 0, dwellTotal: 0, more: 0, el: null, card: null, faceB: '', bubbleAt: 0, happy: null,
      paxTotal: 0, paxBoarded: 0, pax: [], work: null, chatted: false, snacked: false, met: 0, bonus: 0, lateShown: false,
    });
    for (const L of S.lines) {
      L.dest = pick(S.st.dest, rng);
      for (const p of L.times) {
        const delay = rng() < L.T.lateP ? 1 + Math.floor(rng() * L.T.lateMax) : 0;
        runs.push(mkRun(L.T, p, delay, null, L.dest));
      }
    }
    const nExtra = S.mode === 'daily' ? 2 : 1 + Math.min(S.d, 2);
    for (let i = 0; i < nExtra; i++) {
      const L = S.lines[Math.floor(rng() * S.lines.length)];
      const theme = D.EXTRAS[Math.floor(rng() * D.EXTRAS.length)];
      runs.push(mkRun(L.T, 18 + Math.floor(rng() * 82), 0, theme, pick(S.st.dest, rng)));
    }
    return runs.sort((a, b) => a.arr - b.arr);
  }

  // ---------- Fahrplan ----------
  function lineIntervals(L, k) { return L.times.map((p) => ({ a: p, b: p + L.T.dwell, k })); }
  function overlapCost(L, k, plan) {
    let c = 0;
    for (const M of S.lines) {
      if (M === L || plan[M.T.id] !== k) continue;
      for (const x of lineIntervals(L, k)) for (const y of lineIntervals(M, k)) if (x.a < y.b + 1 && y.a < x.b + 1) c++;
    }
    return c;
  }
  function autoPlan() {
    const plan = {};
    const order = S.lines.slice().sort((a, b) => (b.T.dwell * b.times.length) - (a.T.dwell * a.times.length));
    const load = new Array(S.nTracks).fill(0);
    for (const L of order) {
      let best = 0, bestC = Infinity;
      for (let k = 0; k < S.nTracks; k++) {
        let c = overlapCost(L, k, plan) * 10 + load[k] * 0.01;
        if (L.T.wish != null && L.T.wish !== k) c += 6;
        if (c < bestC) { bestC = c; best = k; }
      }
      plan[L.T.id] = best;
      load[best] += L.T.dwell * L.times.length;
    }
    S.plan = plan;
  }

  function planConflicts() {
    const per = Array.from({ length: S.nTracks }, () => []);
    for (const L of S.lines) for (const p of L.times) per[S.plan[L.T.id]].push({ L, a: p, b: p + L.T.dwell, bad: false });
    let n = 0;
    for (const list of per) {
      list.sort((x, y) => x.a - y.a);
      for (let i = 1; i < list.length; i++) if (list[i].a < list[i - 1].b) { list[i].bad = list[i - 1].bad = true; n++; }
    }
    return { per, n };
  }

  function showPlan() {
    const st = S.st;
    $('#plan-title').textContent = S.mode === 'daily' ? `📅 Tagesfahrt in ${st.name}` : `${st.deco} ${st.name} · Tag ${S.d + 1}`;
    $('#plan-sub').textContent = `${st.tagline} ${S.nTracks} Gleise, ${S.lines.length} Linien, dazu Extrazüge.`;
    renderPlan();
    show('plan');
  }

  function renderPlan() {
    const box = $('#plan-lines');
    box.innerHTML = '';
    for (const L of S.lines) {
      const T = L.T;
      const row = mk('div', 'line-row');
      row.style.setProperty('--c', T.color);
      const isNew = S.mode !== 'daily' && !store.seen.includes(T.id) && D.UNLOCK_ORDER.includes(T.id);
      const guest = S.mode === 'daily' && !store.unlocked.includes(T.id);
      const times = L.times.map(hhmm);
      row.innerHTML = `<div class="lr-face">${faceSVG(T, 10)}</div>
        <div><b>${T.kind} ${T.name}</b> ${isNew ? '<span class="new">NEU</span>' : ''}${guest ? '<span class="new">GAST</span>' : ''}
        <div class="lr-sub">→ ${L.dest} · ${times[0]}${times.length > 1 ? ` und alle ${T.takt} Min.` : ''} · ${T.dwell} Min. Halt${T.wish != null ? ' · will Gleis 1' : ''}</div></div>
        <div class="track-pick"></div>`;
      const pk = row.querySelector('.track-pick');
      for (let k = 0; k < S.nTracks; k++) {
        const b = mk('button', S.plan[T.id] === k ? 'on' : '', String(k + 1));
        b.type = 'button';
        b.title = `Gleis ${k + 1}`;
        b.onclick = () => { S.plan[T.id] = k; Snd.sfx('click'); renderPlan(); };
        pk.appendChild(b);
      }
      box.appendChild(row);
    }
    renderTimeline();
  }

  function renderTimeline() {
    const { per, n } = planConflicts();
    const rowH = Math.min(26, 100 / S.nTracks);
    const x = (m) => 34 + m * 3.15;
    let s = '';
    for (let h = 0; h <= 4; h++) {
      const m = 15 + h * 30;
      if (m > 125) break;
      s += `<line x1="${x(m)}" y1="4" x2="${x(m)}" y2="${8 + rowH * S.nTracks}" stroke="#e3d8c4" stroke-width="${h % 2 ? 1 : 2}"/>`;
      s += `<text x="${x(m)}" y="${20 + rowH * S.nTracks}" font-size="11" text-anchor="middle" fill="#7a7290">${hhmm(m)}</text>`;
    }
    for (let k = 0; k < S.nTracks; k++) {
      const y = 6 + k * rowH;
      s += `<text x="4" y="${y + rowH * 0.62}" font-size="10" font-weight="700" fill="#2b2440">Gl.${k + 1}</text>`;
      s += `<rect x="${x(0)}" y="${y}" width="${x(120) - x(0)}" height="${rowH - 4}" rx="5" fill="#f6efe2"/>`;
      for (const it of per[k]) {
        const w = Math.max(5, (it.b - it.a) * 3.15);
        s += `<rect x="${x(it.a)}" y="${y + 2}" width="${w}" height="${rowH - 8}" rx="4" fill="${it.L.T.color}" stroke="${it.bad ? '#e4572e' : '#2b2440'}" stroke-width="${it.bad ? 3 : 1.2}"/>`;
        if (w > 12) s += `<text x="${x(it.a) + w / 2}" y="${y + rowH * 0.6}" font-size="10" font-weight="700" text-anchor="middle" fill="#2b2440">${it.L.T.name[0]}</text>`;
      }
    }
    const svg = $('#timeline');
    svg.setAttribute('viewBox', `0 0 420 ${26 + rowH * S.nTracks}`);
    svg.innerHTML = s;
    const msgs = [n ? `<span class="bad">⚠ ${n} Überschneidung${n > 1 ? 'en' : ''}. Dort wartet kurz jemand, das Stellwerk hilft.</span>` : '<span class="ok">✓ Alles passt. Verspätungen und Extrazüge kommen trotzdem.</span>'];
    for (const L of S.lines) if (L.T.wish != null && S.plan[L.T.id] !== L.T.wish) msgs.push(`<span class="bad">${L.T.name} wäre auf Gleis ${S.plan[L.T.id] + 1} beleidigt.</span>`);
    $('#plan-warn').innerHTML = msgs.join(' ');
  }

  // ---------- Tag starten ----------
  function startDay() {
    S.lines.forEach((L) => { if (!store.seen.includes(L.T.id)) store.seen.push(L.T.id); });
    save();
    const st = $('#station');
    st.innerHTML = `<div class="stars"></div><div class="sun">☀️</div><div class="deco">${S.st.deco}</div>`;
    st.style.setProperty('--sky', S.st.sky);
    st.style.setProperty('--ground', S.st.ground);
    S.tracks = [];
    for (let k = 0; k < S.nTracks; k++) {
      const row = mk('div', 'row', `<div class="perron"></div><div class="rail"></div>
        <span class="gleis${k === 0 ? ' wish' : ''}" title="Gleis ${k + 1}: ${D.TRACK_NAMES[k]}"><span class="tn">${k + 1}</span><span class="tf">😊</span></span>
        <div class="tmood"><i></i></div>`);
      row.dataset.track = k;
      row.addEventListener('click', () => {
        const r = S.selected;
        if (r && r.state === 'waiting' && !S.tracks[k].occ) assign(r, k);
        else if (S.tracks[k].occ) select(S.tracks[k].occ);
      });
      st.appendChild(row);
      S.tracks.push({ occ: null, mood: 80, emptyT: 0, busyT: 0, el: row, saidAt: -99, face: '' });
    }
    renderQueue();
    $('#pause-btn').textContent = '❚❚';
    S.paused = false;
    $('#pause-overlay').hidden = true;
    $('#speed-btn').textContent = S.speed + '×';
    ticker(`Guten Morgen, ${S.st.name}! ${S.st.tagline}`);
    S.running = true;
    S.panelKey = ''; S.boardKey = '';
    show('game');
    sizeStation();
    Snd.startMusic();
    if (!store.seenHelp) { store.seenHelp = true; save(); setTimeout(() => { if (S.running && !S.paused) togglePause(); $('#help').showModal(); }, 600); }
  }

  function sizeStation() {
    const st = $('#station');
    if (!st || !S) return;
    const h = st.clientHeight / Math.max(1, S.nTracks);
    const w = st.clientWidth;
    const rh = Math.max(40, Math.min(h, (100 * w * 0.62) / 225, 115));
    st.style.setProperty('--rh', rh.toFixed(1) + 'px');
    for (const r of S.runs) if (r.el && r.state === 'platform') r.el.style.left = `calc(56% - ${r.el.offsetWidth / 2}px)`;
  }
  window.addEventListener('resize', sizeStation);

  // ---------- Simulation ----------
  const darkness = () => clamp(1 - (S.t - 22) / 35, 0, 1);
  const neighborRuns = (k) => [S.tracks[k - 1], S.tracks[k + 1]].filter((x) => x && x.occ && x.occ.state === 'platform').map((x) => x.occ);

  function update(dm) {
    S.t += dm;
    // Ressourcen
    if (S.hearts < S.heartsMax) { S.heartT += dm; if (S.heartT >= 12) { S.heartT = 0; S.hearts++; Snd.sfx('heart'); } }
    if (S.snacks < S.snackMax) { S.snackT += dm; if (S.snackT >= 9 - upLvl('kiosk') * 2) { S.snackT = 0; S.snacks++; } }
    if (S.musicCD > 0) S.musicCD = Math.max(0, S.musicCD - dm);

    const dark = darkness();
    for (const r of S.runs) {
      if (r.state === 'sched') {
        if (!r.lateShown && r.delay > 0 && S.t >= r.plan - 20) { r.lateShown = true; ticker(`⏱️ ${r.T.kind} ${r.T.name} nach ${r.dest} kommt ca. ${r.delay} Min. später.`); S.boardKey = ''; }
        if (S.t >= r.arr) arrive(r);
        continue;
      }
      const T = r.T;
      if (r.state === 'waiting') {
        r.waitT += dm;
        let rate = T.wait * 0.75;
        if (has(T, 'dark')) rate += 1.5 * dark;
        if (has(T, 'adventure') && Math.random() < 0.02 * dm) addNeed(r, 'plaudern');
        r.stress += rate * dm;
        if (r.waitT >= WAIT_AUTO) autoAssign(r);
        else if (Math.random() < 0.05 * dm) say(r, 'wait');
      } else if (r.state === 'platform') {
        const k = r.track;
        if (r.work) {
          r.work.left -= dm;
          r.dwellLeft = Math.max(r.dwellLeft - dm, 1);
          if (r.work.left <= 0) finishWork(r);
        } else {
          r.dwellLeft -= dm;
        }
        const nb = neighborRuns(k);
        let rate = -0.7;
        rate += 0.9 * r.needs.filter((n) => n !== 'trost').length;
        if (T.wish != null && k !== T.wish) rate += 1.2;
        if (has(T, 'dark')) { rate += 1.6 * dark + (nb.length ? -1 : 0.6); if (Math.random() < 0.04 * dm) say(r, dark > 0.5 ? 'dark' : nb.length ? null : 'alone'); }
        if (has(T, 'shy')) rate += 0.5 * nb.filter((o) => (store.friends[pairKey(T.id, o.T.id)] || 0) < 3).length;
        if (has(T, 'love') && nb.some((o) => o.T.id === T.love)) rate -= 1.5;
        if (has(T, 'small') && nb.some((o) => o.T.cars >= 3)) rate -= 0.5;
        if (nb.some((o) => has(o.T, 'charm'))) rate -= 0.3;
        r.stress += rate * dm;
        maybeSpawnNeed(r, dm);
        boardPax(r);
        if (r.dwellLeft <= 0 && !r.work) depart(r);
      }
      r.stress = clamp(r.stress, 0, 100);
      if (r.state === 'waiting' || r.state === 'platform') {
        if (r.stress >= 60 && !r.needs.includes('trost')) addNeed(r, 'trost');
        else if (r.stress < 40 && r.needs.includes('trost')) r.needs = r.needs.filter((n) => n !== 'trost');
      }
    }
    updateTracks(dm);
    S.talkT += dm;
    if (S.talkT >= 0.5) { S.talkT = 0; checkTalks(); }
    const avgTrack = S.tracks.reduce((a, t) => a + t.mood, 0) / S.tracks.length;
    S.mood = S.trainMood * 0.8 + avgTrack * 0.2;
    if (S.t >= DAY_LEN && !S.ended && S.runs.every((r) => r.state === 'gone' || r.state === 'leaving')) endDay();
  }

  function updateTracks(dm) {
    const lonelyAfter = 15 + upLvl('blumen') * 7;
    const decay = 0.8 - upLvl('blumen') * 0.2;
    S.tracks.forEach((tk, k) => {
      if (tk.occ) {
        tk.emptyT = 0; tk.busyT += dm;
        tk.mood = Math.min(100, tk.mood + 0.6 * dm);
        if (tk.busyT > 40) { tk.mood -= 1.1 * dm; if (S.t - tk.saidAt > 15) { trackSay(k, 'tired'); } }
      } else {
        tk.emptyT += dm;
        if (tk.emptyT > 3) tk.busyT = 0;
        if (tk.emptyT > lonelyAfter) { tk.mood -= decay * dm; if (tk.mood < 55 && S.t - tk.saidAt > 14) trackSay(k, 'lonely'); }
      }
      tk.mood = clamp(tk.mood, 0, 100);
    });
  }

  function trackSay(k, key) {
    const tk = S.tracks[k];
    tk.saidAt = S.t;
    const b = mk('div', 'tbubble', `${D.TRACK_NAMES[k]}: ${pick(D.TRACK_SAY[key])}`);
    tk.el.querySelectorAll('.tbubble').forEach((x) => x.remove());
    tk.el.appendChild(b);
    setTimeout(() => b.remove(), 3200);
    if (key === 'lonely') Snd.sfx('sad');
    if (key === 'visit') Snd.sfx('sparkle');
  }

  function weightOf(r, n) {
    let w = r.T.n[n] != null ? r.T.n[n] : DEF_W[n];
    if (has(r.T, 'morning') && n === 'ruhe') w *= S.t > 55 ? 3 : 0.2;
    if (r.extra && r.extra.need === n) w += 3;
    return w;
  }
  function rollNeed(r) {
    const opts = D.NEED_KEYS.filter((n) => !r.needs.includes(n));
    const tot = opts.reduce((a, n) => a + weightOf(r, n), 0);
    let x = Math.random() * tot;
    for (const n of opts) { x -= weightOf(r, n); if (x <= 0) return n; }
    return opts[0];
  }
  function addNeed(r, n) {
    if (!n || r.needs.includes(n)) return;
    r.needs.push(n);
    S.panelKey = '';
    if (n !== 'trost' || r.stress > 70) say(r, null, null, false, pick(D.NEEDS[n].say));
  }
  function initialNeeds(r) {
    for (const n of D.NEED_KEYS) if (r.needs.filter((x) => x !== 'trost').length < 2 && Math.random() < 0.13 * weightOf(r, n)) r.needs.push(n);
    if (r.extra && r.extra.need && !r.needs.includes(r.extra.need)) r.needs.push(r.extra.need);
  }
  function maybeSpawnNeed(r, dm) {
    const open = r.needs.filter((n) => n !== 'trost').length;
    const rate = has(r.T, 'moody') ? 0.07 : 0.035;
    if (open < 2 && Math.random() < rate * dm) addNeed(r, rollNeed(r));
    if (has(r.T, 'moody') && open && Math.random() < 0.04 * dm) { r.needs = r.needs.filter((n) => n === 'trost' || Math.random() < 0.5); S.panelKey = ''; }
  }

  function arrive(r) {
    r.state = 'waiting';
    if (r.delay > 0) r.stress += has(r.T, 'shy-late') ? 14 + r.delay * 2 : has(r.T, 'perfect') ? 10 + r.delay * 4 : r.delay * 1.2;
    initialNeeds(r);
    if (r.extra) {
      if (r.extra.gift === 'heart') { S.hearts = Math.min(S.heartsMax + 1, S.hearts + 1); }
      if (r.extra.gift === 'snack') { S.snacks = Math.min(S.snackMax + 2, S.snacks + 2); }
    }
    const k = r.extra ? -1 : S.plan[r.T.id];
    Snd.sfx('chime');
    S.boardKey = '';
    if (k >= 0 && !S.tracks[k].occ) {
      enterTrack(r, k, r.delay > 0 ? 'late' : 'arrive');
    } else {
      S.queue.push(r);
      renderQueue();
      if (r.delay > 0 && r.T.say.late && !r.extra) say(r, 'late', null, true);
      else say(r, null, null, true, r.extra ? `${r.extra.icon} ${r.extra.text}` : `Gleis ${k + 1} ist noch besetzt…`);
      ticker(r.extra ? `${r.extra.icon} ${r.extra.label}: ${r.T.name} braucht ein freies Gleis.` : `${r.T.kind} ${r.T.name} wartet in der Einfahrt. Gleis ${k + 1} ist besetzt.`);
      if (!S.selected) select(r, true);
    }
  }

  function enterTrack(r, k, sayKey) {
    S.queue = S.queue.filter((x) => x !== r);
    if (r.card) { r.card.remove(); r.card = null; }
    renderQueue();
    const tk = S.tracks[k];
    tk.occ = r;
    r.track = k;
    r.state = 'platform';
    r.dwellLeft = r.dwell;
    r.dwellTotal = r.dwell;
    makeTrainEl(r, k);
    S.boardKey = '';
    if (tk.mood < 60) { r.bonus += 6; tk.mood = Math.min(100, tk.mood + 22); trackSay(k, 'visit'); }
    if (r.T.wish != null && k !== r.T.wish) { r.stress += 12; say(r, 'wrong', { n: k + 1 }, true); Snd.sfx('grump'); }
    else if (sayKey) say(r, sayKey, null, true);
    if (r.extra && r.extra.gift === 'joy') neighborRuns(k).forEach((o) => { o.stress -= 10; fx(o, '💐'); });
    spawnPax(r, k);
    ticker(`Gleis ${k + 1}: ${r.extra ? r.extra.icon + ' ' : ''}${r.T.kind} ${r.T.name} nach ${r.dest}${r.delay ? ` (+${r.delay} Min.)` : ''}.`);
  }

  function assign(r, k) {
    if (r.state !== 'waiting' || S.tracks[k].occ) return;
    Snd.sfx('click');
    r.bonus += 3;
    enterTrack(r, k, 'arrive');
  }

  function autoAssign(r) {
    const planned = r.extra ? -1 : S.plan[r.T.id];
    const free = (k) => k >= 0 && k < S.nTracks && !S.tracks[k].occ;
    let k = free(planned) ? planned : -1;
    if (k < 0 && r.T.wish != null && free(r.T.wish)) k = r.T.wish;
    if (k < 0) { // einsamstes freies Gleis
      let best = -1;
      S.tracks.forEach((t, i) => { if (!t.occ && (best < 0 || t.mood < S.tracks[best].mood)) best = i; });
      k = best;
    }
    if (k < 0) return;
    enterTrack(r, k, null);
    say(r, null, null, true, 'Das Stellwerk hat mich eingeteilt.');
  }

  function depart(r) {
    const tk = S.tracks[r.track];
    tk.occ = null;
    r.state = 'leaving';
    const unmet = r.needs.filter((n) => n !== 'trost').length;
    r.stress = clamp(r.stress, 0, 100);
    const h = Math.round(clamp(100 - r.stress - unmet * 7 + r.bonus + r.met * 3, 0, 100));
    r.happy = h;
    S.trainMood = S.trainMood * 0.78 + h * 0.22;
    S.results.push(r);
    const coins = h >= 80 ? 2 : h >= 60 ? 1 : 0;
    if (coins) earn(coins);
    missPax(r);
    say(r, h >= 60 ? 'happy' : 'sad', null, true);
    Snd.sfx('depart');
    if (S.selected === r) { S.selected = null; S.panelKey = ''; }
    const e = r.el;
    e.classList.remove('moving', 'sel');
    e.classList.add('leaving');
    if (h >= 80) e.classList.add('hop');
    e.style.left = 'calc(100% + 80px)';
    S.boardKey = '';
    setTimeout(() => { e.remove(); r.state = 'gone'; }, 1900);
  }

  function earn(n) {
    S.earned += n;
    const el = $('#taler');
    el.querySelector('b').textContent = store.taler + S.earned;
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
  }

  // ---------- Bedürfnisse erfüllen ----------
  function fulfill(r, n, quiet) {
    const hadIt = r.needs.includes(n);
    const mult = (MULT[r.T.id] && MULT[r.T.id][n]) || 1;
    let gain = NEED_GAIN[n] * mult;
    if (n === 'trost' && has(r.T, 'grumpy')) gain *= r.snacked ? 1.3 : 0.4;
    if (!hadIt) gain = n === 'trost' ? gain * 0.6 : 4;
    r.stress = clamp(r.stress - gain, 0, 100);
    if (hadIt) {
      r.needs = r.needs.filter((x) => x !== n);
      r.met++;
      earn(1);
      if (!quiet) say(r, 'thanks', null, true);
    } else if (!quiet) {
      say(r, null, null, true, n === 'trost' ? pick(r.T.say.thanks) : 'Oh, danke!');
    }
    fx(r, D.NEEDS[n].icon);
    S.panelKey = '';
    return hadIt;
  }

  function act(r, kind) {
    if (!r || (r.state !== 'platform' && r.state !== 'waiting')) return;
    const onTrack = r.state === 'platform';
    if (kind === 'trost') {
      if (S.hearts <= 0) return;
      S.hearts--; fulfill(r, 'trost'); Snd.sfx('comfort');
    } else if (kind === 'snack') {
      if (S.snacks <= 0) return;
      S.snacks--; r.snacked = true; fulfill(r, 'snack'); Snd.sfx('munch');
    } else if (kind === 'wartung') {
      if (!onTrack || r.work || freeWorkers('wartung') <= 0 || !r.needs.includes('wartung')) return;
      r.work = { kind: 'wartung', left: 4 - upLvl('werkstatt') * 0.8 };
      showWork(r, '🔧'); Snd.sfx('wrench'); say(r, null, null, true, 'Die Mechanikerin ist da!');
    } else if (kind === 'wasch') {
      if (!onTrack || r.work || freeWorkers('wasch') <= 0) return;
      r.work = { kind: 'wasch', left: 2 - upLvl('wasch') * 0.5 };
      showWork(r, '🫧'); Snd.sfx('bubbles');
    } else if (kind === 'plaudern') {
      if (r.chatted) return;
      r.chatted = true; fulfill(r, 'plaudern'); Snd.sfx('chat');
    } else if (kind === 'musik') {
      if (S.musicCD > 0) return;
      S.musicCD = 5 - upLvl('spieldose') * 1.5;
      fulfill(r, 'musik'); Snd.sfx('lullaby');
      if (onTrack) neighborRuns(r.track).forEach((o) => { if (o.needs.includes('musik')) fulfill(o, 'musik', true); else { o.stress -= 5; fx(o, '🎵'); } });
    } else if (kind === 'more') {
      if (!onTrack || r.more >= 2) return;
      r.more++; r.dwellLeft += 3; r.dwellTotal += 3;
      r.stress += r.T.more;
      if (r.needs.includes('ruhe')) fulfill(r, 'ruhe', true);
      say(r, 'more', null, true);
      Snd.sfx(r.T.more > 0 ? 'grump' : 'more');
    } else if (kind === 'early') {
      if (!onTrack || r.work || r.dwellLeft < 0.6) return;
      r.dwellLeft = 0.3;
      r.noBoard = true;
      r.stress += r.T.early + (r.needs.includes('ruhe') ? 8 : 0);
      say(r, 'early', null, true);
      Snd.sfx('early');
    }
    r.stress = clamp(r.stress, 0, 100);
    S.panelKey = '';
  }

  function freeWorkers(kind) {
    const busy = S.runs.filter((r) => r.state === 'platform' && r.work && r.work.kind === kind).length;
    return (kind === 'wartung' ? S.mechanics : S.washers) - busy;
  }
  function showWork(r, icon) {
    if (!r.el) return;
    r.el.querySelectorAll('.work').forEach((x) => x.remove());
    r.el.querySelector('.body').appendChild(mk('div', 'work', icon));
    S.panelKey = '';
  }
  function finishWork(r) {
    const kind = r.work.kind;
    r.work = null;
    if (r.el) r.el.querySelectorAll('.work').forEach((x) => x.remove());
    fulfill(r, kind);
    Snd.sfx(kind === 'wartung' ? 'fixed' : 'sparkle');
    if (kind === 'wasch' && r.el) { r.el.classList.remove('hop'); void r.el.offsetWidth; r.el.classList.add('hop'); }
  }

  function fx(r, icon) {
    const host = r.el || r.card;
    if (!host) return;
    const f = mk('div', 'fx', icon);
    (r.el ? r.el.querySelector('.body') : host).appendChild(f);
    setTimeout(() => f.remove(), 1200);
  }

  // ---------- Passagiere ----------
  function spawnPax(r, k) {
    const row = S.tracks[k].el;
    const n = Math.min(9, 2 + Math.floor(Math.random() * 4) + (r.extra ? Math.round(r.extra.pax / 2) : 0) + Math.floor(S.stIdx / 2));
    r.paxTotal = n; r.paxBoarded = 0; r.pax = [];
    const W = row.clientWidth;
    for (let i = 0; i < n; i++) {
      const p = mk('div', 'pax');
      p.style.setProperty('--pc', pick(PAX_COLORS));
      const x = W * (0.08 + Math.random() * 0.24);
      p.style.left = x + 'px';
      row.appendChild(p);
      r.pax.push({ el: p, at: r.dwell * (0.12 + 0.6 * (i / Math.max(1, n))), done: false });
    }
    // Aussteigende laufen nach rechts weg
    const out = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < out; i++) {
      const p = mk('div', 'pax walk');
      p.style.setProperty('--pc', pick(PAX_COLORS));
      p.style.left = (W * 0.56) + 'px';
      p.style.opacity = '0';
      row.appendChild(p);
      setTimeout(() => { p.style.opacity = '1'; p.style.transition = 'left 2.6s linear, opacity 0.4s'; p.style.left = (W + 30) + 'px'; }, 1700 + i * 350);
      setTimeout(() => p.remove(), 4800 + i * 350);
    }
  }
  function boardPax(r) {
    if (!r.el || r.noBoard) return;
    const elapsed = r.dwellTotal - r.dwellLeft;
    const row = S.tracks[r.track].el;
    for (const p of r.pax) {
      if (p.done || elapsed < p.at) continue;
      p.done = true;
      r.paxBoarded++;
      const left = r.el.offsetLeft + r.el.offsetWidth * (0.15 + Math.random() * 0.7);
      p.el.classList.add('walk');
      p.el.style.left = left + 'px';
      setTimeout(() => { p.el.classList.add('in'); Snd.sfx('pip'); }, 900);
      setTimeout(() => p.el.remove(), 1400);
    }
    void row;
  }
  function missPax(r) {
    const left = r.pax.filter((p) => !p.done);
    if (!left.length) return;
    S.missed += left.length;
    S.trainMood -= left.length * 1.2;
    if (has(r.T, 'shy-late')) r.stress += 8;
    Snd.sfx('miss');
    left.forEach((p, i) => {
      p.done = true;
      p.el.classList.add('missed', 'walk');
      if (i === 0) p.el.appendChild(mk('span', 'pb', pick(['Waaarte!', 'Neeein!', 'Mein Zug!'])));
      setTimeout(() => { p.el.style.transition = 'left 2.4s linear, opacity 0.5s'; p.el.style.left = '-30px'; p.el.style.opacity = '0'; }, 1800);
      setTimeout(() => p.el.remove(), 4400);
    });
    ticker(`😩 ${left.length} ${left.length === 1 ? 'Person hat' : 'Leute haben'} ${r.T.name} verpasst.`);
  }

  // ---------- Gespräche ----------
  function checkTalks() {
    for (let k = 0; k < S.nTracks - 1; k++) {
      const a = S.tracks[k].occ, b = S.tracks[k + 1].occ;
      if (!a || !b || a.state !== 'platform' || b.state !== 'platform' || a.T.id === b.T.id) continue;
      const key = pairKey(a.T.id, b.T.id);
      if (S.t - (S.pairCD[key] ?? -99) < 7) continue;
      if (Math.random() > 0.5) continue;
      S.pairCD[key] = S.t;
      talk(a, b, key);
    }
  }

  function talk(a, b, key) {
    const A = a.T, B = b.T;
    let first = a, second = b, kind = 'neutral', lines = null;
    const swap = () => { first = b; second = a; };
    const rel = store.friends[key] || 0;
    if (A.love === B.id || B.love === A.id) { kind = 'love'; if (B.love === A.id) swap(); }
    else if (A.rival === B.id || B.rival === A.id) kind = 'rival';
    else if (has(A, 'care') && (b.stress > 35 || b.needs.length)) kind = 'care';
    else if (has(B, 'care') && (a.stress > 35 || a.needs.length)) { kind = 'care'; swap(); }
    else if (has(A, 'share') && b.needs.includes('snack')) kind = 'share';
    else if (has(B, 'share') && a.needs.includes('snack')) { kind = 'share'; swap(); }
    else if (has(A, 'chatty') || has(B, 'chatty')) {
      if (has(B, 'chatty') && !has(A, 'chatty')) swap();
      const o = second.T;
      kind = (has(o, 'shy') || has(o, 'grumpy') || has(o, 'proud')) ? 'chattyBad' : 'chatty';
    } else if (has(A, 'old') || has(B, 'old')) { kind = 'old'; if (has(B, 'old')) swap(); }
    else if (has(A, 'charm') || has(B, 'charm')) { kind = 'charm'; if (has(B, 'charm')) swap(); }
    else if (rel >= 3) kind = 'friend';
    if (D.PAIR_TALK[key]) {
      lines = pick(D.PAIR_TALK[key]);
      // Reihenfolge der Paar-Dialoge: alphabetisch erster Zug spricht zuerst
      const firstId = key.split('+')[0];
      if (first.T.id !== firstId) swap();
      if (kind === 'neutral') kind = 'friend';
    } else if (kind === 'neutral' && Math.random() < 0.5) {
      lines = pick(S.st.talk);
    } else {
      lines = pick(D.GENERIC_TALK[kind] || D.GENERIC_TALK.neutral);
    }
    const l2 = lines[1].replace('{dest}', second.dest);
    say(first, null, null, true, lines[0].replace('{dest}', first.dest));
    Snd.sfx(kind === 'love' ? 'love' : kind === 'rival' || kind === 'chattyBad' ? 'grump' : 'chat');
    setTimeout(() => { if (second.state === 'platform') { say(second, null, null, true, l2); Snd.sfx('toot'); } }, 1700);

    // Wirkung
    const both = (d) => { a.stress = clamp(a.stress + d, 0, 100); b.stress = clamp(b.stress + d, 0, 100); };
    const calmChat = (r) => { if (r.needs.includes('plaudern')) fulfill(r, 'plaudern', true); };
    let friendly = true;
    if (kind === 'love') { both(-9); fx(first, '💕'); fx(second, '💗'); first.loveT = second.loveT = performance.now() + 4000; }
    else if (kind === 'rival') { both(3); friendly = false; fx(a, '💢'); fx(b, '💢'); }
    else if (kind === 'care') { second.stress -= 12; if (second.needs.includes('trost')) fulfill(second, 'trost', true); fx(second, '🤗'); }
    else if (kind === 'share') { fulfill(second, 'snack', true); fx(second, '🍫'); }
    else if (kind === 'chatty') { calmChat(first); calmChat(second); both(-4); }
    else if (kind === 'chattyBad') { calmChat(first); second.stress += 5; friendly = false; }
    else if (kind === 'charm') { second.stress -= 7; fx(second, '✨'); }
    else if (kind === 'old') { calmChat(second); second.stress -= 4; }
    else { both(-4); calmChat(a); calmChat(b); }
    if (friendly) {
      const before = store.friends[key] || 0;
      store.friends[key] = Math.min(10, before + 1);
      if (before < 3 && store.friends[key] >= 3) { S.newFriends.push(key); ticker(`💞 ${A.name} und ${B.name} sind jetzt Freunde!`); Snd.sfx('love'); }
      save();
    }
    S.panelKey = '';
  }

  function endDay() {
    S.ended = true;
    const cur = S;
    setTimeout(() => { if (S !== cur || !S.running) return; S.running = false; Snd.stopMusic(); Snd.sfx('end'); showEnd(); }, 2000);
  }

  // ---------- Darstellung ----------
  function trainHTML(T, opts = {}) {
    let cars = '';
    for (let i = 0; i < T.cars; i++) cars += '<div class="car"><i></i><i></i><span class="wheel l"></span><span class="wheel r"></span></div>';
    return `${cars}<div class="loco"><span class="steam"></span><span class="wheel l"></span><span class="wheel r"></span><div class="face">${faceSVG(T, opts.stress || 10)}</div></div>`;
  }

  function makeTrainEl(r, k) {
    const row = S.tracks[k].el;
    const e = mk('div', 'train');
    e.style.setProperty('--c', r.T.color);
    e.style.setProperty('--a', r.T.accent);
    e.innerHTML = `<div class="tag">${r.extra ? r.extra.icon : ''}<b>${r.T.name}</b>${r.delay ? `<em>+${r.delay}′</em>` : ''}<span class="needs"></span></div>
      <div class="body">${trainHTML(r.T, { stress: r.stress })}</div><div class="bar"><i></i></div>`;
    e.addEventListener('click', (ev) => { ev.stopPropagation(); select(r); });
    row.appendChild(e);
    r.el = e;
    r.faceB = '';
    r.needKey = '';
    const w = e.offsetWidth;
    e.style.left = `-${w + 30}px`;
    void e.offsetWidth;
    e.classList.add('moving');
    e.style.left = `calc(56% - ${w / 2}px)`;
  }

  function renderQueue() {
    const q = $('#queue');
    if (!S.queue.length) { q.innerHTML = '<div class="qempty">🚦 Einfahrt frei. Niemand wartet.</div>'; return; }
    const em = q.querySelector('.qempty');
    if (em) em.remove();
    for (const r of S.queue) {
      if (r.card) continue;
      const c = mk('div', 'qcard');
      c.style.setProperty('--c', r.T.color);
      c.innerHTML = `<div class="qface"></div><div><div class="qname">${r.extra ? r.extra.icon + ' ' : ''}${r.T.name}${r.delay ? ` <span style="color:var(--red)">+${r.delay}′</span>` : ''} <span class="needs"></span></div>
        <div class="qmeta">${r.extra ? r.extra.label : `Plan: Gleis ${S.plan[r.T.id] + 1}`} · <span class="qwait">0</span> Min.</div></div><div class="qsay"></div>`;
      c.addEventListener('click', () => select(r));
      q.appendChild(c);
      r.card = c;
      r.faceB = '';
      r.needKey = '';
    }
  }

  function say(r, key, vars, force, raw) {
    let text = raw;
    if (!text) {
      if (!key) return;
      text = pick(r.T.say[key]);
      if (!text) return;
    }
    if (vars) text = text.replace('{n}', vars.n);
    const now = performance.now();
    if (!force && now < r.bubbleAt) return;
    r.bubbleAt = now + 2800;
    if (r.card) { r.card.querySelector('.qsay').textContent = text; clearTimeout(r.qsayT); r.qsayT = setTimeout(() => { if (r.card) r.card.querySelector('.qsay').textContent = ''; }, 3000); return; }
    if (!r.el) return;
    r.el.querySelectorAll('.bubble').forEach((b) => b.remove());
    const b = mk('div', 'bubble' + (r.el.offsetLeft < 70 ? ' left' : ''));
    b.textContent = text;
    r.el.appendChild(b);
    setTimeout(() => b.classList.add('out'), 2700);
    setTimeout(() => b.remove(), 3100);
  }

  function select(r, silent) {
    if (S.selected === r) return;
    S.selected = r;
    S.panelKey = '';
    if (!silent) Snd.sfx('select');
  }

  function ticker(text) { $('#ticker').textContent = text; }

  const needIcons = (r) => r.needs.map((n) => `<i>${D.NEEDS[n].icon}</i>`).join('');

  function render() {
    $('#clock').textContent = hhmm(Math.min(S.t, DAY_LEN + 30));
    $('#clock-face').innerHTML = clockSVG(Math.min(S.t, DAY_LEN + 30));
    const m = Math.round(S.mood);
    $('#mood-bar').style.width = m + '%';
    $('#mood-val').textContent = m + '%';
    $('#res-hearts').textContent = '💛' + S.hearts;
    $('#res-hearts').classList.toggle('empty', !S.hearts);
    $('#res-snacks').textContent = '🥐' + S.snacks;
    $('#res-snacks').classList.toggle('empty', !S.snacks);
    const fw = freeWorkers('wartung');
    $('#res-tools').textContent = '🔧' + fw;
    $('#res-tools').classList.toggle('empty', fw <= 0);
    const dk = darkness();
    const st = $('#station');
    st.style.setProperty('--dark', dk.toFixed(3));
    st.querySelector('.sun').style.opacity = (1 - dk).toFixed(2);
    st.querySelector('.sun').textContent = dk > 0.5 ? '🌙' : '☀️';
    st.querySelector('.sun').style.opacity = dk > 0.5 ? '0.9' : (1 - dk).toFixed(2);

    for (const r of S.runs) {
      if ((r.state === 'platform' || r.state === 'leaving') && r.el) {
        const loveOn = r.loveT && performance.now() < r.loveT;
        const fb = Math.floor(r.stress / 12) + (loveOn ? 'L' : '');
        if (fb !== r.faceB) { r.faceB = fb; r.el.querySelector('.face').innerHTML = faceSVG(r.T, r.stress, loveOn ? 'love' : null); }
        const nk = r.needs.join(',');
        if (nk !== r.needKey) { r.needKey = nk; r.el.querySelector('.tag .needs').innerHTML = needIcons(r); }
        r.el.querySelector('.bar i').style.width = clamp(100 * (1 - r.dwellLeft / r.dwellTotal), 0, 100) + '%';
        r.el.classList.toggle('sel', S.selected === r);
      } else if (r.state === 'waiting' && r.card) {
        const fb = String(Math.floor(r.stress / 12));
        if (fb !== r.faceB) { r.faceB = fb; r.card.querySelector('.qface').innerHTML = faceSVG(r.T, r.stress); }
        const nk = r.needs.join(',');
        if (nk !== r.needKey) { r.needKey = nk; r.card.querySelector('.needs').innerHTML = needIcons(r); }
        r.card.querySelector('.qwait').textContent = Math.floor(r.waitT);
        r.card.classList.toggle('sel', S.selected === r);
        r.card.classList.toggle('urgent', r.stress >= 65);
      }
    }
    S.tracks.forEach((tk, k) => {
      const tired = tk.occ && tk.busyT > 40;
      const face = tired ? '😮‍💨' : tk.mood >= 75 ? '😊' : tk.mood >= 50 ? '🙂' : tk.mood >= 30 ? '🥺' : '😢';
      if (face !== tk.face) { tk.face = face; tk.el.querySelector('.tf').textContent = face; }
      const bar = tk.el.querySelector('.tmood i');
      bar.style.width = tk.mood + '%';
      bar.style.background = tk.mood >= 50 ? '#8fd6a8' : tk.mood >= 30 ? '#ffcf4a' : '#ff8a7a';
      const sel = S.selected;
      tk.el.classList.toggle('free', !!(sel && sel.state === 'waiting' && !tk.occ));
    });
    renderBoard();
    renderPanel();
  }

  function renderBoard() {
    const up = S.runs.filter((r) => r.state === 'sched' || r.state === 'waiting').slice(0, 10);
    const key = up.map((r) => r.id + r.state + (r.lateShown ? 'L' : '')).join('|') + Math.floor(S.t);
    if (key === S.boardKey) return;
    S.boardKey = key;
    const b = $('#board');
    if (!up.length) { b.innerHTML = '<span class="bempty">Keine weiteren Züge heute. Gleich Feierabend! 🌇</span>'; return; }
    b.innerHTML = up.map((r) => {
      const k = r.extra ? '?' : S.plan[r.T.id] + 1;
      const late = r.delay && (r.lateShown || r.state === 'waiting') ? `<span class="late">+${r.delay}′</span>` : '';
      const wait = r.state === 'waiting' ? ' waiting' : '';
      return `<span class="bchip${wait}" style="--c:${r.T.color}"><span class="dot"></span><b>${hhmm(r.plan)}</b>${late} ${r.extra ? r.extra.icon : ''}${r.T.name} → ${r.dest} <span class="gl">${r.state === 'waiting' ? 'wartet' : 'Gl. ' + k}</span></span>`;
    }).join('');
  }

  function renderPanel() {
    const r = S.selected && (S.selected.state === 'waiting' || S.selected.state === 'platform') ? S.selected : null;
    const p = $('#panel');
    const free = S.tracks.map((t) => (t.occ ? 1 : 0)).join('');
    const key = r ? [r.id, r.state, S.hearts, S.snacks, r.needs.join(','), r.more, r.chatted, r.work ? 1 : 0, r.dwellLeft >= 0.6, free, S.musicCD > 0, freeWorkers('wartung'), freeWorkers('wasch')].join('|') : 'none' + S.queue.length;
    if (key !== S.panelKey) {
      S.panelKey = key;
      if (!r) {
        p.innerHTML = S.queue.length
          ? '<p class="hint">🚦 In der <b>Einfahrt</b> wartet jemand. Tippe ihn an und dann ein freies Gleis.</p>'
          : '<p class="hint">Tippe auf einen Zug. Die Symbole über ihm zeigen, was er braucht: 💛 🥐 🔧 🫧 💬 🎵 😴</p>';
        return;
      }
      p.style.setProperty('--c', r.T.color);
      p.innerHTML = `<div class="p-top"><div class="p-face"></div>
        <div class="p-info"><div class="p-name">${r.extra ? r.extra.icon + ' ' : ''}${r.T.kind} ${r.T.name} <span>· ${r.T.pers}</span></div><div class="p-status"></div></div>
        <div class="p-stress">Stress<div class="meter"><i></i></div></div></div>
        <div class="p-actions"></div>`;
      r.panelFace = '';
      const acts = p.querySelector('.p-actions');
      const btn = (ic, label, kind, ok, needKey, title) => {
        const b = mk('button', 'act' + (needKey && r.needs.includes(needKey) ? ' need' : '') + (kind.startsWith('gl') ? ' track' : ''), `<span class="ic">${ic}</span>${label}`);
        b.type = 'button'; b.disabled = !ok; if (title) b.title = title;
        b.onclick = (ev) => { ev.stopPropagation(); if (kind.startsWith('gl')) assign(r, +kind.slice(2)); else act(r, kind); };
        acts.appendChild(b);
      };
      const onTrack = r.state === 'platform';
      btn('💛', `Trösten ${S.hearts}`, 'trost', S.hearts > 0, 'trost', 'Kostet ein Herz');
      btn('🥐', `Snack ${S.snacks}`, 'snack', S.snacks > 0, 'snack', 'Aus dem Kiosk');
      if (onTrack) {
        btn('🔧', 'Wartung', 'wartung', !r.work && r.needs.includes('wartung') && freeWorkers('wartung') > 0, 'wartung', 'Reparatur dauert ein paar Minuten');
        btn('🫧', 'Waschen', 'wasch', !r.work && freeWorkers('wasch') > 0, 'wasch', 'Waschen dauert kurz');
      }
      btn('💬', 'Plaudern', 'plaudern', !r.chatted, 'plaudern', 'Einmal pro Besuch');
      btn('🎵', S.musicCD > 0 ? 'Spieldose…' : 'Ständchen', 'musik', S.musicCD <= 0, 'musik', 'Beruhigt auch die Nachbarn');
      if (onTrack) {
        btn('😴', 'Mehr Zeit', 'more', r.more < 2, 'ruhe', '+3 Minuten am Perron');
        btn('⏩', 'Früher los', 'early', !r.work && r.dwellLeft >= 0.6, null, 'Wer noch nicht eingestiegen ist, verpasst den Zug');
      } else {
        S.tracks.forEach((t, k) => { if (!t.occ && acts.children.length < 8) btn('🛤️', `Gleis ${k + 1}`, 'gl' + k, true, null, `${D.TRACK_NAMES[k]} ${t.mood < 50 ? '(fühlt sich einsam)' : ''}`); });
      }
    }
    if (r) {
      const fb = String(Math.floor(r.stress / 12));
      if (fb !== r.panelFace) { r.panelFace = fb; p.querySelector('.p-face').innerHTML = faceSVG(r.T, r.stress); }
      const meter = p.querySelector('.meter i');
      meter.style.width = r.stress + '%';
      meter.className = r.stress >= 60 ? 'high' : r.stress >= 35 ? 'mid' : '';
      const needTxt = r.needs.length ? ' · braucht ' + r.needs.map((n) => D.NEEDS[n].icon).join('') : ' · wunschlos glücklich';
      p.querySelector('.p-status').textContent = r.state === 'waiting'
        ? `→ ${r.dest} · wartet ${Math.floor(r.waitT)} Min.${needTxt}`
        : r.work ? `→ ${r.dest} · ${r.work.kind === 'wartung' ? 'wird repariert' : 'wird gewaschen'} (${Math.ceil(r.work.left)} Min.)${needTxt}`
          : `→ ${r.dest} · Gl. ${r.track + 1} · ab in ${Math.max(0, Math.ceil(r.dwellLeft))} Min. · 🧍${r.paxBoarded}/${r.paxTotal}${needTxt}`;
    }
  }

  // ---------- Screens ----------
  const SCREENS = ['start', 'plan', 'game', 'end'];
  function show(name) {
    SCREENS.forEach((s) => ($('#screen-' + s).hidden = s !== name));
    if (name !== 'game') Snd.stopMusic();
    syncTaler();
  }
  function syncTaler() { $('#taler b').textContent = store.taler + (S && S.running ? S.earned : 0); }

  function showStart() {
    if (S) S.running = false;
    Snd.stopMusic();
    $('#daily-date').textContent = prettyDate(todayStr());
    $('#star-total').textContent = `⭐ ${totalStars()}`;
    $('#album-count').textContent = `${store.unlocked.length}/${D.TRAINS.length}`;
    const box = $('#stations');
    box.innerHTML = '';
    D.STATIONS.forEach((st, i) => {
      const open = stationOpen(st);
      const c = mk('div', 'st-card' + (open ? '' : ' locked'));
      c.innerHTML = `<div class="st-deco">${st.deco}</div><h3>${st.name}</h3>
        <p class="dim">${open ? st.tagline : `Braucht ⭐ ${st.need} (du hast ${totalStars()}).`} · ${tracksFor(st)}/${st.maxTracks} Gleise</p><div class="st-days"></div>`;
      const days = c.querySelector('.st-days');
      let nextMarked = false;
      for (let d = 0; d < 3; d++) {
        const sKey = `${st.id}-${d}`;
        const got = store.stars[sKey] || 0;
        const ok = open && (d === 0 || (store.stars[`${st.id}-${d - 1}`] || 0) > 0);
        const isNext = ok && !got && !nextMarked;
        if (isNext) nextMarked = true;
        const b = mk('button', 'st-day' + (isNext ? ' next' : ''), `Tag ${d + 1}<span class="stars">${got ? '⭐'.repeat(got) + '☆'.repeat(3 - got) : ok ? '☆☆☆' : '🔒'}</span>`);
        b.type = 'button';
        b.disabled = !ok;
        b.onclick = () => { Snd.ensure(); Snd.sfx('select'); newDay('career', i, d); };
        days.appendChild(b);
      }
      box.appendChild(c);
    });
    show('start');
  }

  // ---------- Tagesende ----------
  function showEnd() {
    const mood = Math.round(clamp(S.mood, 0, 100));
    const stars = mood >= 80 ? 3 : mood >= 65 ? 2 : mood >= 50 ? 1 : 0;
    const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    const emojis = S.results.map((r) => moodEmoji(r.happy)).join('');
    const bonus = stars * 5;
    let unlockHTML = '';
    const stationsBefore = D.STATIONS.filter(stationOpen).length;
    let nextBtn = '';
    if (S.mode === 'career') {
      const sKey = `${S.st.id}-${S.d}`;
      const prev = store.stars[sKey] || 0;
      if (stars > prev) store.stars[sKey] = stars;
      if (!prev && stars > 0) unlockHTML += unlockNext();
      const stationsAfter = D.STATIONS.filter(stationOpen).length;
      if (stationsAfter > stationsBefore) {
        const ns = D.STATIONS[stationsAfter - 1];
        unlockHTML += `<div class="unlock-card"><div class="lr-face" style="background:#fff;font-size:30px">${ns.deco}</div><div><b>Neuer Bahnhof: ${ns.name}!</b><br><span class="small">${ns.tagline}</span></div></div>`;
        unlockHTML += unlockNext();
      }
      if (stars > 0 && S.d < 2) nextBtn = `<button id="next-btn" class="big-btn" type="button">Tag ${S.d + 2} ➜</button>`;
    } else {
      const prev = store.best[todayStr()];
      if (prev == null || mood > prev) store.best[todayStr()] = mood;
    }
    store.taler += S.earned + bonus;
    save();
    if (unlockHTML) setTimeout(() => Snd.sfx('unlock'), 900);

    const byTrain = {};
    S.results.forEach((r) => { (byTrain[r.T.id] = byTrain[r.T.id] || []).push(r.happy); });
    const lines = Object.entries(byTrain).map(([id, hs]) => {
      const T = TRAIN[id];
      const avg = Math.round(hs.reduce((a, b) => a + b, 0) / hs.length);
      return `<p>${moodEmoji(avg)} <b>${T.name}</b> <span class="dim">(${avg}%)</span>: «${pick(avg >= 60 ? T.say.happy : T.say.sad)}»</p>`;
    }).join('');
    const lonely = S.tracks.filter((t) => t.mood < 50).length;
    const friends = S.newFriends.length ? `<p>💞 Neue Freundschaften: ${S.newFriends.map((k) => k.split('+').map((id) => TRAIN[id].name).join(' & ')).join(', ')}</p>` : '';
    const title = stars === 3 ? 'Ein wunderbarer Tag!' : stars === 2 ? 'Ein schöner Tag.' : stars === 1 ? 'Ein holpriger Tag.' : 'Ein schwieriger Tag. Morgen wird besser.';
    const el = $('#screen-end');
    el.innerHTML = `<h2>${title}</h2>
      <div class="end-stars">${starStr}</div>
      <p class="end-mood">Stimmung in ${S.st.name}: ${mood}%</p>
      <p class="dim small">🪙 +${S.earned + bonus} Taler · 😩 ${S.missed} verpasst · ${lonely ? `🥺 ${lonely} einsame${lonely > 1 ? '' : 's'} Gleis${lonely > 1 ? 'e' : ''}` : '😊 alle Gleise zufrieden'}</p>
      ${unlockHTML}
      <div class="end-trains">${emojis}</div>
      <div class="end-box">${lines}${friends}</div>
      <div class="end-buttons">
        ${nextBtn}
        <button id="again-btn" class="pill-btn" type="button">↻ Nochmal</button>
        <button id="share-btn" class="pill-btn" type="button">📤 Teilen</button>
        <button id="menu-btn" class="pill-btn alt" type="button">🗺️ Streckennetz</button>
      </div>
      <p id="share-msg" class="dim small"></p>`;
    if (nextBtn) $('#next-btn').onclick = () => newDay('career', S.stIdx, S.d + 1);
    $('#again-btn').onclick = () => newDay(S.mode, S.stIdx, S.d);
    $('#share-btn').onclick = () => share(mood, starStr, emojis);
    $('#menu-btn').onclick = showStart;
    show('end');
  }

  function unlockNext() {
    const id = D.UNLOCK_ORDER.find((x) => !store.unlocked.includes(x));
    if (!id) return '';
    store.unlocked.push(id);
    const T = TRAIN[id];
    return `<div class="unlock-card" style="--c:${T.color}"><div class="lr-face">${faceSVG(T, 5)}</div><div><b>Neuer Zug: ${T.kind} ${T.name}!</b><br><span class="small">${T.pers}. ${T.desc}</span></div></div>`;
  }

  function share(mood, starStr, emojis) {
    const head = S.mode === 'daily' ? `Trainle ${prettyDate(todayStr())} · ${S.st.name}` : `Trainle · ${S.st.name} Tag ${S.d + 1}`;
    const text = `${head} 🚆\nStimmung ${mood}% ${starStr}\n${emojis}\nhttps://trainle.dicele.io/`;
    const done = () => ($('#share-msg').textContent = 'In die Zwischenablage kopiert!');
    const fallback = () => {
      const ta = mk('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { $('#share-msg').textContent = text; }
      ta.remove();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  }

  // ---------- Zugbuch und Laden ----------
  function openAlbum() {
    const g = $('#album-grid');
    g.innerHTML = D.TRAINS.map((T) => {
      const ok = store.unlocked.includes(T.id);
      if (!ok) {
        const idx = D.UNLOCK_ORDER.indexOf(T.id) - D.UNLOCK_ORDER.filter((x) => store.unlocked.includes(x)).length + 1;
        return `<div class="al-card locked"><div class="lr-face">${faceSVG(T, 5)}</div><b>???</b><br>${T.kind}<br><span class="small">Kommt in ${idx} neuen Tag${idx > 1 ? 'en' : ''}.</span></div>`;
      }
      const favs = Object.entries(Object.assign({}, DEF_W, T.n)).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([n]) => D.NEEDS[n].icon).join(' ');
      const friends = Object.entries(store.friends).filter(([k, v]) => v >= 3 && k.split('+').includes(T.id)).map(([k]) => TRAIN[k.split('+').find((x) => x !== T.id)].name);
      return `<div class="al-card" style="--c:${T.color}"><div class="lr-face">${faceSVG(T, 5)}</div><b>${T.name}</b> <span class="dim">${T.kind}</span><br><i>${T.pers}</i><br>${T.desc}<br>Mag: ${favs}${friends.length ? `<br>💞 ${friends.join(', ')}` : ''}</div>`;
    }).join('');
    $('#album').showModal();
  }

  function openShop() {
    const list = $('#shop-list');
    const items = D.SHOP.map((it) => {
      const lvl = upLvl(it.id);
      const cost = it.cost[lvl];
      return { html: `<div class="si-ic">${it.icon}</div><div><b>${it.name}</b> <span class="lvl dim">Stufe ${lvl}/${it.cost.length}</span><p>${it.desc}</p></div>`, cost, buy: () => { store.up[it.id] = lvl + 1; } };
    });
    D.STATIONS.filter(stationOpen).forEach((st) => {
      const extra = store.tracks[st.id] || 0;
      const n = tracksFor(st);
      const cost = n < st.maxTracks ? 40 + extra * 35 + D.STATIONS.indexOf(st) * 10 : undefined;
      items.push({ html: `<div class="si-ic">🛤️</div><div><b>Gleis ${n + 1} in ${st.name}</b> <span class="lvl dim">${n}/${st.maxTracks}</span><p>Mehr Platz, weniger Warten. ${D.TRACK_NAMES[n] ? `Das neue Gleis heisst ${D.TRACK_NAMES[n]}.` : ''}</p></div>`, cost, buy: () => { store.tracks[st.id] = extra + 1; } });
    });
    list.innerHTML = '';
    items.forEach((it) => {
      const row = mk('div', 'shop-item', it.html);
      const b = mk('button', 'pill-btn' + (it.cost != null && store.taler >= it.cost ? ' alt' : ''), it.cost == null ? 'Fertig ✓' : `🪙 ${it.cost}`);
      b.type = 'button';
      b.disabled = it.cost == null || store.taler < it.cost;
      b.onclick = () => { store.taler -= it.cost; it.buy(); save(); Snd.sfx('coin'); syncTaler(); openShop(); if (!$('#screen-start').hidden) showStart(); };
      row.appendChild(b);
      list.appendChild(row);
    });
    if (!$('#shop').open) $('#shop').showModal();
  }

  // ---------- Steuerung ----------
  function togglePause() {
    if (!S || !S.running) return;
    S.paused = !S.paused;
    $('#pause-overlay').hidden = !S.paused;
    $('#pause-btn').textContent = S.paused ? '▶' : '❚❚';
    if (S.paused) Snd.stopMusic(); else Snd.startMusic();
  }

  function syncSoundButtons() {
    Snd.soundOn = store.sound;
    Snd.musicOn = store.music;
    $('#sound-btn').textContent = store.sound ? '🔊' : '🔈';
    $('#sound-btn').classList.toggle('off', !store.sound);
    $('#music-btn').classList.toggle('off', !store.music || !store.sound);
  }

  function initUI() {
    $('#daily-btn').onclick = () => { Snd.ensure(); Snd.sfx('select'); newDay('daily', hashStr(todayStr()) % D.STATIONS.length, 1); };
    $('#album-btn').onclick = () => { Snd.sfx('select'); openAlbum(); };
    $('#shop-btn').onclick = () => { Snd.sfx('select'); openShop(); };
    $('#start-day').onclick = () => { Snd.ensure(); startDay(); };
    $('#auto-plan').onclick = () => { autoPlan(); Snd.sfx('sparkle'); renderPlan(); };
    $('#home-btn').onclick = showStart;
    $('#pause-btn').onclick = togglePause;
    $('#speed-btn').onclick = () => {
      if (!S) return;
      S.speed = S.speed >= 3 ? 1 : S.speed + 1;
      $('#speed-btn').textContent = S.speed + '×';
      Snd.sfx('click');
    };
    $('#help-btn').onclick = () => $('#help').showModal();
    $('#help').addEventListener('close', () => { if (S && S.running && S.paused) togglePause(); });
    $('#sound-btn').onclick = () => {
      store.sound = !store.sound; save(); syncSoundButtons();
      if (!store.sound) Snd.stopMusic(); else if (S && S.running) Snd.startMusic();
    };
    $('#music-btn').onclick = () => {
      Snd.ensure();
      store.music = !store.music;
      if (store.music) store.sound = true;
      save(); syncSoundButtons();
      if (store.music && S && S.running && !S.paused) Snd.startMusic(); else Snd.stopMusic();
    };
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && S && S.running && !document.querySelector('dialog[open]')) { e.preventDefault(); togglePause(); }
    });
    if (window.ResizeObserver) new ResizeObserver(() => sizeStation()).observe($('#station'));
    syncSoundButtons();
  }

  let last = 0;
  function frame(ts) {
    const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0;
    last = ts;
    if (S && S.running) {
      if (!S.paused) update((dt * S.speed) / (SEC_PER_MIN * S.st.slow));
      render();
    }
    requestAnimationFrame(frame);
  }

  initUI();
  showStart();
  requestAnimationFrame(frame);

  // Test-Hook für die Konsole
  window.__trainle = {
    get state() { return S; }, store,
    step(minutes) { for (let i = 0; i < minutes * 4 && S && S.running && !S.ended; i++) update(0.25); if (S && S.running) render(); },
    finish() { if (S && S.ended && S.running) { S.running = false; showEnd(); } },
    act: (kind) => S && act(S.selected, kind),
  };
})();
