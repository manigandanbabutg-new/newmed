export interface AppSettings {
  intervalMinutes: number;
  alarmSound: 'bowl' | 'gong' | 'chime';
  musicTrack: 'drone' | 'waves' | 'rain' | 'none';
  volume: number;
  enableNotifications: boolean;
}

export interface ActivityLog {
  activityType: 'break' | 'breathing' | 'meditation';
  durationSeconds: number;
  completedAt: string;
  notes?: string;
}

export interface WellnessTip {
  id: number;
  category: 'mindfulness' | 'breathing' | 'posture' | 'focus';
  title: string;
  content: string;
}

export interface JavaCodeSnippet {
  fileName: string;
  className: string;
  description: string;
  code: string;
}
