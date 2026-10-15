"use client";

import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, MeshDistortMaterial, Float } from "@react-three/drei";
import * as THREE from "three";

function AdvancedHolographicCore({ isWorking }: { isWorking: boolean }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const particlesCount = 150;
  const positions = new Float32Array(particlesCount * 3);
  for (let i = 0; i < particlesCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 5;
  }

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (coreRef.current) {
      coreRef.current.rotation.x = time * 0.3;
      coreRef.current.rotation.y = time * 0.5;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = time * 0.8;
      ring1Ref.current.rotation.y = time * 0.4;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -time * 0.6;
      ring2Ref.current.rotation.y = -time * 0.3;
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y = time * 0.1;
    }
  });

  return (
    <group>
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial size={0.03} color="#22d3ee" transparent opacity={0.6} />
      </points>

      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.8}>
        <mesh ref={coreRef}>
          <sphereGeometry args={[1.1, 64, 64]} />
          <MeshDistortMaterial
            color="#06b6d4"
            roughness={0.05}
            metalness={0.95}
            wireframe={true}
            distort={isWorking ? 0.65 : 0.35}
            speed={isWorking ? 6 : 2.5}
          />
        </mesh>
      </Float>

      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.7, 0.02, 16, 100]} />
        <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.5} />
      </mesh>

      <mesh ref={ring2Ref}>
        <torusGeometry args={[2.1, 0.015, 16, 100]} />
        <meshBasicMaterial color="#00f0ff" wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

export default function CyberCoreScene({ isWorking }: { isWorking: boolean }) {
  const [inspectMode, setInspectMode] = useState(false);

  return (
    <div className="w-full h-56 md:h-72 relative bg-slate-950/60 rounded-2xl border border-cyan-500/40 backdrop-blur-md overflow-hidden shadow-[0_0_35px_rgba(6,182,212,0.2)] my-2">
      <Canvas camera={{ position: [0, 0, 4.5] }}>
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#06b6d4" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#3b82f6" />
        
        <AdvancedHolographicCore isWorking={isWorking} />
        
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={true}
          autoRotateSpeed={isWorking ? 3.5 : 1.2}
        />
      </Canvas>

      <div className="absolute top-2.5 left-3 text-[9px] font-mono text-cyan-400 tracking-widest bg-slate-950/80 px-2 py-1 rounded border border-cyan-500/40">
        [NEURAL_REACTOR // 60FPS GPU]
      </div>

      <div className="absolute top-2.5 right-3 flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded border border-cyan-500/40 text-[9px] font-mono">
        <span className={`w-2 h-2 rounded-full ${isWorking ? "bg-emerald-400 animate-ping" : "bg-cyan-400 animate-pulse"}`} />
        <span className={isWorking ? "text-emerald-400" : "text-cyan-400"}>
          {isWorking ? "ACTIVE_SYNC" : "STABLE"}
        </span>
      </div>

      <div className="absolute bottom-2 left-3 right-3 flex justify-between items-center text-[9px] font-mono bg-slate-950/85 px-3 py-1.5 rounded-lg border border-cyan-500/30 text-slate-300 backdrop-blur-sm">
        <div>
          <span className="text-cyan-400 font-bold">TEMP:</span> 32°C // <span className="text-cyan-400 font-bold">CORE:</span> STABLE
        </div>
        <button
          type="button"
          onClick={() => setInspectMode(!inspectMode)}
          className="text-[9px] text-cyan-300 hover:text-cyan-100 bg-cyan-950/60 border border-cyan-500/40 px-2 py-0.5 rounded transition"
        >
          {inspectMode ? "CHIUDI INFO" : "ISPEZIONA STATO"}
        </button>
      </div>

      {inspectMode && (
        <div className="absolute inset-x-2 top-10 bottom-12 bg-slate-950/95 border border-cyan-500/50 rounded-xl p-3 z-20 font-mono text-[10px] text-cyan-200 overflow-y-auto backdrop-blur-md space-y-1.5">
          <div className="flex justify-between items-center border-b border-cyan-500/30 pb-1 font-bold text-cyan-300">
            <span>[DIAGNOSTICA CORE - READ ONLY]</span>
            <button onClick={() => setInspectMode(false)} className="text-rose-400 hover:text-rose-300 font-bold">✕</button>
          </div>
          <p>• RENDER ENGINE: WebGL / Three.js (Hardware Accelerated)</p>
          <p>• MEMORY BUFFER: Attivo e sincronizzato con Groq API</p>
          <p>• LATENCY: 0.1ms // OPTIMIZED STREAMING</p>
          <p>• SECURITY: Enclave protetto [RESTRICTED ACCESS]</p>
        </div>
      )}
    </div>
  );
}