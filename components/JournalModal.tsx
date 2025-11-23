
import React, { useEffect, useState } from 'react';
import { MOODS } from '../constants';

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MoodEntry {
    date: string;
    moodId: string;
    timestamp: number;
}

const JournalModal: React.FC<JournalModalProps> = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [stats, setStats] = useState<{label: string, count: number, color: string}[]>([]);

  useEffect(() => {
    if (isOpen) {
        // Load data from LocalStorage
        const raw = localStorage.getItem('iym_mood_history');
        if (raw) {
            const parsed: MoodEntry[] = JSON.parse(raw);
            // Sort by new first
            const sorted = parsed.sort((a, b) => b.timestamp - a.timestamp);
            setHistory(sorted);
            calculateStats(sorted);
        }
    }
  }, [isOpen]);

  const calculateStats = (data: MoodEntry[]) => {
      const counts: Record<string, number> = {};
      data.forEach(entry => {
          counts[entry.moodId] = (counts[entry.moodId] || 0) + 1;
      });

      const processed = Object.keys(counts).map(id => {
          const mood = MOODS.find(m => m.id === id);
          return {
              label: mood?.label || id,
              count: counts[id],
              color: mood?.color || '#fff'
          };
      }).sort((a,b) => b.count - a.count);

      setStats(processed);
  };

  const clearHistory = () => {
      if(window.confirm('¿Borrar todo el historial? No se puede deshacer.')) {
          localStorage.removeItem('iym_mood_history');
          setHistory([]);
          setStats([]);
      }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/85 backdrop-blur-xl animate-fade-in p-4 md:p-8">
      {/* Background Hologram Effect */}
      <div className="absolute inset-0 z-0 bg-grid opacity-20 pointer-events-none" />
      
      <div className="w-full max-w-4xl bg-[#0b0c15]/90 border border-white/10 rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
            <div>
                <h2 className="font-title text-2xl md:text-3xl text-white font-bold flex items-center gap-2">
                   💾 Diario Holográfico
                </h2>
                <p className="text-white/40 text-xs md:text-sm mt-1">Tu registro emocional en la nube local.</p>
            </div>
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors text-2xl">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col md:flex-row gap-8">
            
            {/* Left: Stats & Summary */}
            <div className="md:w-1/3 space-y-6">
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                    <h3 className="text-white font-bold mb-4 uppercase text-xs tracking-widest text-accent">Análisis de Frecuencia</h3>
                    {stats.length === 0 ? (
                        <p className="text-white/30 text-sm italic">Sin datos suficientes.</p>
                    ) : (
                        <div className="space-y-3">
                            {stats.map((stat, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]" style={{color: stat.color, backgroundColor: stat.color}} />
                                    <span className="text-sm text-gray-300 flex-1">{stat.label.split('/')[0]}</span>
                                    <span className="font-mono text-white font-bold">{stat.count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button 
                    onClick={clearHistory}
                    className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs uppercase tracking-widest transition-all"
                >
                    Formatear Memoria
                </button>
            </div>

            {/* Right: Timeline Grid */}
            <div className="md:w-2/3">
                <h3 className="text-white font-bold mb-4 uppercase text-xs tracking-widest text-accent sticky top-0 bg-[#0b0c15] pb-2 z-10">Línea de Tiempo</h3>
                
                {history.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl">
                        <span className="text-4xl opacity-20 mb-2">📂</span>
                        <p className="text-white/30">El diario está vacío.</p>
                        <p className="text-white/20 text-xs">Seleccioná un estado de ánimo para empezar.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {history.map((entry, idx) => {
                            const mood = MOODS.find(m => m.id === entry.moodId);
                            const dateObj = new Date(entry.timestamp);
                            
                            return (
                                <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                                    <div className="flex flex-col items-center min-w-[50px]">
                                        <span className="text-xs text-white/40 font-mono">{dateObj.getDate()}/{dateObj.getMonth()+1}</span>
                                        <span className="text-xs text-white/30">{dateObj.getHours()}:{dateObj.getMinutes() < 10 ? '0'+dateObj.getMinutes() : dateObj.getMinutes()}</span>
                                    </div>
                                    
                                    <div className="h-8 w-px bg-white/10" />
                                    
                                    <div className="flex items-center gap-3 flex-1">
                                        <span className="text-2xl group-hover:scale-110 transition-transform">{mood?.emoji || '❓'}</span>
                                        <div>
                                            <h4 className="text-white font-bold text-sm">{mood?.label || 'Desconocido'}</h4>
                                        </div>
                                    </div>

                                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: mood?.color || '#555', boxShadow: `0 0 10px ${mood?.color}`}} />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default JournalModal;
