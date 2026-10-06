/**
 * AnatomyAudio — In-Browser Web Audio Synthesizer for NexusLab 3D
 * Generates futuristic medical UI clicks, layer slider ticks, and slicing whooshes.
 * 100% client-side, zero external assets, zero latency.
 */
class AnatomyAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.turntableOsc = null;
    this.turntableGain = null;

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nexuslab:audio:muted");
      this.isMuted = saved === "true";
    }
  }

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (typeof window !== "undefined") {
      localStorage.setItem("nexuslab:audio:muted", String(this.isMuted));
    }
    if (this.isMuted && this.turntableGain) {
      this.turntableGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // Soft futuristic UI click / blip
  playClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  // Tactile slider tick when moving through layers (100% -> 75% -> 50%...)
  playSliderTick(freq = 600) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.ctx.currentTime + 0.025);

    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.025);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.03);
  }

  // Metallic cyber slice whoosh when toggling 3D slicing
  playSliceWhoosh() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  // Camera focus snap sound
  playCameraSnap() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(520, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1040, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  // Mode switcher chime
  playModeSwitch() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, this.ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  // Subtle pin hover blip
  playPinHover() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.02);

    gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.02);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.025);
  }

  // Physiological Heartbeat Sound (Dual lub-dub acoustic resonance)
  playHeartbeat(volume = 0.08) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // S1 - "Lub" (lower frequency, deeper thump)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(65, now);
    osc1.frequency.exponentialRampToValueAtTime(35, now + 0.08);
    gain1.gain.setValueAtTime(volume, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.09);

    // S2 - "Dub" (slightly higher, sharper closure ~150ms later)
    const t2 = now + 0.16;
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(82, t2);
    osc2.frequency.exponentialRampToValueAtTime(42, t2 + 0.07);
    gain2.gain.setValueAtTime(volume * 0.85, t2);
    gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.07);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(t2);
    osc2.stop(t2 + 0.08);
  }

  // Turntable ambient hum
  startTurntableHum() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    if (!this.turntableOsc) {
      this.turntableOsc = this.ctx.createOscillator();
      this.turntableGain = this.ctx.createGain();

      this.turntableOsc.type = "sine";
      this.turntableOsc.frequency.setValueAtTime(95, this.ctx.currentTime);

      this.turntableGain.gain.setValueAtTime(0.02, this.ctx.currentTime);

      this.turntableOsc.connect(this.turntableGain);
      this.turntableGain.connect(this.ctx.destination);

      this.turntableOsc.start();
    } else if (this.turntableGain) {
      this.turntableGain.gain.setValueAtTime(0.02, this.ctx.currentTime);
    }
  }

  stopTurntableHum() {
    if (this.turntableGain && this.ctx) {
      this.turntableGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }
}

export const anatomyAudio = new AnatomyAudioEngine();
export default anatomyAudio;
