
import { MOODS } from '../constants';

export class BioAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private isMuted: boolean = true;
  private isPlaying: boolean = false;
  private currentMoodId: string = 'neutral';
  private nextNoteTimer: ReturnType<typeof setTimeout> | null = null;

  // SFX Oscillators references to stop them if needed
  private spinOsc: OscillatorNode | null = null;
  private spinGain: GainNode | null = null;

  constructor() {
    // AudioContext initialization is deferred
  }

  private init() {
    if (this.ctx) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    // Master Volume
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.4; 

    // --- EFFECTS CHAIN ---
    
    // 1. Delay (Echo)
    this.delayNode = this.ctx.createDelay();
    this.delayNode.delayTime.value = 0.4; 
    const feedback = this.ctx.createGain();
    feedback.gain.value = 0.3;
    this.delayNode.connect(feedback);
    feedback.connect(this.delayNode);

    // 2. Simple Reverb (Impulse Response simulation)
    // Creating a synthetic buffer for reverb
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * 2.0; // 2 seconds tail
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Exponential decay noise
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 4);
      }
    }
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = impulse;
    const reverbGain = this.ctx.createGain();
    reverbGain.gain.value = 0.4; // Wet mix

    // Connections
    this.delayNode.connect(this.masterGain);
    this.reverbNode.connect(reverbGain);
    reverbGain.connect(this.masterGain);
    
    this.masterGain.connect(this.ctx.destination);
  }

  public async start() {
    if (!this.ctx) this.init();
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }
    
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    this.isMuted = false;
    this.scheduleNextNote();
  }

  public stop() {
    this.isPlaying = false;
    this.isMuted = true;
    if (this.nextNoteTimer) clearTimeout(this.nextNoteTimer);
    
    // Fade out master
    if (this.masterGain && this.ctx) {
       this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
    }
  }

  public toggle() {
    if (this.isMuted) {
        this.start();
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(0.4, this.ctx.currentTime, 0.5);
        }
        this.isMuted = false;
    } else {
        this.stop();
        this.isMuted = true;
    }
    return this.isMuted;
  }

  public updateMood(moodId: string) {
    this.currentMoodId = moodId;
  }

  // --- AMBIENT MUSIC GENERATOR ---

  private scheduleNextNote() {
    if (!this.isPlaying || !this.ctx) return;

    const mood = MOODS.find(m => m.id === this.currentMoodId) || MOODS[0];
    const scale = mood.scale || [220, 440];
    const bpm = mood.bpm || 60;
    
    const freq = scale[Math.floor(Math.random() * scale.length)];
    this.playTone(freq);

    const beatDuration = (60000 / bpm); 
    const randomOffset = (Math.random() - 0.5) * (beatDuration * 0.5);
    const nextTime = beatDuration + randomOffset;

    this.nextNoteTimer = setTimeout(() => this.scheduleNextNote(), nextTime);
  }

  private playTone(freq: number) {
    if (!this.ctx || !this.masterGain || !this.delayNode || !this.reverbNode) return;
    if (this.isMuted) return;

    const t = this.ctx.currentTime;
    
    // Create two oscillators for a thicker, warmer sound (Detuned)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(freq, t);
    osc2.frequency.setValueAtTime(freq, t);
    osc2.detune.value = 5; // Slight detune for warmth

    // Envelope
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.5); // Slow attack
    gain.gain.exponentialRampToValueAtTime(0.001, t + 4.0); // Long tail

    osc1.connect(gain);
    osc2.connect(gain);
    
    gain.connect(this.masterGain);
    gain.connect(this.delayNode);
    gain.connect(this.reverbNode);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 4.5);
    osc2.stop(t + 4.5);

    setTimeout(() => { osc1.disconnect(); osc2.disconnect(); gain.disconnect(); }, 5000);
  }

  // --- SFX: TYPING (Bubble/Click) ---
  public playTypingSound() {
    if (!this.ctx || this.isMuted) return;
    
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Very short sine blip, randomized pitch to sound organic
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600 + Math.random() * 200, t);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.02, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.1);
    
    setTimeout(() => { osc.disconnect(); gain.disconnect(); }, 200);
  }

  // --- SFX: SPIN UP (Turbine/Rising) ---
  public playSpinUp() {
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    this.spinOsc = this.ctx.createOscillator();
    this.spinGain = this.ctx.createGain();

    this.spinOsc.type = 'sawtooth'; // Richer harmonic content
    // Low pass filter to keep it subtle
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, t);
    filter.frequency.exponentialRampToValueAtTime(2000, t + 1.5); // Filter opens up

    this.spinOsc.frequency.setValueAtTime(100, t);
    this.spinOsc.frequency.exponentialRampToValueAtTime(400, t + 1.5); // Pitch rises

    this.spinGain.gain.setValueAtTime(0, t);
    this.spinGain.gain.linearRampToValueAtTime(0.1, t + 0.5);
    this.spinGain.gain.linearRampToValueAtTime(0.1, t + 1.0);
    // Note: We don't stop it here, we let playCalmDown take over or fade it
    
    this.spinOsc.connect(filter);
    filter.connect(this.spinGain);
    this.spinGain.connect(this.masterGain);

    this.spinOsc.start(t);
  }

  // --- SFX: CALM DOWN (Filter Sweep Down) ---
  public playCalmDown() {
    if (!this.ctx || this.isMuted || !this.spinOsc || !this.spinGain) return;

    const t = this.ctx.currentTime;
    
    // Ramp down pitch
    this.spinOsc.frequency.setTargetAtTime(50, t, 0.2);
    // Fade out volume
    this.spinGain.gain.setTargetAtTime(0, t, 0.3);

    setTimeout(() => {
        this.spinOsc?.stop();
        this.spinOsc?.disconnect();
        this.spinGain?.disconnect();
        this.spinOsc = null;
        this.spinGain = null;
    }, 1000);
  }

  // --- SFX: EXPLOSION (Ethereal Chime) ---
  public playExplosion() {
    if (!this.ctx || this.isMuted) return;
    
    const t = this.ctx.currentTime;
    
    // 1. Noise Burst (The "Pop")
    const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 sec noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 1000;
    const noiseGain = this.ctx.createGain();
    
    noiseGain.gain.setValueAtTime(0.1, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(t);

    // 2. Harmonic Chime (The "Magic")
    const mood = MOODS.find(m => m.id === this.currentMoodId) || MOODS[0];
    const rootFreq = mood.scale[0] * 2; // High octave

    [rootFreq, rootFreq * 1.5, rootFreq * 2].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.1, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, t + 3.0);
        
        osc.connect(g);
        g.connect(this.masterGain);
        if (this.reverbNode) g.connect(this.reverbNode); // Send to reverb
        
        osc.start(t);
        osc.stop(t + 3.5);
        setTimeout(() => { osc.disconnect(); g.disconnect(); }, 4000);
    });
  }
}

export const audioService = new BioAudioEngine();
