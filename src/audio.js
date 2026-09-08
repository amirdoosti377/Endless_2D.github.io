export class AudioFX {
  constructor() { this.enabled = false; this.context = null; }
  toggle() {
    try { this.context ??= new (window.AudioContext || window.webkitAudioContext)(); this.context.resume().catch(() => {}); this.enabled = !this.enabled; } catch { this.enabled = false; }
    return this.enabled;
  }
  play(type) {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const frequencies = { shoot: 540, kill: 160, hurt: 75, level: 740, heal: 620 };
    if (!frequencies[type]) return;
    const ctx = this.context, o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.type = type === 'hurt' ? 'triangle' : 'sine'; o.frequency.setValueAtTime(frequencies[type], t); o.frequency.exponentialRampToValueAtTime(frequencies[type] * (type === 'level' ? 1.8 : .45), t + .11);
    g.gain.setValueAtTime(type === 'shoot' ? .022 : .055, t); g.gain.exponentialRampToValueAtTime(.001, t + .14); o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + .15); o.onended = () => { o.disconnect(); g.disconnect(); };
  }
}
