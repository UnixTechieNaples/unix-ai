"use client";

import { useEffect, useRef } from "react";

interface JarvisCoreProps {
  status: "idle" | "thinking" | "speaking";
}

export default function JarvisCoreVisualizer({ status }: JarvisCoreProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Velocità di rotazione e colore in base allo stato
      let speed = 0.01;
      let color = "rgba(16, 185, 129, "; // Smeraldo/Verde per Idle
      let pulseScale = Math.sin(Date.now() * 0.003) * 5;

      if (status === "thinking") {
        speed = 0.05;
        color = "rgba(59, 130, 246, "; // Blu per Elaborazione
        pulseScale = Math.sin(Date.now() * 0.01) * 10;
      } else if (status === "speaking") {
        speed = 0.03;
        color = "rgba(236, 72, 153, "; // Magenta/Rosa per Risposta Vocale
        pulseScale = Math.sin(Date.now() * 0.02) * 15;
      }

      angle += speed;

      // Cerchio Interno
      ctx.beginPath();
      ctx.arc(centerX, centerY, 35 + pulseScale, 0, Math.PI * 2);
      ctx.strokeStyle = `${color}0.8)`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Anello Rotante Estrinseco
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.arc(0, 0, 60, 0, Math.PI * 1.5);
      ctx.strokeStyle = `${color}0.5)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Anello Contro-Rotante Esterno con Nodi Neurali
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-angle * 1.2);
      ctx.beginPath();
      ctx.arc(0, 0, 80, 0, Math.PI * 2);
      ctx.strokeStyle = `${color}0.2)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Particelle/Nodi
      for (let i = 0; i < 6; i++) {
        const nodeAngle = (i * Math.PI) / 3;
        const x = Math.cos(nodeAngle) * 80;
        const y = Math.sin(nodeAngle) * 80;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `${color}0.9)`;
        ctx.fill();
      }
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [status]);

  return (
    <div className="flex justify-center items-center py-2">
      <canvas ref={canvasRef} width={220} height={220} className="rounded-full shadow-2xl" />
    </div>
  );
}