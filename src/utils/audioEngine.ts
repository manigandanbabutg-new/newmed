/**
 * Web Audio API synthesizer for Zen meditation music and alarms.
 * Procedurally generates ambient soundscapes and warm acoustic notifications
 * completely client-side. No external audio assets required.
 */

export class ZenAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentSourceNode: AudioNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  
  // Nodes for active synth drone
  private oscs: OscillatorNode[] = [];
  private droneGain: GainNode | null = null;
  private waveLfo: OscillatorNode | null = null;
  private activeMusic: 'drone' | 'waves' | 'rain' | 'none' = 'none';
  private masterVolume: number = 0.5;

  constructor() {
    // Audio context is lazily loaded upon user interaction to comply with browser safety
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(this.masterVolume, this.ctx.currentTime + 0.1);
    }
  }

  public stopMusic() {
    this.initContext();
    this.activeMusic = 'none';

    // Stop and clear drone oscillators
    this.oscs.forEach(osc => {
      try { osc.stop(); } catch (e) {}
    });
    this.oscs = [];

    if (this.waveLfo) {
      try { this.waveLfo.stop(); } catch (e) {}
      this.waveLfo = null;
    }

    if (this.droneGain) {
      try { this.droneGain.disconnect(); } catch (e) {}
      this.droneGain = null;
    }

    // Stop noise sources
    if (this.currentSourceNode) {
      try { (this.currentSourceNode as any).stop(); } catch (e) {}
      this.currentSourceNode = null;
    }
  }

  /**
   * Starts playing selected background soundscape
   */
  public playMusic(track: 'drone' | 'waves' | 'rain' | 'none') {
    this.initContext();
    this.stopMusic();

    if (track === 'none' || !this.ctx || !this.masterGain) return;
    this.activeMusic = track;

    if (track === 'drone') {
      this.playZenDrone();
    } else if (track === 'waves') {
      this.playOceanWaves();
    } else if (track === 'rain') {
      this.playRainSound();
    }
  }

  /**
   * Creates an audio buffer filled with white noise
   */
  private createNoiseBuffer(): AudioBuffer {
    const bufferSize = 2 * this.ctx!.sampleRate;
    const noiseBuffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return noiseBuffer;
  }

  /**
   * Synthesis: Tibetan/Zen Synth Drone
   * Harmonic intervals creating a meditative chord progression
   */
  private playZenDrone() {
    if (!this.ctx || !this.masterGain) return;

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.droneGain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 2.0); // Smooth fade in
    this.droneGain.connect(this.masterGain);

    // Root notes and golden harmonics: C3, G3, C4, E4
    const pitches = [130.81, 196.00, 261.63, 329.63];

    pitches.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const filter = this.ctx!.createBiquadFilter();
      const oscGain = this.ctx!.createGain();

      osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);

      // Add a slight frequency detuning for lush chorusing
      osc.detune.setValueAtTime((Math.random() - 0.5) * 15, this.ctx!.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400 + idx * 100, this.ctx!.currentTime);
      filter.Q.setValueAtTime(1.5, this.ctx!.currentTime);

      // Low frequency modulation of volume to make it breathe
      oscGain.gain.setValueAtTime(0.15, this.ctx!.currentTime);
      
      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(this.droneGain!);

      osc.start();
      this.oscs.push(osc);

      // Slow volume breathing animation
      const animateVolume = () => {
        if (!this.ctx || this.activeMusic !== 'drone') return;
        const time = this.ctx.currentTime;
        const speed = 4 + idx * 2; // Different breathing periods
        const lfoVal = 0.08 + 0.05 * Math.sin(time * (2 * Math.PI / speed));
        oscGain.gain.linearRampToValueAtTime(lfoVal, time + 0.5);
        setTimeout(animateVolume, 500);
      };
      
      animateVolume();
    });
  }

  /**
   * Synthesis: Cosmic Ocean Waves
   * Pink-filtered noise swept gently by an LFO at breathing rate
   */
  private playOceanWaves() {
    if (!this.ctx || !this.masterGain) return;

    // Create white noise source
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();
    noise.loop = true;

    // Filter to pink-ish lowpass noise
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, this.ctx.currentTime);
    filter.Q.setValueAtTime(1, this.ctx.currentTime);

    // Gain node for breathing amplitude
    const waveGain = this.ctx.createGain();
    waveGain.gain.setValueAtTime(0, this.ctx.currentTime);
    waveGain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 2.0); // Fade-in

    // Set up LFO to modulate filter frequency (creates waves crashing sound)
    this.waveLfo = this.ctx.createOscillator();
    this.waveLfo.type = 'sine';
    this.waveLfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // 8-second wave cycle

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(250, this.ctx.currentTime); // Range of frequency sweep

    this.waveLfo.connect(lfoGain);
    lfoGain.connect(filter.frequency); // Modulate the cutoff frequency

    // Also modulate the volume to mimic waves
    const waveVolLfo = this.ctx.createGain();
    waveVolLfo.gain.setValueAtTime(0.1, this.ctx.currentTime);
    
    noise.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(this.masterGain);

    noise.start();
    this.waveLfo.start();
    this.currentSourceNode = noise;

    // Animate wave volume in rhythm
    const animateWaveVolume = () => {
      if (!this.ctx || this.activeMusic !== 'waves' || !waveGain) return;
      const time = this.ctx.currentTime;
      const factor = 0.15 + 0.13 * Math.sin(time * (2 * Math.PI / 8.5)); // wave crash rhythm
      waveGain.gain.linearRampToValueAtTime(factor, time + 0.3);
      setTimeout(animateWaveVolume, 300);
    };
    animateWaveVolume();
  }

  /**
   * Synthesis: Rainfall
   * Filtered white noise with random highpass drop sounds
   */
  private playRainSound() {
    if (!this.ctx || !this.masterGain) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, this.ctx.currentTime);
    filter.Q.setValueAtTime(0.8, this.ctx.currentTime);

    const rainGain = this.ctx.createGain();
    rainGain.gain.setValueAtTime(0, this.ctx.currentTime);
    rainGain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 2.0); // Fade-in

    noise.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(this.masterGain);

    noise.start();
    this.currentSourceNode = noise;

    // Add intermittent raindrops using micro-envelopes
    const triggerRaindrop = () => {
      if (!this.ctx || this.activeMusic !== 'rain') return;
      
      const raindrop = this.ctx.createOscillator();
      const dropGain = this.ctx.createGain();
      const dropFilter = this.ctx.createBiquadFilter();

      raindrop.type = 'sine';
      // Random frequencies representing drop sizes
      const baseFreq = 1200 + Math.random() * 800;
      raindrop.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      raindrop.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.08);

      dropFilter.type = 'bandpass';
      dropFilter.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

      dropGain.gain.setValueAtTime(0, this.ctx.currentTime);
      dropGain.gain.linearRampToValueAtTime(0.015 * Math.random(), this.ctx.currentTime + 0.01);
      dropGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.09);

      raindrop.connect(dropFilter);
      dropFilter.connect(dropGain);
      dropGain.connect(this.masterGain!);

      raindrop.start();
      raindrop.stop(this.ctx.currentTime + 0.1);

      // Trigger next random droplet
      const nextDelay = 50 + Math.random() * 300;
      setTimeout(triggerRaindrop, nextDelay);
    };

    triggerRaindrop();
  }

  /**
   * Synthesis: Tibetan Singing Bowl (Resonant harmonic layers)
   */
  public triggerTibetanBowl() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const baseFreq = 180; // Grounding F pitch
    const harmonics = [1.0, 1.5, 2.0, 2.51, 3.02, 3.55]; // Harmonious overtone ratios
    const now = this.ctx.currentTime;

    const bowlGroupGain = this.ctx.createGain();
    bowlGroupGain.gain.setValueAtTime(0, now);
    bowlGroupGain.gain.linearRampToValueAtTime(0.8, now + 0.02); // Quick tap attack
    bowlGroupGain.gain.exponentialRampToValueAtTime(0.0001, now + 8.0); // Very long decay
    bowlGroupGain.connect(this.masterGain);

    harmonics.forEach((ratio, idx) => {
      const osc = this.ctx!.createOscillator();
      const oscGain = this.ctx!.createGain();
      const detuneAmount = (Math.random() - 0.5) * 4; // microtonal warmth

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * ratio, now);
      osc.detune.setValueAtTime(detuneAmount, now);

      // High overtones decay faster than lower frequencies
      const relativeVolume = 0.3 / (idx + 1);
      oscGain.gain.setValueAtTime(relativeVolume, now);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + (7.0 - idx * 0.8));

      osc.connect(oscGain);
      oscGain.connect(bowlGroupGain);
      
      osc.start(now);
      osc.stop(now + 8.5);
    });
  }

  /**
   * Synthesis: Temple Gong (Deep, metallic low frequency)
   */
  public triggerTempleGong() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const gongGain = this.ctx.createGain();
    gongGain.gain.setValueAtTime(0, now);
    gongGain.gain.linearRampToValueAtTime(0.9, now + 0.05); // Slow, heavy attack
    gongGain.gain.exponentialRampToValueAtTime(0.0001, now + 10.0); // Infinite drone resonance
    gongGain.connect(this.masterGain);

    // Ultra low root + clashing metallic overtones
    const freqs = [82.41, 110.0, 125.0, 168.0, 220.0, 310.0];

    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const oscGain = this.ctx!.createGain();

      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      // Detune slightly over time to simulate shifting metal plates
      osc.frequency.linearRampToValueAtTime(freq + (Math.random() - 0.5) * 6, now + 5);

      const amp = idx === 0 ? 0.4 : 0.25 / idx;
      oscGain.gain.setValueAtTime(amp, now);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + (9.5 - idx * 1.0));

      osc.connect(oscGain);
      oscGain.connect(gongGain);

      osc.start(now);
      osc.stop(now + 10.5);
    });
  }

  /**
   * Synthesis: Zen Bell Chime (High, sweet, positive frequency arpeggio)
   */
  public triggerChimes() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const chimeGain = this.ctx.createGain();
    chimeGain.gain.setValueAtTime(0, now);
    chimeGain.gain.linearRampToValueAtTime(0.7, now + 0.01);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 5.0);
    chimeGain.connect(this.masterGain);

    // Chime notes: E5, A5, B5, E6, A6 (Major pentatonic arpeggio)
    const pitches = [659.25, 880.00, 987.77, 1318.51, 1760.00];

    pitches.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const oscGain = this.ctx!.createGain();
      const delay = idx * 0.12; // staggered arpeggio

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      oscGain.gain.setValueAtTime(0, now);
      oscGain.gain.setValueAtTime(0.25, now + delay);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 2.5);

      osc.connect(oscGain);
      oscGain.connect(chimeGain);

      osc.start(now + delay);
      osc.stop(now + delay + 3.0);
    });
  }

  /**
   * General-purpose sound trigger based on key name
   */
  public triggerAlarm(type: 'bowl' | 'gong' | 'chime') {
    if (type === 'bowl') {
      this.triggerTibetanBowl();
    } else if (type === 'gong') {
      this.triggerTempleGong();
    } else if (type === 'chime') {
      this.triggerChimes();
    }
  }
}

// Single active reference for audio control in React components
export const audio = new ZenAudioEngine();
