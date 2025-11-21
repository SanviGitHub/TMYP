
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface EmergencyInfo {
  number: string;
  name: string;
  desc: string;
  keywords: string[];
}

export interface EmergencyConfig {
  [key: string]: EmergencyInfo;
}

export interface APIConfig {
  url: string;
  model: string;
  key: string;
}

export interface MoodOption {
  id: string;
  label: string;
  color: string; // Hex for UI
  threeColor: string; // Hex for 3D Sphere
  emoji: string;
  systemContext: string; // Instruction for the AI
  bpm: number; // Beats per minute for audio engine
  scale: number[]; // Musical frequencies for the mood
}
