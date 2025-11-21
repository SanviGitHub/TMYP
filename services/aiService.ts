
import { API_ENDPOINTS, EMERGENCIES, SYSTEM_PROMPT_TEMPLATE, FALLBACK_RESPONSES } from '../constants';
import { EmergencyInfo, Message } from '../types';

export const detectEmergency = (msg: string): EmergencyInfo[] => {
  const lower = msg.toLowerCase();
  const detected: EmergencyInfo[] = [];
  for (const key in EMERGENCIES) {
    const data = EMERGENCIES[key];
    if (data.keywords.some(kw => lower.includes(kw))) detected.push(data);
  }
  return detected;
};

export const generateEmergencyResponse = (detected: EmergencyInfo[], isUrgent: boolean): string | null => {
  if (detected.length === 0) return null;
  const p = detected[0];
  return isUrgent 
    ? `🚨 URGENTE: Llamá al ${p.number} (${p.name}) AHORA. ` 
    : `Te doy el ${p.number} (${p.name}) - ${p.desc}. `;
};

export const detectPromptHack = (msg: string): boolean => {
  const kw = ['system prompt', 'ignore all previous instructions', 'tu configuracion interna'];
  return kw.some(k => msg.toLowerCase().includes(k));
};

export const processResponse = (text: string): string => {
  let clean = text.replace(/^(IYM:|Assistant:|AI:)/i, '').replace(/\*\*|__/g, '').trim();
  if (clean.length > 10 && !clean.match(/[.!?]$/)) {
     const lastPunc = Math.max(clean.lastIndexOf('.'), clean.lastIndexOf('!'), clean.lastIndexOf('?'));
     if (lastPunc > clean.length * 0.7) clean = clean.substring(0, lastPunc + 1);
     else clean += ".";
  }
  return clean;
};

// Utility to get a random fallback message
const getFallbackResponse = (): string => {
  const randomIndex = Math.floor(Math.random() * FALLBACK_RESPONSES.length);
  return FALLBACK_RESPONSES[randomIndex];
};

export const sendMessageToAI = async (messages: Message[], userText: string): Promise<string> => {
    // 1. Security Checks
    if (detectPromptHack(userText)) {
      return "Soy IYM, tu psicólogo personal. Enfoquémonos en lo que te pasa a vos. 😊";
    }

    // 2. Emergency Detection
    const emergencies = detectEmergency(userText);
    const urgentKW = ['suicidio', 'matarme', 'quitarme la vida', 'cortarme', 'acabar con todo'];
    const isUrgent = urgentKW.some(k => userText.toLowerCase().includes(k));
    
    let emergencyContext = "";
    let preResponse = "";

    if (isUrgent) {
      const resp = generateEmergencyResponse(emergencies, true);
      if (resp) preResponse = resp + " Mientras tanto, contame qué te está pasando. ";
    }

    if (emergencies.length > 0) {
       const info = generateEmergencyResponse(emergencies, false);
       emergencyContext = `CONTEXTO EMERGENCIA: Usuario mencionó temas delicados (${emergencies.map(e=>e.name).join(', ')}). Números disponibles: ${info}`;
    }

    // 3. Build Payload
    const systemPrompt = SYSTEM_PROMPT_TEMPLATE(emergencyContext);
    const conversationHistory = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));
    const fullMessages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory, 
        { role: "user", content: userText }
    ];

    let reply = "";
    let success = false;

    // 4. API Attempt Loop
    for (const api of API_ENDPOINTS) {
        try {
            // Abort controller to prevent hanging requests (timeout 8s)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(api.url, {
                method: "POST", 
                headers: { 
                    "Authorization": `Bearer ${api.key}`, 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({ 
                    model: api.model, 
                    messages: fullMessages, 
                    max_tokens: 800, 
                    temperature: 0.6 
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0]?.message?.content;
                if (content) {
                    reply = content;
                    success = true;
                    break; // Success! Exit loop
                }
            } else {
                // Log error but continue loop
                console.warn(`API ${api.model} failed with status: ${response.status}`);
            }
        } catch (e) {
            console.warn(`Network/Fetch Error with ${api.model}:`, e);
            // Continue to next API
        }
    }

    // 5. Fallback Logic (Offline Mode)
    if (!success) {
        console.warn("All APIs failed or network offline. Using therapeutic simulation fallback.");
        reply = getFallbackResponse();
    } else {
        reply = processResponse(reply);
    }

    // Append non-urgent emergency info if needed
    if (emergencies.length > 0 && !isUrgent && !reply.includes('135')) {
        const info = generateEmergencyResponse(emergencies, false);
        if (info) reply = info + "\n\n" + reply;
    }

    return preResponse + reply;
};
