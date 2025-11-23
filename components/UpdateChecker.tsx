
import React, { useEffect, useRef, useState } from 'react';

const UpdateChecker: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'updating' | 'success'>('idle');
  const initialShaRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const fetchSha = async () => {
      try {
        // Cache Buster: Timestamp como parámetro + Headers 'no-store'.
        // Esto fuerza al navegador y proxies a pedir una copia fresca a GitHub.
        const timestamp = new Date().getTime();
        const res = await fetch(`https://api.github.com/repos/SanviGitHub/tmyp/commits/main?t=${timestamp}`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            mode: 'cors', // Asegurar CORS
        });
        
        if (!res.ok) {
            // Si falla (ej: 403 rate limit), no hacemos nada, intentamos en el prox ciclo.
            return null;
        }
        
        const data = await res.json();
        return data.sha;
      } catch (e) {
        // Silenciar errores de red (Failed to fetch) para no alarmar al usuario en consola.
        // Es normal que falle si la red fluctúa.
        return null;
      }
    };

    // 1. Chequeo Inicial
    fetchSha().then(sha => {
      if (isMountedRef.current && sha) {
        initialShaRef.current = sha;
        console.log("System Version (v1.2):", sha.substring(0, 7));
      }
    });

    // 2. Intervalo de Polling (30 segundos)
    // Más frecuente para que se sienta "despierto", pero seguro.
    const interval = setInterval(async () => {
      if (status !== 'idle' || !initialShaRef.current) return;
      
      const latestSha = await fetchSha();
      
      if (latestSha && initialShaRef.current && latestSha !== initialShaRef.current) {
        console.log("New update detected:", latestSha);
        triggerUpdateFlow();
      }
    }, 30000); 

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [status]);

  const triggerUpdateFlow = () => {
    if (!isMountedRef.current) return;
    setStatus('updating');
    
    // Simulación de carga (4s)
    setTimeout(() => {
        if (!isMountedRef.current) return;
        setStatus('success');
        
        // Reinicio (1.5s después del éxito)
        setTimeout(() => {
            if (isMountedRef.current) {
                window.location.reload();
            }
        }, 1500);
    }, 4000);
  };

  if (status === 'idle') return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6 animate-fade-in cursor-wait touch-none select-none">
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
                    Actualizando Sistema...
                </h2>
                <p className="text-accent/80 mt-4 font-body font-mono text-sm uppercase tracking-widest">
                    Sincronizando con Servidor :: ESPERA
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
                    Actualización Completada
                </h2>
                <p className="text-emerald-400 mt-4 font-body font-medium">
                    Reiniciando para aplicar cambios...
                </p>
            </>
        )}
    </div>
  );
};

export default UpdateChecker;
