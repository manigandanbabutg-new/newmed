import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, Wind, Coffee, HeartPulse, Settings, Calendar, 
  Sparkles, BellRing, Volume2, X, Play, Pause, RefreshCw, AlertTriangle 
} from 'lucide-react';
import { AppSettings, ActivityLog } from './types';
import { audio } from './utils/audioEngine';
import BreathingGuide from './components/BreathingGuide';
import SettingsPanel from './components/SettingsPanel';
import LogsHistory from './components/LogsHistory';
import TipsCard from './components/TipsCard';
import ArchitectureExplorer from './components/ArchitectureExplorer';

export default function App() {
  // Global React state
  const [settings, setSettings] = useState<AppSettings>({
    intervalMinutes: 60,
    alarmSound: 'bowl',
    musicTrack: 'drone',
    volume: 0.5,
    enableNotifications: true,
  });

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(60 * 60); // In seconds
  const [timerRunning, setTimerRunning] = useState<boolean>(true);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'breathe' | 'architecture'>('breathe');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial configuration and database sync on mount
  useEffect(() => {
    async function syncBackendData() {
      setIsSyncing(true);
      try {
        // Fetch current preferences
        const settingsRes = await fetch('/api/settings');
        if (settingsRes.ok) {
          const fetchedSettings = await settingsRes.json();
          setSettings(fetchedSettings);
          // Set volume directly in procedural audio synth
          audio.setVolume(fetchedSettings.volume);
          // Set countdown time in seconds
          setTimeLeft(Math.round(fetchedSettings.intervalMinutes * 60));
        }

        // Fetch activity logs
        const logsRes = await fetch('/api/logs');
        if (logsRes.ok) {
          const fetchedLogs = await logsRes.json();
          setLogs(fetchedLogs);
        }
      } catch (error) {
        console.error('Error syncing data with Express backend on startup:', error);
      } finally {
        setIsSyncing(false);
      }
    }
    syncBackendData();
  }, []);

  // 2. Main Countdown Timer Loop for Break Reminders
  useEffect(() => {
    if (!timerRunning || showPopup) {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      return;
    }

    countdownIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer Hit Zero! Trigger Alert
          triggerBreakAlert();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [timerRunning, showPopup, settings]);

  // Triggered when break countdown hits zero
  const triggerBreakAlert = () => {
    setShowPopup(true);
    setTimerRunning(false);

    // Play the procedural alarm chime
    audio.triggerAlarm(settings.alarmSound);

    // Keep triggering alarm sound every 4 seconds until popup is dismissed
    if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    alarmIntervalRef.current = setInterval(() => {
      audio.triggerAlarm(settings.alarmSound);
    }, 4500);

    // Try to trigger real browser HTML5 notification as progressive enhancement
    if (settings.enableNotifications && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Time for a Zen break!', {
          body: 'Step away from your keyboard, roll your shoulders, and breathe.',
          icon: '/favicon.ico',
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification('Time for a Zen break!', {
              body: 'Step away from your keyboard, roll your shoulders, and breathe.',
            });
          }
        });
      }
    }
  };

  // Sync settings back to backend database
  const handleSettingsChange = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    // Adjust countdown time if changed
    setTimeLeft(Math.round(newSettings.intervalMinutes * 60));

    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
    } catch (e) {
      console.warn('Failed to persist settings changes back to API', e);
    }
  };

  const handleRefreshLogs = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const fetchedLogs = await res.json();
        setLogs(fetchedLogs);
      }
    } catch (e) {
      console.error('Failed to reload logs:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearLogs = async () => {
    // Standard clear state
    setLogs([]);
    // In-memory backend doesn't support deletion but we reset the list in front-end
  };

  const handleLogComplete = (newLog: ActivityLog) => {
    setLogs((prev) => [...prev, newLog]);
  };

  // Sound and notification testing triggers
  const handleTestAlarm = () => {
    audio.triggerAlarm(settings.alarmSound);
  };

  const handleTestPopup = () => {
    triggerBreakAlert();
  };

  // Popup interaction handlers
  const handleDismissBreak = async (completedActivity: 'stretch' | 'breathe' | 'snooze') => {
    // Clear alarm interval loop
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }

    setShowPopup(false);

    if (completedActivity === 'snooze') {
      // Set timer to 5 minutes
      setTimeLeft(5 * 60);
      setTimerRunning(true);
      return;
    }

    // Reset countdown timer to the user setting
    setTimeLeft(Math.round(settings.intervalMinutes * 60));
    setTimerRunning(true);

    // Save "break" activity logs to backend database
    const newLog: ActivityLog = {
      activityType: 'break',
      durationSeconds: Math.round(settings.intervalMinutes * 60),
      completedAt: new Date().toISOString(),
      notes: completedActivity === 'stretch' 
        ? 'Completed full physical stretch break.'
        : 'Completed hourly transition break.',
    };

    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog),
      });
      if (response.ok) {
        const savedLog = await response.json();
        handleLogComplete(savedLog);
      }
    } catch (e) {
      console.warn('Failed to log break record backend:', e);
      handleLogComplete(newLog); // local fallback
    }
  };

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Return formatted display percent for break countdown circle
  const getTimerPercentage = () => {
    const total = settings.intervalMinutes * 60;
    if (total === 0) return 100;
    return (timeLeft / total) * 100;
  };

  return (
    <div className="min-h-screen bg-[#08080c] text-white/90 flex flex-col selection:bg-teal-500/20 selection:text-teal-300 relative overflow-x-hidden" id="app-root">
      {/* 0. Immersive Floating Ambient Light Nodes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/5 blur-[140px] animate-ambient-1" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[60%] rounded-full bg-teal-500/5 blur-[140px] animate-ambient-2" />
      </div>

      {/* 1. Global Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#08080c]/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-teal-400">
              <HeartPulse className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-light tracking-widest uppercase text-white/90">Aether</h1>
              <p className="text-[9px] font-mono tracking-wider text-white/40">Hourly break & breathing catalyst</p>
            </div>
          </div>

          {/* Quick tab switcher */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 p-1 rounded-full">
            <button
              onClick={() => setActiveTab('breathe')}
              className={`px-4 py-1.5 rounded-full text-xs font-sans font-medium transition cursor-pointer ${
                activeTab === 'breathe'
                  ? 'bg-white/10 text-white shadow-sm border border-white/10'
                  : 'text-white/50 hover:text-white'
              }`}
              id="btn-breathe-tab"
            >
              Zen Coach
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-4 py-1.5 rounded-full text-xs font-sans font-medium transition cursor-pointer ${
                activeTab === 'architecture'
                  ? 'bg-white/10 text-white shadow-sm border border-white/10'
                  : 'text-white/50 hover:text-white'
              }`}
              id="btn-architecture-tab"
            >
              Dev Reference
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Page Layout Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 relative z-10">
        
        {/* Dynamic content deck based on navigation tabs */}
        <AnimatePresence mode="wait">
          {activeTab === 'breathe' ? (
            <motion.div
              key="breathe-deck"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Left Column: Visual Timers and Breathing (Spans 8 cols on desktop) */}
              <div className="lg:col-span-8 flex flex-col gap-8">
                
                {/* 2.1. Hourly Countdown Timer Card */}
                <div className="p-8 glass-panel rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden" id="countdown-card">
                  
                  {/* Subtle decorative glowing background blur */}
                  <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-2xl pointer-events-none" />
                  
                  <div className="flex flex-col items-center md:items-start text-center md:text-left z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-mono font-bold border border-indigo-500/20 mb-3 uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      Active Cycle
                    </div>
                    <h3 className="text-2xl font-serif font-light italic text-white/90 leading-tight">Focus Controller</h3>
                    <p className="text-xs text-white/50 mt-2 max-w-md font-sans font-light leading-relaxed">
                      Taking a break every {settings.intervalMinutes === 0.166 ? '10 seconds' : `${settings.intervalMinutes} minutes`} preserves macular integrity and aligns focus.
                    </p>

                    <div className="flex items-center gap-3 mt-6">
                      <button
                        onClick={() => setTimerRunning(!timerRunning)}
                        className={`flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-medium cursor-pointer border transition active:scale-95 ${
                          timerRunning 
                            ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' 
                            : 'bg-white text-slate-950 font-medium hover:bg-white/95'
                        }`}
                        id="toggle-timer-btn"
                      >
                        {timerRunning ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            Pause Sequence
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                            Resume Sequence
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setTimeLeft(Math.round(settings.intervalMinutes * 60))}
                        className="px-4 py-2 border border-white/10 text-white/60 hover:text-white hover:bg-white/5 rounded-xl text-xs font-mono font-medium cursor-pointer transition"
                        id="reset-timer-btn"
                      >
                        Reset Sequence
                      </button>
                    </div>
                  </div>

                  {/* Circular visual timer countdown */}
                  <div className="relative flex items-center justify-center w-40 h-40 shrink-0 z-10">
                    <svg className="absolute w-36 h-36 transform -rotate-90">
                      <circle
                        cx="72"
                        cy="72"
                        r="66"
                        className="stroke-white/5"
                        strokeWidth="2"
                        fill="transparent"
                      />
                      <motion.circle
                        cx="72"
                        cy="72"
                        r="66"
                        className="stroke-indigo-400"
                        strokeWidth="2.5"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 66}
                        animate={{
                          strokeDashoffset: (2 * Math.PI * 66) * (1 - getTimerPercentage() / 100)
                        }}
                        transition={{ duration: 1, ease: "linear" }}
                      />
                    </svg>
                    
                    <div className="flex flex-col items-center justify-center z-10 font-mono">
                      <span className="text-3xl font-light tracking-tight text-white/90">
                        {formatCountdown(timeLeft)}
                      </span>
                      <span className="text-[9px] text-white/40 font-mono tracking-widest mt-1">
                        COUNTDOWN
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grid holding Breathing Guide and Tips side-by-side */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  <div className="md:col-span-7">
                    <BreathingGuide 
                      volume={settings.volume} 
                      onLogComplete={handleLogComplete} 
                    />
                  </div>
                  <div className="md:col-span-5 flex flex-col gap-8 h-full">
                    <div className="flex-1">
                      <TipsCard />
                    </div>
                    
                    {/* Background audio notice card */}
                    <div className="p-5 rounded-3xl glass-panel text-center flex flex-col justify-center items-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-teal-400/5 rounded-full blur-xl pointer-events-none" />
                      <Volume2 className="w-5 h-5 text-teal-400 mb-2" />
                      <span className="text-xs font-serif italic text-white/85 font-light">Synthesized Acoustics</span>
                      <p className="text-[10px] text-white/40 mt-1 leading-relaxed max-w-xs font-light">
                        Procedural sounds require user interaction first. Tap "Test Tone" in Preferences to activate the Web Audio engine!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Settings & Database Log History (Spans 4 cols on desktop) */}
              <div className="lg:col-span-4 flex flex-col gap-8 h-full">
                <SettingsPanel 
                  settings={settings}
                  onSettingsChange={handleSettingsChange}
                  onTriggerTestAlarm={handleTestAlarm}
                  onTriggerTestPopup={handleTestPopup}
                />
                
                <LogsHistory 
                  logs={logs}
                  onClearLogs={handleClearLogs}
                  onRefresh={handleRefreshLogs}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="architecture-deck"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              <ArchitectureExplorer />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 3. Immersive Overlay Alert Popup Notification (Timer Hit Zero) */}
      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08080c]/85 backdrop-blur-lg" id="alert-popup-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-lg bg-[#0e0e14] border border-white/10 rounded-3xl shadow-2xl p-8 relative overflow-hidden text-center"
              id="alert-popup-modal"
            >
              {/* Decorative radial alarm background glow */}
              <div className="absolute inset-0 bg-radial-gradient from-amber-500/10 to-transparent pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center">
                
                {/* Bell Icon ringing */}
                <motion.div
                  animate={{ rotate: [-8, 8, -8, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="w-12 h-12 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center mb-5"
                >
                  <BellRing className="w-6 h-6 animate-pulse" />
                </motion.div>

                <h3 className="text-2xl font-serif font-light italic text-white/95">
                  Take a Break
                </h3>
                
                <p className="text-[10px] font-mono text-amber-400 uppercase tracking-widest mt-1">
                  Hourly Wellness Checkpoint
                </p>

                <div className="my-6 p-4 rounded-2xl bg-white/5 border border-white/5 max-w-md">
                  <p className="text-xs text-white/60 leading-relaxed font-sans font-light">
                    You have been looking at screens for a long period of time. Let's stand up, stretch your wrists, rotate your shoulder blades, or complete a simple breathing sequence.
                  </p>
                </div>

                {/* Alarm sound playback notice */}
                <div className="flex items-center gap-1.5 justify-center text-[10px] text-white/40 font-mono mb-6">
                  <Volume2 className="w-3.5 h-3.5 text-teal-400" />
                  Procedural {settings.alarmSound === 'bowl' ? 'Tibetan Bowl' : settings.alarmSound === 'gong' ? 'Temple Gong' : 'Zen Chime'} sounding...
                </div>

                {/* Dialog Interactive Call to Actions */}
                <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                  
                  {/* Take break breathing */}
                  <button
                    onClick={() => {
                      handleDismissBreak('breathe');
                      setActiveTab('breathe');
                      // Scroll or direct focus to breathing box
                      setTimeout(() => {
                        const target = document.getElementById('breathing-coach');
                        if (target) target.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className="flex-1 py-3 px-5 rounded-xl text-xs font-medium bg-white hover:bg-white/95 text-slate-950 shadow-md cursor-pointer transition active:scale-95"
                    id="popup-breathe-btn"
                  >
                    Take Breathing Break
                  </button>

                  {/* Just stretch and log */}
                  <button
                    onClick={() => handleDismissBreak('stretch')}
                    className="flex-1 py-3 px-5 rounded-xl text-xs font-medium bg-white/5 border border-white/10 hover:bg-white/10 text-white cursor-pointer transition active:scale-95"
                    id="popup-stretch-btn"
                  >
                    Just Stretch Completed
                  </button>

                  {/* Snooze */}
                  <button
                    onClick={() => handleDismissBreak('snooze')}
                    className="py-3 px-4 rounded-xl text-xs font-mono text-white/40 hover:text-white border border-white/5 cursor-pointer transition active:scale-95"
                    id="popup-snooze-btn"
                  >
                    Snooze 5m
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer footer-credit */}
      <footer className="w-full border-t border-white/5 bg-[#08080c] py-6 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[9px] font-mono text-white/30 tracking-wider">
            ZenWork Breathing Timer © 2026. Crafted using Web Audio Oscillators, React & Node.js Express.
          </p>
        </div>
      </footer>
    </div>
  );
}
