import React, { useEffect, useRef, useState } from 'react';

const UpdateChecker: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'updating' | 'success'>('idle');
  const initialShaRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const fetchSha = async () => {
      try {
        // Fetch latest commit from main branch
        // Using 'no-store' to prevent browser caching of the API response
        const res = await fetch('https://api.github.com/repos/SanviGitHub/tmyp/commits/main', {
            cache: 'no-store'
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.sha;
      } catch (e) {
        console.error("Error checking updates:", e);
        return null;
      }
    };

    // 1. Get Initial SHA on mount
    fetchSha().then(sha => {
      if (isMountedRef.current && sha) {
        initialShaRef.current = sha;
        console.log("System Version:", sha.substring(0, 7));
      }
    });

    // 2. Poll every 70 seconds (safe for GitHub API rate limits 60/hr)
    const interval = setInterval(async () => {
      if (status !== 'idle' || !initialShaRef.current) return;
      
      const latestSha = await fetchSha();
      
      // If we have both SHAs and they are different -> Update Detected
      if (latestSha && initialShaRef.current && latestSha !== initialShaRef.current) {
        triggerUpdateFlow();
      }
    }, 70000); 

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [status]);

  const triggerUpdateFlow = () => {
    if (!isMountedRef.current) return;
    setStatus('updating');
    
    // Phase 1: "Uploading" simulation (5 seconds)
    setTimeout(() => {
        if (!isMountedRef.current) return;
        setStatus('success');
        
        // Phase 2: "New Update" message (1.5 seconds)
        setTimeout(() => {
            if (isMountedRef.current) {
                window.location.reload();
            }
        }, 1500);
    }, 5000);
  };

  if (status === 'idle') return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6 animate-fade-in cursor-wait touch-none select-none">
        {/* Background Grid Effect */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        {status === 'updating' && (
            <>
                <div className="relative mb-8">
                    <div className="w-20 h-20 rounded-full border-4 border-white/10 border-t-accent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl">📡</span>
                    </div>
                </div>
                <h2 className="font-title text-2xl md:text-4xl text-white font-bold animate-pulse leading-tight">
                    Se está subiendo una nueva Actualización espera...
                </h2>
                <p className="text-accent/80 mt-4 font-body font-mono text-sm uppercase tracking-widest">
                    Sincronizando con base de datos :: ESPERA
                </p>
            </>
        )}

        {status === 'success' && (
             <>
                <div className="mb-8 relative">
                    <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center animate-bounce">
                         <span className="text-5xl">✅</span>
                    </div>
                    <div className="absolute inset-0 rounded-full bg-emerald-500 blur-xl opacity-40 animate-pulse"></div>
                </div>
                <h2 className="font-title text-3xl md:text-5xl text-white font-bold leading-tight animate-[fadeIn_0.5s_ease-out]">
                    Nueva Actualización
                </h2>
                <p className="text-emerald-400 mt-4 font-body font-medium">
                    Reiniciando sistema...
                </p>
            </>
        )}
    </div>
  );
};

export default UpdateChecker;