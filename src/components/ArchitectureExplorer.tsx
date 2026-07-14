import { useState } from 'react';
import { javaSnippets } from '../utils/javaSnippets';
import { Terminal, Copy, Check, FileCode, Coffee, Server } from 'lucide-react';
import { motion } from 'motion/react';

export default function ArchitectureExplorer() {
  const [activeLang, setActiveLang] = useState<'java' | 'express'>('java');
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  // Live Express equivalent files that we actually created in the project!
  const expressSnippets = [
    {
      fileName: 'userRequest.ts',
      className: 'Interfaces & Types',
      description: 'Defines the TypeScript interfaces and request DTO schemas representing settings configurations and activity log inputs.',
      code: `/**
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
}`
    },
    {
      fileName: 'service.ts',
      className: 'MeditationService',
      description: 'Express class encapsulating business rules, storing in-memory state arrays, and fetching wellness tips.',
      code: `import { SettingsRequest, ActivityLogRequest, MeditationTip } from './userRequest';

export class MeditationService {
  private settings: SettingsRequest = {
    intervalMinutes: 60,
    alarmSound: 'bowl',
    musicTrack: 'drone',
    volume: 0.5,
    enableNotifications: true,
  };

  private activityLogs: ActivityLogRequest[] = [];

  // Retrieves user configurations
  public getSettings(): SettingsRequest {
    return this.settings;
  }

  // Merges setting changes
  public updateSettings(newSettings: Partial<SettingsRequest>): SettingsRequest {
    this.settings = { ...this.settings, ...newSettings };
    return this.settings;
  }

  // Appends activity log entries
  public addActivityLog(log: ActivityLogRequest): ActivityLogRequest {
    this.activityLogs.push(log);
    return log;
  }
}`
    },
    {
      fileName: 'controller.ts',
      className: 'createMeditationRouter',
      description: 'Registers Node Express controllers mapping incoming HTTP requests directly to service execution nodes.',
      code: `import { Router, Request, Response } from 'express';
import { MeditationService } from './service';

export function createMeditationRouter(service: MeditationService): Router {
  const router = Router();

  // GET /api/settings - Retrieve configurations
  router.get('/settings', (req: Request, res: Response) => {
    res.status(200).json(service.getSettings());
  });

  // POST /api/settings - Update configurations
  router.post('/settings', (req: Request, res: Response) => {
    const updated = service.updateSettings(req.body);
    res.status(200).json(updated);
  });

  return router;
}`
    },
    {
      fileName: 'server.ts',
      className: 'Main Entry Point',
      description: 'Bootstraps Express, parses JSON payloads, sets up routing APIs, and serves Vite frontend client files.',
      code: `import express from 'express';
import { MeditationService } from './src/server/service';
import { createMeditationRouter } from './src/server/controller';

async function startServer() {
  const app = express();
  app.use(express.json());

  const meditationService = new MeditationService();
  app.use('/api', createMeditationRouter(meditationService));

  app.listen(3000, '0.0.0.0', () => {
    console.log('Zen server started on http://0.0.0.0:3000');
  });
}
startServer();`
    }
  ];

  const currentSnippetList = activeLang === 'java' ? javaSnippets : expressSnippets;
  const currentSnippet = currentSnippetList[activeFileIdx] || currentSnippetList[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 p-6 glass-panel rounded-3xl shadow-2xl h-full relative overflow-hidden" id="architecture-explorer">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-mono font-medium border border-cyan-500/20 mb-2">
            <Terminal className="w-3.5 h-3.5" />
            Core Framework
          </div>
          <h2 className="text-xl font-light tracking-wide text-white/90">Architecture Explorer</h2>
          <p className="text-[11px] text-white/40 mt-1 font-sans font-light">
            Compare your requested Java/Spring Boot stack with our running Node.js / Express sandbox stack.
          </p>
        </div>

        {/* Stack switcher tabs */}
        <div className="flex rounded-full bg-white/5 p-1 border border-white/10 shrink-0">
          <button
            onClick={() => { setActiveLang('java'); setActiveFileIdx(0); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-mono font-medium transition cursor-pointer ${
              activeLang === 'java'
                ? 'bg-white/10 text-amber-400 shadow-sm border border-white/10'
                : 'text-white/50 hover:text-white border border-transparent'
            }`}
            id="tab-java-code"
          >
            <Coffee className="w-3.5 h-3.5" />
            Java/Spring Stack
          </button>
          <button
            onClick={() => { setActiveLang('express'); setActiveFileIdx(0); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-mono font-medium transition cursor-pointer ${
              activeLang === 'express'
                ? 'bg-white/10 text-teal-300 shadow-sm border border-white/10'
                : 'text-white/50 hover:text-white border border-transparent'
            }`}
            id="tab-express-code"
          >
            <Server className="w-3.5 h-3.5" />
            Node.js/Express
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[400px] z-10">
        {/* Left Side: File Explorer */}
        <div className="lg:col-span-4 flex flex-col gap-2 rounded-2xl bg-white/5 border border-white/10 p-3 h-full">
          <span className="text-[9px] uppercase font-mono tracking-widest text-white/40 font-medium mb-1 px-1">
            Project Files
          </span>
          <div className="flex flex-col gap-1.5">
            {currentSnippetList.map((snippet, index) => (
              <button
                key={snippet.fileName}
                onClick={() => { setActiveFileIdx(index); }}
                className={`flex items-center justify-between p-3 rounded-xl text-left border cursor-pointer transition-all ${
                  activeFileIdx === index
                    ? activeLang === 'java'
                      ? 'bg-amber-400/5 text-amber-400 border-amber-500/20'
                      : 'bg-teal-400/5 text-teal-300 border-teal-500/20'
                    : 'text-white/50 hover:text-white hover:bg-white/5 border-transparent'
                }`}
                id={`file-btn-${snippet.fileName.replace('.', '-')}`}
              >
                <div className="flex items-center gap-2.5">
                  <FileCode className={`w-4 h-4 ${activeFileIdx === index ? (activeLang === 'java' ? 'text-amber-400' : 'text-teal-300') : 'text-white/30'}`} />
                  <div className="flex flex-col">
                    <span className="text-xs font-mono font-medium">{snippet.fileName}</span>
                    <span className="text-[10px] text-white/30 font-sans mt-0.5">{snippet.className}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-auto p-3.5 rounded-xl bg-white/5 border border-white/5 text-[11px] text-white/40 leading-relaxed font-sans font-light">
            <span className="font-semibold text-white/60 block mb-1">Architecture Insight:</span>
            {activeLang === 'java' ? (
              <span>
                Standard corporate web stack. Spring Boot parses REST requests mapping classes directly onto local Service layers to decouple model schemas.
              </span>
            ) : (
              <span>
                Active stack powering this page. High-performance Express runtime utilizing TS compiler configurations matching standard enterprise REST structures.
              </span>
            )}
          </div>
        </div>

        {/* Right Side: IDE Shell & Code Viewer */}
        <div className="lg:col-span-8 flex flex-col rounded-2xl border border-white/10 bg-slate-950/60 overflow-hidden h-full min-h-[300px]">
          {/* Editor Header Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-white/5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
              <span className="text-xs font-mono text-white/40 ml-2">{currentSnippet.fileName}</span>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-white/60 hover:text-white hover:bg-white/5 border border-white/10 rounded-lg cursor-pointer transition"
              id="copy-snippet-btn"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy File
                </>
              )}
            </button>
          </div>

          {/* Description Callout */}
          <div className="px-4 py-2 border-b border-white/5 bg-slate-950/30 text-[11px] font-sans text-white/40 font-light">
            <span className="font-mono text-white/60 uppercase font-semibold text-[10px] mr-1">Role:</span>
            {currentSnippet.description}
          </div>

          {/* Core Code Area */}
          <div className="flex-1 p-4 overflow-auto font-mono text-xs leading-relaxed text-teal-100/80 select-all max-h-[320px]">
            <pre className="whitespace-pre">{currentSnippet.code}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
