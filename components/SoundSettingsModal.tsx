
import React, { useState, useEffect } from 'react';
import { audioService } from '../services/audioService';

interface SoundSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SoundSettingsModal: React.FC<SoundSettingsModalProps> = ({ isOpen, onClose }) => {
  const [volumes, setVolumes] = useState(audioService.getVolumes());
  const [activeBeat, setActiveBeat] = useState<'gamma' | 'alpha' | 'theta' | null>(audioService.getCurrentBinaural());
  
  // Sincronizar estado al abrir
  useEffect(() => {
    if (isOpen) {
      setVolumes(audioService.getVolumes());
      setActiveBeat(audioService.getCurrentBinaural());
    }
  }, [isOpen]);

  const handleChange = (channel: 'master' | 'bg' | 'typing' | 'sfx', val: number) => {
    setVolumes(prev => ({ ...prev, [channel]: val }));
    audioService.setVolume(channel, val);
  };

  const toggleBeat = (type: 'gamma' | 'alpha' | 'theta') => {
      if (activeBeat === type) {
          audioService.stopBinauralBeat();
          setActiveBeat(null);
      } else {
          audioService.playBinauralBeat(type);
          setActiveBeat(type);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl animate-fade-in p-6">
      <div 
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, #6366f1 0%, transparent 70%)`
        }}
      />
      
      <div className="w-full max-w-md bg-[#0b0c15] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
            <h2 className="font-title text-2xl text-white font-bold flex items-center gap-3">
                <span className="text-primary text-3xl">🎚️</span> Configuración
            </h2>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all">✕</button>
        </div>

        <div className="space-y-6">
            {/* MASTER */}
            <VolumeSlider 
                label="Volumen General" 
                icon="🔊"
                value={volumes.master} 
                onChange={(v) => handleChange('master', v)} 
                color="text-white"
                trackColor="bg-white"
            />

            <div className="h-px bg-white/10 w-full my-4" />

            {/* NEURO TUNER (Binaural Beats) */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🧠</span>
                    <h3 className="font-title font-bold text-white/90">Neuro-Sintonizador</h3>
                    <span className="text-xs text-white/40 ml-auto border border-white/10 px-2 py-0.5 rounded">Auriculares 🎧</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                    <BeatButton 
                        active={activeBeat === 'gamma'} 
                        label="Gamma" 
                        sub="40Hz Enfoque"
                        onClick={() => toggleBeat('gamma')} 
                        color="border-purple-500 text-purple-400 bg-purple-500/10"
                    />
                    <BeatButton 
                        active={activeBeat === 'alpha'} 
                        label="Alpha" 
                        sub="10Hz Calma"
                        onClick={() => toggleBeat('alpha')} 
                        color="border-blue-500 text-blue-400 bg-blue-500/10"
                    />
                    <BeatButton 
                        active={activeBeat === 'theta'} 
                        label="Theta" 
                        sub="4Hz Sueño"
                        onClick={() => toggleBeat('theta')} 
                        color="border-indigo-500 text-indigo-400 bg-indigo-500/10"
                    />
                </div>
            </div>

            <div className="h-px bg-white/10 w-full my-4" />

            {/* BACKGROUND */}
            <VolumeSlider 
                label="Música de Fondo" 
                icon="🎵"
                value={volumes.bg} 
                onChange={(v) => handleChange('bg', v)} 
                color="text-indigo-400"
                trackColor="bg-indigo-500"
            />

            {/* TYPING */}
            <VolumeSlider 
                label="Sonido de Escritura" 
                icon="⌨️"
                value={volumes.typing} 
                onChange={(v) => handleChange('typing', v)} 
                color="text-emerald-400"
                trackColor="bg-emerald-500"
            />

            {/* SFX */}
            <VolumeSlider 
                label="Efectos Especiales" 
                icon="✨"
                value={volumes.sfx} 
                onChange={(v) => handleChange('sfx', v)} 
                color="text-pink-400"
                trackColor="bg-pink-500"
            />
        </div>

        <div className="mt-8 pt-4 border-t border-white/5 text-center">
             <p className="text-white/20 text-xs font-mono uppercase tracking-widest">Audio Spatial Engine v2.1</p>
        </div>
      </div>
    </div>
  );
};

interface SliderProps {
    label: string;
    icon: string;
    value: number;
    onChange: (val: number) => void;
    color: string;
    trackColor: string;
}

const VolumeSlider: React.FC<SliderProps> = ({ label, icon, value, onChange, color, trackColor }) => {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end mb-1">
                <label className={`text-sm font-bold tracking-wide ${color} flex items-center gap-2`}>
                    <span className="opacity-80">{icon}</span> {label}
                </label>
                <span className="text-xs font-mono text-white/40">{(value * 100).toFixed(0)}%</span>
            </div>
            <div className="relative h-6 flex items-center">
                <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01"
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="w-full absolute z-20 opacity-0 cursor-pointer h-full"
                />
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden absolute z-10">
                    <div 
                        className={`h-full ${trackColor} shadow-[0_0_10px_currentColor] transition-all duration-75`} 
                        style={{ width: `${value * 100}%` }}
                    />
                </div>
                <div 
                    className={`w-5 h-5 rounded-full bg-white absolute z-10 shadow-lg pointer-events-none transition-all duration-75`}
                    style={{ left: `calc(${value * 100}% - 10px)` }}
                />
            </div>
        </div>
    );
}

const BeatButton: React.FC<{ active: boolean, label: string, sub: string, onClick: () => void, color: string }> = ({ active, label, sub, onClick, color }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-300 ${active ? `${color} shadow-[0_0_15px_currentColor]` : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
    >
        <span className="font-bold text-sm">{label}</span>
        <span className="text-[0.6rem] opacity-70">{sub}</span>
        {active && <span className="w-1.5 h-1.5 rounded-full bg-current mt-1 animate-pulse" />}
    </button>
)

export default SoundSettingsModal;
