import React, { useEffect, useRef } from 'react';

export const GhostPointer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef({ x: 0, y: 0 }); // Current mouse position
  const trailRef = useRef({ x: 0, y: 0 });  // The "Ghost" position
  const pointsRef = useRef<{x: number, y: number}[]>([]); // History for the line

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration
    const config = {
      lerpFactor: 0.15, // How fast the ghost follows (lower = more lag/ghostly)
      trailLength: 20, // Length of the tail
      illuminationSize: 600, // Size of the background light
      strokeColor: '255, 255, 255',
      strokeWidth: 2
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    // Initialize positions
    trailRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    cursorRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    window.addEventListener('resize', handleResize);
    handleResize();

    const handleMouseMove = (e: MouseEvent) => {
      cursorRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;

    const lerp = (start: number, end: number, factor: number) => {
      return start + (end - start) * factor;
    };

    const render = () => {
      if (!ctx || !canvas) return;

      // Update Ghost Position (Lerp towards Mouse)
      trailRef.current.x = lerp(trailRef.current.x, cursorRef.current.x, config.lerpFactor);
      trailRef.current.y = lerp(trailRef.current.y, cursorRef.current.y, config.lerpFactor);

      // Add to history
      pointsRef.current.push({ ...trailRef.current });
      if (pointsRef.current.length > config.trailLength) {
        pointsRef.current.shift();
      }

      // Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Illumination (Radial Gradient centered on the GHOST, not the mouse, for smoother effect)
      const gradient = ctx.createRadialGradient(
          trailRef.current.x, trailRef.current.y, 0, 
          trailRef.current.x, trailRef.current.y, config.illuminationSize
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Draw The Ghost Trail Line
      if (pointsRef.current.length > 3) {
        ctx.beginPath();
        ctx.moveTo(pointsRef.current[0].x, pointsRef.current[0].y);

        // Smooth curve through points
        for (let i = 1; i < pointsRef.current.length - 2; i++) {
           const xc = (pointsRef.current[i].x + pointsRef.current[i + 1].x) / 2;
           const yc = (pointsRef.current[i].y + pointsRef.current[i + 1].y) / 2;
           ctx.quadraticCurveTo(pointsRef.current[i].x, pointsRef.current[i].y, xc, yc);
        }
        
        // Connect to the last few points
        ctx.quadraticCurveTo(
            pointsRef.current[pointsRef.current.length - 2].x, 
            pointsRef.current[pointsRef.current.length - 2].y, 
            pointsRef.current[pointsRef.current.length - 1].x, 
            pointsRef.current[pointsRef.current.length - 1].y
        );

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = config.strokeWidth;
        
        // Gradient stroke - Fades out at the tail
        const strokeGrad = ctx.createLinearGradient(
            pointsRef.current[0].x, pointsRef.current[0].y,
            trailRef.current.x, trailRef.current.y
        );
        strokeGrad.addColorStop(0, 'rgba(255,255,255,0)');
        strokeGrad.addColorStop(0.5, 'rgba(255,255,255,0.4)');
        strokeGrad.addColorStop(1, 'rgba(255,255,255,0.8)');
        
        ctx.strokeStyle = strokeGrad;
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-[1]"
    />
  );
};
