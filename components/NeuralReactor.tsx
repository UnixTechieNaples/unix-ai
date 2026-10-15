"use client";

import { useEffect, useRef } from "react";

interface NeuralReactorProps {
  isSpeaking: boolean;
  isListening: boolean;
}

export default function NeuralReactor({ isSpeaking, isListening }: NeuralReactorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;

    // Caricamento dell'immagine dell'avatar per disegnarla direttamente al centro esatto del Canvas
    const avatarImg = new Image();
    avatarImg.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop";

    // Particelle orbitali fluttuanti
    const particles = Array.from({ length: 30 }, () => ({
      r: Math.random() * 85 + 50,
      a: Math.random() * Math.PI * 2,
      speed: (Math.random() - 0.5) * 0.04,
      size: Math.random() * 2 + 1
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Colori dinamici basati sullo stato del Core
      const primaryColor = isSpeaking ? "#00f0ff" : isListening ? "#ff0055" : "#00ffcc";
      const secondaryColor = isSpeaking ? "#0066ff" : isListening ? "#ff8800" : "#00aa88";

      // 1. Alone luminoso centrale (Core Glow)
      const gradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 120);
      gradient.addColorStop(0, isSpeaking ? "rgba(0, 240, 255, 0.25)" : isListening ? "rgba(255, 0, 85, 0.25)" : "rgba(0, 255, 204, 0.12)");
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Avatar Circolare Centrale disegnato matematicamente al centro esatto
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, 48, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip(); // Ritaglia l'area in cerchio perfetto

      if (avatarImg.complete) {
        ctx.drawImage(avatarImg, centerX - 48, centerY - 48, 96, 96);
      }

      // Effetto Scanlines CRT direttamente sull'avatar
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      for (let y = centerY - 48; y < centerY + 48; y += 3) {
        ctx.fillRect(centerX - 48, y, 96, 1.5);
      }
      ctx.restore();

      // 3. Bordo olografico dinamico dell'avatar
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, 49, 0, Math.PI * 2);
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 15;
      ctx.shadowColor = primaryColor;
      ctx.stroke();
      ctx.restore();

      // 4. Particelle orbitali olografiche
      ctx.save();
      ctx.translate(centerX, centerY);
      particles.forEach(p => {
        p.a += p.speed;
        const x = Math.cos(p.a) * p.r;
        const y = Math.sin(p.a) * p.r;
        ctx.fillStyle = primaryColor;
        ctx.shadowBlur = 6;
        ctx.shadowColor = primaryColor;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // 5. Anello olografico principale rotante con segmenti complessi
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.arc(0, 0, 72, 0, Math.PI * 1.7);
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 12;
      ctx.shadowColor = primaryColor;
      ctx.setLineDash([14, 6, 4, 8]);
      ctx.stroke();
      ctx.restore();

      // 6. Secondo anello rotante in senso opposto (Stile Radar)
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-angle * 1.5);
      ctx.beginPath();
      ctx.arc(0, 0, 88, 0, Math.PI * 2);
      ctx.strokeStyle = secondaryColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 14]);
      ctx.stroke();
      ctx.restore();

      // 7. Archi al plasma ad alta tensione (attivi se parla o ascolta)
      if (isSpeaking || isListening) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.beginPath();
        ctx.strokeStyle = "#ffffff"; // Nucleo bianco dei fulmini al plasma
        ctx.lineWidth = 2;
        ctx.shadowBlur = 20;
        ctx.shadowColor = primaryColor;
        
        for (let i = 0; i < 8; i++) {
          const a = angle * 4 + (i * Math.PI / 4);
          const r1 = 50;
          const r2 = 82 + Math.sin(angle * 15 + i) * 10;
          ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
          ctx.lineTo(Math.cos(a + 0.15) * r2, Math.sin(a + 0.15) * r2);
        }
        ctx.stroke();
        ctx.restore();
      }

      // 8. Equalizzatore spettrografico audio avanzato in basso
      ctx.beginPath();
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = primaryColor;
      const waveY = centerY + 102;
      for (let i = -75; i <= 75; i += 3) {
        const freq = Math.sin(angle * 15 + i * 0.3) * Math.cos(angle * 5 + i * 0.1);
        const h = freq * (isSpeaking || isListening ? 16 : 4);
        if (i === -75) ctx.moveTo(centerX + i, waveY + h);
        else ctx.lineTo(centerX + i, waveY + h);
      }
      ctx.stroke();

      // 9. Telemetria e Glifi di Testo HUD allineati e puliti
      ctx.font = "8px 'Orbitron', monospace";
      ctx.fillStyle = "rgba(0, 240, 255, 0.8)";
      ctx.shadowBlur = 4;
      ctx.shadowColor = "#00f0ff";
      ctx.fillText("SYS_CORE // 004", centerX - 95, centerY - 105);
      ctx.fillText("SYNC: 99.8%", centerX + 30, centerY - 105);

      const statusText = isSpeaking ? "STATUS: [SYNTHESIZING...]" : isListening ? "STATUS: [LISTENING_ACTIVE]" : "STATUS: [ONLINE]";
      ctx.fillStyle = primaryColor;
      ctx.fillText(statusText, centerX - 55, centerY + 120);

      // Incremento dell'angolo per fluidità cinematografica
      angle += isSpeaking ? 0.045 : isListening ? 0.04 : 0.012;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isSpeaking, isListening]);

  return (
    <div className="relative flex items-center justify-center my-1 w-full">
      {/* Canvas HUD Unificato (Larghezza e altezza maggiorate per contenere tutti gli anelli simmetricamente) */}
      <canvas ref={canvasRef} width={260} height={260} className="pointer-events-none" />
    </div>
  );
}