import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

interface TheBolaProps {
  isTalking: boolean;
}

const TheBola: React.FC<TheBolaProps> = ({ isTalking }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Shaders (preserved verbatim to ensure exact brand look)
  const vertexShader = `
    varying vec2 vUv; varying vec3 vNormal; uniform float uTime; uniform float uTalk; 
    void main() { vUv = uv; vNormal = normal; float breath = sin(uTime * 0.5) * 0.05; float speech = sin(position.y * 10.0 + uTime * 15.0) * uTalk * 0.1; vec3 newPos = position + normal * (breath + speech); gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0); }
  `;
  
  const fragmentShader = `
    varying vec3 vNormal; uniform vec3 uColor; void main() { float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 2.0); gl_FragColor = vec4(uColor, 1.0) * intensity * 2.0; }
  `;

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Scene Setup ---
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const scene = new THREE.Scene();
    // Slight fog for depth in the cosmos
    scene.fog = new THREE.FogExp2(0x050505, 0.02);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    while(containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    containerRef.current.appendChild(renderer.domElement);

    // --- The Bola (Sphere) - UNTOUCHED AS REQUESTED ---
    const geo = new THREE.IcosahedronGeometry(1.8, 30);
    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: { 
        uTime: { value: 0 }, 
        uTalk: { value: 0 }, 
        uColor: { value: new THREE.Color("#6366f1") } 
      },
      wireframe: true, 
      transparent: true, 
      opacity: 0.5
    });
    
    const sphere = new THREE.Mesh(geo, mat);
    scene.add(sphere);

    // --- Background Particles (The Universe) ---
    const pGeo = new THREE.BufferGeometry();
    const pCount = 800; // Increased density for "cosmos" feel
    const pPos = [];
    const pSizes = [];

    for(let i=0; i<pCount; i++) {
        // Spread them out more for a universe feel
        pPos.push((Math.random()-0.5)*25, (Math.random()-0.5)*25, (Math.random()-0.5)*20);
        pSizes.push(Math.random());
    }
    
    pGeo.setAttribute('position', new THREE.Float32BufferAttribute(pPos, 3));
    pGeo.setAttribute('size', new THREE.Float32BufferAttribute(pSizes, 1)); // Custom attribute if we wanted shader particles, but using PointsMaterial for simplicity

    const pMat = new THREE.PointsMaterial({ 
        size: 0.04, 
        color: 0xa855f7, // Secondary purple color
        transparent: true, 
        opacity: 0.6,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
    });
    
    const stars = new THREE.Points(pGeo, pMat);
    scene.add(stars);

    // Secondary distant stars (white)
    const pGeo2 = new THREE.BufferGeometry();
    const pPos2 = [];
    for(let i=0; i<1000; i++) {
        pPos2.push((Math.random()-0.5)*40, (Math.random()-0.5)*40, (Math.random()-0.5)*40 - 5);
    }
    pGeo2.setAttribute('position', new THREE.Float32BufferAttribute(pPos2, 3));
    const stars2 = new THREE.Points(pGeo2, new THREE.PointsMaterial({ size: 0.02, color: 0xffffff, transparent: true, opacity: 0.3 }));
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
      mat.uniforms.uTalk.value += (targetTalk - mat.uniforms.uTalk.value) * 0.1;
      
      // Sphere idle rotation
      sphere.rotation.y = t * 0.15;
      sphere.rotation.z = Math.sin(t * 0.5) * 0.05;

      // --- MOVING COSMOS EFFECT ---
      // Rotate the entire particle systems slowly
      stars.rotation.y = t * 0.05;
      stars.rotation.x = t * 0.02;
      
      stars2.rotation.y = t * 0.02; // Parallax effect (slower speed)

      // Gentle floating camera movement
      camera.position.y = Math.sin(t * 0.2) * 0.1;
      
      renderer.render(scene, camera);
    };
    
    animate();

    // --- Event Listeners ---
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      
      if (w < 768) { 
        camera.position.z = 6.5; 
        sphere.position.y = 1.2;
        stars.position.y = 1.0; // Move stars up too on mobile
      } else {
        camera.position.z = 5; 
        sphere.position.y = 0;
        stars.position.y = 0;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        
        // Rotate sphere towards mouse
        gsap.to(sphere.rotation, {x: y * 0.5, duration: 1.5});
        
        // Parallax stars slightly opposite to mouse for depth
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

  const isTalkingRef = useRef(isTalking);
  useEffect(() => {
    isTalkingRef.current = isTalking;
  }, [isTalking]);

  return (
    <div 
      ref={containerRef} 
      id="canvas-container" 
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
};

export default TheBola;