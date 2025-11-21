import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

interface TheBolaProps {
  isTalking: boolean;
  moodColor: string;
}

const TheBola: React.FC<TheBolaProps> = ({ isTalking, moodColor }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  
  // Shaders (Optimized: same visual logic, standard precision)
  const vertexShader = `
    varying vec2 vUv; varying vec3 vNormal; uniform float uTime; uniform float uTalk; 
    void main() { vUv = uv; vNormal = normal; float breath = sin(uTime * 0.5) * 0.05; float speech = sin(position.y * 10.0 + uTime * 15.0) * uTalk * 0.1; vec3 newPos = position + normal * (breath + speech); gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0); }
  `;
  
  const fragmentShader = `
    varying vec3 vNormal; uniform vec3 uColor; void main() { float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 2.0); gl_FragColor = vec4(uColor, 1.0) * intensity * 2.0; }
  `;

  // Effect to handle color transition when mood changes
  useEffect(() => {
    if (materialRef.current) {
      const newColor = new THREE.Color(moodColor);
      gsap.to(materialRef.current.uniforms.uColor.value, {
        r: newColor.r,
        g: newColor.g,
        b: newColor.b,
        duration: 2, // Smooth 2 second transition
        ease: "power2.inOut"
      });
    }
  }, [moodColor]);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Scene Setup ---
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < 768;
    
    const scene = new THREE.Scene();
    // Fog slightly reduced for performance, still adds depth
    scene.fog = new THREE.FogExp2(0x050505, 0.02);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
    
    // PERFORMANCE CRITICAL: 
    // 1. Disable antialias on mobile (huge FPS boost)
    // 2. Use mediump precision on mobile shaders
    const renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        antialias: !isMobile, 
        powerPreference: "high-performance",
        precision: isMobile ? "mediump" : "highp",
        stencil: false, // Disable stencil buffer if not used
        depth: true
    });
    
    renderer.setSize(width, height);
    // CRITICAL: Max pixel ratio of 1 on mobile prevents rendering at 3x resolution on new phones
    // This allows us to have high geometry detail without lag
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
    
    while(containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    containerRef.current.appendChild(renderer.domElement);

    // --- The Bola (Sphere) ---
    // RESTORED HIGH DETAIL: 
    // Returning to higher detail (10 for mobile, 20 for desktop) to restore the "dense wireframe" look.
    // The lag is mitigated by the renderer settings above (pixelRatio 1).
    const detail = isMobile ? 10 : 20; 
    const geo = new THREE.IcosahedronGeometry(1.8, detail);
    
    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: { 
        uTime: { value: 0 }, 
        uTalk: { value: 0 }, 
        uColor: { value: new THREE.Color(moodColor) } // Init with current mood
      },
      wireframe: true, 
      transparent: true, 
      opacity: 0.5,
      depthWrite: false, // Optimization for transparent objects
      blending: THREE.AdditiveBlending
    });
    
    materialRef.current = mat;

    const sphere = new THREE.Mesh(geo, mat);
    scene.add(sphere);

    // --- Background Particles (The Universe) ---
    const pGeo = new THREE.BufferGeometry();
    // Restored particle count slightly for better visuals
    const pCount = isMobile ? 150 : 600; 
    const pPos = [];
    const pSizes = [];

    for(let i=0; i<pCount; i++) {
        pPos.push((Math.random()-0.5)*25, (Math.random()-0.5)*25, (Math.random()-0.5)*20);
        pSizes.push(Math.random());
    }
    
    pGeo.setAttribute('position', new THREE.Float32BufferAttribute(pPos, 3));
    pGeo.setAttribute('size', new THREE.Float32BufferAttribute(pSizes, 1));

    const pMat = new THREE.PointsMaterial({ 
        size: 0.04, 
        color: 0xa855f7, 
        transparent: true, 
        opacity: 0.6,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    const stars = new THREE.Points(pGeo, pMat);
    scene.add(stars);

    // Secondary distant stars
    const pGeo2 = new THREE.BufferGeometry();
    const pCount2 = isMobile ? 200 : 800;
    const pPos2 = [];
    for(let i=0; i<pCount2; i++) {
        pPos2.push((Math.random()-0.5)*40, (Math.random()-0.5)*40, (Math.random()-0.5)*40 - 5);
    }
    pGeo2.setAttribute('position', new THREE.Float32BufferAttribute(pPos2, 3));
    const stars2 = new THREE.Points(pGeo2, new THREE.PointsMaterial({ 
        size: 0.02, 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.3,
        depthWrite: false
    }));
    scene.add(stars2);


    // --- Positioning ---
    camera.position.z = 5;

    // --- Animation Loop ---
    const clock = new THREE.Clock();
    let reqId: number;

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      
      // Update Uniforms for Sphere
      mat.uniforms.uTime.value = t;
      
      const targetTalk = isTalkingRef.current ? 1.5 : 0;
      // Smooth interpolation
      mat.uniforms.uTalk.value += (targetTalk - mat.uniforms.uTalk.value) * 0.1;
      
      // Sphere idle rotation
      sphere.rotation.y = t * 0.15;
      sphere.rotation.z = Math.sin(t * 0.5) * 0.05;

      // --- MOVING COSMOS EFFECT ---
      // Only rotate visuals, avoid heavy calculations per frame
      stars.rotation.y = t * 0.05;
      stars.rotation.x = t * 0.02;
      stars2.rotation.y = t * 0.02;

      // Gentle floating camera movement
      // Reduced movement on mobile to prevent motion sickness / reduce recalc
      camera.position.y = Math.sin(t * 0.2) * (isMobile ? 0.02 : 0.1);
      
      renderer.render(scene, camera);
    };
    
    animate();

    // --- Event Listeners ---
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mobile = w < 768;
      
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      // Keep optimization on resize
      renderer.setPixelRatio(mobile ? 1 : Math.min(window.devicePixelRatio, 2));
      
      if (mobile) { 
        camera.position.z = 6.5; 
        sphere.position.y = 1.2;
        stars.position.y = 1.0;
      } else {
        camera.position.z = 5; 
        sphere.position.y = 0;
        stars.position.y = 0;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (window.innerWidth < 768) return;
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        
        gsap.to(sphere.rotation, {x: y * 0.5, duration: 1.5});
        gsap.to(stars.rotation, {x: -y * 0.1, y: -x * 0.1, duration: 2});
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('mousemove', handleMouseMove);
    
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(reqId);
      if(containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      geo.dispose();
      mat.dispose();
      pGeo.dispose();
      pMat.dispose();
      pGeo2.dispose();
    };
  }, []);

  // Refs for loop access
  const isTalkingRef = useRef(isTalking);
  useEffect(() => { isTalkingRef.current = isTalking; }, [isTalking]);

  return (
    <div 
      ref={containerRef} 
      id="canvas-container" 
      className="fixed inset-0 z-0 pointer-events-none transform-gpu" // transform-gpu forces GPU layer
    />
  );
};

export default TheBola;