import { ActivityLog } from '../types';
import { ShieldCheck, Calendar, Zap, RefreshCw, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface LogsHistoryProps {
  logs: ActivityLog[];
  onClearLogs: () => void;
  onRefresh: () => void;
}

export default function LogsHistory({ logs, onClearLogs, onRefresh }: LogsHistoryProps) {
  // Compute nice high-level stats
  const totalBreaths = logs.filter(l => l.activityType === 'breathing').length;
  const totalBreaks = logs.filter(l => l.activityType === 'break').length;
  const totalSeconds = logs.reduce((sum, current) => sum + current.durationSeconds, 0);
  
  const getRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);

      if (diffSec < 60) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHr < 24) return `${diffHr}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Completed';
    }
  };

  const getBadgeStyles = (type: 'break' | 'breathing' | 'meditation') => {
    switch (type) {
      case 'break':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'breathing':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      case 'meditation':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 glass-panel rounded-3xl shadow-2xl h-full relative overflow-hidden" id="logs-history">
      {/* Header section */}
      <div className="flex justify-between items-start z-10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-mono font-medium border border-indigo-500/20 mb-2">
            <Calendar className="w-3.5 h-3.5" />
            Registry
          </div>
          <h2 className="text-xl font-light tracking-wide text-white/90">Activity Logs</h2>
          <p className="text-[11px] text-white/40 mt-1 font-sans font-light">Logs synchronizing live with the active container backend.</p>
        </div>

        {/* Action controllers */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onRefresh}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white cursor-pointer border border-white/10 transition-all"
            title="Refresh database logs"
            id="refresh-logs-btn"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClearLogs}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/10 text-white/60 hover:text-red-400 cursor-pointer border border-white/10 transition-all"
            title="Clear logs"
            id="clear-logs-btn"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Numerical Stats: Daily Stats Card Aesthetic from Design */}
      <div className="grid grid-cols-3 gap-2 bg-white/5 border border-white/10 p-4 rounded-2xl">
        <div className="flex flex-col">
          <span className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Breaks</span>
          <div className="text-2xl font-light italic font-serif text-amber-400">{totalBreaks} <span className="text-xs font-sans opacity-40 font-normal">done</span></div>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Breathe</span>
          <div className="text-2xl font-light italic font-serif text-teal-400">{totalBreaths} <span className="text-xs font-sans opacity-40 font-normal">rnd</span></div>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Duration</span>
          <div className="text-2xl font-light italic font-serif text-indigo-400">
            {Math.round(totalSeconds / 60)} <span className="text-xs font-sans opacity-40 font-normal">min</span>
          </div>
        </div>
      </div>

      {/* Scrollable table/list logs */}
      <div className="flex-1 overflow-y-auto max-h-[220px] pr-1 flex flex-col gap-2 z-10">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-white/40 border border-dashed border-white/10 rounded-2xl bg-white/5">
            <Zap className="w-7 h-7 text-white/20 mb-2 stroke-[1.5]" />
            <span className="text-xs font-mono font-medium">No recorded activities</span>
            <span className="text-[10px] text-white/30 mt-0.5">Saves automatically upon completion.</span>
          </div>
        ) : (
          logs.slice().reverse().map((log, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.3) }}
              className="flex flex-col p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/25 hover:bg-white/10 transition group"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[9px] uppercase font-mono font-semibold px-2 py-0.5 rounded-full border ${getBadgeStyles(log.activityType)}`}>
                  {log.activityType}
                </span>
                <span className="text-[9px] font-mono text-white/40 group-hover:text-white/60 transition">
                  {getRelativeTime(log.completedAt)}
                </span>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs font-sans font-light text-white/80">
                  {log.notes || 'Activity completed successfully.'}
                </p>
                <span className="text-xs font-mono text-white/60 shrink-0 ml-4 font-semibold">
                  {log.durationSeconds >= 60 
                    ? `${Math.floor(log.durationSeconds / 60)}m ${log.durationSeconds % 60}s`
                    : `${log.durationSeconds}s`
                  }
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Backend connection status */}
      <div className="flex items-center gap-2 text-[10px] font-mono text-teal-400 bg-teal-500/5 px-3 py-2.5 rounded-xl border border-teal-500/20 z-10">
        <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]"></div>
        Durable State Sync: REST Connected.
      </div>
    </div>
  );
}
