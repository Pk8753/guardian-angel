'use client';

import * as React from 'react';

// ==================== DANTORA CANVAS ANIMATION (HERO DIAGONAL CHROMOSOME FLUID DNA) ====================
// Health/Genomics fluid diagonal chromosome helix with circular bokeh system, slow pace & interactive parting
export function DantoraHelixCanvas() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = container.clientWidth);
    let height = (canvas.height = container.clientHeight);

    // Responsive Retina DPI sizing
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          width = entry.contentRect.width;
          height = entry.contentRect.height;
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);
        }
      }
    });
    resizeObserver.observe(container);

    // Mouse tracking for hero section
    const mouse = {
      x: -9999,
      y: -9999,
      active: false,
    };

    const handlePointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;

      // Add fluid cursor ink trail droplet
      if (Math.random() < 0.4 && mouseTrail.length < 35) {
        mouseTrail.push({
          x: mouse.x + (Math.random() - 0.5) * 10,
          y: mouse.y + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2.8 + 1.2,
          alpha: 0.8,
          color: Math.random() > 0.4 ? '#90ebcd' : '#30ba78',
        });
      }
    };

    const handlePointerLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);

    // ==================== CIRCULAR BOKEH SYSTEM (ALL AROUND HELIX) ====================
    interface BokehParticle {
      pathT: number;      // 0 to 1 position along the diagonal trajectory
      offsetDist: number; // perpendicular distance from helix spine
      x: number;
      y: number;
      radius: number;
      baseRadius: number;
      alpha: number;
      baseAlpha: number;
      pulsePhase: number;
      pulseSpeed: number;
      driftVx: number;
      driftVy: number;
      color: string;
    }

    const bokehCount = 42;
    const bokehList: BokehParticle[] = [];

    for (let i = 0; i < bokehCount; i++) {
      const pathT = i / (bokehCount - 1) + (Math.random() - 0.5) * 0.08;
      const offsetDist = (Math.random() - 0.5) * 220;
      const baseRadius = Math.random() * 24 + 10;
      const baseAlpha = Math.random() * 0.28 + 0.12;

      // 80% Green/Mint, 15% Blue (#2453ff), 5% Orange (#fe7c3f)
      const colorRoll = Math.random();
      let color = '#30ba78';
      if (colorRoll < 0.80) {
        color = Math.random() > 0.4 ? '#30ba78' : '#90ebcd';
      } else if (colorRoll < 0.95) {
        color = '#2453ff'; // 15% Blue
      } else {
        color = '#fe7c3f'; // 5% Orange
      }

      bokehList.push({
        pathT: Math.max(0, Math.min(1, pathT)),
        offsetDist,
        x: 0,
        y: 0,
        radius: baseRadius,
        baseRadius,
        alpha: baseAlpha,
        baseAlpha,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.015 + 0.008, // slow, gentle breathing pace
        driftVx: (Math.random() - 0.5) * 0.15,
        driftVy: (Math.random() - 0.5) * 0.15,
        color,
      });
    }

    // Ink Plume particle system
    interface PlumeParticle {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      maxLife: number;
      life: number;
      color: string;
      curlFreq: number;
    }

    interface MouseTrailParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      color: string;
    }

    const plumes: PlumeParticle[] = [];
    const mouseTrail: MouseTrailParticle[] = [];
    const MAX_PLUMES = 140;

    let time = 0;

    const render = () => {
      // Active yet graceful rotation speed
      time += 0.010;

      ctx.clearRect(0, 0, width, height);

      // ==================== 1. DIAGONAL SWOOP PATH GEOMETRY ====================
      // Trajectory matching the reference screenshot:
      // Starts upper-left (above/behind headline), curves diagonally across center, exits lower-right
      const getSpinePoint = (t: number) => {
        const x = -0.06 * width + t * (1.14 * width);
        // Gentle downward curve swooping under headline and across towards bottom-right
        const y = 0.12 * height + t * (0.82 * height) + Math.sin(t * Math.PI) * (0.10 * height);
        return { x, y };
      };

      const getSpineTangent = (t: number) => {
        const dt = 0.01;
        const p1 = getSpinePoint(Math.max(0, t - dt));
        const p2 = getSpinePoint(Math.min(1, t + dt));
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        return {
          tanX: dx / len,
          tanY: dy / len,
          normX: -dy / len, // 2D perpendicular normal in screen plane
          normY: dx / len,
        };
      };

      // ==================== 2. RENDER CIRCULAR BOKEH ALL AROUND HELIX ====================
      for (let b = 0; b < bokehList.length; b++) {
        const item = bokehList[b];
        item.pulsePhase += item.pulseSpeed;

        const spinePos = getSpinePoint(item.pathT);
        const { normX, normY } = getSpineTangent(item.pathT);

        // Apply slow drift & breathing
        const pulse = Math.sin(item.pulsePhase) * 0.25 + 0.9;
        item.radius = item.baseRadius * pulse;
        item.alpha = item.baseAlpha * pulse;

        item.x = spinePos.x + normX * item.offsetDist + Math.sin(time * 0.8 + b) * 12;
        item.y = spinePos.y + normY * item.offsetDist + Math.cos(time * 0.7 + b) * 10;

        // Mouse gentle repulsion on bokeh
        if (mouse.active) {
          const dx = item.x - mouse.x;
          const dy = item.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130 && dist > 0.1) {
            const force = (1 - dist / 130) * 18;
            item.x += (dx / dist) * force;
            item.y += (dy / dist) * force;
          }
        }

        // Draw soft glowing circular bokeh disc (80% Green/Mint, 15% Blue, 5% Orange)
        const radGrad = ctx.createRadialGradient(item.x, item.y, 0, item.x, item.y, item.radius);
        if (item.color === '#2453ff') {
          // 15% Blue bokeh
          radGrad.addColorStop(0, `rgba(36, 83, 255, ${item.alpha * 0.9})`);
          radGrad.addColorStop(0.5, `rgba(36, 83, 255, ${item.alpha * 0.45})`);
          radGrad.addColorStop(1, 'rgba(36, 83, 255, 0)');
        } else if (item.color === '#fe7c3f') {
          // 5% Orange bokeh
          radGrad.addColorStop(0, `rgba(254, 124, 63, ${item.alpha * 0.9})`);
          radGrad.addColorStop(0.5, `rgba(254, 124, 63, ${item.alpha * 0.45})`);
          radGrad.addColorStop(1, 'rgba(254, 124, 63, 0)');
        } else if (item.color === '#30ba78') {
          // Jungle green bokeh
          radGrad.addColorStop(0, `rgba(48, 186, 120, ${item.alpha * 0.85})`);
          radGrad.addColorStop(0.5, `rgba(48, 186, 120, ${item.alpha * 0.45})`);
          radGrad.addColorStop(1, 'rgba(48, 186, 120, 0)');
        } else {
          // Mint green bokeh
          radGrad.addColorStop(0, `rgba(144, 235, 205, ${item.alpha * 0.85})`);
          radGrad.addColorStop(0.5, `rgba(144, 235, 205, ${item.alpha * 0.45})`);
          radGrad.addColorStop(1, 'rgba(144, 235, 205, 0)');
        }

        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
        ctx.fillStyle = radGrad;
        ctx.fill();
      }

      // ==================== 3. ZOOMED-IN THICK CHROMOSOME FLUID DNA (4 RINGS) ====================
      const nodeCount = 52;
      // Zoomed-in helix radius: significantly wider and more prominent
      const helixRadius = Math.min(width * 0.22, 190);
      const focalLength = 380;
      // Active yet graceful rotation speed
      const rotationSpeed = time * 0.22;

      interface ChromosomeNode {
        x: number;
        y: number;
        z: number;
        screenX: number;
        screenY: number;
        scale: number;
        alpha: number;
      }

      const nodesStrandA: ChromosomeNode[] = [];
      const nodesStrandB: ChromosomeNode[] = [];

      for (let i = 0; i < nodeCount; i++) {
        const t = i / (nodeCount - 1);
        const spine = getSpinePoint(t);
        const { normX, normY } = getSpineTangent(t);

        // Exactly 4 majestic helical rings / loops across the visible diagonal span (4 * Math.PI)
        const angle = t * Math.PI * 4.0 + rotationSpeed;

        const offsetNormA = Math.cos(angle) * helixRadius;
        const offsetZA = Math.sin(angle) * helixRadius;

        const offsetNormB = Math.cos(angle + Math.PI) * helixRadius;
        const offsetZB = Math.sin(angle + Math.PI) * helixRadius;

        // Perspective projection
        const scaleA = focalLength / (focalLength + offsetZA + helixRadius * 1.25);
        const scaleB = focalLength / (focalLength + offsetZB + helixRadius * 1.25);

        let screenXA = spine.x + normX * offsetNormA * scaleA;
        let screenYA = spine.y + normY * offsetNormA * scaleA;

        let screenXB = spine.x + normX * offsetNormB * scaleB;
        let screenYB = spine.y + normY * offsetNormB * scaleB;

        // Cursor parting repulsion field
        if (mouse.active) {
          const dxA = screenXA - mouse.x;
          const dyA = screenYA - mouse.y;
          const distA = Math.sqrt(dxA * dxA + dyA * dyA);
          const repelDist = 160;

          if (distA < repelDist && distA > 0.1) {
            const force = Math.pow(1 - distA / repelDist, 1.8) * 85;
            screenXA += (dxA / distA) * force;
            screenYA += (dyA / distA) * force;
          }

          const dxB = screenXB - mouse.x;
          const dyB = screenYB - mouse.y;
          const distB = Math.sqrt(dxB * dxB + dyB * dyB);

          if (distB < repelDist && distB > 0.1) {
            const force = Math.pow(1 - distB / repelDist, 1.8) * 85;
            screenXB += (dxB / distB) * force;
            screenYB += (dyB / distB) * force;
          }
        }

        const alphaA = Math.max(0.22, Math.min(0.92, (offsetZA + helixRadius) / (2 * helixRadius) * 0.7 + 0.22));
        const alphaB = Math.max(0.22, Math.min(0.92, (offsetZB + helixRadius) / (2 * helixRadius) * 0.7 + 0.22));

        nodesStrandA.push({ x: offsetNormA, y: spine.y, z: offsetZA, screenX: screenXA, screenY: screenYA, scale: scaleA, alpha: alphaA });
        nodesStrandB.push({ x: offsetNormB, y: spine.y, z: offsetZB, screenX: screenXB, screenY: screenYB, scale: scaleB, alpha: alphaB });

        // Shed fluid plumes at slow pace
        if (plumes.length < MAX_PLUMES && Math.random() < 0.14) {
          const sourceNode = Math.random() > 0.5 ? nodesStrandA[i] : nodesStrandB[i];
          const isStrandA = sourceNode === nodesStrandA[i];
          plumes.push({
            x: sourceNode.screenX,
            y: sourceNode.screenY,
            z: sourceNode.z,
            vx: (Math.random() - 0.5) * 0.6 + normX * (isStrandA ? 0.35 : -0.35),
            vy: (Math.random() - 0.5) * 0.6 + normY * (isStrandA ? 0.35 : -0.35) - 0.2,
            size: Math.random() * 5.0 + 2.5,
            alpha: 0.65,
            maxLife: Math.random() * 160 + 100,
            life: 0,
            color: Math.random() > 0.35 ? '#30ba78' : '#90ebcd',
            curlFreq: Math.random() * 0.015 + 0.006,
          });
        }
      }

      // ==================== 4. RENDER THICK CHROMATIN BASE BRIDGES ====================
      for (let i = 0; i < nodeCount; i += 2) {
        const nodeA = nodesStrandA[i];
        const nodeB = nodesStrandB[i];
        const avgZ = (nodeA.z + nodeB.z) / 2;
        const rungAlpha = Math.max(0.12, Math.min(0.65, (avgZ + helixRadius) / (2 * helixRadius) * 0.55 + 0.1));

        // Outer bridge halo (thickened)
        ctx.beginPath();
        ctx.moveTo(nodeA.screenX, nodeA.screenY);
        ctx.lineTo(nodeB.screenX, nodeB.screenY);
        ctx.strokeStyle = `rgba(144, 235, 205, ${rungAlpha * 0.45})`;
        ctx.lineWidth = Math.max(2.8, ((nodeA.scale + nodeB.scale) / 2) * 8.5);
        ctx.stroke();

        // Dense inner core
        ctx.beginPath();
        ctx.moveTo(nodeA.screenX, nodeA.screenY);
        ctx.lineTo(nodeB.screenX, nodeB.screenY);
        ctx.strokeStyle = `rgba(255, 255, 255, ${rungAlpha * 0.85})`;
        ctx.lineWidth = Math.max(1.4, ((nodeA.scale + nodeB.scale) / 2) * 3.5);
        ctx.stroke();

        // Central chromatin junction bead
        const midX = (nodeA.screenX + nodeB.screenX) / 2;
        const midY = (nodeA.screenY + nodeB.screenY) / 2;
        ctx.beginPath();
        ctx.arc(midX, midY, 3.8 * ((nodeA.scale + nodeB.scale) / 2), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(144, 235, 205, ${rungAlpha * 0.95})`;
        ctx.fill();
      }

      // ==================== 5. RENDER ZOOMED-IN THICK STRAND A (EMERALD CHROMOSOME #30ba78) ====================
      // Layer 5a: Outer thick chromatin aura (zoomed in & bold)
      for (let i = 1; i < nodeCount; i++) {
        const prev = nodesStrandA[i - 1];
        const cur = nodesStrandA[i];
        ctx.beginPath();
        ctx.moveTo(prev.screenX, prev.screenY);
        ctx.lineTo(cur.screenX, cur.screenY);
        ctx.strokeStyle = `rgba(48, 186, 120, ${cur.alpha * 0.32})`;
        ctx.lineWidth = cur.scale * 26.0; // Extra thick chromosome body
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Layer 5b: Dense chromosome chromatid cylinder
      for (let i = 1; i < nodeCount; i++) {
        const prev = nodesStrandA[i - 1];
        const cur = nodesStrandA[i];
        ctx.beginPath();
        ctx.moveTo(prev.screenX, prev.screenY);
        ctx.lineTo(cur.screenX, cur.screenY);
        ctx.strokeStyle = `rgba(48, 186, 120, ${cur.alpha * 0.88})`;
        ctx.lineWidth = cur.scale * 13.0; // Dense thick core
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Layer 5c: Luminous central filament
      for (let i = 1; i < nodeCount; i++) {
        const prev = nodesStrandA[i - 1];
        const cur = nodesStrandA[i];
        ctx.beginPath();
        ctx.moveTo(prev.screenX, prev.screenY);
        ctx.lineTo(cur.screenX, cur.screenY);
        ctx.strokeStyle = `rgba(255, 255, 255, ${cur.alpha * 0.95})`;
        ctx.lineWidth = cur.scale * 3.5;
        ctx.stroke();
      }

      // Strand A Nucleosome Nodes (Zoomed in & thick)
      for (let i = 0; i < nodeCount; i++) {
        const cur = nodesStrandA[i];
        // Outer halo
        ctx.beginPath();
        ctx.arc(cur.screenX, cur.screenY, cur.scale * 13.0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(48, 186, 120, ${cur.alpha * 0.85})`;
        ctx.shadowColor = '#30ba78';
        ctx.shadowBlur = 18;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Dense nucleus
        ctx.beginPath();
        ctx.arc(cur.screenX, cur.screenY, cur.scale * 5.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${cur.alpha * 0.95})`;
        ctx.fill();
      }

      // ==================== 6. RENDER ZOOMED-IN THICK STRAND B (MINT CHROMOSOME #90ebcd) ====================
      // Layer 6a: Outer thick chromatin aura (zoomed in & bold)
      for (let i = 1; i < nodeCount; i++) {
        const prev = nodesStrandB[i - 1];
        const cur = nodesStrandB[i];
        ctx.beginPath();
        ctx.moveTo(prev.screenX, prev.screenY);
        ctx.lineTo(cur.screenX, cur.screenY);
        ctx.strokeStyle = `rgba(144, 235, 205, ${cur.alpha * 0.32})`;
        ctx.lineWidth = cur.scale * 26.0; // Extra thick chromosome body
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Layer 6b: Dense chromosome chromatid cylinder
      for (let i = 1; i < nodeCount; i++) {
        const prev = nodesStrandB[i - 1];
        const cur = nodesStrandB[i];
        ctx.beginPath();
        ctx.moveTo(prev.screenX, prev.screenY);
        ctx.lineTo(cur.screenX, cur.screenY);
        ctx.strokeStyle = `rgba(144, 235, 205, ${cur.alpha * 0.88})`;
        ctx.lineWidth = cur.scale * 13.0; // Dense thick core
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Layer 6c: Luminous central filament
      for (let i = 1; i < nodeCount; i++) {
        const prev = nodesStrandB[i - 1];
        const cur = nodesStrandB[i];
        ctx.beginPath();
        ctx.moveTo(prev.screenX, prev.screenY);
        ctx.lineTo(cur.screenX, cur.screenY);
        ctx.strokeStyle = `rgba(255, 255, 255, ${cur.alpha * 0.95})`;
        ctx.lineWidth = cur.scale * 3.5;
        ctx.stroke();
      }

      // Strand B Nucleosome Nodes (Zoomed in & thick)
      for (let i = 0; i < nodeCount; i++) {
        const cur = nodesStrandB[i];
        // Outer halo
        ctx.beginPath();
        ctx.arc(cur.screenX, cur.screenY, cur.scale * 13.0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(144, 235, 205, ${cur.alpha * 0.85})`;
        ctx.shadowColor = '#90ebcd';
        ctx.shadowBlur = 18;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Dense nucleus
        ctx.beginPath();
        ctx.arc(cur.screenX, cur.screenY, cur.scale * 5.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${cur.alpha * 0.95})`;
        ctx.fill();
      }

      // ==================== 7. RENDER SLOW SHEDDING INK PLUMES ====================
      for (let p = plumes.length - 1; p >= 0; p--) {
        const plume = plumes[p];
        plume.life += 1;

        if (plume.life >= plume.maxLife) {
          plumes.splice(p, 1);
          continue;
        }

        // Slow fluid noise drift
        const noiseX = Math.sin(plume.y * plume.curlFreq + time * 0.5) * 0.35;
        const noiseY = Math.cos(plume.x * plume.curlFreq + time * 0.4) * 0.3;

        plume.x += plume.vx + noiseX;
        plume.y += plume.vy + noiseY;

        // Cursor parting on plumes
        if (mouse.active) {
          const dx = plume.x - mouse.x;
          const dy = plume.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110 && dist > 0.1) {
            const force = Math.pow(1 - dist / 110, 1.5) * 2.5;
            plume.x += (dx / dist) * force;
            plume.y += (dy / dist) * force;
          }
        }

        const lifeRatio = plume.life / plume.maxLife;
        const currentAlpha = lifeRatio < 0.2
          ? (lifeRatio / 0.2) * plume.alpha
          : (1 - lifeRatio) * plume.alpha;

        const currentSize = plume.size * (1 + lifeRatio * 1.8);

        ctx.beginPath();
        ctx.arc(plume.x, plume.y, currentSize, 0, Math.PI * 2);
        ctx.fillStyle = plume.color === '#30ba78'
          ? `rgba(48, 186, 120, ${currentAlpha * 0.55})`
          : `rgba(144, 235, 205, ${currentAlpha * 0.55})`;
        ctx.fill();
      }

      // ==================== 8. RENDER CURSOR INK TRAIL ====================
      for (let t = mouseTrail.length - 1; t >= 0; t--) {
        const p = mouseTrail[t];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.016; // slightly longer lingering trail
        p.radius = Math.max(0.3, p.radius - 0.025);

        if (p.alpha <= 0.01) {
          mouseTrail.splice(t, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color === '#30ba78'
          ? `rgba(48, 186, 120, ${p.alpha * 0.75})`
          : `rgba(144, 235, 205, ${p.alpha * 0.75})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
