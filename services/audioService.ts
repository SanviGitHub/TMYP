
import { MOODS } from '../constants';

export class BioAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private isMuted: boolean = true;
  private isPlaying: boolean = false;
  private currentMoodId: string = 'neutral';
  private nextNoteTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // AudioContext initialization is deferred until user interaction
  }

  private init() {
    if (this.ctx) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    // Master Volume
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3; 

    // Delay Effect (The "Chill" Factor)
    this.delayNode = this.ctx.createDelay();
    this.delayNode.delayTime.value = 0.4; // 400ms delay
    const feedback = this.ctx.createGain();
    feedback.gain.value = 0.3; // 30% feedback

    // Chain: Source -> Delay -> Feedback -> Delay
    this.delayNode.connect(feedback);
    feedback.connect(this.delayNode);
    
    // Chain: Source -> Master, Delay -> Master
    this.delayNode.connect(this.masterGain);
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
        // Restore volume
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(0.3, this.ctx.currentTime, 0.5);
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

  private scheduleNextNote() {
    if (!this.isPlaying || !this.ctx) return;

    const mood = MOODS.find(m => m.id === this.currentMoodId) || MOODS[0];
    const scale = mood.scale || [220, 440];
    const bpm = mood.bpm || 60;
    
    // Pick a random note from the mood's scale
    const freq = scale[Math.floor(Math.random() * scale.length)];
    
    // Play the note
    this.playTone(freq);

    // Randomize timing slightly for "human/organic" feel
    const beatDuration = (60000 / bpm); 
    const randomOffset = (Math.random() - 0.5) * (beatDuration * 0.5);
    const nextTime = beatDuration + randomOffset;

    this.nextNoteTimer = setTimeout(() => this.scheduleNextNote(), nextTime);
  }

  private playTone(freq: number) {
    if (!this.ctx || !this.masterGain || !this.delayNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Sound Design: Soft Electric Piano / Bellish
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    
    // Add a tiny bit of FM synthesis for texture (optional, keeping it simple for now)
    // Envelope (ADSR - mostly Decay)
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.05); // Attack
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.5); // Long Decay

    // Connections
    osc.connect(gain);
    gain.connect(this.masterGain); // Dry signal
    gain.connect(this.delayNode);  // Wet signal (Echo)

    osc.start(t);
    osc.stop(t + 3);

    // Garbage collection cleanup
    setTimeout(() => {
        osc.disconnect();
        gain.disconnect();
    }, 3500);
  }
}

export const audioService = new BioAudioEngine();
