'use strict';
// Trainle: weiche, süsse Töne mit Web Audio (Spieldose, Glöckchen, Tschu-tschu).
window.TrainleAudio = (() => {
  const A = {
    ctx: null, master: null, sfxGain: null, musicGain: null, noise: null,
    soundOn: true, musicOn: false, timer: null, step: 0, next: 0, lastPip: 0,
  };
  const N = (n) => 440 * Math.pow(2, (n - 69) / 12);

  A.ensure = function () {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      const comp = this.ctx.createDynamicsCompressor();
      comp.connect(this.ctx.destination);
      this.master = this.ctx.createGain(); this.master.gain.value = 0.8; this.master.connect(comp);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.9; this.sfxGain.connect(this.master);
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.28; this.musicGain.connect(this.master);
      this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.4, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return true;
  };

  // weicher Ton mit Hüllkurve
  A.tone = function (f, t, dur, type = 'sine', vol = 0.1, dest, slide) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest || this.sfxGain);
    o.start(t); o.stop(t + dur + 0.05);
  };
  // Spieldosen-Klang: Grundton plus zarte Oktave
  A.box = function (f, t, vol = 0.09, dest, dur = 0.9) {
    this.tone(f, t, dur, 'sine', vol, dest);
    this.tone(f * 2, t, dur * 0.5, 'sine', vol * 0.35, dest);
    this.tone(f * 3, t, dur * 0.25, 'triangle', vol * 0.08, dest);
  };
  A.puff = function (t, vol = 0.12, freq = 1600, dur = 0.12, dest) {
    const src = this.ctx.createBufferSource(); src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.9;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(dest || this.sfxGain); src.start(t); src.stop(t + dur + 0.02);
  };

  const SFX = {
    chime(t) { [79, 76, 72].forEach((n, i) => A.box(N(n), t + i * 0.22, 0.08, null, 1.1)); },
    toot(t) { A.tone(N(74), t, 0.18, 'triangle', 0.07); A.tone(N(79), t + 0.2, 0.28, 'triangle', 0.06); },
    depart(t) { for (let i = 0; i < 4; i++) A.puff(t + i * 0.16, 0.1 - i * 0.02); A.tone(N(81), t + 0.1, 0.3, 'triangle', 0.05, null, 1.02); },
    click(t) { A.tone(N(88), t, 0.05, 'sine', 0.05); },
    select(t) { A.box(N(84), t, 0.05, null, 0.3); },
    yay(t) { [72, 76, 79, 84].forEach((n, i) => A.box(N(n), t + i * 0.07, 0.07, null, 0.6)); },
    comfort(t) { [76, 79, 83, 88].forEach((n, i) => A.box(N(n), t + i * 0.1, 0.06, null, 1)); },
    munch(t) { for (let i = 0; i < 3; i++) A.puff(t + i * 0.13, 0.12, 500 + i * 80, 0.07); A.box(N(84), t + 0.45, 0.05, null, 0.4); },
    wrench(t) { [0, 0.18, 0.36].forEach((d, i) => { A.tone(2400 - i * 200, t + d, 0.09, 'triangle', 0.04); A.puff(t + d, 0.05, 4000, 0.04); }); },
    fixed(t) { A.tone(N(72), t, 0.15, 'triangle', 0.05); A.box(N(84), t + 0.15, 0.08, null, 0.7); },
    bubbles(t) { for (let i = 0; i < 6; i++) A.tone(500 + Math.random() * 600, t + i * 0.07, 0.12, 'sine', 0.04, null, 1.8); },
    chat(t) { for (let i = 0; i < 5; i++) A.tone(N(76 + Math.floor(Math.random() * 8)), t + i * 0.06, 0.05, 'square', 0.018); },
    lullaby(t) { [72, 76, 79, 76, 77, 74, 72].forEach((n, i) => A.box(N(n + 12), t + i * 0.24, 0.07, null, 1.2)); },
    more(t) { A.box(N(67), t, 0.06, null, 0.6); A.box(N(64), t + 0.2, 0.05, null, 0.8); },
    early(t) { A.tone(N(72), t, 0.15, 'triangle', 0.05, null, 1.5); },
    miss(t) { A.tone(N(76), t, 0.5, 'triangle', 0.05, null, 0.6); },
    pip(t) { A.tone(N(96 + Math.floor(Math.random() * 3)), t, 0.04, 'sine', 0.025); },
    grump(t) { A.tone(N(45), t, 0.3, 'triangle', 0.07, null, 0.9); },
    sparkle(t) { [91, 95, 98].forEach((n, i) => A.tone(N(n), t + i * 0.05, 0.25, 'sine', 0.03)); },
    sad(t) { A.box(N(71), t, 0.05, null, 0.6); A.box(N(67), t + 0.25, 0.05, null, 0.8); },
    heart(t) { A.box(N(84), t, 0.05, null, 0.5); A.box(N(88), t + 0.12, 0.05, null, 0.6); },
    love(t) { [79, 83, 86, 91].forEach((n, i) => A.box(N(n), t + i * 0.12, 0.05, null, 0.9)); },
    unlock(t) { [72, 76, 79, 84, 79, 84, 88].forEach((n, i) => A.box(N(n), t + i * 0.13, 0.08, null, 1)); },
    coin(t) { A.box(N(88), t, 0.05, null, 0.3); A.box(N(93), t + 0.07, 0.05, null, 0.5); },
    end(t) { [72, 76, 79, 84, 88, 84, 91].forEach((n, i) => A.box(N(n), t + i * 0.16, 0.08, null, 1.3)); },
  };

  A.sfx = function (name) {
    if (!this.soundOn || !this.ensure() || !SFX[name]) return;
    if (name === 'pip') { const now = performance.now(); if (now - this.lastPip < 90) return; this.lastPip = now; }
    SFX[name](this.ctx.currentTime + 0.01);
  };

  // gemütliche Musik: Spieldosen-Melodie, weicher Bass, leises Tschu-tschu
  const MEL = [
    72, 0, 76, 0, 79, 0, 76, 0, 77, 0, 74, 0, 72, 0, 0, 0,
    74, 0, 77, 0, 81, 0, 79, 0, 76, 0, 72, 0, 74, 0, 0, 0,
    72, 0, 76, 0, 79, 0, 84, 0, 83, 0, 81, 0, 79, 0, 0, 0,
    77, 0, 76, 0, 74, 0, 71, 0, 72, 0, 0, 0, 0, 0, 0, 0,
  ];
  const ROOTS = [48, 53, 50, 55, 48, 53, 55, 48];
  A.startMusic = function () {
    if (!this.soundOn || !this.musicOn || !this.ensure() || this.timer) return;
    const STEP = 60 / 92 / 2; // Achtel bei 92 bpm
    this.step = 0; this.next = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => {
      while (this.next < this.ctx.currentTime + 0.2) {
        const s = this.step, t = this.next, m = MEL[s % MEL.length];
        if (m) this.box(N(m), t, 0.07, this.musicGain, 1.1);
        if (s % 8 === 0) { const r = ROOTS[Math.floor(s / 8) % ROOTS.length]; this.tone(N(r), t, 1.6, 'sine', 0.12, this.musicGain); this.tone(N(r + 7), t + STEP * 2, 1, 'sine', 0.05, this.musicGain); }
        if (s % 2 === 0) this.puff(t, s % 4 === 0 ? 0.035 : 0.018, 1800, 0.08, this.musicGain);
        this.next += STEP; this.step++;
      }
    }, 40);
  };
  A.stopMusic = function () { clearInterval(this.timer); this.timer = null; };

  return A;
})();
