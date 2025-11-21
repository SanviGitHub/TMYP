import React from 'react';
import { MOODS } from '../constants';
import { MoodOption } from '../types';

interface MoodSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMood: (mood: MoodOption) => void;
  currentMoodId: string;
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ isOpen, onClose, onSelectMood, currentMoodId }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-bg/80 border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 relative z-10">
          <h2 className="font-title text-2xl text-white font-bold">¿Cómo te sentís hoy?</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors text-2xl">✕</button>
        </div>
        
        {/* Grid of Moods */}
        <div className="grid grid-cols-1 gap-3 relative z-10">
          {MOODS.map((mood) => (
            <button
              key={mood.id}
              onClick={() => onSelectMood(mood)}
              className={`
                relative flex items-center p-4 rounded-xl border transition-all duration-300 group overflow-hidden
                ${currentMoodId === mood.id 
                  ? 'bg-white/10 border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'}
              `}
            >
              {/* Hover Gradient Background based on mood color */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                style={{ background: `linear-gradient(90deg, transparent, ${mood.color})` }}
              />
              
              <span className="text-3xl mr-4 filter drop-shadow-lg">{mood.emoji}</span>
              <div className="text-left">
                <div className={`font-bold font-title text-lg ${currentMoodId === mood.id ? 'text-white' : 'text-gray-300'}`}>
                  {mood.label}
                </div>
              </div>
              
              {/* Active Indicator */}
              {currentMoodId === mood.id && (
                <div className="absolute right-4 w-3 h-3 rounded-full bg-white shadow-[0_0_10px_white]" />
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-white/20 text-xs mt-6 font-body">
          IYM adaptará su personalidad a tu estado.
        </p>
      </div>
    </div>
  );
};

export default MoodSelector;