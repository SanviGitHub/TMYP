import React, { useState, useEffect, useRef } from 'react';

interface BreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BreathingModal: React.FC<BreathingModalProps> = ({ isOpen, onClose }) => {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'ready' | 'finished'>('ready');
  const [text, setText] = useState('Tocá para empezar');
  const [remainingCycles, setRemainingCycles] = useState(2);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActiveRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setPhase('ready');
    setText('Tocá para empezar');
    setRemainingCycles(2);
    isActiveRef.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const runCycle = (cyclesLeft: number) => {
    if (!isActiveRef.current) return;

    // Actualizar el contador visual
    setRemainingCycles(cyclesLeft);

    // 1. INHALAR (4s)
    setPhase('inhale');
    setText('Inhalá...');
    
    timeoutRef.current = setTimeout(() => {
      if (!isActiveRef.current) return;
      
      // 2. SOSTENER (4s)
      setPhase('hold');
      setText('Sostén el aire');
      
      timeoutRef.current = setTimeout(() => {
        if (!isActiveRef.current) return;

        // 3. EXHALAR (6s)
        setPhase('exhale');
        setText('Exhalá suavemente...');
        
        timeoutRef.current = setTimeout(() => {
          if (!isActiveRef.current) return;
          
          const nextCycles = cyclesLeft - 1;
          
          if (nextCycles > 0) {
            // Si quedan vueltas, seguimos
            runCycle(nextCycles);
          } else {
            // Si terminó, mostrar éxito
            finishExercise();
          }
        }, 6000); 
      }, 4000); 
    }, 4000);
  };

  const finishExercise = () => {
    setPhase('finished');
    setText('¡Muy bien, lo lograste!');
    isActiveRef.current = false;
  };

  const handleStart = () => {
    if (phase !== 'ready' && phase !== 'finished') return;
    // Si viene de finished, reseteamos a 2 ciclos
    setRemainingCycles(2);
    isActiveRef.current = true;
    runCycle(2);
  };

  const handleStop = () => {
    isActiveRef.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onClose();
  };

  if (!isOpen) return null;

  // Estilos dinámicos basados en la fase (High Performance CSS)
  let circleScale = 'scale-100';
  let circleOpacity = 'opacity-30';
  let duration = 'duration-1000'; 
  let colorClass = 'bg-cyan-500'; // Color por defecto
  let glowClass = 'shadow-[0_0_50px_rgba(34,211,238,0.1)]';

  if (phase === 'inhale') {
    circleScale = 'scale-[2.5]';
    circleOpacity = 'opacity-100';
    duration = 'duration-[4000ms]';
  } else if (phase === 'hold') {
    circleScale = 'scale-[2.5]';
    circleOpacity = 'opacity-80';
    duration = 'duration-0'; // Pausa visual
  } else if (phase === 'exhale') {
    circleScale = 'scale-75';
    circleOpacity = 'opacity-40';
    duration = 'duration-[6000ms]';
  } else if (phase === 'finished') {
    circleScale = 'scale-110';
    circleOpacity = 'opacity-60';
    colorClass = 'bg-emerald-500'; // Verde éxito
    glowClass = 'shadow-[0_0_50px_rgba(16,185,129,0.3)]';
    duration = 'duration-[1000ms]';
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in touch-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black pointer-events-none" />

      {/* Círculo Interactivo */}
      <div 
        className="relative flex items-center justify-center w-64 h-64 cursor-pointer mb-8"
        onClick={phase === 'ready' ? handleStart : undefined}
      >
        {/* Anillo exterior (Glow) */}
        <div className={`absolute w-32 h-32 rounded-full ${colorClass} blur-2xl transition-all ease-in-out ${duration} ${circleScale} ${circleOpacity}`} />
        
        {/* Círculo central */}
        <div className={`absolute w-32 h-32 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm flex items-center justify-center transition-all ease-in-out ${duration} ${circleScale} ${glowClass}`}>
            {phase === 'ready' && (
                <span className="animate-pulse text-4xl">👆</span>
            )}
            {phase === 'finished' && (
                <span className="text-4xl animate-bounce">✨</span>
            )}
        </div>
      </div>

      {/* Textos e Instrucciones */}
      <div className="text-center z-10 px-6 h-32 flex flex-col items-center justify-center">
        <h2 className="font-title text-3xl md:text-4xl font-bold text-white tracking-wider transition-all duration-300">
          {text}
        </h2>
        
        {/* Subtitulo / Contador */}
        <p className="text-white/50 mt-4 font-body text-sm md:text-base transition-opacity duration-300">
            {phase === 'ready' && 'Respiración guiada para bajar la ansiedad.'}
            {(phase === 'inhale' || phase === 'hold' || phase === 'exhale') && (
                <span className="font-mono text-cyan-300 bg-cyan-900/20 px-3 py-1 rounded-full border border-cyan-500/30">
                    Faltan: {remainingCycles}/2
                </span>
            )}
            {phase === 'finished' && '¿Te sentís un poco más relajado/a?'}
        </p>
      </div>

      {/* Botones de control */}
      <div className="absolute bottom-10 flex gap-4 z-20">
        {phase === 'finished' ? (
          <>
             <button 
              onClick={handleStart}
              className="px-6 py-3 rounded-full border border-white/20 text-white hover:bg-white/10 transition-all active:scale-95 font-body text-sm"
            >
              ↻ Repetir
            </button>
            <button 
              onClick={handleStop}
              className="px-8 py-3 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold hover:bg-emerald-500/30 transition-all active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.2)] font-body text-sm"
            >
              Sí, gracias
            </button>
          </>
        ) : (
          <button 
            onClick={handleStop}
            className="px-6 py-2 rounded-full border border-white/10 text-white/50 hover:bg-white/10 hover:text-white transition-all uppercase text-xs tracking-widest"
          >
            Cerrar
          </button>
        )}
      </div>
    </div>
  );
};

export default BreathingModal;