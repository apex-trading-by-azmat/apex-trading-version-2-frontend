"use client";

/**
 * Sound synthesis engine using the Web Audio API.
 * Guarantees zero latency, works offline, and requires no external MP3 downloads.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  private initContext() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Bullish (UP) Signal Alert: Crisp ascending chime (C5 -> E5 -> G5)
   */
  public playUpSignal() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.4);
      });
    } catch {
      // Audio playback silently guarded against browser autoplay blocking
    }
  }

  /**
   * Bearish (DOWN) Signal Alert: Punchy descending chime (G5 -> E5 -> C5)
   */
  public playDownSignal() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const notes = [783.99, 659.25, 523.25, 392.0]; // G5, E5, C5, G4
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.4);
      });
    } catch {
      // Silently guarded
    }
  }

  /**
   * Winning Trade Celebration Sound: Bright major arpeggio + triumphant chord
   */
  public playWin() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Arpeggio notes: C5, E5, G5, B5, C6
      const arpeggio = [523.25, 659.25, 783.99, 987.77, 1046.5];
      arpeggio.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        gain.gain.setValueAtTime(0, now + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.65);
      });

      // Shimmer chord sustained
      setTimeout(() => {
        if (!this.ctx) return;
        const cNow = this.ctx.currentTime;
        [523.25, 659.25, 1046.5].forEach((f) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(f, cNow);
          gain.gain.setValueAtTime(0.12, cNow);
          gain.gain.exponentialRampToValueAtTime(0.0001, cNow + 0.8);
          osc.connect(gain);
          gain.connect(this.ctx!.destination);
          osc.start(cNow);
          osc.stop(cNow + 0.85);
        });
      }, 350);
    } catch {
      // Silently guarded
    }
  }

  /**
   * Losing Trade Outcome Sound: Subdued descending minor tone
   */
  public playLoss() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [440.0, 392.0, 329.63]; // A4 -> G4 -> E4
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.12 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.5);
      });
    } catch {
      // Silently guarded
    }
  }

  /**
   * Pair Switch Telemetry Sound: Sleek cyber blip
   */
  public playPairSwitch() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.06);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Silently guarded
    }
  }
}

export const soundEffects = new SoundSynthesizer();

