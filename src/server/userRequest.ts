/**
 * Models and request interfaces for the Meditation and Breathing application.
 * This mirrors the "UserRequest.java" structure in a TypeScript environment.
 */

export interface SettingsRequest {
  intervalMinutes: number;
  alarmSound: string;
  musicTrack: string;
  volume: number;
  enableNotifications: boolean;
}

export interface ActivityLogRequest {
  activityType: 'break' | 'breathing' | 'meditation';
  durationSeconds: number;
  completedAt: string;
  notes?: string;
}

export interface MeditationTip {
  id: number;
  category: 'mindfulness' | 'breathing' | 'posture' | 'focus';
  title: string;
  content: string;
}
