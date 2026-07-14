import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, CheckCircle, Wind, Award } from 'lucide-react';
import { ActivityLog } from '../types';

interface BreathingGuideProps {
  volume: number;
  onLogComplete: (log: ActivityLog) => void;
}

type BreathState = 'idle' | 'inhale' | 'hold_in' | 'exhale' | 'hold_out';

const STATE_DURATIONS = {
  inhale: 4,
  hold_in: 4,
  exhale: 4,
  hold_out: 4
};

const STATE_COLORS = {
  idle: 'from-white/5 to-white/10 border-white/15',
  inhale: 'from-teal-500/10 to-teal-300/10 border-teal-400/40',
  hold_in: 'from-cyan-500/10 to-cyan-300/10 border-cyan-400/40',
  exhale: 'from-indigo-500/10 to-indigo-300/10 border-indigo-400/40',
  hold_out: 'from-white/5 to-white/10 border-white/20'
};

const STATE_LABELS = {
  idle: 'Ready to Begin',
  inhale: 'Breathe In',
  hold_in: 'Hold Your Breath',
  exhale: 'Breathe Out',
  hold_out: 'Hold (Empty)'
};

export default function BreathingGuide({ volume, onLogComplete }: BreathingGuideProps) {
  const [breathState, setBreathState] = useState<BreathState>('idle');
  const [timeLeft, setTimeLeft] = useState(4);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [totalBreathingSeconds, setTotalBreathingSeconds] = useState(0);
  const [isLogging, setIsLogging] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sound effect helpers for transition cues
  const playCueSound = (pitch: number, duration: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15 * volume, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio context failed to trigger cue', e);
    }
  };

  useEffect(() => {
    if (breathState === 'idle') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Transition to next breathing stage
          setBreathState((currentState) => {
            let nextState: BreathState = 'idle';
            let nextDuration = 4;

            if (currentState === 'inhale') {
              nextState = 'hold_in';
              nextDuration = STATE_DURATIONS.hold_in;
              playCueSound(523.25, 0.4); // C5 note cue for hold
            } else if (currentState === 'hold_in') {
              nextState = 'exhale';
              nextDuration = STATE_DURATIONS.exhale;
              playCueSound(392.00, 0.4); // G4 note cue for exhale
            } else if (currentState === 'exhale') {
              nextState = 'hold_out';
              nextDuration = STATE_DURATIONS.hold_out;
              playCueSound(329.63, 0.4); // E4 note cue for hold empty
            } else if (currentState === 'hold_out') {
              nextState = 'inhale';
              nextDuration = STATE_DURATIONS.inhale;
              playCueSound(440.00, 0.6); // A4 note cue for inhale (higher pitch)
              setRoundsCompleted((r) => r + 1);
            }

            setTimeLeft(nextDuration);
            return nextState;
          });
          return 4;
        }
        setTotalBreathingSeconds((s) => s + 1);
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [breathState, volume]);

  const handleStart = () => {
    if (breathState === 'idle') {
      setBreathState('inhale');
      setTimeLeft(STATE_DURATIONS.inhale);
      playCueSound(440.00, 0.6); // First breath in chime
    } else {
      setBreathState('idle');
    }
  };

  const handleReset = () => {
    setBreathState('idle');
    setTimeLeft(4);
    setRoundsCompleted(0);
    setTotalBreathingSeconds(0);
  };

  const handleSaveSession = async () => {
    if (totalBreathingSeconds < 10) return;
    setIsLogging(true);
    
    const newLog: ActivityLog = {
      activityType: 'breathing',
      durationSeconds: totalBreathingSeconds,
      completedAt: new Date().toISOString(),
      notes: `Completed ${roundsCompleted} rounds of box breathing.`
    };

    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog)
      });
      if (response.ok) {
        const savedLog = await response.json();
        onLogComplete(savedLog);
        handleReset();
      }
    } catch (e) {
      console.error('Failed to log session backend', e);
      // Fallback client complete
      onLogComplete(newLog);
      handleReset();
    } finally {
      setIsLogging(false);
    }
  };

  // Determine scale of breathing circle based on status
  const getCircleScale = () => {
    switch (breathState) {
      case 'inhale': return 1.4;
      case 'hold_in': return 1.4;
      case 'exhale': return 0.8;
      case 'hold_out': return 0.8;
      default: return 1.0;
    }
  };

  // Determine duration for animation interpolation
  const getAnimationDuration = () => {
    if (breathState === 'inhale' || breathState === 'exhale') return 4;
    return 0.5; // Quick stabilization for holds
  };

  return (
    <div className="flex flex-col items-center justify-between p-6 glass-panel rounded-3xl shadow-2xl h-full relative overflow-hidden" id="breathing-coach">
      {/* Header Info */}
      <div className="w-full text-center mb-4 z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-mono font-medium border border-teal-500/20 mb-2">
          <Wind className="w-3.5 h-3.5 animate-pulse" />
          Breathing Space
        </div>
        <h2 className="text-xl font-light tracking-wide text-white/90">Pranayama breathing exercise</h2>
        <p className="text-[11px] text-white/40 mt-1 font-sans font-light">Calibrate heart rate variability and reduce brain chatter</p>
      </div>

      {/* Main Visual Stage */}
      <div className="relative flex items-center justify-center w-64 h-64 my-6 z-10">
        {/* Background glow radiating waves */}
        <AnimatePresence>
          {breathState !== 'idle' && (
            <motion.div
              key={breathState}
              className={`absolute inset-0 rounded-full bg-gradient-to-tr ${STATE_COLORS[breathState]} filter blur-xl opacity-40`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.4, scale: getCircleScale() }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: getAnimationDuration(), ease: "easeInOut" }}
            />
          )}
        </AnimatePresence>

        {/* Breathing Sphere */}
        <motion.div
          animate={{
            scale: getCircleScale(),
          }}
          transition={{
            duration: getAnimationDuration(),
            ease: "easeInOut"
          }}
          className={`flex flex-col items-center justify-center w-48 h-48 rounded-full border-2 shadow-2xl bg-gradient-to-b ${STATE_COLORS[breathState]} border-white/10 transition-all duration-300 z-10`}
        >
          {/* Internal Instructions */}
          <span className="text-xs font-mono tracking-widest text-teal-400 mb-1">
            {breathState === 'idle' ? 'STANDBY' : `${timeLeft}s`}
          </span>
          <span className="text-xl font-serif italic font-light text-white/90 text-center px-4 leading-tight">
            {STATE_LABELS[breathState]}
          </span>
          
          {breathState !== 'idle' && (
            <span className="text-[10px] font-mono text-white/40 mt-2">
              Round {roundsCompleted + 1}
            </span>
          )}
        </motion.div>

        {/* Progress circular ring */}
        <svg className="absolute w-56 h-56 transform -rotate-90 pointer-events-none">
          <circle
            cx="112"
            cy="112"
            r="108"
            className="stroke-white/5"
            strokeWidth="2"
            fill="transparent"
          />
          {breathState !== 'idle' && (
            <motion.circle
              cx="112"
              cy="112"
              r="108"
              className="stroke-teal-400"
              strokeWidth="2.5"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 108}
              animate={{
                strokeDashoffset: (2 * Math.PI * 108) * (1 - timeLeft / 4)
              }}
              transition={{ duration: 1, ease: "linear" }}
            />
          )}
        </svg>
      </div>

      {/* Control Actions Panel */}
      <div className="w-full flex flex-col items-center gap-4 z-10">
        <div className="flex items-center gap-4">
          {/* Restart/Reset Button */}
          <button
            onClick={handleReset}
            disabled={totalBreathingSeconds === 0}
            className="flex items-center justify-center w-11 h-11 rounded-full border border-white/10 bg-white/5 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 disabled:opacity-30 disabled:hover:text-white/50 cursor-pointer transition-all duration-200"
            title="Reset exercise"
            id="reset-breath"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Primary Play Button */}
          <button
            onClick={handleStart}
            className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-sans font-medium shadow-xl cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 ${
              breathState === 'idle'
                ? 'bg-white text-slate-950 hover:bg-white/95'
                : 'bg-white/10 border border-white/20 text-white hover:bg-white/15'
            }`}
            id="start-breath"
          >
            {breathState === 'idle' ? (
              <>
                <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
                Start Breathing
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 fill-white text-white" />
                Pause Cycle
              </>
            )}
          </button>

          {/* Complete & Log Session */}
          <button
            onClick={handleSaveSession}
            disabled={totalBreathingSeconds < 10 || isLogging}
            className="flex items-center justify-center w-11 h-11 rounded-full border border-teal-500/20 bg-teal-500/5 text-teal-400 hover:text-teal-300 hover:bg-teal-500/15 disabled:opacity-30 cursor-pointer transition-all duration-200"
            title="Log finished session"
            id="complete-breath"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic breathing telemetry stats */}
        <div className="w-full grid grid-cols-2 gap-3 pt-3 border-t border-white/5 text-center font-mono text-xs text-white/40">
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5">
            <span className="text-white/30 text-[9px] uppercase tracking-wider mb-0.5">Time Engaged</span>
            <span className="text-white/80 font-bold text-sm">
              {Math.floor(totalBreathingSeconds / 60)}m {totalBreathingSeconds % 60}s
            </span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5">
            <span className="text-white/30 text-[9px] uppercase tracking-wider mb-0.5">Rounds Saved</span>
            <span className="text-teal-300 font-bold text-sm flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              {roundsCompleted} Cycles
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
