// Every sound in the game is synthesized with WebAudio: no audio files, no network.
// A tiny helper builds short tones and filtered noise bursts on demand.

export class SoundBank {
  constructor() {
    this.context = null;
    this.muted = false;
    this.sizzleNodes = null;
  }

  ensure() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      this.context = new AudioContext();
    }
    if (this.context.state === 'suspended') void this.context.resume();
    return true;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopSizzle();
    return this.muted;
  }

  tone(freq, dur, type = 'sine', gain = 0.12, slideTo = 0) {
    if (this.muted || !this.ensure()) return;
    const ctx = this.context;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
    amp.gain.setValueAtTime(gain, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }

  noise(dur, gain = 0.08, filterFreq = 1200) {
    if (this.muted || !this.ensure()) return;
    const ctx = this.context;
    const length = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const amp = ctx.createGain();
    amp.gain.value = gain;
    source.connect(filter);
    filter.connect(amp);
    amp.connect(ctx.destination);
    source.start();
  }

  chop() {
    this.noise(0.09, 0.16, 2400);
    this.tone(190, 0.07, 'triangle', 0.1, 90);
  }

  pickup() {
    this.tone(520, 0.08, 'sine', 0.1, 720);
  }

  plate() {
    this.tone(660, 0.09, 'sine', 0.1);
    this.tone(880, 0.12, 'sine', 0.08);
  }

  serveGood() {
    this.tone(523, 0.1, 'sine', 0.12);
    setTimeout(() => this.tone(659, 0.1, 'sine', 0.12), 90);
    setTimeout(() => this.tone(784, 0.16, 'sine', 0.12), 180);
  }

  serveBad() {
    this.tone(220, 0.18, 'sawtooth', 0.07, 140);
  }

  expire() {
    this.tone(330, 0.2, 'square', 0.05, 220);
  }

  tick() {
    this.tone(980, 0.05, 'square', 0.04);
  }

  /** A new ticket lands on the order board. */
  ding() {
    this.tone(1046, 0.09, 'sine', 0.09);
    setTimeout(() => this.tone(1318, 0.12, 'sine', 0.09), 80);
  }

  startSizzle() {
    if (this.muted || !this.ensure() || this.sizzleNodes) return;
    const ctx = this.context;
    const length = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;
    const amp = ctx.createGain();
    amp.gain.value = 0.015;
    source.connect(filter);
    filter.connect(amp);
    amp.connect(ctx.destination);
    source.start();
    this.sizzleNodes = { source, amp };
  }

  stopSizzle() {
    if (!this.sizzleNodes) return;
    try { this.sizzleNodes.source.stop(); } catch { /* already stopped */ }
    this.sizzleNodes = null;
  }
}
