
import React, { useState, useEffect, useRef } from 'react';
import TheBola from './components/TheBola';
import Navigation from './components/Navigation';
import ChatInterface from './components/ChatInterface';
import VentModal from './components/VentModal';
import SOSModal from './components/SOSModal';
import BreathingModal from './components/BreathingModal';
import MoodSelector from './components/MoodSelector';
import UpdateChecker from './components/UpdateChecker';
import TutorialOverlay from './components/TutorialOverlay'; // Imported
import { Message, MoodOption } from './types';
import { QUOTES, MOODS } from './constants';
import { sendMessageToAI } from './services/aiService';
import { audioService } from './services/audioService';

const App: React.FC = () => {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTalking, setIsTalking] = useState(false);
  const [activeModal, setActiveModal] = useState<'vent' | 'sos' | 'breathe' | 'mood' | null>(null);
  const [currentMood, setCurrentMood] = useState<MoodOption>(MOODS[0]); // Default: Neutral
  const [quote, setQuote] = useState("Cargando paz mental...");
  const [isMuted, setIsMuted] = useState(true);
  
  // Tutorial State: Starts TRUE to force onboarding
  const [showTutorial, setShowTutorial] = useState(true);
  
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial Setup
  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      audioService.stop(); // Clean up audio
    };
  }, []);

  // Update audio when mood changes
  useEffect(() => {
    if (!isMuted && !showTutorial) {
        audioService.updateMood(currentMood.id);
    }
  }, [currentMood, isMuted, showTutorial]);

  const startConversation = () => {
      // Small delay for aesthetics
      typingTimeoutRef.current = setTimeout(() => {
        addMessageWithTyping("¡Hola! Soy IYM. Estoy acá para escucharte, sin juzgarte. ¿Cómo venís hoy?", 'assistant');
      }, 800);
  };

  const handleToggleSound = async () => {
    // AudioContext needs a user gesture to start
    const newMuteState = audioService.toggle();
    setIsMuted(newMuteState);
  };

  const handleTutorialClick = () => {
      // User clicked the Highlighted Mood Button
      setActiveModal('mood');
      // We don't hide tutorial yet, we hide it after selection
  };

  const handleMoodChange = (mood: MoodOption) => {
    setCurrentMood(mood);
    setActiveModal(null);
    
    // ONBOARDING FINISHED
    if (showTutorial) {
        setShowTutorial(false);
        // Initialize Audio automatically on this first valid interaction
        audioService.start(); 
        setIsMuted(false);
        // Start chat only after onboarding
        startConversation();
    }
    
    // Add a small system message to chat (visible only to user to confirm change)
    const systemMsg: Message = {
        role: 'system', 
        content: `✨ <em>Ambiente cambiado a: <strong>${mood.label}</strong></em>`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, systemMsg]);
  };

  // Helper to add message with "typing" visual effect
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
      
      // Add placeholder
      setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: msgTimestamp }]);
      
      let i = 0;
      const speed = 20; // Faster typing for better UX
      
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
    setIsTalking(true);
    
    try {
      // INJECT MOOD CONTEXT INVISIBLE TO USER BUT VISIBLE TO AI
      // We prepend a system instruction to the user's text just for the API call
      const textWithContext = `[CONTEXTO ACTUAL DEL USUARIO: ${currentMood.systemContext}]\n\n${text}`;

      // Pass current messages context
      const response = await sendMessageToAI(messages, textWithContext);
      addMessageWithTyping(response, 'assistant'); 
    } catch (error) {
      console.error(error);
      setIsTalking(false); 
      addMessageWithTyping("Me desconecté un segundo del universo. ¿Me lo repetís? 😅", 'assistant');
    }
  };

  const handleReset = () => {
    if (window.confirm("¿Querés borrar todo y empezar de cero?")) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setMessages([]);
      setIsTalking(false);
      setCurrentMood(MOODS[0]); // Reset mood too
      setShowTutorial(true); // Optional: Restart tutorial? Let's keep it off for reset to avoid annoyance.
      // Actually, let's just restart conversation, not tutorial.
      
      setTimeout(() => {
        setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
        addMessageWithTyping("Listo, borrón y cuenta nueva. ¿En qué te puedo ayudar ahora?", 'assistant');
      }, 300);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-bg text-gray-100 font-body selection:bg-primary/30">
      
      {/* 1. Background Visuals */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#020205] via-[#0c0c14] to-[#050505] z-0" />
      
      {/* 2. The Bola (3D Sphere & Stars) - NOW WITH DYNAMIC MOOD COLOR */}
      <TheBola isTalking={isTalking} moodColor={currentMood.threeColor} />

      {/* 3. Main Layout */}
      <div className="relative z-20 w-full h-full flex flex-col md:flex-row max-w-[1800px] mx-auto pointer-events-none md:pl-20">
        
        {/* Navigation: Z-50 to stay above Tutorial Overlay (Z-45) */}
        <div className="pointer-events-auto z-50">
            <Navigation 
            onVent={() => setActiveModal('vent')}
            onBreathe={() => setActiveModal('breathe')}
            onReset={handleReset}
            onSOS={() => setActiveModal('sos')}
            onMood={handleTutorialClick} // Handle click specially for tutorial/normal use
            onToggleSound={handleToggleSound}
            isMuted={isMuted}
            highlightMood={showTutorial} // Prop to highlight button during tutorial
            />
        </div>

        {/* Center Stage (Quote) */}
        <section className="hidden md:flex flex-1 flex-col items-center justify-end pb-10 md:pb-24 pointer-events-none z-30 px-4">
           <div className={`bg-black/40 backdrop-blur-md px-6 py-4 md:px-8 md:py-5 rounded-3xl border border-white/10 text-white/80 font-light text-sm md:text-base tracking-wide shadow-2xl animate-fade-in hover:text-white hover:border-white/20 transition-all duration-500 text-center max-w-md mx-auto ${showTutorial ? 'opacity-0' : 'opacity-100'}`}>
             "{quote}"
           </div>
        </section>

        {/* Chat Panel - Hidden during tutorial for cleaner focus */}
        <div className={`flex md:items-end md:justify-end h-full w-full md:w-auto pointer-events-auto z-40 transition-opacity duration-1000 ${showTutorial ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
             <ChatInterface 
                messages={messages} 
                isTalking={isTalking} 
                onSendMessage={handleSendMessage}
             />
        </div>
      </div>

      {/* 4. Modals & Overlays - Separated from wrapper to manage Z-indices individually */}
      <TutorialOverlay isVisible={showTutorial && !activeModal} />

      <VentModal isOpen={activeModal === 'vent'} onClose={() => setActiveModal(null)} />
      <SOSModal isOpen={activeModal === 'sos'} onClose={() => setActiveModal(null)} />
      <BreathingModal isOpen={activeModal === 'breathe'} onClose={() => setActiveModal(null)} />
      
      <MoodSelector 
        isOpen={activeModal === 'mood'} 
        onClose={() => {
            // If tutorial is active, don't let them close without selecting (optional, currently allows close but overlay remains)
            setActiveModal(null);
        }} 
        onSelectMood={handleMoodChange}
        currentMoodId={currentMood.id}
      />

      <UpdateChecker />

    </div>
  );
};

export default App;
