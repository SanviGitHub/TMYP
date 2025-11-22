
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

interface IntroLoaderProps {
  onComplete: () => void;
}

const IntroLoader: React.FC<IntroLoaderProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const subTextRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("LOADING..."); 
  const [subText, setSubText] = useState("");

  useEffect(() => {
    if (!containerRef.current) return;

    // --- 1. THREE.JS SETUP ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.02);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Force canvas to be behind text
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '0';
    
    containerRef.current.appendChild(renderer.domElement);

    // --- 2. THE NEURAL CORE (Shader Material) ---
    const geometry = new THREE.IcosahedronGeometry(1, 40); 
    
    const vertexShader = `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying float vDisplace;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      float snoise(vec3 v) {
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 = v - i + dot(i, C.xxx) ;
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute( permute( permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        float n_ = 0.142857142857;
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
      }

      void main() {
        vUv = uv;
        vNormal = normal;
        float noise = snoise(position * 2.5 + uTime * 0.8);
        vDisplace = noise;
        vec3 newPos = position + normal * (noise * 0.4);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying float vDisplace;

      void main() {
        vec3 viewDir = vec3(0.0, 0.0, 1.0);
        float fresnel = pow(1.0 - dot(vNormal, viewDir), 2.0);
        vec3 color = mix(uColor1, uColor2, vDisplace * 0.5 + 0.5);
        color += fresnel * vec3(0.8); 
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color("#6366f1") }, 
        uColor2: { value: new THREE.Color("#00fff2") }, 
      },
      wireframe: true,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const core = new THREE.Mesh(geometry, material);
    scene.add(core);
    camera.position.z = 3.5;

    // --- 3. ANIMATION LOOP ---
    const clock = new THREE.Clock();
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      material.uniforms.uTime.value = t;
      
      core.rotation.y = t * 0.2;
      core.rotation.z = t * 0.05;
      
      renderer.render(scene, camera);
    };
    animate();

    // --- 4. CINEMATIC SEQUENCE (GSAP) ---
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 0.5,
          onComplete: () => {
            cancelAnimationFrame(animationId);
            onComplete();
          }
        });
      }
    });

    // --- LOGICA DE SCRAMBLE TEXT ---
    const scrambleText = (finalText: string) => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&*";
        let iterations = 0;
        
        const interval = setInterval(() => {
            const scrambled = finalText
                .split("")
                .map((char, index) => {
                    if (index < iterations) {
                        return finalText[index];
                    }
                    return chars[Math.floor(Math.random() * chars.length)];
                })
                .join("");

            setText(scrambled);

            if (iterations >= finalText.length) {
                clearInterval(interval);
                setText(finalText); 
            }
            
            // SPEED UP: Increase by 2 chars per frame to reveal quickly (approx 0.3s total)
            iterations += 2; 
        }, 30); 
    };

    // --- TIMELINE EVENTS ---
    // Ensure visible text duration is at least 1.5s
    
    // 0s: Init scale
    tl.set(core.scale, { x: 0.1, y: 0.1, z: 0.1 });
    
    // 0.1s: Core Explosion
    tl.to(core.scale, { x: 1, y: 1, z: 1, duration: 1.5, ease: "elastic.out(1, 0.5)" }, 0.1);
    
    // 0.1s: Text Fade In & Scramble (IMMEDIATE START)
    tl.call(() => {
        setSubText("CREADO POR");
        gsap.to(subTextRef.current, { opacity: 1, duration: 0.5 });
        gsap.to(textRef.current, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.2 });
        scrambleText("SANTINO V. & DANTE G.");
    }, undefined, 0.1);

    // 2.0s: Flashbang start (Giving ~1.9s of text presence, ~1.6s fully readable)
    tl.to(core.scale, { x: 50, y: 50, z: 50, duration: 0.6, ease: "expo.in" }, 2.0);
    tl.to(material.uniforms.uColor1.value, { r: 1, g: 1, b: 1, duration: 0.2 }, 2.0);
    tl.to(material.uniforms.uColor2.value, { r: 1, g: 1, b: 1, duration: 0.2 }, 2.0);
    
    // Fade out text just as flashbang hits
    tl.to([textRef.current, subTextRef.current], { opacity: 0, duration: 0.2 }, 2.0);

    const handleResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h);
        camera.aspect = w/h;
        camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if(containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [onComplete]);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden"
    >
        {/* TEXT OVERLAY */}
        <div className="absolute z-[10000] flex flex-col items-center justify-center text-center w-full px-4 pointer-events-none">
             
             {/* SUBTEXT */}
             <div 
                ref={subTextRef}
                className="font-body text-accent text-xs md:text-sm tracking-[0.5em] uppercase mb-4 font-bold opacity-0"
                style={{ textShadow: '0 2px 10px rgba(0,0,0,1)' }}
             >
                {subText}
             </div>

             {/* MAIN NAMES - High Contrast */}
             <div 
                ref={textRef}
                className="font-title font-black text-3xl md:text-6xl text-white tracking-wider opacity-0 transform scale-95"
                style={{ 
                    textShadow: '0 0 10px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,0.8), 0 0 40px rgba(99,102,241,0.5)' 
                }}
             >
                {text}
             </div>

             {/* Decorative Elements */}
             <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent mt-8 rounded-full opacity-50" />
        </div>
    </div>
  );
};

export default IntroLoader;
