
import React, { useState, useEffect, useRef } from 'react';
import TheBola from './components/TheBola';
import Navigation from './components/Navigation';
import ChatInterface from './components/ChatInterface';
import VentModal from './components/VentModal';
import SOSModal from './components/SOSModal';
import BreathingModal from './components/BreathingModal';
import MoodSelector from './components/MoodSelector';
import FocusModal from './components/FocusModal';
import DailyChallenge from './components/DailyChallenge';
import UpdateChecker from './components/UpdateChecker';
import TutorialOverlay from './components/TutorialOverlay'; 
import { Message, MoodOption } from './types';
import { QUOTES, MOODS } from './constants';
import { sendMessageToAI } from './services/aiService';
import { audioService } from './services/audioService';

// VISUAL COMPONENTS
const CinematicOverlay = () => (
  <>
    <div className="bg-grid fixed inset-0 z-[-2] animate-grid-flow opacity-30 md:opacity-40"></div>
    <div className="fixed inset-0 z-[1] pointer-events-none opacity-30 overflow-hidden">
        <div className="absolute w-full h-[200%] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] animate-dust opacity-20"></div>
    </div>
    <div className="bg-noise fixed inset-0 pointer-events-none z-[90]"></div>
    <div className="scanlines fixed inset-0 pointer-events-none z-[80]"></div>
    <div className="fixed inset-0 pointer-events-none z-[70] bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"></div>
  </>
);

const AmbientAurora = ({ color }: { color: string }) => (
  <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none transition-colors duration-[2000ms]">
    <div 
      className="absolute -top-[10%] -right-[10%] w-[80vh] h-[80vh] rounded-full blur-[140px] opacity-20 animate-float"
      style={{ backgroundColor: color }}
    />
    <div 
      className="absolute -bottom-[10%] -left-[10%] w-[70vh] h-[70vh] rounded-full blur-[120px] opacity-15 animate-float-delayed"
      style={{ backgroundColor: color }}
    />
  </div>
);

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTalking, setIsTalking] = useState(false);
  const [isThinking, setIsThinking] = useState(false); 
  const [zenMode, setZenMode] = useState(false); 
  
  const [activeModal, setActiveModal] = useState<'vent' | 'sos' | 'breathe' | 'mood' | 'focus' | null>(null);
  const [currentMood, setCurrentMood] = useState<MoodOption>(MOODS[0]); 
  
  // Estado para el efecto de flash de color (Mood Transition)
  const [moodTransitionColor, setMoodTransitionColor] = useState<string | null>(null);

  const [quote, setQuote] = useState("Cargando paz mental...");
  const [isMuted, setIsMuted] = useState(true);
  
  const [showTutorial, setShowTutorial] = useState(true);
  
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    
    const quoteInterval = setInterval(() => {
        if (zenMode) {
            setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
        }
    }, 15000);

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      clearInterval(quoteInterval);
      audioService.stop(); 
    };
  }, [zenMode]);

  useEffect(() => {
    if (!isMuted && !showTutorial) {
        audioService.updateMood(currentMood.id);
    }
  }, [currentMood, isMuted, showTutorial]);

  const startConversation = () => {
      typingTimeoutRef.current = setTimeout(() => {
        addMessageWithTyping("¡Hola! Soy IYM. Estoy acá para escucharte, sin juzgarte. ¿Cómo venís hoy?", 'assistant');
      }, 800);
  };

  const handleToggleSound = async () => {
    const newMuteState = audioService.toggle();
    setIsMuted(newMuteState);
  };

  const handleTutorialClick = () => {
      setActiveModal('mood');
  };

  const handleMoodChange = (mood: MoodOption) => {
    // 1. Activar Flash Effect
    setMoodTransitionColor(mood.color);
    
    // 2. Apagar Flash después de la transición
    setTimeout(() => setMoodTransitionColor(null), 600); // Duración del flash

    setCurrentMood(mood);
    setActiveModal(null);
    
    if (showTutorial) {
        setShowTutorial(false);
        audioService.start(); 
        setIsMuted(false);
        startConversation();
    }
    
    const systemMsg: Message = {
        role: 'system', 
        content: `✨ <em>Ambiente cambiado a: <strong>${mood.label}</strong></em>`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, systemMsg]);
  };

  const addMessageWithTyping = (text: string, role: 'assistant' | 'user') => {
    if (role === 'user') {
      const msg: Message = { 
        role, 
        content: text, 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };
      setMessages(prev => [...prev, msg]);
    } else {
      setIsTalking(true);
      const msgTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: msgTimestamp }]);
      
      let i = 0;
      const speed = 20; 
      
      const typeChar = () => {
        setMessages(prev => {
          if (prev.length === 0) return prev;
          const newArr = [...prev];
          const lastIdx = newArr.length - 1;
          newArr[lastIdx] = { 
            ...newArr[lastIdx], 
            content: text.substring(0, i + 1) 
          };
          return newArr;
        });

        i++;
        if (i < text.length) {
          typingTimeoutRef.current = setTimeout(typeChar, speed);
        } else {
          setIsTalking(false);
        }
      };
      
      typeChar();
    }
  };

  const handleSendMessage = async (text: string) => {
    addMessageWithTyping(text, 'user');
    setIsThinking(true); 
    
    try {
      const textWithContext = `[CONTEXTO ACTUAL DEL USUARIO: ${currentMood.systemContext}]\n\n${text}`;
      const response = await sendMessageToAI(messages, textWithContext);
      setIsThinking(false); 
      addMessageWithTyping(response, 'assistant'); 
    } catch (error) {
      console.error(error);
      setIsThinking(false);
      setIsTalking(false); 
      addMessageWithTyping("Me desconecté un segundo del universo. ¿Me lo repetís? 😅", 'assistant');
    }
  };

  const handleReset = () => {
    if (window.confirm("¿Querés borrar todo y empezar de cero?")) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setMessages([]);
      setIsTalking(false);
      setIsThinking(false);
      setCurrentMood(MOODS[0]); 
      setShowTutorial(true); 
      
      setTimeout(() => {
        setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
        addMessageWithTyping("Listo, borrón y cuenta nueva. ¿En qué te puedo ayudar ahora?", 'assistant');
      }, 300);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-bg text-gray-100 font-body selection:bg-primary/30">
      
      {/* 1. VISUAL LAYERS */}
      <CinematicOverlay />
      <AmbientAurora color={currentMood.threeColor} />
      <div className="fixed inset-0 bg-gradient-to-b from-[#0b0c15]/20 via-transparent to-[#0b0c15]/60 z-0 pointer-events-none" />
      
      {/* MOOD FLASH TRANSITION: Una capa que se inunda de color y se desvanece */}
      <div 
        className="fixed inset-0 z-[150] pointer-events-none transition-opacity duration-700 ease-out mix-blend-screen"
        style={{ 
            backgroundColor: moodTransitionColor || 'transparent',
            opacity: moodTransitionColor ? 0.4 : 0
        }}
      />

      {/* 2. The Bola (With Zen Prop) */}
      <TheBola 
        isTalking={isTalking} 
        isThinking={isThinking}
        moodColor={currentMood.threeColor}
        isZen={zenMode}
      />

      {/* 3. Main Layout */}
      <div className="relative z-20 w-full h-full flex flex-col md:flex-row max-w-[1800px] mx-auto pointer-events-none md:pl-20">
        
        {/* Navigation */}
        <div className="pointer-events-auto z-50">
            <Navigation 
            onVent={() => setActiveModal('vent')}
            onBreathe={() => setActiveModal('breathe')}
            onFocus={() => setActiveModal('focus')} 
            onReset={handleReset}
            onSOS={() => setActiveModal('sos')}
            onMood={handleTutorialClick} 
            onToggleSound={handleToggleSound}
            onToggleZen={() => setZenMode(!zenMode)} 
            isMuted={isMuted}
            isZen={zenMode}
            highlightMood={showTutorial} 
            />
        </div>

        {/* Daily Challenge Widget (Hidden in Zen or Mobile if needed) */}
        {!zenMode && !showTutorial && (
           <div className="pointer-events-auto">
              <DailyChallenge />
           </div>
        )}

        {/* Center Stage (Quote) */}
        <section className={`
            flex-1 flex flex-col items-center transition-all duration-1000 ease-in-out pointer-events-none z-30 px-4
            ${zenMode 
                ? 'justify-center pb-0 opacity-100' 
                : 'hidden md:flex justify-end pb-10 md:pb-24 opacity-100'}
        `}>
           <div className={`
              bg-black/40 backdrop-blur-md px-5 py-3 md:px-12 md:py-8 rounded-3xl border border-white/10 
              text-white/90 font-light text-[0.8rem] md:text-xl tracking-wide shadow-2xl animate-fade-in 
              text-center max-w-xl mx-auto transition-all duration-500
              ${showTutorial ? 'opacity-0' : 'opacity-100'}
              ${zenMode ? 'scale-105' : 'scale-100'}
           `}>
             "{quote}"
             {zenMode && (
               <div className="mt-4 text-[0.6rem] text-white/40 tracking-[0.3em] uppercase animate-pulse">
                  Modo Inmersivo
               </div>
             )}
           </div>
        </section>

        {/* Chat Panel */}
        <div className={`
            absolute md:static bottom-0 w-full md:w-auto h-auto md:h-full flex md:items-end md:justify-end 
            pointer-events-auto z-40 transition-all duration-700 transform 
            ${showTutorial || zenMode ? 'opacity-0 pointer-events-none translate-y-20 md:translate-y-0 md:translate-x-20' : 'opacity-100 translate-y-0 md:translate-x-0'}
        `}>
             <ChatInterface 
                messages={messages} 
                isTalking={isTalking} 
                onSendMessage={handleSendMessage}
             />
        </div>
      </div>

      {/* 4. Modals & Overlays */}
      <TutorialOverlay isVisible={showTutorial && !activeModal} />

      <VentModal isOpen={activeModal === 'vent'} onClose={() => setActiveModal(null)} />
      <SOSModal isOpen={activeModal === 'sos'} onClose={() => setActiveModal(null)} />
      <BreathingModal isOpen={activeModal === 'breathe'} onClose={() => setActiveModal(null)} />
      <FocusModal isOpen={activeModal === 'focus'} onClose={() => setActiveModal(null)} />
      
      <MoodSelector 
        isOpen={activeModal === 'mood'} 
        onClose={() => setActiveModal(null)} 
        onSelectMood={handleMoodChange}
        currentMoodId={currentMood.id}
      />

      <UpdateChecker />

    </div>
  );
};

export default App;
