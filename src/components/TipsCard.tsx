import { useState, useEffect } from 'react';
import { WellnessTip } from '../types';
import { Lightbulb, ChevronRight, HelpCircle, Eye, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function TipsCard() {
  const [tips, setTips] = useState<WellnessTip[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTips() {
      try {
        const response = await fetch('/api/tips');
        if (response.ok) {
          const data = await response.json();
          setTips(data);
        }
      } catch (error) {
        console.error('Failed to retrieve tips from controller API', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTips();
  }, []);

  const handleNextTip = () => {
    if (tips.length === 0) return;
    setActiveIdx((prev) => (prev + 1) % tips.length);
  };

  const getTipIcon = (category: WellnessTip['category']) => {
    switch (category) {
      case 'breathing':
        return <Lightbulb className="w-4 h-4 text-emerald-400" />;
      case 'mindfulness':
        return <Eye className="w-4 h-4 text-cyan-400" />;
      case 'posture':
        return <Sliders className="w-4 h-4 text-amber-400" />;
      default:
        return <HelpCircle className="w-4 h-4 text-indigo-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-28 glass-panel rounded-3xl animate-pulse">
        <span className="text-xs font-mono text-white/40">Retrieving wellness guidelines...</span>
      </div>
    );
  }

  const currentTip = tips[activeIdx];

  return (
    <div className="p-6 glass-panel rounded-3xl shadow-2xl flex flex-col justify-between h-full relative overflow-hidden" id="wellness-tips">
      <div className="flex items-start justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-teal-400">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-widest text-white/60 font-light">Aether Insights</span>
            <span className="text-[10px] text-white/30 font-mono">Hourly Break Guidance</span>
          </div>
        </div>
        
        {tips.length > 0 && (
          <button
            onClick={handleNextTip}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white cursor-pointer border border-white/10 transition-all"
            id="next-tip-btn"
            title="Next guideline"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {currentTip ? (
        <div className="mt-5 flex-1 flex flex-col justify-center z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTip.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
            >
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 text-[9px] uppercase tracking-wider font-mono text-teal-400 mb-2.5 border border-white/5">
                {getTipIcon(currentTip.category)}
                {currentTip.category}
              </div>
              <h4 className="text-lg font-serif font-light italic text-white/90 leading-tight">
                {currentTip.title}
              </h4>
              <p className="text-xs text-white/60 mt-1.5 leading-relaxed font-sans font-light">
                {currentTip.content}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        <div className="mt-4 py-3 text-center text-xs text-white/30 font-mono">
          No tips available.
        </div>
      )}
    </div>
  );
}
