'use strict';
(() => {
  const $ = (s) => document.querySelector(s);
  const mk = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };

  // ---------- Konstanten ----------
  const SEC_PER_MIN = 1.6;      // Echtzeit-Sekunden pro Spielminute bei 1x
  const DAY_LEN = 180;          // 05:00 bis 08:00
  const START_MIN = 5 * 60;
  const WAIT_AUTO = 10;          // nach so vielen Minuten teilt das Stellwerk selbst ein
  const HEART_MAX = 3, HEART_REGEN = 15;
  const TRACKS = 3;
  const STORE = 'trainle-v1';

  const PERS = {
    gestresst:  { label: 'Der Gestresste', desc: 'Immer knapp dran. Hasst Warten, liebt frühe Abfahrt.', wait: 6,   plat: -0.4, comfort: -25, more: 15,  early: -18 },
    beschaemt:  { label: 'Der Beschämte',  desc: 'Oft verspätet und schämt sich dafür. Trost wirkt doppelt.', wait: 3.5, plat: -0.8, comfort: -40, more: -8, early: 5 },
    arrogant:   { label: 'Der Arrogante',  desc: 'Will Gleis 1. Alles andere ist eine Beleidigung.', wait: 4.5, plat: -0.5, comfort: -12, more: -8,  early: -5 },
    gemuetlich: { label: 'Der Gemütliche', desc: 'Lässt sich Zeit, redet mit allen. Mag keine Hetze.', wait: 1.5, plat: -1.2, comfort: -25, more: -18, early: 15 },
    aengstlich: { label: 'Die Ängstliche', desc: 'Mag Dunkelheit und leere Perrons nicht. Nachbarn beruhigen sie.', wait: 4, plat: -0.3, comfort: -35, more: -10, early: 12 },
  };

  const LINES = [
    {
      id: 'rita', name: 'Rita', kind: 'RE', pers: 'gestresst', color: '#e4572e', accent: '#a83a1c', cars: 2,
      times: [28, 58, 88, 118, 148, 178], dwell: 4, lateP: 0.2, lateMax: 5, track: 1,
      say: {
        arrive: ['Schnell, schnell, schnell!', 'Ich bin da! Wo ist mein Gleis?!'],
        late: 'Verspätet?! Das bin nicht ICH!',
        wait: ['Ich hab KEINE Zeit dafür!', 'Jede Sekunde zählt!!', 'Tick. Tack. TICK. TACK.'],
        comfort: '…danke. Atmen. Atmen.',
        more: 'MEHR Zeit?! Neeein!',
        early: 'JA! Endlich los!',
        happy: 'Pünktlich! Ich liebe den Takt!',
        sad: 'Das war ein Desaster…',
      },
    },
    {
      id: 'saemi', name: 'Sämi', kind: 'S', pers: 'beschaemt', color: '#3b82c4', accent: '#24578a', cars: 1,
      times: [2, 32, 62, 92, 122, 152], dwell: 4, lateP: 0.55, lateMax: 8, track: 2,
      say: {
        arrive: 'Ich bin… pünktlich? Wirklich?',
        late: ['Tut mir leid, tut mir so leid…', 'Ich hab den Takt verpasst…', 'Bitte nicht hinschauen…'],
        wait: ['Alle schauen mich an…', 'Ich stör hoffentlich nicht…'],
        comfort: 'Du bist nicht böse auf mich?',
        more: 'Oh, das ist lieb von dir.',
        early: 'Sorry fürs Drängeln!',
        happy: 'Heute war ein guter Tag!',
        sad: 'Entschuldigung an alle…',
      },
    },
    {
      id: 'ivo', name: 'Ivo', kind: 'IC', pers: 'arrogant', color: '#f4f1ea', accent: '#d33a2c', cars: 3,
      times: [57, 117, 177], dwell: 6, lateP: 0.15, lateMax: 4, track: 0, wish: 0,
      say: {
        arrive: 'Gleis 1, selbstverständlich.',
        late: 'Die Verspätung ist nicht meine Schuld.',
        wrong: 'Gleis {n}?! Für MICH?',
        wait: ['Wissen Sie, wer ich bin?', 'Ich bin ein InterCity!', 'Unerhört.'],
        comfort: 'Ich brauche keinen Trost. …Aber gut.',
        more: 'Man lässt mich gebührend wirken.',
        early: 'Ein IC wartet auf niemanden.',
        happy: 'Akzeptabel.',
        sad: 'Ich werde mich beschweren.',
      },
    },
    {
      id: 'gusti', name: 'Gusti', kind: 'Güterzug', pers: 'gemuetlich', color: '#c08a4e', accent: '#7a532a', cars: 3,
      times: [15, 75, 135], dwell: 12, lateP: 0.3, lateMax: 6, track: 0,
      say: {
        arrive: ['Moooorgen zusammen!', 'Grüessech mitenand!'],
        late: 'Ich bin nicht spät, die anderen sind früh.',
        wait: ['Kein Stress, kein Stress.', 'Schöne Aussicht hier.'],
        chat: ['Hast du schon gehört…?', 'Früher war mehr Kohle.', 'Ein Käffeli wär jetzt schön.'],
        comfort: 'Du bist ein Schatz.',
        more: 'Oh, noch ein Käffeli!',
        early: 'Jetzt schon? Hmpf.',
        happy: 'Schöner Tag zum Rollen.',
        sad: 'Etwas hektisch heute…',
      },
    },
    {
      id: 'nora', name: 'Nora', kind: 'Nachtzug', pers: 'aengstlich', color: '#5a5fae', accent: '#33377a', cars: 2,
      times: [10, 50, 90], dwell: 8, lateP: 0.2, lateMax: 5, track: 1,
      say: {
        arrive: 'Ist… ist hier jemand?',
        late: 'Ich hab mich im Dunkeln verfahren…',
        dark: ['Es ist so dunkel…', 'Was war das für ein Geräusch?'],
        alone: ['Ganz allein am Perron…', 'Hallo? Jemand da?'],
        wait: ['Bitte lass mich rein…', 'Mir ist kalt hier draussen.'],
        comfort: 'Bleibst du kurz bei mir?',
        more: 'Danke… noch nicht raus.',
        early: 'Oh nein, schon los?',
        happy: 'Das war gar nicht so schlimm!',
        sad: 'Ich will nach Hause…',
      },
    },
  ];
  const LINE_BY_ID = Object.fromEntries(LINES.map((l) => [l.id, l]));

  const GENERIC = {
    blocked: ['Gleis {n} ist besetzt?!', 'Mein Gleis {n} ist voll!'],
    extra: ['Extrazug! Wohin mit mir?', 'Ich steh in keinem Fahrplan…'],
    auto: 'Das Stellwerk hat mich eingeteilt.',
    friend: ['Wir zwei! ♥', 'Schön, dich zu sehen! ♥'],
  };

  // ---------- Hilfsfunktionen ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = (v) => (Array.isArray(v) ? v[Math.floor(Math.random() * v.length)] : v);
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
  function prettyDate(s) { const [y, m, d] = s.split('-'); return `${+d}.${+m}.${y}`; }

  // ---------- Speicher ----------
  function load() {
    try { return Object.assign({ best: {}, sound: true, music: false, friends: [] }, JSON.parse(localStorage.getItem(STORE) || '{}')); }
    catch (e) { return { best: {}, sound: true, music: false, friends: [] }; }
  }
  const store = load();
  function save() { try { localStorage.setItem(STORE, JSON.stringify(store)); } catch (e) { /* egal */ } }

  // ---------- Gesichter ----------
  function faceSVG(pers, stress) {
    const b = stress < 30 ? 0 : stress < 60 ? 1 : stress < 85 ? 2 : 3;
    const ink = '#2b2440';
    let s = '<svg viewBox="0 0 60 60" aria-hidden="true">';
    // Augenbrauen
    if (b >= 2 || pers === 'aengstlich') s += `<path d="M14 18 l9 3 M46 18 l-9 3" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`;
    else if (pers === 'arrogant') s += `<path d="M14 19 l9 -2 M37 17 l9 2" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`;
    // Augen
    if (b === 3) {
      s += `<path d="M14 28 q5 -5 10 0 M36 28 q5 -5 10 0" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      s += '<path d="M17 31 q-3 6 0 8 q3 -2 0 -8z M43 31 q-3 6 0 8 q3 -2 0 -8z" fill="#7cc8ff"/>';
    } else {
      const ry = pers === 'aengstlich' ? 6 : 5;
      s += `<ellipse cx="19" cy="28" rx="4.5" ry="${ry}" fill="${ink}"/><ellipse cx="41" cy="28" rx="4.5" ry="${ry}" fill="${ink}"/>`;
      s += '<circle cx="20.5" cy="26" r="1.6" fill="#fff"/><circle cx="42.5" cy="26" r="1.6" fill="#fff"/>';
      if (pers === 'arrogant' && b < 2) s += '<rect x="13" y="21" width="12" height="5" fill="var(--c, #f4f1ea)"/><rect x="35" y="21" width="12" height="5" fill="var(--c, #f4f1ea)"/>';
      if (pers === 'gemuetlich' && b === 0) s += '<rect x="13" y="22" width="12" height="4" fill="var(--c, #c08a4e)"/><rect x="35" y="22" width="12" height="4" fill="var(--c, #c08a4e)"/>';
    }
    // Wangen
    if (pers === 'beschaemt' || b === 0) s += `<ellipse cx="11" cy="38" rx="5" ry="3" fill="#ff8a5b" opacity="${pers === 'beschaemt' ? 0.9 : 0.55}"/><ellipse cx="49" cy="38" rx="5" ry="3" fill="#ff8a5b" opacity="${pers === 'beschaemt' ? 0.9 : 0.55}"/>`;
    // Mund
    const mouth = [
      'M21 40 q9 9 18 0',
      'M22 42 h16',
      'M20 44 q5 -5 10 0 q5 5 10 0',
      'M20 46 q10 -9 20 0',
    ][b];
    s += `<path d="${mouth}" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    // Schweiss
    if (b >= 2) s += `<path d="M52 10 q-5 8 0 11 q5 -3 0 -11z" fill="#9fd8ff" stroke="${ink}" stroke-width="1.5"/>`;
    return s + '</svg>';
  }
  const moodEmoji = (h) => (h >= 80 ? '😊' : h >= 60 ? '🙂' : h >= 40 ? '😐' : h >= 20 ? '😰' : '😭');

  // ---------- Ton und Musik ----------
  const Snd = {
    ctx: null, master: null, musicGain: null, noise: null, timer: null, step: 0, next: 0,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        this.ctx = new AC();
        this.master = this.ctx.createGain(); this.master.gain.value = 0.7; this.master.connect(this.ctx.destination);
        this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.35; this.musicGain.connect(this.master);
        this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.2, this.ctx.sampleRate);
        const d = this.noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    },
    tone(f, t, dur, type, vol, dest) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.012, t + dur * 0.5);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(dest || this.master); o.start(t); o.stop(t + dur + 0.02);
    },
    sfx(name) {
      if (!store.sound || !this.ensure()) return;
      const t = this.ctx.currentTime + 0.01;
      if (name === 'chime') [784, 659, 523].forEach((f, i) => this.tone(f, t + i * 0.2, 0.5, 'triangle', 0.12));
      if (name === 'whistle') { this.tone(988, t, 0.22, 'triangle', 0.09); this.tone(1319, t + 0.2, 0.3, 'triangle', 0.07); }
      if (name === 'comfort') [523, 659, 784, 1047].forEach((f, i) => this.tone(f, t + i * 0.07, 0.35, 'sine', 0.1));
      if (name === 'click') this.tone(880, t, 0.06, 'square', 0.05);
      if (name === 'grump') this.tone(150, t, 0.3, 'sawtooth', 0.06);
      if (name === 'end') [523, 659, 784, 659, 1047].forEach((f, i) => this.tone(f, t + i * 0.14, 0.4, 'square', 0.06));
    },
    // quirky Bahnhofs-Jingle (gleich wie assets/jingle.html)
    mel: [72,0,76,0,79,0,78,79,81,0,79,0,76,0,0,0,74,0,77,0,81,80,81,0,79,0,76,0,72,0,0,0,
          72,0,76,0,79,0,78,79,84,0,83,0,81,79,78,0,77,0,76,0,74,0,71,0,72,0,0,0,0,0,0,0],
    roots: [48, 48, 53, 55, 48, 48, 50, 55],
    startMusic() {
      if (!store.sound || !this.ensure() || this.timer) return;
      const STEP = 60 / 132 / 4, N = (n) => 440 * Math.pow(2, (n - 69) / 12);
      this.step = 0; this.next = this.ctx.currentTime + 0.05;
      this.timer = setInterval(() => {
        while (this.next < this.ctx.currentTime + 0.12) {
          const s = this.step, m = this.mel[s % 64];
          if (m) this.tone(N(m), this.next, STEP * 1.6, 'square', 0.05, this.musicGain);
          const r = this.roots[Math.floor(s / 8) % 8];
          if (s % 4 === 0) this.tone(N(r), this.next, STEP * 1.2, 'triangle', 0.18, this.musicGain);
          if (s % 4 === 2) this.tone(N(r + 7), this.next, STEP * 1.2, 'triangle', 0.18, this.musicGain);
          const src = this.ctx.createBufferSource(); src.buffer = this.noise;
          const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800;
          const g = this.ctx.createGain(); const v = s % 4 === 0 ? 0.2 : s % 2 === 0 ? 0.1 : 0.04;
          g.gain.setValueAtTime(v, this.next); g.gain.exponentialRampToValueAtTime(0.0001, this.next + 0.09);
          src.connect(f).connect(g).connect(this.musicGain); src.start(this.next); src.stop(this.next + 0.1);
          this.next += STEP; this.step++;
        }
      }, 25);
    },
    stopMusic() { clearInterval(this.timer); this.timer = null; },
  };

  // ---------- Spielzustand ----------
  let S = null;

  function newGame(mode) {
    const date = todayStr();
    const seed = mode === 'daily' ? hashStr('trainle-' + date) : (Math.random() * 2 ** 32) >>> 0;
    const rng = mulberry32(seed);
    const plan = {};
    LINES.forEach((l) => (plan[l.id] = l.track));
    S = {
      mode, date, seed, plan, t: 0, speed: 1, paused: false, strict: false,
      mood: 70, hearts: HEART_MAX, heartT: 0, tracks: new Array(TRACKS).fill(null),
      trains: buildDay(rng), queue: [], selected: null, results: [], friends: new Set(), newFriends: [],
      running: false, ended: false, panelKey: '',
    };
    showPlan();
  }

  function buildDay(rng) {
    const trains = [];
    let id = 0;
    const make = (L, plan, delay, extra) => ({
      id: id++, L, plan, delay, arr: plan + delay, dwell: L.dwell, extra,
      state: 'sched', stress: (L.pers === 'aengstlich' ? 38 : 26) + Math.floor(rng() * 14), track: -1,
      waitT: 0, dwellLeft: 0, dwellTotal: L.dwell, more: 0, el: null, card: null, faceB: -1, bubbleAt: 0, happy: null,
    });
    for (const L of LINES) {
      for (const p of L.times) {
        const delay = rng() < L.lateP ? 1 + Math.floor(rng() * L.lateMax) : 0;
        trains.push(make(L, p, delay, false));
      }
    }
    for (let i = 0; i < 2; i++) {
      const L = LINES[Math.floor(rng() * LINES.length)];
      trains.push(make(L, 20 + Math.floor(rng() * 140), 0, true));
    }
    return trains.sort((a, b) => a.arr - b.arr);
  }

  // ---------- Screens ----------
  const screens = ['start', 'plan', 'game', 'end'];
  function show(name) {
    screens.forEach((s) => ($('#screen-' + s).hidden = s !== name));
    window.scrollTo(0, 0);
  }

  function showStart() {
    if (S) { S.running = false; }
    const d = todayStr();
    $('#daily-date').textContent = prettyDate(d);
    const best = store.best[d];
    $('#daily-best').textContent = best != null ? `Deine beste Tagesfahrt heute: ${best}% Stimmung` : 'Die Tagesfahrt ist für alle gleich. Wer schafft die beste Stimmung?';
    $('#friends-note').textContent = store.friends.length ? `Freundschaften bisher: ${store.friends.map(fmtPair).join(', ')}` : '';
    show('start');
  }
  const fmtPair = (k) => k.split('+').map((id) => LINE_BY_ID[id].name).join(' ♥ ');

  // ---------- Planung ----------
  function showPlan() {
    $('#plan-title').textContent = S.mode === 'daily' ? `· Tagesfahrt ${prettyDate(S.date)}` : '· Freie Fahrt';
    $('#strict').checked = S.strict;
    renderPlan();
    show('plan');
  }

  function renderPlan() {
    const box = $('#plan-lines');
    box.innerHTML = '';
    for (const L of LINES) {
      const P = PERS[L.pers];
      const card = mk('div', 'line-card');
      card.style.setProperty('--c', L.color);
      const times = L.times.map(hhmm).join(' · ');
      card.innerHTML = `
        <div class="lc-face" style="background:${L.color}">${faceSVG(L.pers, 10)}</div>
        <div><h4>${L.name} <span class="dim">· ${L.kind} · ${P.label}</span></h4>
        <p>${P.desc}</p><p class="dim">${times} · ${L.dwell} Min. Halt</p></div>
        <div class="track-pick"></div>`;
      const pickBox = card.querySelector('.track-pick');
      for (let k = 0; k < TRACKS; k++) {
        const b = mk('button', S.plan[L.id] === k ? 'on' : '', String(k + 1));
        b.type = 'button';
        b.title = `Gleis ${k + 1}`;
        b.onclick = () => { S.plan[L.id] = k; Snd.sfx('click'); renderPlan(); };
        pickBox.appendChild(b);
      }
      box.appendChild(card);
    }
    renderTimeline();
  }

  function planConflicts() {
    const per = Array.from({ length: TRACKS }, () => []);
    for (const L of LINES) for (const p of L.times) per[S.plan[L.id]].push({ L, a: p, b: p + L.dwell, bad: false });
    let n = 0;
    for (const list of per) {
      list.sort((x, y) => x.a - y.a);
      for (let i = 1; i < list.length; i++) {
        if (list[i].a < list[i - 1].b) { list[i].bad = list[i - 1].bad = true; n++; }
      }
    }
    return { per, n };
  }

  function renderTimeline() {
    const { per, n } = planConflicts();
    const x = (m) => 52 + m * 3.05;
    let s = '';
    for (let h = 0; h <= 3; h++) {
      s += `<line x1="${x(h * 60)}" y1="8" x2="${x(h * 60)}" y2="132" stroke="#d8cdb8" stroke-width="2"/>`;
      s += `<text x="${x(h * 60)}" y="146" font-size="12" text-anchor="middle" fill="#6d6680">0${5 + h}:00</text>`;
    }
    for (let k = 0; k < TRACKS; k++) {
      const y = 12 + k * 40;
      s += `<text x="6" y="${y + 20}" font-size="13" font-weight="700" fill="#2b2440">Gl. ${k + 1}</text>`;
      s += `<rect x="${x(0)}" y="${y}" width="${x(190) - x(0)}" height="30" rx="6" fill="#f6efe2"/>`;
      for (const it of per[k]) {
        const w = Math.max(5, (it.b - it.a) * 3.05);
        s += `<rect x="${x(it.a)}" y="${y + 3}" width="${w}" height="24" rx="5" fill="${it.L.color}" stroke="${it.bad ? '#e4572e' : '#2b2440'}" stroke-width="${it.bad ? 3.5 : 1.5}"/>`;
        if (w > 14) s += `<text x="${x(it.a) + w / 2}" y="${y + 20}" font-size="11" font-weight="700" text-anchor="middle" fill="${it.L.id === 'ivo' ? '#2b2440' : '#fff'}">${it.L.name[0]}</text>`;
      }
    }
    $('#timeline').innerHTML = s;
    const msgs = [];
    msgs.push(n ? `<span class="bad">⚠ ${n} Überschneidung${n > 1 ? 'en' : ''}: dort muss jemand warten.</span>` : '<span class="ok">✓ Keine Überschneidungen im Plan.</span>');
    if (S.plan.ivo !== 0) msgs.push(`<span class="bad">Ivo auf Gleis ${S.plan.ivo + 1}? Er wird beleidigt sein.</span>`);
    msgs.push('<span class="dim">Dazu kommen Verspätungen und zwei Extrazüge ohne Gleis.</span>');
    $('#plan-warn').innerHTML = msgs.join('<br>');
  }

  // ---------- Tag starten ----------
  function startDay() {
    S.strict = $('#strict').checked;
    const st = $('#station');
    st.innerHTML = '<div class="stars"></div>';
    for (let k = 0; k < TRACKS; k++) {
      const row = mk('div', 'row', `<span class="gleis${k === 0 ? ' wish' : ''}" title="${k === 0 ? 'Ivos Lieblingsgleis' : ''}">Gleis ${k + 1}</span><div class="rail"></div>`);
      row.dataset.track = k;
      row.addEventListener('click', () => {
        const tr = S.selected;
        if (tr && tr.state === 'waiting' && !S.tracks[k]) assign(tr, k);
      });
      st.appendChild(row);
    }
    $('#queue').innerHTML = '<p class="dim small empty">Niemand wartet.</p>';
    $('#pause-btn').disabled = S.strict;
    S.paused = false;
    $('#pause-overlay').hidden = true;
    $('#speed-btn').textContent = S.speed + '×';
    ticker(S.strict ? 'Strenger Takt heute. Kein Pausieren, gute Fahrt!' : 'Guten Morgen, Leitstelle! Der erste Zug kommt gleich.');
    S.running = true;
    S.panelKey = '';
    show('game');
    if (store.music) Snd.startMusic();
  }

  // ---------- Simulation ----------
  const darkness = () => clamp(1 - (S.t - 40) / 60, 0, 1);
  const neighbors = (k) => (k > 0 && S.tracks[k - 1] ? 1 : 0) + (k < TRACKS - 1 && S.tracks[k + 1] ? 1 : 0);

  function update(dm) {
    S.t += dm;
    if (S.hearts < HEART_MAX) {
      S.heartT += dm;
      if (S.heartT >= HEART_REGEN) { S.heartT = 0; S.hearts++; ticker('💛 Ein neues Herz ist bereit.'); }
    }
    const dark = darkness();
    const mult = S.strict ? 1.6 : 1;
    for (const tr of S.trains) {
      if (tr.state === 'sched') { if (S.t >= tr.arr) arrive(tr); continue; }
      const P = PERS[tr.L.pers];
      if (tr.state === 'waiting') {
        tr.waitT += dm;
        let r = P.wait;
        if (tr.L.pers === 'aengstlich') r += 2 * dark;
        tr.stress += r * dm * mult;
        if (tr.waitT >= WAIT_AUTO) autoAssign(tr);
        else if (Math.random() < 0.06 * dm) say(tr, 'wait');
      } else if (tr.state === 'platform') {
        tr.dwellLeft -= dm;
        let r = P.plat;
        if (tr.L.pers === 'arrogant' && tr.track !== 0) r = 1.5;
        if (tr.L.pers === 'aengstlich') {
          const n = neighbors(tr.track);
          r += (n ? -1.5 : 1.5) + 2 * dark;
          if (Math.random() < 0.05 * dm) say(tr, dark > 0.5 ? 'dark' : n ? null : 'alone');
        }
        if (tr.L.pers === 'gemuetlich' && Math.random() < 0.05 * dm) say(tr, 'chat');
        tr.stress += r * dm;
        if (tr.dwellLeft <= 0) depart(tr);
      }
      tr.stress = clamp(tr.stress, 0, 100);
    }
    checkFriends();
    if (S.t >= DAY_LEN && !S.ended && S.trains.every((tr) => tr.state === 'gone' || tr.state === 'leaving')) endDay();
  }

  function arrive(tr) {
    tr.state = 'waiting';
    if (tr.delay > 0) tr.stress += tr.L.pers === 'beschaemt' ? 20 + tr.delay * 3 : tr.delay * 2;
    const k = tr.extra ? -1 : S.plan[tr.L.id];
    Snd.sfx('chime');
    if (k >= 0 && !S.tracks[k]) {
      enterTrack(tr, k, tr.delay > 0 ? 'late' : 'arrive');
    } else {
      S.queue.push(tr);
      makeCard(tr);
      say(tr, tr.delay > 0 && tr.L.pers === 'beschaemt' ? 'late' : tr.extra ? 'extra' : 'blocked', { n: k + 1 });
      ticker(tr.extra ? `Extrazug! ${tr.L.kind} ${tr.L.name} braucht ein Gleis.` : `${tr.L.kind} ${tr.L.name} wartet: Gleis ${k + 1} ist besetzt.`);
    }
  }

  function enterTrack(tr, k, sayKey) {
    S.queue = S.queue.filter((x) => x !== tr);
    if (tr.card) { tr.card.remove(); tr.card = null; }
    if (!S.queue.length) $('#queue').innerHTML = '<p class="dim small empty">Niemand wartet.</p>';
    S.tracks[k] = tr;
    tr.track = k;
    tr.state = 'platform';
    tr.dwellLeft = tr.dwell;
    tr.dwellTotal = tr.dwell;
    makeTrainEl(tr, k);
    if (tr.L.pers === 'arrogant' && k !== 0) { tr.stress += 15; say(tr, 'wrong', { n: k + 1 }, true); Snd.sfx('grump'); }
    else if (sayKey) say(tr, sayKey, null, true);
    ticker(`Gleis ${k + 1}: ${tr.L.kind} ${tr.L.name} fährt ein${tr.delay ? ` (+${tr.delay} Min.)` : ''}.`);
  }

  function assign(tr, k) {
    if (tr.state !== 'waiting' || S.tracks[k]) return;
    Snd.sfx('click');
    enterTrack(tr, k, tr.extra ? 'arrive' : null);
  }

  function autoAssign(tr) {
    const planned = tr.extra ? -1 : S.plan[tr.L.id];
    let k = planned >= 0 && !S.tracks[planned] ? planned : -1;
    if (k < 0 && tr.L.wish != null && !S.tracks[tr.L.wish]) k = tr.L.wish;
    if (k < 0) k = S.tracks.findIndex((x) => !x);
    if (k < 0) return;
    enterTrack(tr, k, 'auto');
  }

  function depart(tr) {
    S.tracks[tr.track] = null;
    tr.state = 'leaving';
    tr.stress = clamp(tr.stress, 0, 100);
    const h = Math.round(100 - tr.stress);
    tr.happy = h;
    S.mood = S.mood * 0.75 + h * 0.25;
    S.results.push(tr);
    say(tr, h >= 60 ? 'happy' : 'sad', null, true);
    Snd.sfx('whistle');
    if (S.selected === tr) S.selected = null;
    const e = tr.el;
    e.classList.remove('moving', 'sel');
    e.classList.add('leaving');
    if (h >= 80) e.classList.add('happy-hop');
    e.style.left = 'calc(100% + 60px)';
    ticker(`${tr.L.name} fährt ab ${moodEmoji(h)}`);
    setTimeout(() => { e.remove(); tr.state = 'gone'; }, 1500);
  }

  function act(tr, kind) {
    const P = PERS[tr.L.pers];
    if (kind === 'comfort') {
      if (S.hearts <= 0) return;
      S.hearts--;
      tr.stress += P.comfort;
      say(tr, 'comfort', null, true);
      Snd.sfx('comfort');
      const host = tr.el || tr.card;
      if (host) { const h = mk('div', 'float-heart', '💛'); host.appendChild(h); setTimeout(() => h.remove(), 1000); }
    } else if (kind === 'more') {
      if (tr.state !== 'platform' || tr.more >= 2) return;
      tr.more++;
      tr.dwellLeft += 3;
      tr.dwellTotal += 3;
      tr.stress += P.more - (tr.L.pers === 'aengstlich' && darkness() > 0.5 ? 6 : 0);
      say(tr, 'more', null, true);
      Snd.sfx(P.more > 0 ? 'grump' : 'click');
    } else if (kind === 'early') {
      if (tr.state !== 'platform' || tr.dwellLeft < 0.6) return;
      tr.dwellLeft = 0.3;
      tr.stress += P.early;
      say(tr, 'early', null, true);
      Snd.sfx(P.early > 0 ? 'grump' : 'click');
    }
    tr.stress = clamp(tr.stress, 0, 100);
    S.panelKey = '';
  }

  function checkFriends() {
    for (let k = 0; k < TRACKS - 1; k++) {
      const a = S.tracks[k], b = S.tracks[k + 1];
      if (!a || !b || a.L.id === b.L.id || a.stress > 45 || b.stress > 45) continue;
      const key = [a.L.id, b.L.id].sort().join('+');
      if (S.friends.has(key)) continue;
      S.friends.add(key);
      say(a, 'friend', null, true); say(b, 'friend', null, true);
      a.stress -= 8; b.stress -= 8;
      if (!store.friends.includes(key)) { store.friends.push(key); S.newFriends.push(key); save(); }
      ticker(`${a.L.name} und ${b.L.name} mögen sich ♥`);
    }
  }

  function endDay() {
    S.ended = true;
    setTimeout(() => {
      S.running = false;
      Snd.sfx('end');
      showEnd();
    }, 1600);
  }

  // ---------- Darstellung ----------
  function makeTrainEl(tr, k) {
    const row = document.querySelector(`.row[data-track="${k}"]`);
    const e = mk('div', 'train');
    e.style.setProperty('--c', tr.L.color);
    e.style.setProperty('--a', tr.L.accent);
    let cars = '';
    for (let i = 0; i < tr.L.cars; i++) cars += '<div class="car"><i></i><i></i></div>';
    e.innerHTML = `<div class="tag"><b>${tr.L.kind}</b> ${tr.L.name}${tr.extra ? ' · Extra' : ''}${tr.delay ? ` <em>+${tr.delay}′</em>` : ''}</div>
      <div class="stressbar"><i></i></div>
      <div class="body">${cars}<div class="loco"></div></div>
      <div class="dwell"><i></i></div>`;
    e.addEventListener('click', (ev) => { ev.stopPropagation(); select(tr); });
    row.appendChild(e);
    tr.el = e;
    tr.faceB = -1;
    const w = e.offsetWidth;
    e.style.left = `-${w + 30}px`;
    void e.offsetWidth;
    e.classList.add('moving');
    e.style.left = `calc(55% - ${w / 2}px)`;
  }

  function makeCard(tr) {
    const q = $('#queue');
    const empty = q.querySelector('.empty');
    if (empty) empty.remove();
    const c = mk('div', 'qcard');
    c.style.setProperty('--c', tr.L.color);
    const planned = tr.extra ? 'Extrazug, kein Gleis' : `Plan: Gleis ${S.plan[tr.L.id] + 1}`;
    c.innerHTML = `<div class="qface"></div><div><div class="qname">${tr.L.kind} ${tr.L.name}${tr.delay ? ` <span style="color:var(--red)">+${tr.delay}′</span>` : ''}</div>
      <div class="qmeta">${planned} · <span class="qwait">0</span> Min.</div><div class="stressbar"><i></i></div></div><div class="qsay"></div>`;
    c.addEventListener('click', () => select(tr));
    q.appendChild(c);
    tr.card = c;
    tr.faceB = -1;
    if (!S.selected) select(tr);
  }

  function say(tr, key, vars, force) {
    if (!key) return;
    let text = pick(tr.L.say[key] || GENERIC[key]);
    if (!text) return;
    if (vars) text = text.replace('{n}', vars.n);
    const now = performance.now();
    if (!force && now < tr.bubbleAt) return;
    tr.bubbleAt = now + 2600;
    if (tr.card) {
      const s = tr.card.querySelector('.qsay');
      s.textContent = '«' + text + '»';
      return;
    }
    if (!tr.el) return;
    tr.el.querySelectorAll('.bubble').forEach((b) => b.remove());
    const b = mk('div', 'bubble');
    b.textContent = text;
    tr.el.appendChild(b);
    setTimeout(() => b.classList.add('out'), 2400);
    setTimeout(() => b.remove(), 2800);
  }

  function select(tr) {
    if (S.selected === tr) return;
    S.selected = tr;
    S.panelKey = '';
    Snd.sfx('click');
  }

  let tickerTimer = null;
  function ticker(text) {
    const t = $('#ticker');
    t.textContent = text;
    clearTimeout(tickerTimer);
  }

  function stressClass(s) { return s >= 70 ? 'high' : s >= 40 ? 'mid' : ''; }
  function updateFace(tr, host) {
    const b = Math.floor(tr.stress / 15);
    if (b === tr.faceB) return;
    tr.faceB = b;
    host.innerHTML = faceSVG(tr.L.pers, tr.stress);
  }

  function render() {
    $('#clock').textContent = hhmm(Math.min(S.t, DAY_LEN + 59));
    const m = Math.round(S.mood);
    $('#mood-bar').style.width = m + '%';
    $('#mood-val').textContent = m + '%';
    $('#hearts').textContent = '💛'.repeat(S.hearts) + '🤍'.repeat(HEART_MAX - S.hearts);
    $('#station').style.setProperty('--dark', (darkness() * 0.85).toFixed(3));

    for (const tr of S.trains) {
      if (tr.state === 'platform' || tr.state === 'leaving') {
        if (!tr.el) continue;
        const bar = tr.el.querySelector('.stressbar i');
        bar.style.width = tr.stress + '%';
        bar.className = stressClass(tr.stress);
        updateFace(tr, tr.el.querySelector('.loco'));
        const d = tr.el.querySelector('.dwell i');
        d.style.width = clamp(100 * (1 - tr.dwellLeft / tr.dwellTotal), 0, 100) + '%';
        tr.el.classList.toggle('sel', S.selected === tr);
      } else if (tr.state === 'waiting' && tr.card) {
        const bar = tr.card.querySelector('.stressbar i');
        bar.style.width = tr.stress + '%';
        bar.className = stressClass(tr.stress);
        updateFace(tr, tr.card.querySelector('.qface'));
        tr.card.querySelector('.qwait').textContent = Math.floor(tr.waitT);
        tr.card.classList.toggle('sel', S.selected === tr);
        tr.card.classList.toggle('urgent', tr.stress >= 70);
      }
    }

    const sel = S.selected;
    const waitingSel = sel && sel.state === 'waiting';
    document.querySelectorAll('.row').forEach((row) => {
      const k = +row.dataset.track;
      row.classList.toggle('free', !!(waitingSel && !S.tracks[k]));
    });
    renderPanel();
  }

  function renderPanel() {
    const tr = S.selected && (S.selected.state === 'waiting' || S.selected.state === 'platform') ? S.selected : null;
    const p = $('#panel');
    const key = tr
      ? [tr.id, tr.state, S.hearts, tr.more, tr.dwellLeft >= 0.6, S.tracks.map((x) => (x ? 1 : 0)).join('')].join('|')
      : 'none';
    if (key !== S.panelKey) {
      S.panelKey = key;
      if (!tr) {
        p.innerHTML = '<p class="hint">Tippe auf einen Zug, um ihn zu trösten oder ihm mehr Zeit zu geben. Wartende Züge in der Einfahrt brauchen ein freies Gleis.</p>';
        return;
      }
      const P = PERS[tr.L.pers];
      p.style.setProperty('--c', tr.L.color);
      p.innerHTML = `<div class="p-face"></div>
        <div class="p-info"><b>${tr.L.kind} ${tr.L.name}</b> <span class="dim">· ${P.label}${tr.extra ? ' · Extrazug' : ''}</span>
          <p class="dim">${P.desc}</p><p class="p-status"></p></div>
        <div class="p-actions"></div>`;
      tr.faceB = -1;
      const acts = p.querySelector('.p-actions');
      const btn = (label, cls, ok, fn, title) => {
        const b = mk('button', 'act ' + cls, label);
        b.type = 'button';
        b.disabled = !ok;
        if (title) b.title = title;
        b.onclick = (ev) => { ev.stopPropagation(); fn(); };
        acts.appendChild(b);
      };
      if (tr.state === 'waiting') {
        for (let k = 0; k < TRACKS; k++) btn(`Gleis ${k + 1}`, 'primary', !S.tracks[k], () => assign(tr, k), S.tracks[k] ? 'Besetzt' : 'Hierhin einfahren');
      }
      btn('💛 Trösten', '', S.hearts > 0, () => act(tr, 'comfort'), 'Kostet ein Herz');
      if (tr.state === 'platform') {
        btn('⏳ Mehr Zeit', '', tr.more < 2, () => act(tr, 'more'), '+3 Minuten am Perron (höchstens zweimal)');
        btn('🚀 Früher los', '', tr.dwellLeft >= 0.6, () => act(tr, 'early'), 'Gleich abfahren, das Gleis wird frei');
      }
    }
    if (tr) {
      updateFace(tr, p.querySelector('.p-face'));
      const st = p.querySelector('.p-status');
      const mood = tr.stress < 30 ? 'entspannt' : tr.stress < 60 ? 'etwas angespannt' : tr.stress < 85 ? 'gestresst' : 'völlig fertig';
      st.textContent = tr.state === 'waiting'
        ? `Wartet seit ${Math.floor(tr.waitT)} Min. · ${mood} (${Math.round(tr.stress)}%)`
        : `Gleis ${tr.track + 1} · Abfahrt in ${Math.max(0, Math.ceil(tr.dwellLeft))} Min. · ${mood} (${Math.round(tr.stress)}%)`;
    }
  }

  // ---------- Ende ----------
  function showEnd() {
    Snd.stopMusic();
    const mood = Math.round(S.mood);
    const stars = mood >= 85 ? 3 : mood >= 75 ? 2 : mood >= 60 ? 1 : 0;
    const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    const emojis = S.results.map((tr) => moodEmoji(tr.happy)).join('');
    let bestLine = '';
    if (S.mode === 'daily') {
      const prev = store.best[S.date];
      if (prev == null || mood > prev) { store.best[S.date] = mood; save(); bestLine = prev != null ? '<p><b>Neuer Bestwert für heute!</b></p>' : ''; }
      else bestLine = `<p class="dim">Dein Bestwert heute: ${prev}%</p>`;
    }
    const byLine = LINES.map((L) => {
      const rs = S.results.filter((tr) => tr.L === L);
      if (!rs.length) return '';
      const avg = Math.round(rs.reduce((a, tr) => a + tr.happy, 0) / rs.length);
      const P = PERS[L.pers];
      const comment = avg >= 70 ? pick(L.say.happy) : pick(L.say.sad);
      return `<p>${moodEmoji(avg)} <b>${L.name}</b> <span class="dim">(${P.label}, ${avg}%)</span>: «${comment}»</p>`;
    }).join('');
    const friends = S.friends.size ? `<p>♥ Heute befreundet: ${[...S.friends].map(fmtPair).join(', ')}</p>` : '';
    const title = stars === 3 ? 'Ein wunderbarer Tag!' : stars === 2 ? 'Ein guter Tag.' : stars === 1 ? 'Ein holpriger Tag.' : 'Ein schlechter Tag. Morgen wird besser.';
    const el = $('#screen-end');
    el.innerHTML = `<h2>${title}</h2>
      <div class="end-stars">${starStr}</div>
      <p class="end-mood">Stimmung im Bahnhof: ${mood}%</p>
      ${bestLine}
      <div class="end-trains" title="Jeder Zug in Abfahrtsreihenfolge">${emojis}</div>
      <div class="end-list">${byLine}${friends}</div>
      <div class="end-buttons">
        <button id="share-btn" class="big-btn alt" type="button">Ergebnis teilen</button>
        <button id="again-btn" class="big-btn" type="button">${S.mode === 'daily' ? 'Nochmal versuchen' : 'Neue Fahrt'}</button>
        <button id="menu-btn" class="big-btn alt" type="button">Zum Start</button>
      </div>
      <p id="share-msg" class="dim"></p>`;
    $('#share-btn').onclick = () => share(mood, starStr, emojis);
    $('#again-btn').onclick = () => newGame(S.mode);
    $('#menu-btn').onclick = showStart;
    show('end');
  }

  function share(mood, starStr, emojis) {
    const head = S.mode === 'daily' ? `Trainle ${prettyDate(S.date)}` : 'Trainle (freie Fahrt)';
    const text = `${head} 🚆\nStimmung ${mood}% ${starStr}${S.strict ? ' · Strenger Takt' : ''}\n${emojis}\nhttps://trainle.dicele.io/`;
    const done = () => ($('#share-msg').textContent = 'In die Zwischenablage kopiert!');
    const fallback = () => {
      const ta = mk('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { $('#share-msg').textContent = text; }
      ta.remove();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  }

  // ---------- Steuerung ----------
  function togglePause() {
    if (!S || !S.running || S.strict) return;
    S.paused = !S.paused;
    $('#pause-overlay').hidden = !S.paused;
    $('#pause-btn').textContent = S.paused ? '▶' : '❚❚';
  }

  function syncSoundButtons() {
    $('#sound-btn').textContent = store.sound ? '🔊' : '🔈';
    $('#sound-btn').classList.toggle('off', !store.sound);
    $('#music-btn').classList.toggle('off', !store.music || !store.sound);
  }

  function initUI() {
    $('#daily-btn').onclick = () => { Snd.ensure(); newGame('daily'); };
    $('#free-btn').onclick = () => { Snd.ensure(); newGame('free'); };
    $('#start-day').onclick = startDay;
    $('#home-btn').onclick = () => { Snd.stopMusic(); showStart(); };
    $('#pause-btn').onclick = togglePause;
    $('#speed-btn').onclick = () => {
      if (!S) return;
      S.speed = S.speed >= 3 ? 1 : S.speed + 1;
      $('#speed-btn').textContent = S.speed + '×';
    };
    $('#help-btn').onclick = () => $('#help').showModal();
    $('#sound-btn').onclick = () => {
      store.sound = !store.sound; save(); syncSoundButtons();
      if (!store.sound) Snd.stopMusic();
      else if (store.music && S && S.running) Snd.startMusic();
    };
    $('#music-btn').onclick = () => {
      store.music = !store.music; save(); syncSoundButtons();
      if (store.music && !store.sound) { store.sound = true; save(); syncSoundButtons(); }
      if (store.music && S && S.running) Snd.startMusic(); else Snd.stopMusic();
    };
    $('#strict').onchange = (e) => { S.strict = e.target.checked; };
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && S && S.running) { e.preventDefault(); togglePause(); }
    });
    $('#help-chars').innerHTML = LINES.map((L) => `<li><span class="dot" style="background:${L.color}"></span><span><b>${L.name}</b> (${L.kind}) · ${PERS[L.pers].label}: ${PERS[L.pers].desc}</span></li>`).join('');
    syncSoundButtons();
  }

  let last = 0;
  function frame(ts) {
    const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0;
    last = ts;
    if (S && S.running) {
      if (!S.paused) update((dt * S.speed) / SEC_PER_MIN);
      render();
    }
    requestAnimationFrame(frame);
  }

  initUI();
  showStart();
  requestAnimationFrame(frame);

  // für Tests in der Konsole
  window.__trainle = {
    get state() { return S; },
    step(minutes) { for (let i = 0; i < minutes * 4 && S && S.running && !S.ended; i++) update(0.25); if (S && S.running) render(); },
  };
})();
