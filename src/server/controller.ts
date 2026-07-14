import { Router, Request, Response } from 'express';
import { MeditationService } from './service';
import { SettingsRequest, ActivityLogRequest } from './userRequest';

/**
 * Meditation and Breathing API Controller.
 * Configures Express router endpoints, matching the Java "Controller.java" architecture.
 */
export function createMeditationRouter(service: MeditationService): Router {
  const router = Router();

  // GET /api/settings - Retrieve user configurations
  router.get('/settings', (req: Request, res: Response) => {
    try {
      const settings = service.getSettings();
      res.status(200).json(settings);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve settings', details: error.message });
    }
  });

  // POST /api/settings - Update user configurations
  router.post('/settings', (req: Request, res: Response) => {
    try {
      const newSettings: Partial<SettingsRequest> = req.body;
      const updatedSettings = service.updateSettings(newSettings);
      res.status(200).json(updatedSettings);
    } catch (error: any) {
      res.status(400).json({ error: 'Failed to update settings', details: error.message });
    }
  });

  // GET /api/logs - Retrieve activity completion history
  router.get('/logs', (req: Request, res: Response) => {
    try {
      const logs = service.getActivityLogs();
      res.status(200).json(logs);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve activity logs', details: error.message });
    }
  });

  // POST /api/logs - Add a completed break/breathing log
  router.post('/logs', (req: Request, res: Response) => {
    try {
      const logRequest: ActivityLogRequest = req.body;
      
      if (!logRequest.activityType || typeof logRequest.durationSeconds !== 'number') {
        res.status(400).json({ error: 'Invalid log request body. activityType and durationSeconds are required.' });
        return;
      }

      const savedLog = service.addActivityLog(logRequest);
      res.status(201).json(savedLog);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to save activity log', details: error.message });
    }
  });

  // GET /api/tips - Retrieve all wellness tips
  router.get('/tips', (req: Request, res: Response) => {
    try {
      const tips = service.getAllTips();
      res.status(200).json(tips);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve tips', details: error.message });
    }
  });

  // GET /api/tips/random - Retrieve a single random wellness tip
  router.get('/tips/random', (req: Request, res: Response) => {
    try {
      const tip = service.getRandomTip();
      res.status(200).json(tip);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve random tip', details: error.message });
    }
  });

  return router;
}
