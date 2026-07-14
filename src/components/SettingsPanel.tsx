import { useState } from 'react';
import { Volume2, VolumeX, ShieldAlert, Sparkles, BellRing, Music, Clock } from 'lucide-react';
import { AppSettings } from '../types';
import { audio } from '../utils/audioEngine';

interface SettingsPanelProps {
  settings: AppSettings;
  onSettingsChange: (newSettings: AppSettings) => void;
  onTriggerTestAlarm: () => void;
  onTriggerTestPopup: () => void;
}

const INTERVALS = [
  { value: 0.166, label: '10 Seconds (Test Mode)' },
  { value: 1, label: '1 Minute' },
  { value: 5, label: '5 Minutes' },
  { value: 15, label: '15 Minutes' },
  { value: 30, label: '30 Minutes' },
  { value: 60, label: '1 Hour (Recommended)' },
];

const ALARM_SOUNDS = [
  { value: 'bowl', label: 'Tibetan Singing Bowl' },
  { value: 'gong', label: 'Zen Temple Gong' },
  { value: 'chime', label: 'Positive Wind Chime' },
];

const MUSIC_TRACKS = [
  { value: 'drone', label: 'Deep Meditation Drone (Synth)' },
  { value: 'waves', label: 'Cosmic Ocean Waves (Noise LFO)' },
  { value: 'rain', label: 'Verdant Forest Rain (White noise)' },
  { value: 'none', label: 'Silence (No Background Music)' },
];

export default function SettingsPanel({
  settings,
  onSettingsChange,
  onTriggerTestAlarm,
  onTriggerTestPopup,
}: SettingsPanelProps) {
  const [isPlayingTestMusic, setIsPlayingTestMusic] = useState(settings.musicTrack !== 'none');

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = { ...settings, [key]: value };
    onSettingsChange(updated);

    // Dynamic feedback to audio engine
    if (key === 'volume') {
      audio.setVolume(value as number);
    } else if (key === 'musicTrack') {
      const track = value as any;
      if (track === 'none') {
        setIsPlayingTestMusic(false);
        audio.stopMusic();
      } else {
        setIsPlayingTestMusic(true);
        audio.playMusic(track);
      }
    }
  };

  const handleToggleMusic = () => {
    if (isPlayingTestMusic) {
      audio.stopMusic();
      setIsPlayingTestMusic(false);
    } else {
      audio.playMusic(settings.musicTrack);
      setIsPlayingTestMusic(true);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 glass-panel rounded-3xl shadow-2xl h-full relative overflow-hidden" id="settings-panel">
      {/* Header section */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-mono font-medium border border-teal-500/20 mb-2">
          <Clock className="w-3.5 h-3.5" />
          Acoustic & Timing Settings
        </div>
        <h2 className="text-xl font-light tracking-wide text-white/90">Preferences</h2>
        <p className="text-[11px] text-white/40 mt-1 font-sans font-light">Configure your break intervals, notification bells, and background procedural soundscapes.</p>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto pr-1">
        {/* 1. Timer Break Interval Selector */}
        <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-white/10">
          <label className="text-xs uppercase tracking-wider font-light text-white/60 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            Interval Sequence
          </label>
          <select
            value={settings.intervalMinutes}
            onChange={(e) => updateSetting('intervalMinutes', parseFloat(e.target.value))}
            className="w-full text-sm py-2 px-3 rounded-xl bg-slate-900/60 border border-white/10 text-white/80 focus:outline-none focus:border-teal-400 cursor-pointer"
            id="interval-select"
          >
            {INTERVALS.map((item) => (
              <option key={item.value} value={item.value} className="bg-slate-950">
                {item.label}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-white/40 font-sans font-light mt-0.5">
            Decides how frequently you are reminded to halt screen activities for stretch & breathing.
          </p>
        </div>

        {/* 2. Alarm Sound Selector */}
        <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-white/10">
          <label className="text-xs uppercase tracking-wider font-light text-white/60 flex items-center gap-2">
            <BellRing className="w-4 h-4 text-indigo-400" />
            Hourly Break Alert Tone
          </label>
          <div className="flex gap-2">
            <select
              value={settings.alarmSound}
              onChange={(e) => updateSetting('alarmSound', e.target.value as any)}
              className="flex-1 text-sm py-2 px-3 rounded-xl bg-slate-900/60 border border-white/10 text-white/80 focus:outline-none focus:border-teal-400 cursor-pointer"
              id="alarm-select"
            >
              {ALARM_SOUNDS.map((item) => (
                <option key={item.value} value={item.value} className="bg-slate-950">
                  {item.label}
                </option>
              ))}
            </select>
            <button
              onClick={onTriggerTestAlarm}
              className="px-4 py-2 text-xs font-sans font-medium text-white bg-indigo-500/30 hover:bg-indigo-500/50 border border-indigo-500/40 rounded-xl cursor-pointer shadow-md transition-all active:scale-95"
              id="test-alarm-btn"
            >
              Test Tone
            </button>
          </div>
        </div>

        {/* 3. Ambient Background Soundtrack */}
        <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-white/10">
          <label className="text-xs uppercase tracking-wider font-light text-white/60 flex items-center gap-2">
            <Music className="w-4 h-4 text-teal-400" />
            Background Ambient Soundscape
          </label>
          <div className="flex gap-2">
            <select
              value={settings.musicTrack}
              onChange={(e) => updateSetting('musicTrack', e.target.value as any)}
              className="flex-1 text-sm py-2 px-3 rounded-xl bg-slate-900/60 border border-white/10 text-white/80 focus:outline-none focus:border-teal-400 cursor-pointer"
              id="music-select"
            >
              {MUSIC_TRACKS.map((item) => (
                <option key={item.value} value={item.value} className="bg-slate-950">
                  {item.label}
                </option>
              ))}
            </select>
            {settings.musicTrack !== 'none' && (
              <button
                onClick={handleToggleMusic}
                className={`px-4 py-2 text-xs font-sans font-medium rounded-xl cursor-pointer border shadow-md transition-all active:scale-95 ${
                  isPlayingTestMusic
                    ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                    : 'bg-teal-500/20 border-teal-500/30 text-teal-300 hover:bg-teal-500/35'
                }`}
                id="toggle-ambient-btn"
              >
                {isPlayingTestMusic ? 'Mute' : 'Play'}
              </button>
            )}
          </div>
        </div>

        {/* 4. Global Gain / Volume Slider */}
        <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex justify-between items-center text-xs uppercase tracking-wider font-light text-white/60">
            <span className="flex items-center gap-2">
              {settings.volume === 0 ? (
                <VolumeX className="w-4 h-4 text-white/30" />
              ) : (
                <Volume2 className="w-4 h-4 text-teal-400" />
              )}
              Acoustic Master Gain
            </span>
            <span className="text-white/40 font-mono">{Math.round(settings.volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settings.volume}
            onChange={(e) => updateSetting('volume', parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-teal-400"
            id="volume-slider"
          />
        </div>

        {/* 5. Alerts & Notifications toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider font-light text-white/60 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Visual Popups
            </span>
            <span className="text-[10px] text-white/40 font-sans font-light mt-0.5">Toggle browser popup alerts</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onTriggerTestPopup}
              disabled={!settings.enableNotifications}
              className="text-[10px] px-2.5 py-1 text-white/80 border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white rounded-lg cursor-pointer disabled:opacity-40 transition"
              id="test-popup-btn"
            >
              Test Popup
            </button>
            <button
              onClick={() => updateSetting('enableNotifications', !settings.enableNotifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer ${
                settings.enableNotifications ? 'bg-teal-500' : 'bg-white/10'
              }`}
              id="notifications-toggle"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  settings.enableNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
