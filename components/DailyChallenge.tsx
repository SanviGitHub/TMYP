
import React, { useState, useEffect } from 'react';
import { DAILY_CHALLENGES } from '../constants';

const DailyChallenge: React.FC = () => {
  const [challenge, setChallenge] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Get random challenge
    const random = DAILY_CHALLENGES[Math.floor(Math.random() * DAILY_CHALLENGES.length)];
    setChallenge(random);
  }, []);

  const handleComplete = () => {
    setIsCompleted(true);
    setTimeout(() => setIsVisible(false), 2000); // Hide after 2s
  };

  if (!isVisible) return null;

  return (
    // Optimized position for mobile: Top 100px to clear header, Right 10px
    <div className={`fixed top-[100px] md:top-32 right-3 md:right-16 z-[45] transition-all duration-700 transform ${isCompleted ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}>
      <div className="bg-glass/80 backdrop-blur-xl border border-white/20 rounded-2xl p-3 md:p-4 max-w-[150px] md:max-w-xs shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-glass/90 transition-colors group relative overflow-hidden">
        {/* Shine effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/50 to-transparent opacity-50"></div>
        
        <div className="flex justify-between items-start mb-2">
            <h4 className="text-[0.65rem] md:text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-2">
                <span className="animate-pulse">⚡</span> Desafío
            </h4>
            <button onClick={() => setIsVisible(false)} className="text-white/20 hover:text-white text-xs">✕</button>
        </div>
        
        <p className="text-xs md:text-sm text-white font-body leading-snug mb-3">
            {challenge}
        </p>

        <button 
            onClick={handleComplete}
            className="w-full py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 hover:bg-accent/20 hover:text-accent hover:border-accent/50 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
            {isCompleted ? '¡Hecho! ✨' : 'Aceptar'}
        </button>
      </div>
    </div>
  );
};

export default DailyChallenge;
