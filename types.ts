export interface Lead {
  id: string;
  username: string;
  fullName: string;
  niche: string;
  location?: string;
  bio: string;
  email?: string;
  phone?: string;
  website?: string;
  followers?: string; // Estimated
  category?: string;
  engagementScore: number; // 0-100
  status: 'discovered' | 'enriching' | 'complete';
  source: string; // The query used
}

export interface SearchParams {
  niche: string;
  location: string;
  competitor: string;
  leadCount: number;
  minFollowers?: number;
  maxFollowers?: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'dork';
}

export enum AppState {
  IDLE = 'IDLE',
  SEARCHING = 'SEARCHING',
  ENRICHING = 'ENRICHING',
  PAUSED = 'PAUSED',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}