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