
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { audioService } from '../services/audioService';

interface TheBolaProps {
  isTalking: boolean;
  isThinking?: boolean;
  moodColor: string;
  isZen?: boolean;
}

const TheBola: React.FC<TheBolaProps> = ({ isTalking, isThinking, moodColor, isZen }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const pulseRingRef = useRef<THREE.Mesh | null>(null);
  const starsRef = useRef<THREE.Points | null>(null);
  const dustRef = useRef<THREE.Points | null>(null);
  const warpDebrisRef = useRef<THREE.Points | null>(null); 
  const mainGroupRef = useRef<THREE.Group | null>(null);

  // Animation Refs
  const rotationSpeedRef = useRef(1.0); 
  const volatilityRef = useRef(0.0); 
  const previousMoodColor = useRef<string | null>(null);

  // To track star positions for the warp effect
  const starGeoRef = useRef<THREE.BufferGeometry | null>(null);
  const debrisGeoRef = useRef<THREE.BufferGeometry | null>(null);

  const [isMobileState, setIsMobileState] = useState(false);

  // Shader para la bola principal (Holográfico)
  const vertexShader = `
    varying vec2 vUv; varying vec3 vNormal; 
    uniform float uTime; 
    uniform float uTalk; 
    uniform float uVolatility; 

    void main() { 
      vUv = uv; 
      vNormal = normal; 
      
      float breath = sin(uTime * 0.5) * 0.03; 
      float speech = sin(position.y * 8.0 + uTime * 20.0) * uTalk * 0.08; 
      
      float chaos = sin(position.x * 15.0 + uTime * 40.0) * cos(position.z * 15.0 + uTime * 35.0) * uVolatility * 0.3;
      
      vec3 newPos = position + normal * (breath + speech + chaos); 
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0); 
    }
  `;
  
  const fragmentShader = `
    varying vec3 vNormal; uniform vec3 uColor; uniform float uTime;
    void main() { 
      float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.5); 
      float pulse = 0.8 + 0.2 * sin(uTime * 2.0);
      gl_FragColor = vec4(uColor, 1.0) * intensity * pulse * 2.5; 
    }
  `;

  // Control de Transición de Color y Animación (Mood Change)
  useEffect(() => {
    if (!materialRef.current || !mainGroupRef.current) return;

    if (previousMoodColor.current === null) {
        materialRef.current.uniforms.uColor.value.set(moodColor);
        if (pulseRingRef.current) {
             (pulseRingRef.current.material as THREE.MeshBasicMaterial).color.set(moodColor);
        }
        previousMoodColor.current = moodColor;
        return;
    }

    if (previousMoodColor.current !== moodColor) {
        const tl = gsap.timeline();
        
        audioService.playSpinUp();

        tl.to(rotationSpeedRef, { current: 30.0, duration: 1.5, ease: "power3.in" }, 0);
        tl.to(volatilityRef, { current: 1.2, duration: 1.5, ease: "power2.in" }, 0);
        
        tl.call(() => audioService.playCalmDown(), undefined, 1.5);
        
        tl.to(rotationSpeedRef, { current: 0.2, duration: 1.0, ease: "power2.out" }, 1.5);
        tl.to(volatilityRef, { current: 0.0, duration: 1.0, ease: "power2.out" }, 1.5);
        tl.to(mainGroupRef.current.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 1.0, ease: "back.in(1.5)" }, 1.5);

        tl.call(() => {
            if (materialRef.current) materialRef.current.uniforms.uColor.value.set(moodColor);
            if (pulseRingRef.current) {
                 (pulseRingRef.current.material as THREE.MeshBasicMaterial).color.set(moodColor);
            }
            audioService.playExplosion();
        }, undefined, 2.5);

        tl.to(mainGroupRef.current.scale, { x: 1, y: 1, z: 1, duration: 0.8, ease: "elastic.out(1, 0.5)" }, 2.5);
        tl.to(rotationSpeedRef, { current: 1.0, duration: 1.5, ease: "power1.out" }, 2.5);

        previousMoodColor.current = moodColor;
    }
  }, [moodColor]);

  // Handle Zen Audio
  useEffect(() => {
      if (isZen !== undefined) {
          audioService.setZenMode(isZen);
      }
  }, [isZen]);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < 768;
    setIsMobileState(isMobile);
    
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0c15, isMobile ? 0.02 : 0.01); 

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000); 
    
    const renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        antialias: true, 
        powerPreference: "high-performance",
    });
    
    renderer.setSize(width, height);
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
    
    while(containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    containerRef.current.appendChild(renderer.domElement);

    // --- GROUP FOR ROTATION ---
    const mainGroup = new THREE.Group();
    mainGroupRef.current = mainGroup;
    scene.add(mainGroup);

    // --- 1. The Bola (Sphere) ---
    const detail = isMobile ? 2 : 4; 
    const geo = new THREE.IcosahedronGeometry(1.8, detail * 5);
    
    const mat = new THREE.ShaderMaterial({
      vertexShader, fragmentShader,
      uniforms: { 
        uTime: { value: 0 }, 
        uTalk: { value: 0 },
        uVolatility: { value: 0 },
        uColor: { value: new THREE.Color(moodColor) }
      },
      wireframe: true, transparent: true, opacity: 0.6,
      depthWrite: false, blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    
    materialRef.current = mat;
    const sphere = new THREE.Mesh(geo, mat);
    // Ensure sphere itself is centered in group
    sphere.position.set(0, 0, 0); 
    mainGroup.add(sphere);

    // --- 2. Pulse Ring (Saturno) ---
    const ringGeo = new THREE.TorusGeometry(3.5, 0.02, 32, 100);
    const ringMat = new THREE.MeshBasicMaterial({ 
        color: new THREE.Color(moodColor), 
        transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending
    });
    const pulseRing = new THREE.Mesh(ringGeo, ringMat);
    pulseRing.rotation.x = Math.PI / 2; 
    pulseRingRef.current = pulseRing;
    mainGroup.add(pulseRing);

    // --- 3. Particle Systems ---
    
    // A. Ambient Dust
    const dustCount = isMobile ? 60 : 600; 
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = [];
    for(let i=0; i<dustCount; i++) {
        dustPos.push((Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50);
    }
    dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.2 });
    const dust = new THREE.Points(dustGeo, dustMat);
    dustRef.current = dust;
    scene.add(dust);

    // B. Universe Stars
    const starCount = isMobile ? 150 : 800; 
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    
    for(let i=0; i<starCount; i++) {
        const r = 10 + Math.random() * 80; 
        const theta = Math.random() * Math.PI * 2;
        starPos[i*3] = r * Math.cos(theta); 
        starPos[i*3+1] = r * Math.sin(theta);
        starPos[i*3+2] = (Math.random() - 0.5) * 400; 
        starSizes[i] = 0.5 + Math.random() * 1.5; 
    }
    
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    starGeoRef.current = starGeo;

    const starShaderMat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: `
            attribute float size; 
            varying float vAlpha; 
            uniform float uTime;
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                float twinkle = 0.6 + 0.4 * sin(uTime * 5.0 + position.x * 10.0);
                vAlpha = twinkle;
                gl_PointSize = size * (300.0 / -mvPosition.z);
            }
        `,
        fragmentShader: `
            varying float vAlpha; 
            void main() {
                vec2 xy = gl_PointCoord.xy - vec2(0.5);
                float dist = length(xy);
                if(dist > 0.5) discard;
                gl_FragColor = vec4(1.0, 1.0, 1.0, vAlpha * (1.0 - dist * 2.0)); 
            }
        `,
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const stars = new THREE.Points(starGeo, starShaderMat);
    starsRef.current = stars;
    scene.add(stars);

    // C. Warp Debris
    const debrisCount = isMobile ? 40 : 100;
    const debrisGeo = new THREE.BufferGeometry();
    const debrisPos = new Float32Array(debrisCount * 3);
    
    for(let i=0; i<debrisCount; i++) {
        const r = 5 + Math.random() * 30; 
        const theta = Math.random() * Math.PI * 2;
        debrisPos[i*3] = r * Math.cos(theta);
        debrisPos[i*3+1] = r * Math.sin(theta);
        debrisPos[i*3+2] = (Math.random() - 0.5) * 400;
    }
    debrisGeo.setAttribute('position', new THREE.BufferAttribute(debrisPos, 3));
    debrisGeoRef.current = debrisGeo;

    const debrisMat = new THREE.PointsMaterial({ 
        color: 0xaaccff, 
        size: 0.3, 
        transparent: true, 
        opacity: 0, 
        blending: THREE.AdditiveBlending 
    });
    const debris = new THREE.Points(debrisGeo, debrisMat);
    warpDebrisRef.current = debris;
    scene.add(debris);


    camera.position.z = 6;
    
    // IMPORTANT: Do NOT set sphere.position.y here based on mobile. 
    // We control position via mainGroup in the loop to avoid double offsets.
    
    const clock = new THREE.Clock();
    let reqId: number;

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const zen = isZenRef.current;

      // Update Uniforms
      mat.uniforms.uTime.value = t;
      mat.uniforms.uVolatility.value = volatilityRef.current;
      starShaderMat.uniforms.uTime.value = t;

      // Talking Animation
      const targetTalk = isTalkingRef.current ? 2.0 : 0;
      mat.uniforms.uTalk.value += (targetTalk - mat.uniforms.uTalk.value) * 0.15;

      // --- MOBILE SPECIFIC LOGIC ---
      if (pulseRingRef.current) {
         // HIDE RING ON MOBILE
         pulseRingRef.current.visible = !isMobileState;
      }

      // 1. SPHERE & GROUP BEHAVIOR
      if (mainGroupRef.current) {
          // Calculate Center Position for Mobile
          // Mobile Top area is approx 45% of height. 
          // 2.2 puts it nicely in the visual center of that space.
          const baseY = isMobileState ? 2.2 : 0; 
          mainGroupRef.current.position.y = baseY + Math.sin(t * 0.5) * 0.1;
          
          if (zen) {
              // ZEN MODE
              mainGroupRef.current.rotation.x *= 0.95;
              mainGroupRef.current.rotation.z *= 0.95; 
              mainGroupRef.current.rotation.y += 0.05;
          } else {
              // NORMAL MODE
              const baseSpeed = 0.005;
              const rotationDelta = baseSpeed * rotationSpeedRef.current;
              mainGroupRef.current.rotation.y += rotationDelta;
              mainGroupRef.current.rotation.z += rotationDelta * 0.5;
          }
      }

      // 2. PULSE RING (Only visual effects, visibility handled above)
      if (pulseRingRef.current && pulseRingRef.current.visible) {
         pulseRingRef.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.3) * 0.15;
         pulseRingRef.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.03);
      }

      // 3. STARS (WARP EFFECT)
      if (starGeoRef.current && starsRef.current) {
          const positions = starGeoRef.current.attributes.position.array as Float32Array;
          const count = positions.length / 3;
          
          if (zen) {
              const speed = 3.5; 
              for (let i = 0; i < count; i++) {
                  positions[i * 3 + 2] += speed;
                  if (positions[i * 3 + 2] > 50) {
                      positions[i * 3 + 2] = -300; 
                  }
              }
              starGeoRef.current.attributes.position.needsUpdate = true;
              starsRef.current.rotation.y = 0;
          } else {
              starsRef.current.rotation.y -= 0.001;
          }
      }

      // 4. WARP DEBRIS
      if (warpDebrisRef.current && debrisGeoRef.current) {
          const positions = debrisGeoRef.current.attributes.position.array as Float32Array;
          const count = positions.length / 3;

          if (zen) {
             (warpDebrisRef.current.material as THREE.PointsMaterial).opacity = 0.6;
             const speed = 6.0; 
             for (let i = 0; i < count; i++) {
                  positions[i * 3 + 2] += speed;
                  if (positions[i * 3 + 2] > 60) {
                      positions[i * 3 + 2] = -300;
                      const r = 5 + Math.random() * 40;
                      const theta = Math.random() * Math.PI * 2;
                      positions[i * 3] = r * Math.cos(theta);
                      positions[i * 3 + 1] = r * Math.sin(theta);
                  }
             }
             debrisGeoRef.current.attributes.position.needsUpdate = true;
          } else {
             (warpDebrisRef.current.material as THREE.PointsMaterial).opacity = 0;
          }
      }
      
      // 5. DUST
      if (dustRef.current) {
          if (zen) {
               dustRef.current.position.z += 1.0;
               if (dustRef.current.position.z > 20) dustRef.current.position.z = -50;
          } else {
              dustRef.current.rotation.y -= 0.002;
              dustRef.current.position.y = Math.sin(t * 0.2) * 0.5;
          }
      }

      // 6. CAMERA
      if (zen) {
          camera.position.x = 0;
          camera.position.y = 0;
      } else {
          camera.position.x = Math.sin(t * 0.2) * 0.2;
          camera.position.y = Math.cos(t * 0.3) * 0.2;
      }
      
      renderer.render(scene, camera);
    };
    
    animate();

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mobile = w < 768;
      setIsMobileState(mobile);
      
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(mobile ? 1 : Math.min(window.devicePixelRatio, 2));
      
      // Removed manual position set here to let animate loop handle it
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); 

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(reqId);
      if(containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      geo.dispose(); mat.dispose(); 
      dustGeo.dispose(); dustMat.dispose(); 
      starGeo.dispose(); starShaderMat.dispose();
      debrisGeo.dispose(); debrisMat.dispose();
    };
  }, []);

  const isTalkingRef = useRef(isTalking);
  const isZenRef = useRef(isZen);
  
  useEffect(() => { isTalkingRef.current = isTalking; }, [isTalking]);
  useEffect(() => { isZenRef.current = isZen; }, [isZen]);

  return (
    <div ref={containerRef} className="fixed inset-0 z-0 pointer-events-none" />
  );
};

export default TheBola;
