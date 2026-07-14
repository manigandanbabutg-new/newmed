import { SettingsRequest, ActivityLogRequest, MeditationTip } from './userRequest';

/**
 * Meditation and Breathing Business Logic Service.
 * Implements equivalent functionality of Java's "Service.java" layer.
 */
export class MeditationService {
  private settings: SettingsRequest = {
    intervalMinutes: 60, // Default to hourly breaks
    alarmSound: 'bowl',  // 'bowl' | 'gong' | 'chime'
    musicTrack: 'drone', // 'drone' | 'waves' | 'rain' | 'none'
    volume: 0.5,
    enableNotifications: true,
  };

  private activityLogs: ActivityLogRequest[] = [
    {
      activityType: 'breathing',
      durationSeconds: 120,
      completedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      notes: 'Felt very calm after the 4-4-4-4 cycle.',
    },
    {
      activityType: 'break',
      durationSeconds: 300,
      completedAt: new Date(Date.now() - 3600000).toISOString(),
      notes: 'Completed hourly stretch break.',
    }
  ];

  private readonly tips: MeditationTip[] = [
    {
      id: 1,
      category: 'breathing',
      title: 'The 4-4-4-4 Box Breathing',
      content: 'Inhale for 4 seconds, hold for 4, exhale for 4, and hold empty for 4. This technique is used by Navy SEALs to regain focus and reduce stress.',
    },
    {
      id: 2,
      category: 'mindfulness',
      title: 'Rest Your Eyes',
      content: 'Every hour, follow the 20-20-20 rule: look at something 20 feet away for at least 20 seconds to reduce screen-induced eye strain.',
    },
    {
      id: 3,
      category: 'posture',
      title: 'Shoulder Release',
      content: 'Roll your shoulders backward 5 times, then forward 5 times. Let your collarbones widen and drop your shoulders away from your ears.',
    },
    {
      id: 4,
      category: 'focus',
      title: 'Acknowledge Your Thoughts',
      content: 'When thoughts arise during breathing exercises, note them gently (e.g., "thinking") and guide your attention back to your breath without judgment.',
    },
    {
      id: 5,
      category: 'breathing',
      title: 'Diaphragmatic Breathing',
      content: 'Place one hand on your belly and the other on your chest. Breathe deeply through your nose, ensuring only the hand on your belly rises.',
    }
  ];

  /**
   * Retrieves the current user settings.
   */
  public getSettings(): SettingsRequest {
    return this.settings;
  }

  /**
   * Updates the current user settings.
   */
  public updateSettings(newSettings: Partial<SettingsRequest>): SettingsRequest {
    this.settings = {
      ...this.settings,
      ...newSettings,
    };
    return this.settings;
  }

  /**
   * Retrieves all completed activity logs.
   */
  public getActivityLogs(): ActivityLogRequest[] {
    return this.activityLogs;
  }

  /**
   * Adds a new activity log.
   */
  public addActivityLog(log: ActivityLogRequest): ActivityLogRequest {
    const newLog: ActivityLogRequest = {
      ...log,
      completedAt: log.completedAt || new Date().toISOString(),
    };
    this.activityLogs.push(newLog);
    
    // Maintain a maximum of 100 log items
    if (this.activityLogs.length > 100) {
      this.activityLogs.shift();
    }
    
    return newLog;
  }

  /**
   * Retrieves a random meditation/mindfulness tip.
   */
  public getRandomTip(): MeditationTip {
    const index = Math.floor(Math.random() * this.tips.length);
    return this.tips[index];
  }

  /**
   * Retrieves all meditation/mindfulness tips.
   */
  public getAllTips(): MeditationTip[] {
    return this.tips;
  }
}
