
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

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
  const mainGroupRef = useRef<THREE.Group | null>(null);

  const [isMobileState, setIsMobileState] = useState(false);

  // Shader para la bola principal (Holográfico)
  const vertexShader = `
    varying vec2 vUv; varying vec3 vNormal; uniform float uTime; uniform float uTalk; 
    void main() { 
      vUv = uv; 
      vNormal = normal; 
      // Deformación orgánica basada en voz y tiempo
      float breath = sin(uTime * 0.5) * 0.03; 
      float speech = sin(position.y * 8.0 + uTime * 20.0) * uTalk * 0.08; 
      vec3 newPos = position + normal * (breath + speech); 
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0); 
    }
  `;
  
  const fragmentShader = `
    varying vec3 vNormal; uniform vec3 uColor; uniform float uTime;
    void main() { 
      // Efecto fresnel para borde brillante
      float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.5); 
      // Pulso interno sutil
      float pulse = 0.8 + 0.2 * sin(uTime * 2.0);
      gl_FragColor = vec4(uColor, 1.0) * intensity * pulse * 2.5; 
    }
  `;

  // Control de Transición de Color (GSAP)
  useEffect(() => {
    if (materialRef.current) {
      const newColor = new THREE.Color(moodColor);
      gsap.to(materialRef.current.uniforms.uColor.value, {
        r: newColor.r, g: newColor.g, b: newColor.b, duration: 2.0, ease: "power2.inOut"
      });
    }
    if (pulseRingRef.current) {
       const ringMat = pulseRingRef.current.material as THREE.MeshBasicMaterial;
       const newColor = new THREE.Color(moodColor);
       gsap.to(ringMat.color, { r: newColor.r, g: newColor.g, b: newColor.b, duration: 2.0 });
    }
  }, [moodColor]);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < 768;
    setIsMobileState(isMobile);
    
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0c15, isMobile ? 0.02 : 0.01); 

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
    
    const renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        antialias: true, // Antialias ON para que las líneas se vean nítidas (Wireframe sin AA se ve feo)
        powerPreference: "high-performance",
    });
    
    renderer.setSize(width, height);
    // MOBILE OPTIMIZATION: PixelRatio en 1 para móviles es la mejor optimización de rendimiento.
    // Evita renderizar 3x o 4x pixeles en pantallas retina, ahorrando mucha batería.
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
    // Detail 2 en mobile mantiene la forma esférica sin ser tan costoso como 4.
    // Detail 0 se veía muy "cuadrado" (diamante).
    const detail = isMobile ? 2 : 4; 
    const geo = new THREE.IcosahedronGeometry(1.8, detail * 5);
    
    const mat = new THREE.ShaderMaterial({
      vertexShader, fragmentShader,
      uniforms: { 
        uTime: { value: 0 }, 
        uTalk: { value: 0 }, 
        uColor: { value: new THREE.Color(moodColor) }
      },
      wireframe: true, transparent: true, opacity: 0.6,
      depthWrite: false, blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    
    materialRef.current = mat;
    const sphere = new THREE.Mesh(geo, mat);
    mainGroup.add(sphere);

    // --- 2. Pulse Ring (Saturno) ---
    // Restaurado en Mobile porque es icónico.
    const ringGeo = new THREE.TorusGeometry(3.5, 0.02, 32, 100);
    const ringMat = new THREE.MeshBasicMaterial({ 
        color: new THREE.Color(moodColor), 
        transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending
    });
    const pulseRing = new THREE.Mesh(ringGeo, ringMat);
    pulseRing.rotation.x = Math.PI / 2; 
    pulseRingRef.current = pulseRing;
    mainGroup.add(pulseRing);

    // --- 3. Particle Systems (Dust & Stars) ---
    
    // SYSTEM A: DUST (Polvo Cósmico)
    // Cantidad reducida en mobile para optimizar CPU
    const dustCount = isMobile ? 60 : 600; 
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = [];
    for(let i=0; i<dustCount; i++) {
        const x = (Math.random() - 0.5) * 50;
        const y = (Math.random() - 0.5) * 50;
        const z = (Math.random() - 0.5) * 50;
        dustPos.push(x, y, z);
    }
    dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
        color: 0xffffff, 
        size: 0.05, 
        transparent: true, 
        opacity: 0.2
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    dustRef.current = dust;
    scene.add(dust);

    // SYSTEM B: STARS (Estrellas)
    const starCount = isMobile ? 40 : 120;
    const starGeo = new THREE.BufferGeometry();
    const starPos = [];
    const starSizes = [];
    for(let i=0; i<starCount; i++) {
        const r = 10 + Math.random() * 30;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        starPos.push(x, y, z);
        starSizes.push(0.5 + Math.random() * 1.0); 
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    starGeo.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));

    // Shader para estrellas
    const starShaderMat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: `
            attribute float size; 
            varying float vAlpha; 
            uniform float uTime;
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                float twinkle = 0.6 + 0.4 * sin(uTime * 2.0 + position.x * 10.0);
                vAlpha = twinkle;
                gl_PointSize = size * (200.0 / -mvPosition.z);
            }
        `,
        fragmentShader: `
            varying float vAlpha; 
            void main() {
                vec2 xy = gl_PointCoord.xy - vec2(0.5);
                float dist = length(xy);
                if(dist > 0.5) discard;
                float glow = 1.0 - (dist * 2.0);
                glow = pow(glow, 3.0); 
                gl_FragColor = vec4(1.0, 1.0, 1.0, vAlpha * glow); 
            }
        `,
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    });

    const stars = new THREE.Points(starGeo, starShaderMat);
    starsRef.current = stars;
    scene.add(stars);

    camera.position.z = 6;

    const clock = new THREE.Clock();
    let reqId: number;

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const zen = isZenRef.current;

      // Update Uniforms
      mat.uniforms.uTime.value = t;
      starShaderMat.uniforms.uTime.value = t;

      // Talking Animation
      const targetTalk = isTalkingRef.current ? 2.0 : 0;
      mat.uniforms.uTalk.value += (targetTalk - mat.uniforms.uTalk.value) * 0.15;

      // 1. MAIN SPHERE BEHAVIOR
      if (mainGroupRef.current) {
          mainGroupRef.current.position.y = Math.sin(t * 0.5) * 0.1;
          
          if (zen) {
              mainGroupRef.current.rotation.z = THREE.MathUtils.lerp(mainGroupRef.current.rotation.z, -0.4, 0.02); 
              mainGroupRef.current.rotation.y += 0.002;
          } else {
              mainGroupRef.current.rotation.z = THREE.MathUtils.lerp(mainGroupRef.current.rotation.z, 0, 0.05);
              
              if (isThinkingRef.current) {
                  sphere.rotation.y += 0.1;
                  mat.opacity = 0.8 + Math.sin(t * 10.0) * 0.1;
              } else {
                  sphere.rotation.y = t * 0.1;
                  sphere.rotation.x = Math.sin(t * 0.5) * 0.1;
                  mat.opacity += (0.6 - mat.opacity) * 0.05;
              }
          }
      }

      // 2. RING BEHAVIOR
      if (pulseRingRef.current) {
         pulseRingRef.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.3) * 0.15;
         pulseRingRef.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.03);
      }

      // 3. STARS & DUST ANIMATION
      if (starsRef.current && dustRef.current) {
          const speed = zen ? 0.02 : 0.005; 
          starsRef.current.rotation.y -= speed;
          dustRef.current.rotation.y -= speed * 0.5;
          dustRef.current.position.y = Math.sin(t * 0.2) * 0.5;
      }

      // 4. CAMERA BEHAVIOR
      const targetZ = isMobile ? 7.5 : 6.0;
      const zenZ = targetZ + (isMobile ? 1.5 : 3.0); 
      const finalZ = zen ? zenZ : targetZ;
      
      camera.position.z += (finalZ - camera.position.z) * 0.02;
      
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
      
      if (mobile) {
        sphere.position.y = 0.8; 
      } else {
        sphere.position.y = 0;
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Init

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(reqId);
      if(containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      geo.dispose(); mat.dispose(); dustGeo.dispose(); dustMat.dispose(); starGeo.dispose(); starShaderMat.dispose();
    };
  }, []);

  const isTalkingRef = useRef(isTalking);
  const isThinkingRef = useRef(isThinking);
  const isZenRef = useRef(isZen);
  
  useEffect(() => { isTalkingRef.current = isTalking; }, [isTalking]);
  useEffect(() => { isThinkingRef.current = isThinking; }, [isThinking]);
  useEffect(() => { isZenRef.current = isZen; }, [isZen]);

  return (
    <div ref={containerRef} className="fixed inset-0 z-0 pointer-events-none" />
  );
};

export default TheBola;
