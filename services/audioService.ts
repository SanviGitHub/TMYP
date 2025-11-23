
import { MOODS } from '../constants';

export class BioAudioEngine {
  private ctx: AudioContext | null = null;
  
  // Mix Buses
  private masterGain: GainNode | null = null;
  private bgGain: GainNode | null = null;      // Música de fondo (Ambient + Zen + Notes + Binaural)
  private typingGain: GainNode | null = null;  // Sonido de escritura
  private sfxGain: GainNode | null = null;     // Efectos especiales (transiciones, alertas)

  // Effects
  private delayNode: DelayNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;

  // State
  private isMuted: boolean = false; 
  private isPlaying: boolean = false;
  private isZen: boolean = false;
  private currentMoodId: string = 'neutral';
  private nextNoteTimer: ReturnType<typeof setTimeout> | null = null;

  // Default Volumes
  private volumes = {
    master: 0.5,
    bg: 0.6,
    typing: 0.3,
    sfx: 0.5
  };

  // Oscillators References
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private droneLFO: OscillatorNode | null = null;
  private spinOsc: OscillatorNode | null = null;
  private spinGain: GainNode | null = null;

  // --- BINAURAL BEATS ENGINE ---
  private binauralLeft: OscillatorNode | null = null;
  private binauralRight: OscillatorNode | null = null;
  private binauralGain: GainNode | null = null;
  private currentBinauralType: 'gamma' | 'alpha' | 'theta' | null = null;

  constructor() {
    // Initialization deferred
  }

  private init() {
    if (this.ctx) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    // --- 1. Master Output ---
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volumes.master;
    this.masterGain.connect(this.ctx.destination);

    // --- 2. Effects Setup ---
    // Reverb
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * 2.5; 
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
      }
    }
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = impulse;
    
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = 0.6; 
    this.reverbNode.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain); // Reverb wet signal goes to master

    // Delay
    this.delayNode = this.ctx.createDelay();
    this.delayNode.delayTime.value = 0.4; 
    const feedback = this.ctx.createGain();
    feedback.gain.value = 0.2; 
    this.delayNode.connect(feedback);
    feedback.connect(this.delayNode);
    // Delay wet signal goes to master (through a small attenuation)
    const delayOut = this.ctx.createGain();
    delayOut.gain.value = 0.5;
    this.delayNode.connect(delayOut);
    delayOut.connect(this.masterGain);

    // --- 3. Channel Buses (The Mixer) ---
    
    // A. Background Bus (Music, Zen, Notes, Binaural)
    // CRITICAL: This bus controls the source volume. 
    this.bgGain = this.ctx.createGain();
    this.bgGain.gain.value = this.volumes.bg;
    
    this.bgGain.connect(this.masterGain); // Dry path
    
    // Aux Sends for Background
    const bgReverbSend = this.ctx.createGain();
    bgReverbSend.gain.value = 0.5; 
    this.bgGain.connect(bgReverbSend);
    bgReverbSend.connect(this.reverbNode);

    const bgDelaySend = this.ctx.createGain();
    bgDelaySend.gain.value = 0.3; 
    this.bgGain.connect(bgDelaySend);
    bgDelaySend.connect(this.delayNode);

    // B. Typing Bus
    this.typingGain = this.ctx.createGain();
    this.typingGain.gain.value = this.volumes.typing;
    this.typingGain.connect(this.masterGain);
    const typingReverbSend = this.ctx.createGain();
    typingReverbSend.gain.value = 0.1;
    this.typingGain.connect(typingReverbSend);
    typingReverbSend.connect(this.reverbNode);

    // C. SFX Bus
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.volumes.sfx;
    this.sfxGain.connect(this.masterGain);
    const sfxReverbSend = this.ctx.createGain();
    sfxReverbSend.gain.value = 0.4;
    this.sfxGain.connect(sfxReverbSend);
    sfxReverbSend.connect(this.reverbNode);
  }

  public async start() {
    if (!this.ctx) this.init();
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }
    
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    this.isMuted = false;
    this.updateMasterGain(); 
    this.scheduleNextNote();
    
    if (this.isZen) this.startZenDrone();
    if (this.currentBinauralType) this.playBinauralBeat(this.currentBinauralType);
  }

  public stop() {
    this.isPlaying = false;
    if (this.nextNoteTimer) clearTimeout(this.nextNoteTimer);
    this.stopZenDrone();
    this.stopBinauralBeat();
  }

  // --- VOLUME CONTROLS ---

  public setVolume(channel: 'master' | 'bg' | 'typing' | 'sfx', value: number) {
    const v = Math.max(0, Math.min(1, value));
    this.volumes[channel] = v;

    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    
    switch (channel) {
      case 'master':
        if (!this.isMuted && this.masterGain) {
            this.masterGain.gain.setTargetAtTime(v, t, 0.1);
        }
        break;
      case 'bg':
        if (this.bgGain) this.bgGain.gain.setTargetAtTime(v, t, 0.1);
        break;
      case 'typing':
        if (this.typingGain) this.typingGain.gain.setTargetAtTime(v, t, 0.1);
        break;
      case 'sfx':
        if (this.sfxGain) this.sfxGain.gain.setTargetAtTime(v, t, 0.1);
        break;
    }
  }

  public getVolumes() {
    return { ...this.volumes };
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.updateMasterGain();
    if (!this.isMuted && !this.isPlaying) {
        this.start();
    }
    return this.isMuted;
  }

  private updateMasterGain() {
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const target = this.isMuted ? 0 : this.volumes.master;
      this.masterGain.gain.setTargetAtTime(target, t, 0.2);
  }

  public updateMood(moodId: string) {
    this.currentMoodId = moodId;
  }

  public setZenMode(enabled: boolean) {
      this.isZen = enabled;
      if (this.isPlaying && !this.isMuted) {
          if (enabled) {
              this.startZenDrone();
          } else {
              this.stopZenDrone();
          }
      }
  }

  // --- BINAURAL BEATS LOGIC ---
  public playBinauralBeat(type: 'gamma' | 'alpha' | 'theta') {
    if (!this.ctx || !this.bgGain) return;
    
    // Stop previous if exists
    this.stopBinauralBeat();
    this.currentBinauralType = type;

    // Frequencies (Carrier ~200Hz is comfortable)
    const carrier = 200;
    let beatFreq = 0;
    
    switch(type) {
        case 'gamma': beatFreq = 40; break; // High Focus
        case 'alpha': beatFreq = 10; break; // Relax/Zen
        case 'theta': beatFreq = 4; break;  // Deep Med
    }

    const t = this.ctx.currentTime;

    // Create Left & Right Oscillators
    this.binauralLeft = this.ctx.createOscillator();
    this.binauralRight = this.ctx.createOscillator();
    this.binauralLeft.type = 'sine';
    this.binauralRight.type = 'sine';

    this.binauralLeft.frequency.value = carrier;
    this.binauralRight.frequency.value = carrier + beatFreq;

    // Create Stereo Panners
    const pannerLeft = this.ctx.createStereoPanner();
    const pannerRight = this.ctx.createStereoPanner();
    pannerLeft.pan.value = -1; // Full Left
    pannerRight.pan.value = 1; // Full Right

    // Gain for Binaural (Subtle)
    this.binauralGain = this.ctx.createGain();
    this.binauralGain.gain.value = 0; // Start silent
    this.binauralGain.gain.linearRampToValueAtTime(0.15, t + 2.0); // Fade in

    // Routing
    this.binauralLeft.connect(pannerLeft);
    this.binauralRight.connect(pannerRight);
    
    pannerLeft.connect(this.binauralGain);
    pannerRight.connect(this.binauralGain);
    
    // Connect to Background Bus (Controlled by Music Volume)
    this.binauralGain.connect(this.bgGain);

    this.binauralLeft.start(t);
    this.binauralRight.start(t);
  }

  public stopBinauralBeat() {
    this.currentBinauralType = null;
    if (this.binauralLeft) {
        const t = this.ctx?.currentTime || 0;
        this.binauralGain?.gain.setTargetAtTime(0, t, 0.5);
        setTimeout(() => {
            this.binauralLeft?.stop();
            this.binauralRight?.stop();
            this.binauralLeft?.disconnect();
            this.binauralRight?.disconnect();
            this.binauralGain?.disconnect();
            this.binauralLeft = null;
            this.binauralRight = null;
            this.binauralGain = null;
        }, 550);
    }
  }
  
  public getCurrentBinaural() {
      return this.currentBinauralType;
  }

  // --- ZEN MODE DRONE ---
  private startZenDrone() {
      if (!this.ctx || !this.bgGain || this.droneOsc) return;

      const t = this.ctx.currentTime;
      
      this.droneOsc = this.ctx.createOscillator();
      this.droneOsc.type = 'sawtooth';
      this.droneOsc.frequency.setValueAtTime(55, t); 

      this.droneLFO = this.ctx.createOscillator();
      this.droneLFO.type = 'sine';
      this.droneLFO.frequency.value = 0.2; 

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 500; 

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 200; 
      filter.Q.value = 1;

      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0, t);
      this.droneGain.gain.linearRampToValueAtTime(0.25, t + 2.0); 

      this.droneLFO.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      this.droneOsc.connect(filter);
      filter.connect(this.droneGain);
      
      this.droneGain.connect(this.bgGain); 

      this.droneOsc.start(t);
      this.droneLFO.start(t);
  }

  private stopZenDrone() {
      if (!this.ctx || !this.droneOsc || !this.droneGain) return;
      const t = this.ctx.currentTime;
      this.droneGain.gain.setTargetAtTime(0, t, 1.0);
      setTimeout(() => {
          this.droneOsc?.stop();
          this.droneLFO?.stop();
          this.droneOsc?.disconnect();
          this.droneLFO?.disconnect();
          this.droneGain?.disconnect();
          this.droneOsc = null;
          this.droneLFO = null;
          this.droneGain = null;
      }, 1200);
  }

  // --- AMBIENT MUSIC ---
  private scheduleNextNote() {
    if (!this.isPlaying || !this.ctx) return;

    const mood = MOODS.find(m => m.id === this.currentMoodId) || MOODS[0];
    let scale = mood.scale || [220, 440];
    let bpm = mood.bpm || 60;

    if (this.isZen) {
        bpm = 240; 
        scale = [523.25, 587.33, 659.25, 739.99, 783.99, 880.00, 1046.50]; 
    }
    
    const freq = scale[Math.floor(Math.random() * scale.length)];
    const finalFreq = (Math.random() > 0.7 && !this.isZen) ? freq / 2 : freq;
    
    this.playTone(finalFreq);

    const beatDuration = (60000 / bpm); 
    const randomOffset = this.isZen ? 0 : (Math.random() - 0.5) * (beatDuration * 0.5);
    const nextTime = beatDuration + randomOffset;

    this.nextNoteTimer = setTimeout(() => this.scheduleNextNote(), nextTime);
  }

  private playTone(freq: number) {
    if (!this.ctx || !this.bgGain) return;

    const t = this.ctx.currentTime;
    
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (this.isZen) {
        osc1.type = 'sawtooth';
        osc2.type = 'square';
        osc2.detune.value = 10; 
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.08, t + 0.05); 
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3); 

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 4, t);
        filter.frequency.exponentialRampToValueAtTime(freq, t + 0.2);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);

    } else {
        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc2.detune.value = 4; 

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.1, t + 1.0); 
        gain.gain.exponentialRampToValueAtTime(0.001, t + 6.0); 

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
    }
    
    gain.connect(this.bgGain);
    
    osc1.start(t);
    osc2.start(t);
    
    const stopTime = this.isZen ? t + 0.5 : t + 7.0;
    osc1.stop(stopTime);
    osc2.stop(stopTime);

    setTimeout(() => { osc1.disconnect(); osc2.disconnect(); gain.disconnect(); }, (this.isZen ? 600 : 7500));
  }

  // --- SFX: TYPING ---
  public playTypingSound() {
    if (!this.ctx || !this.typingGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800 + Math.random() * 300, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.05, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    
    osc.connect(gain);
    gain.connect(this.typingGain);

    osc.start(t);
    osc.stop(t + 0.1);
    setTimeout(() => { osc.disconnect(); gain.disconnect(); }, 200);
  }

  // --- SFX: SPIN UP ---
  public playSpinUp() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    this.spinOsc = this.ctx.createOscillator();
    this.spinGain = this.ctx.createGain();
    this.spinOsc.type = 'sawtooth'; 
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(100, t);
    filter.frequency.exponentialRampToValueAtTime(1500, t + 2.0); 
    this.spinOsc.frequency.setValueAtTime(80, t);
    this.spinOsc.frequency.exponentialRampToValueAtTime(300, t + 2.0); 
    this.spinGain.gain.setValueAtTime(0, t);
    this.spinGain.gain.linearRampToValueAtTime(0.1, t + 1.0);
    
    this.spinOsc.connect(filter);
    filter.connect(this.spinGain);
    this.spinGain.connect(this.sfxGain);
    
    this.spinOsc.start(t);
  }

  // --- SFX: CALM DOWN ---
  public playCalmDown() {
    if (!this.ctx || !this.spinOsc || !this.spinGain) return;
    const t = this.ctx.currentTime;
    this.spinOsc.frequency.setTargetAtTime(50, t, 0.5);
    this.spinGain.gain.setTargetAtTime(0, t, 0.5);
    setTimeout(() => {
        this.spinOsc?.stop();
        this.spinOsc?.disconnect();
        this.spinGain?.disconnect();
        this.spinOsc = null;
        this.spinGain = null;
    }, 1500);
  }

  // --- SFX: EXPLOSION ---
  public playExplosion() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    
    // Noise Burst
    const bufferSize = this.ctx.sampleRate * 1.0; 
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(500, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(100, t + 1.0); 
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain); 
    noise.start(t);

    // Harmonic Ring
    const mood = MOODS.find(m => m.id === this.currentMoodId) || MOODS[0];
    const baseFreq = mood.scale[0] * 2; 
    [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.08, t + 0.1 + (i * 0.05)); 
        g.gain.exponentialRampToValueAtTime(0.001, t + 4.0);
        
        osc.connect(g);
        g.connect(this.sfxGain!);
        
        osc.start(t);
        osc.stop(t + 4.5);
        setTimeout(() => { osc.disconnect(); g.disconnect(); }, 5000);
    });
  }
}

export const audioService = new BioAudioEngine();
