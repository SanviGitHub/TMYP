
import React, { useState, useEffect, useRef } from 'react';

interface FocusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FocusModal: React.FC<FocusModalProps> = ({ isOpen, onClose }) => {
  // Default 15 minutes (User requested reduction from 25)
  const DEFAULT_TIME = 15 * 60;
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsFinished(true);
      setIsActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(DEFAULT_TIME);
    setIsFinished(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // SVG config
  // Reduced radius to 80 to ensure it fits within 200x200 with strokeWidth=8
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ((DEFAULT_TIME - timeLeft) / DEFAULT_TIME) * circumference;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
      <div className="bg-bg/90 border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl flex flex-col items-center w-full max-w-sm relative overflow-hidden">
        
        {/* Header */}
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white">✕</button>
        <h2 className="text-2xl font-title font-bold text-amber-100 mb-6">Modo Enfoque</h2>

        {/* Timer Viz */}
        <div className="relative flex items-center justify-center mb-8 w-64 h-64">
          <svg className="transform -rotate-90 w-full h-full overflow-visible" viewBox="0 0 200 200">
            {/* Track */}
            <circle
              cx="100" cy="100" r={radius}
              className="stroke-white/5"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Progress */}
            <circle
              cx="100" cy="100" r={radius}
              className={`transition-all duration-1000 ease-linear ${isFinished ? 'stroke-emerald-500' : 'stroke-amber-400'}`}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute text-4xl md:text-5xl font-mono font-bold text-white tracking-wider">
            {isFinished ? "LISTO" : formatTime(timeLeft)}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4">
           {!isFinished ? (
             <button 
                onClick={toggleTimer}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all active:scale-95 ${isActive ? 'bg-white/10 text-amber-200 border border-amber-500/30' : 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'}`}
             >
               {isActive ? '⏸' : '▶'}
             </button>
           ) : (
             <div className="text-center animate-bounce text-emerald-400 font-bold text-xl">¡Buen trabajo!</div>
           )}
           
           <button 
             onClick={resetTimer}
             className="w-16 h-16 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white flex items-center justify-center active:scale-95 transition-all"
             title="Reiniciar"
           >
             ↺
           </button>
        </div>

        <p className="mt-6 text-xs text-white/30 text-center max-w-[200px]">
            Mantené la ventana abierta para que el timer siga corriendo.
        </p>
      </div>
    </div>
  );
};

export default FocusModal;
