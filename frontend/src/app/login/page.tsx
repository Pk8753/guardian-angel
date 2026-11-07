'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';

// Modern Unified Palette for Login Page
const COLORS = {
  pine: '#0c322c',
  white: '#ffffff',
  jungle: '#30ba78',
  fog: '#efefef',
  midnight: '#192072',
  persimmon: '#fe7c3f',
  waterhole: '#2453ff',
  mint: '#90ebcd',
};

// ==================== CLINICAL INBREEDING RISK MODEL DATA ====================
// Sourced directly from /Users/pankaj/Downloads/Family Health Risk Estimator.html
const RELATIONSHIPS: [string, string, string, number][] = [
  ['fc', 'First cousins', 'Your parents are brothers or sisters (children of the same grandparents)', 1 / 16],
  ['sc', 'Second cousins', 'You share great-grandparents', 1 / 64],
  ['none', 'Unrelated', 'No known biological or genealogical relationship', 0],
  ['dfc', 'Double first cousins', 'Two brothers married two sisters, so you share both sets of grandparents', 1 / 8],
  ['fc1', 'First cousins once removed', 'For example, your partner is your first cousin’s child', 1 / 32],
  ['rem', 'Distant relatives (third cousins or beyond)', 'Same tribe or extended family, a more distant link', 1 / 256],
  ['un', 'Uncle and niece, or aunt and nephew', 'Second-degree biological relationship', 1 / 8],
  ['hs', 'Half siblings', 'Share one biological parent', 1 / 8]
];

const AR_RELATIONSHIPS: Record<string, [string, string]> = {
  fc: ['أبناء عمومة / خؤولة مباشرين', 'الآباء إخوة أو أخوات (أبناء نفس الأجداد)'],
  sc: ['أبناء عمومة من الدرجة الثانية', 'تشتركون في أجداد الأجداد'],
  none: ['لا توجد قرابة', 'لا توجد صلة نسب عائلية معروفة'],
  dfc: ['أبناء عمومة مزدوجين', 'أخوان تزوجا أختين، فيشتركون في كلا الجدين'],
  fc1: ['أبناء عمومة من الدرجة الأولى بدرجة إزاحة', 'على سبيل المثال الشريك هو ابن/ابنة ابن عمك'],
  rem: ['أقارب من مسافة أبعد (درجة ثالثة فأكثر)', 'من نفس القبيلة أو العائلة الممتدة برابط أبعد'],
  un: ['خال/عم وابنة أخت/أخ، أو خالة/عمة وابن أخت/أخ', 'قرابة بيولوجية من الدرجة الثانية'],
  hs: ['إخوة غير أشقاء', 'يشتركون في أحد الوالدين بيولوجياً']
};

const EARLIER_GENERATIONS: [string, string, string, number][] = [
  ['no', 'No', 'No known marriage between relatives in earlier generations', 0],
  ['yes', 'Yes', 'Parents, grandparents or earlier ancestors were also relatives (amplifies generational genetic overlap)', 0.0625],
  ['unsure', 'Unsure', 'Family history in earlier generations is incomplete or uncertain', 0.03125]
];

const AR_EARLIER_GENERATIONS: Record<string, [string, string]> = {
  no: ['لا', 'لا يوجد زواج أقارب معروف في الأجيال السابقة'],
  yes: ['نعم', 'الآباء أو الأجداد أو الأسلاف كانوا أيضاً أقارب (مما يضاعف التداخل الجيني)'],
  unsure: ['غير متأكد', 'تاريخ العائلة في الأجيال السابقة غير مكتمل أو غير مؤكد']
};

const FAMILY_HISTORY: [string, string, string, number][] = [
  ['no', 'No', 'No known condition in either family', 1.0],
  ['yes', 'Yes', 'Yes, known history or carrier in either family (e.g. Beta-Thalassemia, Sickle Cell Disease, Cystic Fibrosis, SMA)', 1.8],
  ['unsure', 'Unsure', 'Not sure or family history incomplete', 1.2]
];

const AR_FAMILY_HISTORY: Record<string, [string, string]> = {
  no: ['لا', 'لا توجد حالات وراثية معروفة في العائلتين'],
  yes: ['نعم', 'نعم، تاريخ وراثي معروف أو ناقل لصفة وراثية في إحدى العائلتين (مثل الثلاسيميا، الأنيميا المنجلية، التليف الكيسي، أو الضمور العضلي)'],
  unsure: ['غير متأكد', 'غير متأكد أو تاريخ العائلة الطبي غير مكتمل']
};

const PAST_PREGNANCIES: [string, string, number][] = [
  ['1', 'No pregnancies yet, or all healthy', 1.0],
  ['1.5', 'Two or more miscarriages, or a child who was seriously ill/died without clear cause', 1.5]
];

const AR_PAST_PREGNANCIES: Record<string, string> = {
  '1': 'لا يوجد حمل سابق، أو جميع الأطفال بصحة جيدة',
  '1.5': 'حالتان إجهاض أو أكثر، أو طفل أصيب بمرض شديد/توفي بدون سبب واضح'
};

const SCREENING_STATUS: [string, string, number][] = [
  ['1', 'Not done yet', 1.0],
  ['0.7', 'Done, and no concerns were found (CLIA/CAP carrier panel clear)', 0.7]
];

const AR_SCREENING_STATUS: Record<string, string> = {
  '1': 'لم يتم الفحص بعد',
  '0.7': 'تم الفحص ولم تظهر أي مخاوف وراثية (الفحص سليم تماماً)'
};

const GENDER_OPTIONS: [string, string, string][] = [
  ['male', 'Male', 'Biological male partner assessment'],
  ['female', 'Female', 'Biological female partner assessment']
];

const RELATIONSHIP_STATUS_OPTIONS: [string, string, string][] = [
  ['planning', 'Planning to marry', 'Prospective couple preparing for premarital screening'],
  ['married', 'Already married', 'Married couple seeking hereditary and family planning insight']
];

const K_FACTOR = 0.487;

// ==================== DANTORA CANVAS ANIMATION (HERO DIAGONAL CHROMOSOME FLUID DNA) ====================
// Health/Genomics fluid diagonal chromosome helix with circular bokeh system, slow pace & interactive parting
function DantoraHelixCanvas() {
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
      // Smooth, visibly active pace: 0.010 increment
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

      // ==================== 3. THICK CHROMOSOME FLUID DNA GEOMETRY ====================
      const nodeCount = 56;
      const helixRadius = Math.min(width * 0.14, 130);
      const focalLength = 360;
      // Active yet graceful rotation speed: 0.22 factor
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

        // 3D rotation along diagonal path
        const angle = t * Math.PI * 5.4 + rotationSpeed;

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
          const repelDist = 150;

          if (distA < repelDist && distA > 0.1) {
            const force = Math.pow(1 - distA / repelDist, 1.8) * 75;
            screenXA += (dxA / distA) * force;
            screenYA += (dyA / distA) * force;
          }

          const dxB = screenXB - mouse.x;
          const dyB = screenYB - mouse.y;
          const distB = Math.sqrt(dxB * dxB + dyB * dyB);

          if (distB < repelDist && distB > 0.1) {
            const force = Math.pow(1 - distB / repelDist, 1.8) * 75;
            screenXB += (dxB / distB) * force;
            screenYB += (dyB / distB) * force;
          }
        }

        const alphaA = Math.max(0.2, Math.min(0.9, (offsetZA + helixRadius) / (2 * helixRadius) * 0.7 + 0.2));
        const alphaB = Math.max(0.2, Math.min(0.9, (offsetZB + helixRadius) / (2 * helixRadius) * 0.7 + 0.2));

        nodesStrandA.push({ x: offsetNormA, y: spine.y, z: offsetZA, screenX: screenXA, screenY: screenYA, scale: scaleA, alpha: alphaA });
        nodesStrandB.push({ x: offsetNormB, y: spine.y, z: offsetZB, screenX: screenXB, screenY: screenYB, scale: scaleB, alpha: alphaB });

        // Shed fluid plumes at slow pace
        if (plumes.length < MAX_PLUMES && Math.random() < 0.12) {
          const sourceNode = Math.random() > 0.5 ? nodesStrandA[i] : nodesStrandB[i];
          const isStrandA = sourceNode === nodesStrandA[i];
          plumes.push({
            x: sourceNode.screenX,
            y: sourceNode.screenY,
            z: sourceNode.z,
            vx: (Math.random() - 0.5) * 0.6 + normX * (isStrandA ? 0.35 : -0.35),
            vy: (Math.random() - 0.5) * 0.6 + normY * (isStrandA ? 0.35 : -0.35) - 0.2,
            size: Math.random() * 4.2 + 2.0,
            alpha: 0.65,
            maxLife: Math.random() * 160 + 100, // longer lifespan for slower dispersion
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

        // Outer bridge halo
        ctx.beginPath();
        ctx.moveTo(nodeA.screenX, nodeA.screenY);
        ctx.lineTo(nodeB.screenX, nodeB.screenY);
        ctx.strokeStyle = `rgba(144, 235, 205, ${rungAlpha * 0.4})`;
        ctx.lineWidth = Math.max(2.0, ((nodeA.scale + nodeB.scale) / 2) * 5.5);
        ctx.stroke();

        // Dense inner core
        ctx.beginPath();
        ctx.moveTo(nodeA.screenX, nodeA.screenY);
        ctx.lineTo(nodeB.screenX, nodeB.screenY);
        ctx.strokeStyle = `rgba(255, 255, 255, ${rungAlpha * 0.8})`;
        ctx.lineWidth = Math.max(1.0, ((nodeA.scale + nodeB.scale) / 2) * 2.2);
        ctx.stroke();

        // Central chromatin junction bead
        const midX = (nodeA.screenX + nodeB.screenX) / 2;
        const midY = (nodeA.screenY + nodeB.screenY) / 2;
        ctx.beginPath();
        ctx.arc(midX, midY, 2.5 * ((nodeA.scale + nodeB.scale) / 2), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(144, 235, 205, ${rungAlpha * 0.9})`;
        ctx.fill();
      }

      // ==================== 5. RENDER THICK STRAND A (EMERALD CHROMOSOME #30ba78) ====================
      // Layer 5a: Outer thick chromatin aura
      for (let i = 1; i < nodeCount; i++) {
        const prev = nodesStrandA[i - 1];
        const cur = nodesStrandA[i];
        ctx.beginPath();
        ctx.moveTo(prev.screenX, prev.screenY);
        ctx.lineTo(cur.screenX, cur.screenY);
        ctx.strokeStyle = `rgba(48, 186, 120, ${cur.alpha * 0.28})`;
        ctx.lineWidth = cur.scale * 16.0; // thick chromosome body
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
        ctx.strokeStyle = `rgba(48, 186, 120, ${cur.alpha * 0.85})`;
        ctx.lineWidth = cur.scale * 7.5; // dense thick core
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
        ctx.strokeStyle = `rgba(255, 255, 255, ${cur.alpha * 0.9})`;
        ctx.lineWidth = cur.scale * 2.2;
        ctx.stroke();
      }

      // Strand A Nucleosome Nodes
      for (let i = 0; i < nodeCount; i++) {
        const cur = nodesStrandA[i];
        // Outer halo
        ctx.beginPath();
        ctx.arc(cur.screenX, cur.screenY, cur.scale * 8.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(48, 186, 120, ${cur.alpha * 0.85})`;
        ctx.shadowColor = '#30ba78';
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Dense nucleus
        ctx.beginPath();
        ctx.arc(cur.screenX, cur.screenY, cur.scale * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${cur.alpha * 0.95})`;
        ctx.fill();
      }

      // ==================== 6. RENDER THICK STRAND B (MINT CHROMOSOME #90ebcd) ====================
      // Layer 6a: Outer thick chromatin aura
      for (let i = 1; i < nodeCount; i++) {
        const prev = nodesStrandB[i - 1];
        const cur = nodesStrandB[i];
        ctx.beginPath();
        ctx.moveTo(prev.screenX, prev.screenY);
        ctx.lineTo(cur.screenX, cur.screenY);
        ctx.strokeStyle = `rgba(144, 235, 205, ${cur.alpha * 0.28})`;
        ctx.lineWidth = cur.scale * 16.0; // thick chromosome body
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
        ctx.strokeStyle = `rgba(144, 235, 205, ${cur.alpha * 0.85})`;
        ctx.lineWidth = cur.scale * 7.5; // dense thick core
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
        ctx.strokeStyle = `rgba(255, 255, 255, ${cur.alpha * 0.9})`;
        ctx.lineWidth = cur.scale * 2.2;
        ctx.stroke();
      }

      // Strand B Nucleosome Nodes
      for (let i = 0; i < nodeCount; i++) {
        const cur = nodesStrandB[i];
        // Outer halo
        ctx.beginPath();
        ctx.arc(cur.screenX, cur.screenY, cur.scale * 8.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(144, 235, 205, ${cur.alpha * 0.85})`;
        ctx.shadowColor = '#90ebcd';
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Dense nucleus
        ctx.beginPath();
        ctx.arc(cur.screenX, cur.screenY, cur.scale * 3.5, 0, Math.PI * 2);
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

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { activeLocale, setActiveLocale } = useUIStore();
  const isAr = activeLocale === 'ar';

  // Auth Modal State (Compact Header Controls)
  const [isAuthOpen, setIsAuthOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'signin' | 'register'>('signin');
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = React.useState<string | null>(null);

  // Sign In form state
  const [signInUsername, setSignInUsername] = React.useState('');
  const [signInPassword, setSignInPassword] = React.useState('');
  const [showSignInPassword, setShowSignInPassword] = React.useState(false);
  const [isSignInSubmitting, setIsSignInSubmitting] = React.useState(false);

  // Register form state
  const [regFirstName, setRegFirstName] = React.useState('');
  const [regSecondName, setRegSecondName] = React.useState('');
  const [regUsername, setRegUsername] = React.useState('');
  const [regDob, setRegDob] = React.useState('');
  const [regEmail, setRegEmail] = React.useState('');
  const [regLocation, setRegLocation] = React.useState('');
  const [regPassword, setRegPassword] = React.useState('');
  const [showRegPassword, setShowRegPassword] = React.useState(false);
  const [isRegSubmitting, setIsRegSubmitting] = React.useState(false);

  // OTP state
  const [otpSent, setOtpSent] = React.useState(false);
  const [otpVerified, setOtpVerified] = React.useState(false);
  const [otpInput, setOtpInput] = React.useState('');
  const [otpLoading, setOtpLoading] = React.useState(false);

  // Field validation error tracking
  const [fieldErrors, setFieldErrors] = React.useState<{ [key: string]: boolean }>({});

  // ==================== RISK CALCULATOR STATE ====================
  // No answers pre-selected by default
  const [gender, setGender] = React.useState<'male' | 'female' | null>(null);
  const [relStatus, setRelStatus] = React.useState<'planning' | 'married' | null>(null);
  const [relIdx, setRelIdx] = React.useState<number | null>(null);
  const [genIdx, setGenIdx] = React.useState<number | null>(null);
  const [histIdx, setHistIdx] = React.useState<number | null>(null);
  const [pregIdx, setPregIdx] = React.useState<number | null>(null);
  const [scrIdx, setScrIdx] = React.useState<number | null>(null);
  const [sameCarrier, setSameCarrier] = React.useState<boolean>(false);

  // Result tile flip states & Formula accordion state
  const [flippedTiles, setFlippedTiles] = React.useState<{ [key: string]: boolean }>({});
  const [isFormulaExpanded, setIsFormulaExpanded] = React.useState<boolean>(false);

  // ==================== MOBILE ASSESSMENT SLIDESHOW STATE ====================
  const [isAssessmentActive, setIsAssessmentActive] = React.useState<boolean>(false);
  const [mobileSlide, setMobileSlide] = React.useState<number>(0);
  const [slideDirection, setSlideDirection] = React.useState<'next' | 'prev'>('next');
  const [isMobileCentresOpen, setIsMobileCentresOpen] = React.useState<boolean>(false);
  const [isMobileFormulaOpen, setIsMobileFormulaOpen] = React.useState<boolean>(false);
  const touchStartX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);

  const toggleTile = (key: string) => {
    setFlippedTiles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleResetEstimator = () => {
    setGender(null);
    setRelStatus(null);
    setRelIdx(null);
    setGenIdx(null);
    setHistIdx(null);
    setPregIdx(null);
    setScrIdx(null);
    setSameCarrier(false);
    setFlippedTiles({});
    setMobileSlide(0);
  };

  const goToSlide = (n: number) => {
    if (n < 0 || n > 9) return;
    setSlideDirection(n >= mobileSlide ? 'next' : 'prev');
    setMobileSlide(n);
  };

  const nextSlide = () => {
    if (mobileSlide < 9) {
      setSlideDirection('next');
      setMobileSlide((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    setSlideDirection('prev');
    if (mobileSlide > 0) {
      setMobileSlide((prev) => prev - 1);
    } else {
      setIsAssessmentActive(false);
    }
  };

  const handleSelectAndAdvance = (setter: () => void, targetSlide?: number) => {
    setter();
    setSlideDirection('next');
    setTimeout(() => {
      setMobileSlide((prev) => (targetSlide !== undefined ? targetSlide : Math.min(prev + 1, 9)));
    }, 280);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const diffY = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      if (diffX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Scroll animations state
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const clearFieldError = (key: string) => {
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    setAuthError(null);
  };

  const isValidEmail = (email: string) => {
    return /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(email.trim());
  };

  // Capture URL error query parameters
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err) {
        setAuthError(decodeURIComponent(err));
        setIsAuthOpen(true);
      }
    }
  }, []);

  // Quick helper to open auth modal in specific mode
  const openAuth = (mode: 'signin' | 'register') => {
    setActiveTab(mode);
    setAuthError(null);
    setAuthSuccess(null);
    setIsAuthOpen(true);
  };

  // Demo credential autofill helper
  const fillDemoCreds = (u: string, p: string) => {
    setSignInUsername(u);
    setSignInPassword(p);
    setFieldErrors({});
    setAuthError(null);
  };

  // ==================== CALCULATOR MATH ENGINE ====================
  const computeEstimate = (
    rI: number | null,
    gI: number | null,
    hI: number | null,
    pI: number | null,
    sI: number | null
  ) => {
    const rVal = rI !== null ? RELATIONSHIPS[rI][3] : 0;
    const faVal = gI !== null ? EARLIER_GENERATIONS[gI][3] : 0;
    const fVal = rVal * (1 + faVal);
    const histVal = hI !== null ? FAMILY_HISTORY[hI][3] : 1.0;
    const pregVal = pI !== null ? PAST_PREGNANCIES[pI][2] : 1.0;
    const scrVal = sI !== null ? SCREENING_STATUS[sI][2] : 1.0;
    let lVal = histVal * pregVal * scrVal;
    lVal = Math.min(lVal, 3.0);
    const exRisk = (1 - Math.exp(-K_FACTOR * fVal * lVal)) * 100;
    return { fVal, lVal, exRisk };
  };

  const isStarted = gender !== null || relStatus !== null || relIdx !== null || genIdx !== null || histIdx !== null || pregIdx !== null || scrIdx !== null || sameCarrier;

  const { fVal: currentF, lVal: currentL, exRisk: currentExtra } = computeEstimate(relIdx, genIdx, histIdx, pregIdx, scrIdx);
  const rangeLo = (1 - Math.exp(-K_FACTOR * currentF * (currentL * 0.6))) * 100;
  const rangeHi = (1 - Math.exp(-K_FACTOR * currentF * (currentL * 1.5))) * 100;
  const totalChance = 3.0 + (isStarted ? (sameCarrier ? 25.0 : currentExtra) : 0);
  const oneInCount = Math.max(1, Math.round(100 / totalChance));

  const formatPct = (val: number) => (val >= 0.1 ? val.toFixed(1) + '%' : val.toFixed(2) + '%');

  // Risk Band classification (Humble, reassuring & motivating guidance)
  let riskBandLevel: 'ok' | 'mid' | 'hi' = 'ok';
  let riskBandTitle = isAr ? 'في انتظار تحديد البيانات' : 'Awaiting Selections';
  let riskBandDesc = isAr
    ? 'يرجى تحديد صلة القرابة والتاريخ العائلي في الخطوات الخمس على اليمين لعرض تقييمك الشخصي.'
    : 'Please choose your relationship and family background in the 5 steps on the left to view your personalized assessment.';

  if (sameCarrier) {
    riskBandLevel = 'hi';
    riskBandTitle = isAr ? 'تم تحديد تطابق في حمل نفس الجين المتنحي' : 'Shared Carrier Match Identified';
    riskBandDesc = isAr
      ? 'عندما يحمل كلا الزوجين نفس الطفرة لجين متنحٍ، يكون لكل حمل احتمال ١ من ٤ (٢٥٪) للإصابة. ورغم أن هذا يتطلب تخطيطاً طبياً دقيقاً، فإن علم الجينات الحديث يوفر حلولاً مؤكدة وواضحة — بما في ذلك الاستشارة المتخصصة وخيارات الإنجاب المتقدمة — للمضي قدماً بثقة وراحة بال.'
      : 'When both partners carry the same recessive condition, each pregnancy has a 1 in 4 (25%) chance of being affected. While this requires careful clinical planning, modern genomics offers clear, proven pathways—including targeted carrier counseling and reproductive options—so you can proceed with confidence and peace of mind.';
  } else if (!isStarted) {
    riskBandLevel = 'ok';
    riskBandTitle = isAr ? 'في انتظار تحديد البيانات' : 'Awaiting Selections';
    riskBandDesc = isAr
      ? 'يرجى تحديد صلة القرابة والتاريخ العائلي في الخطوات الخمس على اليمين لعرض تقييمك الشخصي.'
      : 'Please choose your relationship and family background in the 5 steps on the left to view your personalized assessment.';
  } else if (currentF === 0) {
    riskBandLevel = 'ok';
    riskBandTitle = isAr ? 'المعدل الطبيعي العام' : 'Standard Baseline Risk';
    riskBandDesc = isAr
      ? 'لا توجد قرابة بيولوجية بين الشريكين. ينطبق المعدل الطبيعي العام للسكان (~٣٪). تمنحكم الفحوصات الروتينية للمقبلين على الزواج طمأنينة وتأكيداً إضافياً.'
      : 'Partners are not biologically related. Standard baseline population risk (~3%) applies. Routine premarital screening provides reassuring confirmation.';
  } else if (currentExtra < 1.5) {
    riskBandLevel = 'ok';
    riskBandTitle = isAr ? 'احتمال إضافي منخفض' : 'Low Added Risk';
    riskBandDesc = isAr
      ? 'صلة القرابة تضيف احتمالاً بسيطاً جداً. الغالبية العظمى من الأطفال يولدون بصحة تامة. الفحوصات الروتينية للمقبلين على الزواج تمنحكم طمأنينة وتأكيداً.'
      : 'The family link adds only a modest consideration. The vast majority of children are born healthy. Routine premarital screening gives you and your partner reassuring confirmation.';
  } else if (currentExtra < 4.0) {
    riskBandLevel = 'mid';
    riskBandTitle = isAr ? 'احتمال إضافي متوسط' : 'Moderate Added Risk';
    riskBandDesc = isAr
      ? 'تم تحديد احتمال إضافي معتدل ناتج عن القرابة المشتركة. يُرجى تذكر أن معظم الأطفال لأزواج أقارب يولدون بصحة ممتازة. إجراء الفحوصات الموجهة للمقبلين على الزواج يمنحكم وضوحاً مطمئناً للتخطيط للمستقبل بثقة.'
      : 'A modest added chance is identified from shared ancestry. Please remember that most children born to cousins are completely healthy. Completing targeted premarital screening gives you reassuring clarity to plan ahead with confidence.';
  } else {
    riskBandLevel = 'hi';
    riskBandTitle = isAr ? 'احتمال إضافي يستحق المتابعة' : 'Higher Added Risk';
    riskBandDesc = isAr
      ? 'نتفهم أن هذا قد يثير بعض القلق، ولكن المعرفة هي مصدر قوتك واطمئنانك. في حين أن درجات القرابة الأقرب تجعل فحص النواقل واستشارة الطبيب الوراثي ذات قيمة عالية، تذكر دائماً أن معظم أطفال الأقارب يولدون أصحاء. الخطوات الاستباقية تمكنكم من المضي قدماً بوضوح وثقة تامة.'
      : 'We understand this can feel concerning, but knowledge is your greatest strength. While closer kinship links mean premarital carrier screening and certified genetic counselor review are especially valuable, please remember that most children born to relatives are healthy. Taking proactive steps together empowers you to move forward with complete clarity and confidence.';
  }

  // ==================== AUTH HANDLERS ====================
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const u = signInUsername.trim();
    const p = signInPassword.trim();

    if (!u && !p) {
      setFieldErrors({ signInUsername: true, signInPassword: true });
      setAuthError('Please enter your username and password.');
      return;
    }
    if (!u) {
      setFieldErrors({ signInUsername: true });
      setAuthError('Username or email is required.');
      return;
    }
    if (!p) {
      setFieldErrors({ signInPassword: true });
      setAuthError('Password is required.');
      return;
    }

    setIsSignInSubmitting(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'signin', username: u, password: p }),
      });

      const data = await res.json();

      if (data.status === 'success' && data.user) {
        login({
          id: data.user.id,
          username: data.user.username,
          fullName: data.user.full_name,
          aliasName: data.user.alias_name,
          isAdmin: data.user.username.toLowerCase() === 'admin',
          isFreshUser: false,
        });
        router.push('/dashboard');
        return;
      } else {
        setAuthError(data.message || 'Invalid clinical credentials. Please check your username and password.');
      }
    } catch {
      // Offline demo fallback
      const lower = u.toLowerCase();
      if ((lower === 'admin' && p === 'admin') || (lower === 'user' && p === 'user') || (lower === 'kabir' && p === '123456')) {
        login({
          id: lower === 'admin' ? 1 : lower === 'user' ? 2 : 4,
          username: lower,
          fullName: lower === 'admin' ? 'Dr. Tariq Al-Mansoor (Admin)' : lower === 'user' ? 'Dr. Eleanor Vance' : 'Kabir Khan',
          aliasName: lower === 'admin' ? 'Swift-Otter-301' : lower === 'user' ? 'Silent-Falcon-9214' : 'Solar-Sequoia-3972',
          isAdmin: lower === 'admin',
          isFreshUser: false,
        });
        router.push('/dashboard');
        return;
      }
      setAuthError('Invalid clinical credentials. Please check your username and password.');
    } finally {
      setIsSignInSubmitting(false);
    }
  };

  const handleSendOtp = async () => {
    setAuthError(null);
    const errors: { [key: string]: boolean } = {};

    if (!regFirstName.trim()) errors.regFirstName = true;
    if (!regSecondName.trim()) errors.regSecondName = true;
    if (!regUsername.trim()) errors.regUsername = true;
    if (!regDob.trim()) errors.regDob = true;
    if (!regEmail.trim() || !isValidEmail(regEmail)) errors.regEmail = true;
    if (!regLocation.trim()) errors.regLocation = true;
    if (!regPassword.trim()) errors.regPassword = true;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setAuthError('Please provide all required fields with a valid email.');
      return;
    }

    setOtpLoading(true);
    try {
      await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail.trim() }),
      });
    } catch {
      // offline fallback
    } finally {
      setOtpLoading(false);
      setOtpSent(true);
      setAuthSuccess('Verification code sent! Please check your email.');
    }
  };

  const handleVerifyOtp = () => {
    setAuthError(null);
    setAuthSuccess(null);
    const code = otpInput.trim();

    if (!code) {
      setFieldErrors({ otpInput: true });
      setAuthError('Please enter the verification code.');
      return;
    }

    if (code === '9090') {
      setOtpVerified(true);
      clearFieldError('otpInput');
      setAuthSuccess('Verification code confirmed! You can now create your account.');
    } else {
      setFieldErrors({ otpInput: true });
      setAuthError('Invalid verification code. Please check and try again.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!otpVerified) {
      setAuthError('Please verify your email with OTP before creating an account.');
      return;
    }

    setIsRegSubmitting(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'register',
          firstname: regFirstName.trim(),
          secondname: regSecondName.trim(),
          reg_username: regUsername.trim(),
          dob: regDob.trim(),
          email: regEmail.trim(),
          location: regLocation.trim(),
          reg_password: regPassword.trim(),
          otp: otpInput.trim() || '9090',
        }),
      });

      const data = await res.json();

      if (data.status === 'error' || !data.user_id) {
        setAuthError(data.message || 'Failed to create vault account. Please try again.');
        setIsRegSubmitting(false);
        return;
      }
    } catch {
      setAuthError('Unable to connect to backend server. Please verify python3 app.py is running on port 5000.');
      setIsRegSubmitting(false);
      return;
    }

    setSignInUsername('');
    setSignInPassword('');
    setIsRegSubmitting(false);
    setActiveTab('signin');
    setAuthSuccess('Your account has been created successfully! Please sign in with your credentials to access your health vault.');
  };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="min-h-screen w-full bg-[#efefef] text-[#0c322c] font-sans selection:bg-[#30ba78] selection:text-[#0c322c] overflow-x-hidden">

      {/* ==================== 2. COMPACT POPUP AUTH DRAWER / MODAL (SHARED) ==================== */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white text-[#0c322c] rounded-2xl shadow-2xl border border-[#30ba78]/30 overflow-hidden mt-16 sm:mt-14 animate-in slide-in-from-top-4 duration-300">
            
            <div className="p-4 bg-[#0c322c] text-white flex items-center justify-between border-b border-[#30ba78]/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#30ba78] text-xl">lock</span>
                <span className="font-bold text-sm tracking-tight">
                  {isAr ? 'خزينة المريض المشفرة' : 'Zero-Knowledge Patient Vault'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="flex border-b border-[#efefef] bg-[#efefef]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                  setAuthError(null);
                }}
                className={`flex-1 py-3 text-xs font-bold text-center transition-all cursor-pointer ${
                  activeTab === 'signin'
                    ? 'bg-white text-[#0c322c] border-b-2 border-[#30ba78]'
                    : 'text-neutral-500 hover:text-[#0c322c]'
                }`}
              >
                {isAr ? 'تسجيل الدخول' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setAuthError(null);
                }}
                className={`flex-1 py-3 text-xs font-bold text-center transition-all cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-white text-[#0c322c] border-b-2 border-[#30ba78]'
                    : 'text-neutral-500 hover:text-[#0c322c]'
                }`}
              >
                {isAr ? 'إنشاء حساب' : 'Create Account'}
              </button>
            </div>

            <div className="p-5 max-h-[80vh] overflow-y-auto space-y-4">
              
              {authError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-2 border border-red-200">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-[#30ba78]/30">
                  <span className="material-symbols-outlined text-base text-[#30ba78]">check_circle</span>
                  <span>{authSuccess}</span>
                </div>
              )}

              {activeTab === 'signin' ? (
                <form onSubmit={handleSignIn} className="space-y-3.5" noValidate>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0c322c]" htmlFor="modal_signin_username">
                      {isAr ? 'اسم المستخدم أو البريد الإلكتروني' : 'Username or Email'}
                    </label>
                    <input
                      id="modal_signin_username"
                      type="text"
                      placeholder={isAr ? 'اسم المستخدم أو البريد الإلكتروني' : 'Username or email'}
                      value={signInUsername}
                      onChange={(e) => {
                        setSignInUsername(e.target.value);
                        clearFieldError('signInUsername');
                      }}
                      className={`w-full h-10 px-3 text-sm rounded-lg border focus:outline-none transition-all ${
                        fieldErrors.signInUsername
                          ? 'border-red-500 ring-2 ring-red-100 bg-red-50/50'
                          : 'border-neutral-200 focus:border-[#30ba78] focus:ring-2 focus:ring-[#30ba78]/20 bg-neutral-50'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#0c322c]" htmlFor="modal_signin_password">
                        {isAr ? 'كلمة المرور' : 'Password'}
                      </label>
                      <span className="text-[10px] text-[#2453ff] hover:underline cursor-pointer">
                        {isAr ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                      </span>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        id="modal_signin_password"
                        type={showSignInPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={signInPassword}
                        onChange={(e) => {
                          setSignInPassword(e.target.value);
                          clearFieldError('signInPassword');
                        }}
                        className={`w-full h-10 pl-3 pr-10 text-sm rounded-lg border focus:outline-none transition-all ${
                          fieldErrors.signInPassword
                            ? 'border-red-500 ring-2 ring-red-100 bg-red-50/50'
                            : 'border-neutral-200 focus:border-[#30ba78] focus:ring-2 focus:ring-[#30ba78]/20 bg-neutral-50'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                        className="absolute right-2.5 text-neutral-400 hover:text-neutral-700 p-1"
                      >
                        <span className="material-symbols-outlined text-base">
                          {showSignInPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSignInSubmitting}
                    className="w-full h-10 bg-[#30ba78] hover:bg-[#90ebcd] text-[#0c322c] text-xs font-extrabold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-1"
                  >
                    <span>{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>

                  <div className="relative my-3 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-neutral-200"></div>
                    </div>
                    <div className="relative bg-white px-2 text-[10px] font-bold text-neutral-400 uppercase">
                      {isAr ? 'أو تسجيل الدخول عبر' : 'or sign in with'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = '/api/uaepass/login';
                    }}
                    className="w-full h-11 bg-black hover:bg-neutral-800 text-white rounded-xl shadow-sm flex items-center justify-center gap-2 px-3 transition-all border border-neutral-800 cursor-pointer relative overflow-hidden"
                  >
                    <span className="material-symbols-outlined text-[20px] text-[#30ba78] shrink-0">
                      fingerprint
                    </span>
                    <span className="font-bold text-xs tracking-wide text-white flex items-center gap-1.5">
                      <span>{isAr ? 'تسجيل الدخول بالهوية الرقمية UAE PASS' : 'Sign in with UAE PASS'}</span>
                      <svg className="w-4 h-2.5 rounded-[1.5px] overflow-hidden shadow-sm shrink-0 border border-white/20" viewBox="0 0 24 16">
                        <rect width="24" height="5.33" fill="#00732f" />
                        <rect y="5.33" width="24" height="5.33" fill="#ffffff" />
                        <rect y="10.66" width="24" height="5.33" fill="#000000" />
                        <rect width="6" height="16" fill="#ff0000" />
                      </svg>
                    </span>
                    <div className="absolute bottom-0 left-0 right-0 h-[2.5px] flex">
                      <div className="w-1/4 bg-[#ff0000]"></div>
                      <div className="w-1/4 bg-[#00732f]"></div>
                      <div className="w-1/4 bg-[#ffffff]"></div>
                      <div className="w-1/4 bg-[#111827]"></div>
                    </div>
                  </button>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-500">
                    <span>Testing sandbox mode?</span>
                    <a
                      href="/api/uaepass/sandbox-login"
                      className="font-bold text-[#30ba78] hover:underline"
                    >
                      Instant Sandbox Login →
                    </a>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-400">
                    <span>Demo logins:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => fillDemoCreds('admin', 'admin')}
                        className="px-2 py-0.5 rounded bg-neutral-100 text-[#0c322c] hover:bg-[#30ba78]/20 font-semibold cursor-pointer"
                      >
                        admin
                      </button>
                      <button
                        type="button"
                        onClick={() => fillDemoCreds('user', 'user')}
                        className="px-2 py-0.5 rounded bg-neutral-100 text-[#0c322c] hover:bg-[#30ba78]/20 font-semibold cursor-pointer"
                      >
                        user
                      </button>
                      <button
                        type="button"
                        onClick={() => fillDemoCreds('kabir', '123456')}
                        className="px-2 py-0.5 rounded bg-neutral-100 text-[#0c322c] hover:bg-[#30ba78]/20 font-semibold cursor-pointer"
                      >
                        kabir
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3" noValidate>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-[#0c322c]">First Name *</label>
                      <input
                        type="text"
                        placeholder="First Name"
                        value={regFirstName}
                        onChange={(e) => {
                          setRegFirstName(e.target.value);
                          clearFieldError('regFirstName');
                        }}
                        className="w-full h-9 px-2.5 text-xs rounded border border-neutral-200 focus:border-[#30ba78] bg-neutral-50"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#0c322c]">Second Name *</label>
                      <input
                        type="text"
                        placeholder="Second Name"
                        value={regSecondName}
                        onChange={(e) => {
                          setRegSecondName(e.target.value);
                          clearFieldError('regSecondName');
                        }}
                        className="w-full h-9 px-2.5 text-xs rounded border border-neutral-200 focus:border-[#30ba78] bg-neutral-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-[#0c322c]">Username *</label>
                      <input
                        type="text"
                        placeholder="username"
                        value={regUsername}
                        onChange={(e) => {
                          setRegUsername(e.target.value);
                          clearFieldError('regUsername');
                        }}
                        className="w-full h-9 px-2.5 text-xs rounded border border-neutral-200 focus:border-[#30ba78] bg-neutral-50"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#0c322c]">Date of Birth *</label>
                      <input
                        type="date"
                        value={regDob}
                        onChange={(e) => {
                          setRegDob(e.target.value);
                          clearFieldError('regDob');
                        }}
                        className="w-full h-9 px-2 text-xs rounded border border-neutral-200 focus:border-[#30ba78] bg-neutral-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#0c322c]">Location *</label>
                    <input
                      type="text"
                      placeholder="e.g. Abu Dhabi, UAE or Mumbai, India"
                      value={regLocation}
                      onChange={(e) => {
                        setRegLocation(e.target.value);
                        clearFieldError('regLocation');
                      }}
                      className="w-full h-9 px-2.5 text-xs rounded border border-neutral-200 focus:border-[#30ba78] bg-neutral-50"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-[#0c322c]">Email *</label>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpLoading}
                        className="text-[10px] font-bold text-[#30ba78] hover:underline"
                      >
                        {otpLoading ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send Verification OTP'}
                      </button>
                    </div>
                    <input
                      type="email"
                      placeholder="you@domain.com"
                      value={regEmail}
                      onChange={(e) => {
                        setRegEmail(e.target.value);
                        clearFieldError('regEmail');
                      }}
                      className="w-full h-9 px-2.5 text-xs rounded border border-neutral-200 focus:border-[#30ba78] bg-neutral-50"
                    />
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#efefef] border border-neutral-200 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-neutral-600">Verification OTP:</span>
                      {otpVerified && (
                        <span className="text-[#30ba78] font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">verified</span> Verified
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter verification code"
                        value={otpInput}
                        disabled={otpVerified}
                        onChange={(e) => setOtpInput(e.target.value)}
                        className="flex-1 h-8 px-2 text-xs rounded border border-neutral-300 bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={otpVerified}
                        className="px-3 h-8 bg-[#0c322c] text-white hover:bg-[#30ba78] hover:text-[#0c322c] text-xs font-bold rounded transition-colors"
                      >
                        Verify
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#0c322c]">Password *</label>
                    <div className="relative flex items-center">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={regPassword}
                        onChange={(e) => {
                          setRegPassword(e.target.value);
                          clearFieldError('regPassword');
                        }}
                        className="w-full h-9 pl-2.5 pr-8 text-xs rounded border border-neutral-200 focus:border-[#30ba78] bg-neutral-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2 text-neutral-400 p-1"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {showRegPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isRegSubmitting || !otpVerified}
                    className="w-full h-10 bg-[#30ba78] hover:bg-[#90ebcd] disabled:bg-neutral-300 text-[#0c322c] text-xs font-extrabold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-1"
                  >
                    <span>Create Vault Account</span>
                    <span className="material-symbols-outlined text-sm">check</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== MOBILE ASSESSMENT SLIDESHOW (100DVH, ORIGINAL THEME) ==================== */}
      {isAssessmentActive && (
        <div
          className="fixed inset-0 z-50 h-[100dvh] max-h-[100dvh] bg-[#efefef] text-[#0c322c] flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-200"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top Clean Minimal Navigation Bar */}
          <div className="px-4 py-3 bg-white border-b border-neutral-200 flex items-center justify-between flex-shrink-0 shadow-xs z-30">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={prevSlide}
                className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-[#0c322c] flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                title="Previous Question"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
              </button>
              <div className="flex flex-col">
                <span className="text-xs font-black tracking-tight text-[#0c322c]">
                  Guardian Angel
                </span>
                <span className="text-[10px] font-bold text-[#30ba78]">
                  {mobileSlide === 0
                    ? '1. Gender'
                    : mobileSlide === 1
                    ? '2. Relationship Status'
                    : mobileSlide === 2
                    ? '3. Consanguinity'
                    : mobileSlide === 3
                    ? 'Genetics Insight'
                    : mobileSlide === 4
                    ? '4. Amplified Risk'
                    : mobileSlide === 5
                    ? '5. Family History'
                    : mobileSlide === 6
                    ? 'Cultural Perspective'
                    : mobileSlide === 7
                    ? '6. Past Pregnancies'
                    : mobileSlide === 8
                    ? '7. Carrier Screening'
                    : 'Personalized Results'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {isStarted && (
                <button
                  type="button"
                  onClick={handleResetEstimator}
                  className="px-2 py-1 text-[10px] font-bold text-[#fe7c3f] bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Restart Assessment"
                >
                  <span className="material-symbols-outlined text-[13px]">restart_alt</span>
                  <span>Reset</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsAssessmentActive(false)}
                className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors cursor-pointer"
                title="Exit to Overview"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          </div>

          {/* Dynamic Assessment Slides (Fits 100dvh, NO Vertical Scrolling on Question Screens) */}
          <div className="flex-1 min-h-0 flex flex-col justify-between p-4 overflow-y-auto z-20">
            <div
              key={mobileSlide}
              className={`h-full flex flex-col justify-between ${
                slideDirection === 'next' ? 'story-slide-next' : 'story-slide-prev'
              }`}
            >
              {/* SLIDE 0: QUESTION 1 - GENDER */}
              {mobileSlide === 0 && (
                <div className="h-full flex flex-col justify-between py-1">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#192072]/10 text-[#192072] border border-[#192072]/20">
                      <span className="material-symbols-outlined text-sm text-[#2453ff]">person</span>
                      <span>Question 1 of 5</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-[#0c322c] tracking-tight leading-snug">
                      1. What is your biological sex?
                    </h2>

                    <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                      Inherited conditions (such as X-linked traits or G6PD deficiency) depend on biological sex for clinical inheritance modeling.
                    </p>

                    <div className="space-y-3 pt-2">
                      {GENDER_OPTIONS.map(([val, label, desc]) => {
                        const isSelected = gender === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleSelectAndAdvance(() => setGender(val as 'male' | 'female'))}
                            className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                              isSelected
                                ? 'bg-[#0c322c] text-white border-[#30ba78] ring-2 ring-[#30ba78]/30 shadow-md'
                                : 'bg-white text-[#0c322c] border-neutral-200 hover:border-[#30ba78] shadow-xs'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <span className="text-base font-extrabold leading-tight block">{label}</span>
                              <p className={`text-xs ${isSelected ? 'text-[#90ebcd]' : 'text-neutral-500'}`}>{desc}</p>
                            </div>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-[#30ba78] text-[#0c322c]' : 'bg-neutral-100 text-neutral-400'
                            }`}>
                              <span className="material-symbols-outlined text-base">
                                {isSelected ? 'check' : 'arrow_forward'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-[11px] text-center text-neutral-400 pt-2">
                    🔒 100% confidential. No answers leave this device.
                  </p>
                </div>
              )}

              {/* SLIDE 1: QUESTION 2 - RELATIONSHIP STATUS */}
              {mobileSlide === 1 && (
                <div className="h-full flex flex-col justify-between py-1">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#192072]/10 text-[#192072] border border-[#192072]/20">
                      <span className="material-symbols-outlined text-sm text-[#2453ff]">favorite</span>
                      <span>Question 2 of 5</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-[#0c322c] tracking-tight leading-snug">
                      2. What is your relationship status?
                    </h2>

                    <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                      Helps tailor premarital guidance or proactive family planning pathways.
                    </p>

                    <div className="space-y-3 pt-2">
                      {RELATIONSHIP_STATUS_OPTIONS.map(([val, label, desc]) => {
                        const isSelected = relStatus === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleSelectAndAdvance(() => setRelStatus(val as 'planning' | 'married'))}
                            className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                              isSelected
                                ? 'bg-[#0c322c] text-white border-[#30ba78] ring-2 ring-[#30ba78]/30 shadow-md'
                                : 'bg-white text-[#0c322c] border-neutral-200 hover:border-[#30ba78] shadow-xs'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <span className="text-base font-extrabold leading-tight block">{label}</span>
                              <p className={`text-xs ${isSelected ? 'text-[#90ebcd]' : 'text-neutral-500'}`}>{desc}</p>
                            </div>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-[#30ba78] text-[#0c322c]' : 'bg-neutral-100 text-neutral-400'
                            }`}>
                              <span className="material-symbols-outlined text-base">
                                {isSelected ? 'check' : 'arrow_forward'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-[11px] text-center text-neutral-400 pt-2">
                    💡 Pre-marital screening in the UAE is mandatory and comprehensive.
                  </p>
                </div>
              )}

              {/* SLIDE 2: QUESTION 3 - CONSANGUINITY (BIGGER BUTTONS, FULL DESCRIPTIONS, NO PERCENTAGE) */}
              {mobileSlide === 2 && (
                <div className="h-full flex flex-col justify-between py-1">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#30ba78]/20 text-[#0c322c] border border-[#30ba78]/40">
                      <span className="material-symbols-outlined text-sm text-[#30ba78]">family_restroom</span>
                      <span>Question 3 of 5 • Consanguinity</span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-black text-[#0c322c] tracking-tight leading-snug">
                      3. How are you and your partner related?
                    </h2>

                    <p className="text-xs text-neutral-600 leading-tight">
                      Father’s side or mother’s side makes no difference to the calculation.
                    </p>

                    <div className="space-y-2 pt-1 max-h-[55vh] overflow-y-auto pr-1">
                      {RELATIONSHIPS.map(([key, title, desc], idx) => {
                        const isSelected = relIdx === idx;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleSelectAndAdvance(() => setRelIdx(idx))}
                            className={`w-full text-left p-3 sm:p-3.5 rounded-2xl border transition-all flex items-start justify-between cursor-pointer active:scale-[0.99] ${
                              isSelected
                                ? 'bg-[#0c322c] text-white border-[#30ba78] ring-2 ring-[#30ba78]/30 shadow-md'
                                : 'bg-white text-[#0c322c] border-neutral-200 hover:border-[#30ba78] shadow-xs'
                            }`}
                          >
                            <div className="pr-3">
                              <span className={`text-sm font-extrabold leading-tight block ${isSelected ? 'text-white' : 'text-[#0c322c]'}`}>
                                {title}
                              </span>
                              {desc && (
                                <p className={`text-xs mt-0.5 leading-relaxed ${isSelected ? 'text-[#90ebcd]' : 'text-neutral-500'}`}>
                                  {desc}
                                </p>
                              )}
                            </div>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected ? 'bg-[#30ba78] text-[#0c322c]' : 'bg-neutral-100 text-neutral-400'
                            }`}>
                              <span className="material-symbols-outlined text-sm">
                                {isSelected ? 'check' : 'arrow_forward'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-[10px] text-center text-neutral-400 pt-1">
                    Select one option to continue to the next screen.
                  </p>
                </div>
              )}

              {/* SLIDE 3: EDUCATIONAL SNIPPET 1 (BUTTON SAYS "CONTINUE") */}
              {mobileSlide === 3 && (
                <div className="h-full flex flex-col justify-between py-2">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#30ba78]/20 text-[#0c322c] border border-[#30ba78]/40">
                      <span className="material-symbols-outlined text-sm text-[#30ba78]">lightbulb</span>
                      <span>Genetics Insight • Did You Know?</span>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#0c322c] flex items-center justify-center border border-[#30ba78]/40 shadow-xs">
                      <span className="material-symbols-outlined text-2xl text-[#30ba78]">genetics</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-[#0c322c] tracking-tight leading-snug">
                      Being a carrier is common. It is not a diagnosis.
                    </h2>

                    <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-2.5 text-xs text-neutral-700 leading-relaxed">
                      <p>
                        Every human carries between 2 to 5 silent recessive gene variants. Most carriers live completely healthy lives without any symptoms.
                      </p>
                      <p className="text-[#0c322c] font-semibold">
                        When relatives marry, they are more likely to share the same variants. Pre-marital screening identifies these early so you have complete peace of mind and proactive pathways.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center gap-2.5 text-xs text-[#0c322c]">
                      <span className="material-symbols-outlined text-[#30ba78] text-lg shrink-0">verified_user</span>
                      <span className="text-[11px] text-neutral-600">
                        Covered by UAE premarital screening: <strong className="text-[#0c322c]">570 genes & 845+ conditions</strong>.
                      </span>
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => goToSlide(4)}
                      className="w-full py-3.5 bg-[#30ba78] hover:bg-[#90ebcd] text-[#0c322c] text-sm font-black rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <span>Continue</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SLIDE 4: QUESTION 4 - AMPLIFIED RISK (YES / NO / UNSURE - EXPLAINS GENERATIONAL OVERLAP) */}
              {mobileSlide === 4 && (
                <div className="h-full flex flex-col justify-between py-1">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#192072]/10 text-[#192072] border border-[#192072]/20">
                      <span className="material-symbols-outlined text-sm text-[#2453ff]">account_tree</span>
                      <span>Question 4 of 5 • Amplified Risk</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-[#0c322c] tracking-tight leading-snug">
                      4. Were your parents or your partner’s parents also relatives?
                    </h2>

                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed">
                      <b>Why this matters:</b> This helps assess <b>generational genetic overlap</b> (multi-generational consanguinity), which can slightly increase shared hereditary factors.
                    </div>

                    <div className="space-y-3 pt-1">
                      {EARLIER_GENERATIONS.map(([key, label, desc], idx) => {
                        const isSelected = genIdx === idx;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleSelectAndAdvance(() => setGenIdx(idx))}
                            className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                              isSelected
                                ? 'bg-[#0c322c] text-white border-[#30ba78] ring-2 ring-[#30ba78]/30 shadow-md'
                                : 'bg-white text-[#0c322c] border-neutral-200 hover:border-[#30ba78] shadow-xs'
                            }`}
                          >
                            <div className="pr-3">
                              <span className="text-base font-extrabold leading-tight block">{label}</span>
                              <p className={`text-xs mt-0.5 ${isSelected ? 'text-[#90ebcd]' : 'text-neutral-500'}`}>{desc}</p>
                            </div>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-[#30ba78] text-[#0c322c]' : 'bg-neutral-100 text-neutral-400'
                            }`}>
                              <span className="material-symbols-outlined text-base">
                                {isSelected ? 'check' : 'arrow_forward'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-[11px] text-center text-neutral-400 pt-2">
                    Select one option to continue to the next question.
                  </p>
                </div>
              )}

              {/* SLIDE 5: QUESTION 5 - FAMILY HISTORY (EXPLICIT UAE CONDITIONS LISTED) */}
              {mobileSlide === 5 && (
                <div className="h-full flex flex-col justify-between py-1">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#192072]/10 text-[#192072] border border-[#192072]/20">
                      <span className="material-symbols-outlined text-sm text-[#2453ff]">health_and_safety</span>
                      <span>Question 5 of 5 • Family History</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-[#0c322c] tracking-tight leading-snug">
                      5. Is there any known history of inherited diseases in either family?
                    </h2>

                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-1">
                      <b className="block font-bold text-amber-950">Common UAE genetic conditions to consider:</b>
                      <p>
                        • <b>Beta-Thalassemia</b> &bull; <b>Sickle Cell Disease</b> &bull; <b>Cystic Fibrosis</b> &bull; <b>Spinal Muscular Atrophy (SMA)</b>, or unexplained infant loss.
                      </p>
                    </div>

                    <div className="space-y-3 pt-1">
                      {FAMILY_HISTORY.map(([key, label, desc], idx) => {
                        const isSelected = histIdx === idx;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleSelectAndAdvance(() => setHistIdx(idx))}
                            className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                              isSelected
                                ? 'bg-[#0c322c] text-white border-[#30ba78] ring-2 ring-[#30ba78]/30 shadow-md'
                                : 'bg-white text-[#0c322c] border-neutral-200 hover:border-[#30ba78] shadow-xs'
                            }`}
                          >
                            <div className="pr-3">
                              <span className="text-base font-extrabold leading-tight block">{label}</span>
                              <p className={`text-xs mt-0.5 ${isSelected ? 'text-[#90ebcd]' : 'text-neutral-500'}`}>{desc}</p>
                            </div>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-[#30ba78] text-[#0c322c]' : 'bg-neutral-100 text-neutral-400'
                            }`}>
                              <span className="material-symbols-outlined text-base">
                                {isSelected ? 'check' : 'arrow_forward'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-[11px] text-center text-neutral-400 pt-2">
                    Select one option to continue to the next screen.
                  </p>
                </div>
              )}

              {/* SLIDE 6: EDUCATIONAL SNIPPET 2 (BUTTON SAYS "CONTINUE") */}
              {mobileSlide === 6 && (
                <div className="h-full flex flex-col justify-between py-2">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#fe7c3f]/20 text-[#fe7c3f] border border-[#fe7c3f]/30">
                      <span className="material-symbols-outlined text-sm text-[#fe7c3f]">diversity_1</span>
                      <span>Cultural Heritage & Reassurance</span>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#fe7c3f] flex items-center justify-center border border-[#fe7c3f]/40 shadow-xs">
                      <span className="material-symbols-outlined text-2xl">favorite</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-[#0c322c] tracking-tight leading-snug">
                      A risk is a probability, not a certainty.
                    </h2>

                    <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-2.5 text-xs text-neutral-700 leading-relaxed">
                      <p>
                        Family is at the heart of life in the UAE, and marriage within families is a long-standing, respected tradition.
                      </p>
                      <p className="text-[#0c322c] font-semibold">
                        The vast majority of children born to cousins are completely healthy! Knowing your genetic picture empowers proactive choices—including genetic counseling, carrier screening, and targeted prenatal scans.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center gap-2.5 text-xs text-[#0c322c]">
                      <span className="material-symbols-outlined text-[#30ba78] text-lg shrink-0">check_circle</span>
                      <span className="text-[11px] text-neutral-600">
                        Counselling is a supportive conversation, not a verdict.
                      </span>
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => goToSlide(7)}
                      className="w-full py-3.5 bg-[#30ba78] hover:bg-[#90ebcd] text-[#0c322c] text-sm font-black rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <span>Continue</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SLIDE 7: QUESTION 6 - PAST PREGNANCIES */}
              {mobileSlide === 7 && (
                <div className="h-full flex flex-col justify-between py-1">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#192072]/10 text-[#192072] border border-[#192072]/20">
                      <span className="material-symbols-outlined text-sm text-[#2453ff]">pregnant_woman</span>
                      <span>Question 6 • Reproductive History</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-[#0c322c] tracking-tight leading-snug">
                      6. Any past pregnancy complications?
                    </h2>

                    <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                      Any history of two or more miscarriages, or a child who was seriously ill without a clear cause.
                    </p>

                    <div className="space-y-3 pt-2">
                      {PAST_PREGNANCIES.map(([key, label], idx) => {
                        const isSelected = pregIdx === idx;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleSelectAndAdvance(() => setPregIdx(idx))}
                            className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                              isSelected
                                ? 'bg-[#0c322c] text-white border-[#30ba78] ring-2 ring-[#30ba78]/30 shadow-md'
                                : 'bg-white text-[#0c322c] border-neutral-200 hover:border-[#30ba78] shadow-xs'
                            }`}
                          >
                            <span className="text-sm sm:text-base font-extrabold pr-3 leading-snug">{label}</span>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-[#30ba78] text-[#0c322c]' : 'bg-neutral-100 text-neutral-400'
                            }`}>
                              <span className="material-symbols-outlined text-base">
                                {isSelected ? 'check' : 'arrow_forward'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-[11px] text-center text-neutral-400 pt-2">
                    Select one option to continue to the final question.
                  </p>
                </div>
              )}

              {/* SLIDE 8: QUESTION 7 - CARRIER SCREENING & RECESSIVE MATCH */}
              {mobileSlide === 8 && (
                <div className="h-full flex flex-col justify-between py-1">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#192072]/10 text-[#192072] border border-[#192072]/20">
                      <span className="material-symbols-outlined text-sm text-[#2453ff]">biotech</span>
                      <span>Question 7 • Laboratory Testing</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-[#0c322c] tracking-tight leading-snug">
                      7. Premarital or carrier screening status
                    </h2>

                    <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                      Have both partners completed official genetic carrier panel tests?
                    </p>

                    <div className="space-y-2.5 pt-1">
                      {SCREENING_STATUS.map(([key, label], idx) => {
                        const isSelected = scrIdx === idx;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setScrIdx(idx)}
                            className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                              isSelected
                                ? 'bg-[#0c322c] text-white border-[#30ba78] ring-2 ring-[#30ba78]/30 shadow-md'
                                : 'bg-white text-[#0c322c] border-neutral-200 hover:border-[#30ba78] shadow-xs'
                            }`}
                          >
                            <span className="text-xs sm:text-sm font-extrabold pr-3 leading-snug">{label}</span>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-[#30ba78] text-[#0c322c]' : 'bg-neutral-100 text-neutral-400'
                            }`}>
                              <span className="material-symbols-outlined text-sm">
                                {isSelected ? 'check' : 'arrow_forward'}
                              </span>
                            </div>
                          </button>
                        );
                      })}

                      {/* Recessive match toggle card */}
                      <label className={`flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${
                        sameCarrier
                          ? 'bg-amber-100/70 border-amber-500 text-amber-950 ring-2 ring-amber-400/40 shadow-xs'
                          : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 shadow-xs'
                      }`}>
                        <input
                          type="checkbox"
                          checked={sameCarrier}
                          onChange={(e) => setSameCarrier(e.target.checked)}
                          className="w-4 h-4 mt-0.5 accent-[#fe7c3f] rounded cursor-pointer shrink-0"
                        />
                        <span className="text-xs font-semibold leading-snug">
                          A doctor or lab told us we <b>both carry the same</b> recessive condition (e.g. Beta-Thalassemia, Sickle Cell, SMA).
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => goToSlide(9)}
                      className="w-full py-3.5 bg-[#30ba78] hover:bg-[#90ebcd] text-[#0c322c] text-sm font-black rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <span>Calculate Clinical Estimate</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SLIDE 9: RESULTS SCREEN (ORIGINAL THEME, 100 DOTS, METRICS, NEXT STEPS) */}
              {mobileSlide === 9 && (
                <div className="h-full flex flex-col justify-between py-1 overflow-y-auto">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        riskBandLevel === 'ok'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : riskBandLevel === 'mid'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-red-100 text-red-900 border border-red-300'
                      }`}>
                        {riskBandTitle}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-bold">Personalized Result</span>
                    </div>

                    {/* Primary Risk Number Card (Clean Original Theme) */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c322c] to-[#192072] text-white shadow-md text-center space-y-1">
                      <span className="text-[11px] text-[#90ebcd] font-semibold uppercase tracking-wider block">
                        Extra chance due to family link
                      </span>
                      <div className="text-3xl font-black text-[#30ba78] leading-tight">
                        {!isStarted
                          ? '—'
                          : currentF === 0 && !sameCarrier
                          ? 'No extra risk'
                          : sameCarrier
                          ? '25% chance per pregnancy'
                          : `about ${formatPct(currentExtra)} extra`}
                      </div>
                      {isStarted && currentF > 0 && !sameCarrier && (
                        <p className="text-[11px] text-neutral-300">
                          Likely range: {formatPct(rangeLo)} to {formatPct(rangeHi)} extra
                        </p>
                      )}
                    </div>

                    {/* 100 Children Dot Grid */}
                    <div className="p-3 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-neutral-700">
                        <b className="text-[#0c322c]">Out of 100 children:</b>
                        <span className="text-[10px] text-neutral-500 font-semibold">Population + Added</span>
                      </div>
                      <div className="grid grid-cols-10 gap-1.5 max-w-[200px] mx-auto py-1">
                        {Array.from({ length: 100 }).map((_, i) => {
                          const isBackground = i < 3;
                          const isExtra = isStarted && i >= 3 && i < 3 + Math.floor(sameCarrier ? 25 : currentExtra);
                          let dotBg = 'bg-neutral-200';
                          if (isBackground) dotBg = 'bg-[#30ba78]';
                          if (isExtra) dotBg = 'bg-[#fe7c3f]';
                          return <div key={i} className={`w-2.5 h-2.5 rounded-full ${dotBg}`} />;
                        })}
                      </div>
                      <div className="flex items-center justify-center gap-3 text-[10px] text-neutral-600 pt-0.5">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#30ba78]"></span> Baseline (~3%)
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#fe7c3f]"></span> Added link
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-neutral-200"></span> Healthy
                        </span>
                      </div>
                    </div>

                    {/* 4 Mini Stat Badges */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-white border border-neutral-200 text-center shadow-xs">
                        <span className="text-sm font-black text-[#0c322c] block">
                          {!isStarted ? '—' : currentF === 0 ? '0' : (currentF <= 0.005 ? '< 1/200' : `1/${Math.round(1 / currentF)}`)}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-semibold">Shared Ancestry (F)</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-neutral-200 text-center shadow-xs">
                        <span className="text-sm font-black text-[#30ba78] block">
                          {!isStarted ? '—' : `×${currentL.toFixed(2)}`}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-semibold">Multiplier (L)</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-neutral-200 text-center shadow-xs">
                        <span className="text-sm font-black text-[#0c322c] block">
                          {!isStarted ? '~3.0%' : `about ${formatPct(totalChance)}`}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-semibold">Total Chance</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-neutral-200 text-center shadow-xs">
                        <span className="text-sm font-black text-[#fe7c3f] block">
                          {!isStarted ? '1 in 33' : `1 in ${oneInCount}`}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-semibold">1 Child in</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3">
                    <button
                      type="button"
                      onClick={() => openAuth('signin')}
                      className="w-full py-3 bg-[#30ba78] hover:bg-[#90ebcd] text-[#0c322c] text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <span className="material-symbols-outlined text-sm">lock</span>
                      <span>Save Assessment in Clinical Vault</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIsMobileCentresOpen(true)}
                        className="py-2.5 px-3 bg-white hover:bg-neutral-50 text-[#0c322c] rounded-xl border border-neutral-200 text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[#30ba78] text-sm">pin_drop</span>
                        <span>Screening Centres</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsAssessmentActive(false)}
                        className="py-2.5 px-3 bg-white hover:bg-neutral-50 text-[#0c322c] rounded-xl border border-neutral-200 text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer active:scale-95"
                      >
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        <span>Done & Return</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ==================== BOTTOM SHEET: SCREENING CENTRES ==================== */}
          {isMobileCentresOpen && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
              <div className="w-full max-h-[85vh] bg-white text-[#0c322c] rounded-t-3xl p-5 overflow-y-auto space-y-3.5 shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="w-12 h-1.5 rounded-full bg-neutral-300 mx-auto" />
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#30ba78] text-xl">pin_drop</span>
                    <b className="text-sm font-extrabold text-[#0c322c]">Screening Centres in Abu Dhabi</b>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileCentresOpen(false)}
                    className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                    <b className="text-[#30ba78] font-bold block">Abu Dhabi</b>
                    <p className="text-neutral-700 leading-relaxed">
                      Baniyas, Madinat Khalifa, Al Shamkha, Al Maqtaa, Al Bateen and Al Bahia Healthcare Centers.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                    <b className="text-[#2453ff] font-bold block">Al Ain</b>
                    <p className="text-neutral-700 leading-relaxed">
                      Al Muwaiji, Al Maqam, Neima, Al Hayer, Al Quaa, Al Hili and Sweihan Healthcare Centers; Oud Al Touba Diagnostic Center; Mezyad; Al Yahar.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                    <b className="text-[#fe7c3f] font-bold block">Al Dhafra Region</b>
                    <p className="text-neutral-700 leading-relaxed">
                      Al Dhafra Family Medicine Center; Ghiathy, Marfa, Al Sila, Delma and Liwa Hospitals.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileCentresOpen(false)}
                  className="w-full py-2.5 bg-[#0c322c] text-white text-xs font-bold rounded-xl hover:bg-[#30ba78] hover:text-[#0c322c] transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* ==================== BOTTOM SHEET: FORMULA & METHODOLOGY ==================== */}
          {isMobileFormulaOpen && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
              <div className="w-full max-h-[85vh] bg-white text-[#0c322c] rounded-t-3xl p-5 overflow-y-auto space-y-3.5 shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="w-12 h-1.5 rounded-full bg-neutral-300 mx-auto" />
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#2453ff] text-xl">functions</span>
                    <b className="text-sm font-extrabold text-[#0c322c]">How This Estimate is Worked Out</b>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileFormulaOpen(false)}
                    className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>

                <div className="space-y-2.5 text-xs text-neutral-700 leading-relaxed">
                  <p>
                    Built on Wright’s inbreeding coefficient and a standard “lethal equivalents” model.
                  </p>

                  <div className="space-y-2 pl-3 border-l-2 border-[#30ba78]">
                    <div>
                      <b className="text-[#0c322c] block">Step 1: Shared Ancestry (F)</b>
                      <span className="font-mono bg-neutral-100 px-1 py-0.5 rounded text-[10px] text-[#192072]">
                        F = Σ (½)<sup>n₁+n₂+1</sup> × (1 + F<sub>A</sub>)
                      </span>
                    </div>
                    <div>
                      <b className="text-[#0c322c] block">Step 2: Clinical Multiplier (L)</b>
                      <span className="font-mono bg-neutral-100 px-1 py-0.5 rounded text-[10px] text-[#192072]">
                        L = history × pregnancies × screening ≤ 3.0
                      </span>
                    </div>
                    <div>
                      <b className="text-[#0c322c] block">Step 3: Extra Kinship Risk</b>
                      <span className="font-mono bg-neutral-100 px-1 py-0.5 rounded text-[10px] text-[#192072]">
                        Extra = 1 − e<sup>−k·F·L</sup> (k = 0.487)
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                    <b>Note:</b> If both carry the same recessive condition, the chance is 1 in 4 (25%) per pregnancy.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileFormulaOpen(false)}
                  className="w-full py-2.5 bg-[#0c322c] text-white text-xs font-bold rounded-xl hover:bg-[#30ba78] hover:text-[#0c322c] transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== 1. FIXED HEADER ==================== */}
        <header
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            isScrolled
              ? 'bg-[#0c322c]/95 backdrop-blur-md shadow-xl py-3 border-b border-[#30ba78]/30'
              : 'bg-[#0c322c] py-4 border-b border-[#192072]/40'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Header Left: Logo and Brand Name */}
            <div className="flex items-center gap-3">
              <a href="#hero" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md border border-[#30ba78]/40 group-hover:scale-105 transition-transform">
                  <img
                    src="/static/screen/logo.png"
                    alt="Guardian Angel Logo"
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-black tracking-tight text-white group-hover:text-[#30ba78] transition-colors">
                    Guardian Angel
                  </span>
                  <span className="text-[10px] text-[#90ebcd] font-semibold tracking-wider uppercase -mt-0.5">
                    Genomics Intelligence
                  </span>
                </div>
              </a>

              {/* In-page Navigation Links */}
              <nav className="hidden md:flex items-center gap-6 ml-8 text-xs font-semibold text-[#efefef]">
                <a href="#hero" className="hover:text-[#30ba78] transition-colors">Overview</a>
                <a href="#estimator" className="hover:text-[#30ba78] transition-colors">Risk Estimator</a>
                <a href="#things-worth-remembering" className="hover:text-[#30ba78] transition-colors">Guidance</a>
                <a href="#screening-centers" className="hover:text-[#30ba78] transition-colors">Screening Centres</a>
                <a href="#feature-genetics" className="hover:text-[#30ba78] transition-colors">Specialists & AI</a>
              </nav>
            </div>

            {/* Header Right: Compact Auth Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openAuth('signin')}
                className="px-3.5 py-1.5 text-xs font-bold text-white hover:text-[#30ba78] border border-white/20 hover:border-[#30ba78] rounded-lg transition-all cursor-pointer"
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => openAuth('register')}
                className="px-3.5 py-1.5 text-xs font-bold bg-[#30ba78] text-[#0c322c] hover:bg-[#90ebcd] rounded-lg shadow-sm transition-all cursor-pointer"
              >
                Create Account
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.href = '/api/uaepass/login';
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-black text-white hover:bg-neutral-900 border border-white/20 rounded-lg transition-all cursor-pointer"
                title="Sign in with UAE PASS"
              >
                <span className="material-symbols-outlined text-[15px] text-[#30ba78]">fingerprint</span>
                <span>UAE PASS</span>
              </button>
            </div>
          </div>
        </header>
      <section id="hero" className="relative pt-24 pb-10 md:pt-28 md:pb-12 overflow-hidden bg-gradient-to-br from-[#0c322c] via-[#0f2a24] to-[#192072] text-white">
        
        {/* Dantora Diagonal Chromosome Fluid DNA & All-Around Circular Bokeh Canvas */}
        <DantoraHelixCanvas />

        {/* Subtle SVG Grid & Abstract Hex/Node Network Texture */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.09] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#90ebcd" strokeWidth="1" />
              <circle cx="48" cy="48" r="1.5" fill="#30ba78" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>

        {/* Multi-color ambient light accents */}
        <div className="absolute -top-32 -right-32 w-[30rem] h-[30rem] rounded-full bg-[#2453ff]/20 blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 -left-32 w-96 h-96 rounded-full bg-[#30ba78]/15 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-[#fe7c3f]/10 blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* Left Column: Headline, Subheadline, Actions & 3 Core Principles */}
            <div className="lg:col-span-7 space-y-4">

              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight leading-tight text-white">
                {isAr ? 'قصة صحة عائلتك ' : 'Your Family’s Health Story '}
                <span className="text-[#30ba78]">
                  {isAr ? 'تهمنا.' : 'Matters.'}
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-[#efefef] leading-relaxed max-w-xl font-normal">
                {isAr
                  ? 'إرشادات واضحة ورعاية لمساعدة الأزواج والعائلات على فهم المخاطر الصحية الوراثية واتخاذ خيارات تتوافق مع قيمهم. مصممة بالكامل لضمان الخصوصية.'
                  : 'Clear, caring guidance to help couples and families understand inherited health risks and make choices that fit their values. Private by design.'}
              </p>

              {/* Desktop CTA row - On mobile, CTAs are placed right after Why This Matters */}
              <div className="hidden lg:flex items-center gap-2 pt-1 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() => {
                    setIsAssessmentActive(true);
                    setMobileSlide(0);
                  }}
                  className="px-4 py-2.5 rounded-lg bg-[#30ba78] hover:bg-[#90ebcd] text-[#0c322c] text-xs font-black flex items-center gap-1.5 shadow-sm flex-shrink-0 cursor-pointer whitespace-nowrap active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-sm">tune</span>
                  <span>{isAr ? 'تقييم سريع' : 'Quick Assessment'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => openAuth('signin')}
                  className="px-3.5 py-2.5 rounded-lg bg-[#192072] hover:bg-[#2453ff] text-white text-xs font-bold flex items-center gap-1 border border-[#90ebcd]/30 shadow-sm flex-shrink-0 cursor-pointer whitespace-nowrap"
                >
                  <span>{isAr ? 'الوصول إلى الخزينة الصحية' : 'Access Health Vault'}</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/api/uaepass/login';
                  }}
                  className="px-3 py-2.5 rounded-lg bg-black hover:bg-neutral-900 text-white text-xs font-bold flex items-center gap-1 border border-white/20 flex-shrink-0 cursor-pointer whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[#30ba78] text-sm">fingerprint</span>
                  <span>{isAr ? 'الهوية الرقمية' : 'UAE PASS'}</span>
                </button>
              </div>

              {/* 3 Core Principles: Editorial Pillars (not button-like) */}
              <div className="grid grid-cols-3 gap-3 pt-3.5 border-t border-white/10">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 text-[#30ba78]">
                    <span className="material-symbols-outlined text-sm">diversity_1</span>
                    <span className="text-xs sm:text-sm font-extrabold text-white">{isAr ? 'عائلتك' : 'Your family'}</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-[#90ebcd]/80 font-normal leading-tight">{isAr ? 'في قلب الرعاية' : 'At the heart of care'}</p>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 text-[#90ebcd]">
                    <span className="material-symbols-outlined text-sm">favorite</span>
                    <span className="text-xs sm:text-sm font-extrabold text-white">{isAr ? 'قيمك' : 'Your values'}</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-[#90ebcd]/80 font-normal leading-tight">{isAr ? 'محترمة وذات أولوية' : 'Respected & prioritized'}</p>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 text-[#fe7c3f]">
                    <span className="material-symbols-outlined text-sm">how_to_reg</span>
                    <span className="text-xs sm:text-sm font-extrabold text-white">{isAr ? 'خيارك المستنير' : 'Your informed choice'}</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-[#90ebcd]/80 font-normal leading-tight">{isAr ? 'قرارات مدعومة بالمعرفة' : 'Empowered decisions'}</p>
                </div>
              </div>

            </div>

            {/* Right Column: The UAE Programme Card */}
            <div className="lg:col-span-5 relative">
              <div className="rounded-2xl p-4 sm:p-5 bg-[#192072]/70 backdrop-blur-md border border-[#2453ff]/40 shadow-2xl space-y-3 relative overflow-hidden">
                
                {/* Centered UAE Programme with UAE Flag Colors */}
                <div className="flex justify-center border-b border-white/10 pb-2.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/10 border border-white/20 shadow-xs">
                    {/* Authentic UAE Flag: Red vertical bar + Green, White, Black horizontal bars */}
                    <div className="w-3.5 h-2.5 rounded-xs overflow-hidden flex relative shadow-xs flex-shrink-0">
                      <div className="w-1/3 h-full bg-[#e52320]"></div>
                      <div className="w-2/3 h-full flex flex-col">
                        <div className="h-1/3 bg-[#00732f]"></div>
                        <div className="h-1/3 bg-[#ffffff]"></div>
                        <div className="h-1/3 bg-[#000000]"></div>
                      </div>
                    </div>
                    <span className="text-white font-extrabold tracking-wide">{isAr ? 'برنامج دولة الإمارات' : 'The UAE programme'}</span>
                  </div>
                </div>

                <div className="text-center space-y-0.5">
                  <h3 className="text-sm sm:text-base font-black text-white leading-snug">
                    {isAr ? 'الفحص الطبي الإلزامي للمقبلين على الزواج' : 'Mandatory pre-marital screening'}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-[#efefef] leading-relaxed">
                    {isAr
                      ? 'البروتوكول الوطني الرسمي الإلزامي للمقبلين على الزواج لضمان الوضوح الصحي والتخطيط الأسري الاستباقي.'
                      : 'Official nationwide protocol required for prospective couples to ensure health clarity and proactive family planning.'}
                  </p>
                </div>

                {/* 4 Square Tiles Grid: Centered, balanced, no blank space */}
                <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                  
                  {/* Square Tile 1: 570 genes */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex flex-col items-center justify-center text-center">
                    <div className="w-6 h-6 rounded-md bg-[#30ba78]/20 flex items-center justify-center text-[#30ba78] mb-1">
                      <span className="material-symbols-outlined text-sm">genetics</span>
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-white leading-none">570</span>
                    <span className="text-xs font-bold text-[#90ebcd] tracking-wide mt-0.5">{isAr ? 'جين' : 'Genes'}</span>
                    <p className="text-[9.5px] sm:text-[10px] text-neutral-300 font-medium pt-0.5 leading-tight">
                      {isAr ? 'مغطاة بالفحص الجيني' : 'Covered by genetic testing'}
                    </p>
                  </div>

                  {/* Square Tile 2: 845+ conditions */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex flex-col items-center justify-center text-center">
                    <div className="w-6 h-6 rounded-md bg-[#fe7c3f]/20 flex items-center justify-center text-[#fe7c3f] mb-1">
                      <span className="material-symbols-outlined text-sm">health_and_safety</span>
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-white leading-none">845+</span>
                    <span className="text-xs font-bold text-[#fe7c3f] tracking-wide mt-0.5">{isAr ? 'حالة' : 'Conditions'}</span>
                    <p className="text-[9.5px] sm:text-[10px] text-neutral-300 font-medium pt-0.5 leading-tight">
                      {isAr ? 'حالة وراثية يمكن الوقاية منها' : 'Preventable genetic conditions addressed'}
                    </p>
                  </div>

                  {/* Square Tile 3: Screening Types */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex flex-col items-center justify-center text-center">
                    <div className="w-6 h-6 rounded-md bg-[#2453ff]/20 flex items-center justify-center text-[#2453ff] mb-1">
                      <span className="material-symbols-outlined text-sm">bloodtype</span>
                    </div>
                    <span className="text-xs sm:text-sm font-black text-white leading-tight">{isAr ? 'أنواع الفحص' : 'Screening Types'}</span>
                    <p className="text-[9.5px] sm:text-[10px] text-[#90ebcd] font-semibold leading-tight pt-1">
                      {isAr ? 'الفحص الجيني، والأمراض المعدية، واضطرابات الدم' : 'Genetic, infectious disease, and blood disorders'}
                    </p>
                  </div>

                  {/* Square Tile 4: Find a screening centre Button with Building Logo */}
                  <a
                    href="#screening-centers"
                    className="p-2.5 sm:p-3 rounded-xl bg-[#30ba78]/15 hover:bg-[#30ba78]/25 border border-[#30ba78]/40 hover:border-[#30ba78] transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-md bg-[#30ba78] flex items-center justify-center text-[#0c322c] mb-1 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-sm">apartment</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-[#30ba78] group-hover:text-[#90ebcd] font-black text-xs sm:text-sm leading-tight">
                      <span>{isAr ? 'ابحث عن مركز فحص' : 'Find a screening centre'}</span>
                      <span className="material-symbols-outlined text-xs">arrow_downward</span>
                    </div>
                    <p className="text-[9.5px] sm:text-[10px] text-neutral-300 font-medium pt-0.5 leading-tight">
                      {isAr ? 'المراكز الرسمية في أبوظبي والعين والظفرة' : 'Official centres in Abu Dhabi, Al Ain & Al Dhafra'}
                    </p>
                  </a>

                </div>

              </div>
            </div>

          </div>

          {/* ==================== WHY THIS MATTERS (CENTERED AT BOTTOM OF OVERVIEW) ==================== */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center max-w-3xl mx-auto space-y-1.5">
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {isAr ? 'لماذا هذا الأمر مهم' : 'Why this matters'}
            </h2>
            <p className="text-xs sm:text-[13px] text-[#efefef] leading-relaxed font-normal">
              {isAr
                ? 'الأسرة هي قلب الحياة في دولة الإمارات، والزواج داخل العائلات تقليد عريق ومحترم. ولأن الأقارب أكثر عرضة لمشاركة بعض التغيرات الجينية، فإن بعض الحالات الوراثية قد تكون أكثر شيوعاً لدى أطفال الآباء الأقارب. ومعرفة ذلك مبكراً تمنح العائلات خيارات أكثر، لا أقل.'
                : 'Family is at the heart of life in the UAE, and marriages within families are a long-standing, respected tradition. Because relatives are more likely to share certain genetic changes, some inherited conditions can be more common in children of related parents. Knowing this early gives families more choices, not fewer.'}
            </p>
            <p className="text-xs sm:text-[13px] text-[#90ebcd] leading-relaxed font-medium">
              {isAr
                ? 'تتطلب دولة الإمارات بالفعل إجراء الفحوصات الطبية للمقبلين على الزواج. تساعدك هذه المنصة على فهم الخطوات التالية: ماذا تعني نتائجك، وما لا تعنيه، وأين تجد الدعم.'
                : 'The UAE already requires pre-marital screening. This platform helps you make sense of what comes next: what your results mean, what they don’t mean, and where to get support.'}
            </p>

            {/* Quick Assessment and other CTAs right after Why This Matters (First Screen Flow for Mobile) */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsAssessmentActive(true);
                  setMobileSlide(0);
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#30ba78] hover:bg-[#90ebcd] text-[#0c322c] text-sm font-black flex items-center justify-center gap-2 shadow-lg cursor-pointer whitespace-nowrap active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-lg">tune</span>
                <span>Quick Assessment</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => openAuth('signin')}
                  className="flex-1 sm:flex-none px-4 py-3.5 rounded-xl bg-[#192072] hover:bg-[#2453ff] text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-[#90ebcd]/30 shadow-md cursor-pointer whitespace-nowrap transition-colors"
                >
                  <span>Access Health Vault</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/api/uaepass/login';
                  }}
                  className="flex-1 sm:flex-none px-4 py-3.5 rounded-xl bg-black hover:bg-neutral-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-white/20 shadow-md cursor-pointer whitespace-nowrap transition-colors"
                >
                  <span className="material-symbols-outlined text-[#30ba78] text-sm">fingerprint</span>
                  <span>UAE PASS</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ==================== 4. FAMILY HEALTH RISK ESTIMATOR ==================== */}
      <section id="estimator" className="py-16 sm:py-20 bg-[#efefef] text-[#0c322c] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#192072]/10 text-[#192072] border border-[#192072]/20">
              <span className="material-symbols-outlined text-sm text-[#2453ff]">calculate</span>
              <span>{isAr ? 'فاحص سريري تفاعلي' : 'Interactive Clinical Screener'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0c322c] tracking-tight">
              {isAr ? 'مقياس المخاطر الصحية الوراثية للعائلة' : 'Family Health Risk Estimator'}
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
              {isAr
                ? 'العديد من العائلات في دولة الإمارات والمنطقة تشهد زواجاً بين الأقارب. توفر هذه الأداة تقديراً هادئاً وواضحاً لكيفية تأثير ذلك على احتمال حدوث حالة وراثية لدى الأطفال، وما هي الخطوات التالية.'
                : 'Many families in the UAE and across the region have marriages between relatives. This tool gives a clear, calm estimate of how that may affect the chance of an inherited condition in a child, and what to do next.'}
            </p>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-[#30ba78]/30 text-xs font-semibold">
              <span className="material-symbols-outlined text-sm text-[#30ba78]">lock</span>
              <span>
                {isAr
                  ? 'إجاباتك تبقى على جهازك بالكامل. لا يتم إرسال أو حفظ أي شيء. إغلاق هذه الصفحة يمسح كل شيء.'
                  : 'Your answers stay on your device. Nothing is sent or saved. Closing this page clears everything.'}
              </span>
            </div>
          </div>

          {/* Mobile Dedicated View (block lg:hidden): Launch Interactive Slideshow Assessment */}
          <div className="block lg:hidden space-y-4 mb-8">
            <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-md border border-neutral-200 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#0c322c] flex items-center justify-center mx-auto border border-[#30ba78]/40 shadow-xs">
                <span className="material-symbols-outlined text-3xl text-[#30ba78]">tune</span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-[#0c322c]">
                  Interactive Mobile Screener
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed max-w-sm mx-auto">
                  A tap-to-select, slide-based clinical screener optimized for your phone. Calculates kinship coefficient and hereditary risks in under 2 minutes.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsAssessmentActive(true);
                  setMobileSlide(0);
                }}
                className="w-full py-4 bg-[#30ba78] hover:bg-[#90ebcd] text-[#0c322c] text-sm font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">play_arrow</span>
                <span>{isStarted ? 'Resume / View Assessment' : 'Start Quick Assessment'}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>

              <div className="flex items-center justify-center gap-4 text-[11px] text-neutral-500 pt-1">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-[#30ba78]">lock</span>
                  <span>100% Private</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-[#2453ff]">speed</span>
                  <span>Takes ~2 mins</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-[#fe7c3f]">verified</span>
                  <span>UAE Guidelines</span>
                </span>
              </div>
            </div>
          </div>

          <div className="hidden lg:grid grid-cols-12 gap-8 items-stretch">
            
            {/* Left Column: Questionnaire seeking input from user */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-2xl shadow-md border border-neutral-200 flex flex-col justify-between h-full space-y-6">
              
              <div className="space-y-6">
                {/* Questionnaire Header & Start Again Button */}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#30ba78] text-lg">tune</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0c322c]">
                      {isAr ? 'استبيان القرابة والنسب (٥ خطوات)' : 'Kinship Questionnaire (5 Steps)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetEstimator}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#efefef] text-[#0c322c] hover:bg-[#90ebcd]/40 border border-neutral-300 hover:border-[#30ba78] transition-all cursor-pointer shadow-xs"
                    title={isAr ? 'مسح كافة المدخلات والنتائج للبدء من جديد' : 'Clear all inputs and results to start again'}
                  >
                    <span className="material-symbols-outlined text-sm text-[#fe7c3f]">restart_alt</span>
                    <span>{isAr ? 'البدء من جديد' : 'Start Again'}</span>
                  </button>
                </div>

                {/* Demographics & Relationship Status (Questions 1 & 2) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-neutral-100">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#0c322c] flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-[#2453ff]">person</span>
                      <span>Biological Sex</span>
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {GENDER_OPTIONS.map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setGender(val as 'male' | 'female')}
                          className={`py-2 px-2.5 rounded-lg border text-xs font-bold text-center transition-all cursor-pointer ${
                            gender === val
                              ? 'bg-[#0c322c] text-white border-[#30ba78] ring-1 ring-[#30ba78]'
                              : 'bg-white text-neutral-700 border-neutral-200 hover:border-[#30ba78]'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#0c322c] flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-[#fe7c3f]">favorite</span>
                      <span>Relationship Status</span>
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {RELATIONSHIP_STATUS_OPTIONS.map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setRelStatus(val as 'planning' | 'married')}
                          className={`py-2 px-2.5 rounded-lg border text-xs font-bold text-center transition-all cursor-pointer ${
                            relStatus === val
                              ? 'bg-[#0c322c] text-white border-[#30ba78] ring-1 ring-[#30ba78]'
                              : 'bg-white text-neutral-700 border-neutral-200 hover:border-[#30ba78]'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* STEP 1: Consanguinity (Bigger buttons, full description, no percentages) */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-bold text-[#0c322c]">
                      {isAr ? '١. ما هي صلة القرابة بينك وبين شريك حياتك؟' : '1. How are you and your partner related?'}
                    </h3>
                    <span className="text-[10px] text-neutral-400 font-semibold">{isAr ? 'الخطوة ١ من ٥' : 'Step 1 of 5'}</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    {isAr
                      ? 'جهة الأب أو جهة الأم لا تُحدث فرقاً في الحساب السريري.'
                      : 'Father’s side or mother’s side makes no difference to the calculation.'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {RELATIONSHIPS.map(([key, title, desc], idx) => {
                      const isSelected = relIdx === idx;
                      const optTitle = isAr && AR_RELATIONSHIPS[key] ? AR_RELATIONSHIPS[key][0] : title;
                      const optDesc = isAr && AR_RELATIONSHIPS[key] ? AR_RELATIONSHIPS[key][1] : desc;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setRelIdx(idx)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[#0c322c] text-white border-[#30ba78] ring-2 ring-[#30ba78]/30 shadow-xs'
                              : 'bg-white text-[#0c322c] border-neutral-200 hover:border-[#30ba78]'
                          }`}
                        >
                          <div className="pr-2 min-w-0">
                            <p className={`text-xs sm:text-sm font-bold leading-snug ${isSelected ? 'text-white' : 'text-[#0c322c]'}`}>
                              {optTitle}
                            </p>
                            {optDesc && (
                              <p className={`text-[11px] mt-1 leading-relaxed ${isSelected ? 'text-[#90ebcd]' : 'text-neutral-500'}`}>
                                {optDesc}
                              </p>
                            )}
                          </div>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected ? 'bg-[#30ba78] text-[#0c322c]' : 'bg-neutral-100 text-neutral-400'
                          }`}>
                            <span className="material-symbols-outlined text-xs">
                              {isSelected ? 'check' : ''}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STEP 2: Amplified Risk / Earlier Generations (Explains generational overlap, no percentages) */}
                <div className="pt-4 border-t border-neutral-100 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-bold text-[#0c322c]">
                      {isAr ? '٢. هل حدث زواج أقارب في الأجيال السابقة؟' : '2. Has marriage between relatives happened in earlier generations?'}
                    </h3>
                    <span className="text-[10px] text-neutral-400 font-semibold">{isAr ? 'الخطوة ٢ من ٥' : 'Step 2 of 5'}</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    {isAr
                      ? 'تقييم التداخل الجيني عبر الأجيال (مثلاً، هل كان الأجداد أيضاً أبناء عمومة؟)، مما قد يضاعف العوامل الوراثية المشتركة.'
                      : <>Assesses <b>generational genetic overlap</b> (e.g. were your grandparents also cousins?), which can amplify shared hereditary factors.</>}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {EARLIER_GENERATIONS.map(([key, label, desc], idx) => {
                      const isSelected = genIdx === idx;
                      const optLabel = isAr && AR_EARLIER_GENERATIONS[key] ? AR_EARLIER_GENERATIONS[key][0] : label;
                      const optDesc = isAr && AR_EARLIER_GENERATIONS[key] ? AR_EARLIER_GENERATIONS[key][1] : desc;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setGenIdx(idx)}
                          className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[#0c322c] text-white border-[#30ba78] ring-1 ring-[#30ba78]'
                              : 'bg-white text-[#0c322c] border-neutral-200 hover:border-[#30ba78]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold leading-tight">{optLabel}</span>
                              {isSelected && (
                                <span className="material-symbols-outlined text-xs text-[#30ba78]">check_circle</span>
                              )}
                            </div>
                            <p className={`text-[10px] mt-1 leading-tight ${isSelected ? 'text-[#90ebcd]' : 'text-neutral-500'}`}>
                              {optDesc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STEP 3: Family History (Explicitly lists UAE conditions, no percentages) */}
                <div className="pt-4 border-t border-neutral-100 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-bold text-[#0c322c]">
                      {isAr ? '٣. هل توجد حالة صحية وراثية في أي من العائلتين؟' : '3. Is there an inherited condition in either family?'}
                    </h3>
                    <span className="text-[10px] text-neutral-400 font-semibold">{isAr ? 'الخطوة ٣ من ٥' : 'Step 3 of 5'}</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    {isAr
                      ? <>حالات وراثية شائعة في دولة الإمارات: <b>الثلاسيميا بيتا</b>، <b>الأنيميا المنجلية</b>، <b>التليف الكيسي</b>، <b>ضمور العضلات الشوكي (SMA)</b>، أو فقدان أطفال غير مفسر.</>
                      : <>Common UAE genetic conditions to consider: <b>Beta-Thalassemia</b>, <b>Sickle Cell Disease</b>, <b>Cystic Fibrosis</b>, <b>Spinal Muscular Atrophy (SMA)</b>, or unexplained infant loss.</>}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {FAMILY_HISTORY.map(([key, label, desc], idx) => {
                      const isSelected = histIdx === idx;
                      const optLabel = isAr && AR_FAMILY_HISTORY[key] ? AR_FAMILY_HISTORY[key][0] : label;
                      const optDesc = isAr && AR_FAMILY_HISTORY[key] ? AR_FAMILY_HISTORY[key][1] : desc;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setHistIdx(idx)}
                          className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[#0c322c] text-white border-[#30ba78] ring-1 ring-[#30ba78]'
                              : 'bg-white text-[#0c322c] border-neutral-200 hover:border-[#30ba78]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold leading-tight">{optLabel}</span>
                              {isSelected && (
                                <span className="material-symbols-outlined text-xs text-[#30ba78]">check_circle</span>
                              )}
                            </div>
                            <p className={`text-[10px] mt-1 leading-tight ${isSelected ? 'text-[#90ebcd]' : 'text-neutral-500'}`}>
                              {optDesc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STEP 4: Past Pregnancies (No percentages) */}
                <div className="pt-4 border-t border-neutral-100 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-bold text-[#0c322c]">
                      {isAr ? '٤. حالات الحمل السابقة' : '4. Past pregnancies'}
                    </h3>
                    <span className="text-[10px] text-neutral-400 font-semibold">{isAr ? 'الخطوة ٤ من ٥' : 'Step 4 of 5'}</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    {isAr
                      ? 'أي تاريخ لتكرار الإجهاض أو أمراض مبكرة غير مفسرة لدى أطفال سابقين.'
                      : 'Any history of repeated miscarriages or unexplained early child illness.'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {PAST_PREGNANCIES.map(([key, label], idx) => {
                      const isSelected = pregIdx === idx;
                      const optLabel = isAr && AR_PAST_PREGNANCIES[key] ? AR_PAST_PREGNANCIES[key] : label;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setPregIdx(idx)}
                          className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[#0c322c] text-white border-[#30ba78] ring-1 ring-[#30ba78]'
                              : 'bg-white text-[#0c322c] border-neutral-200 hover:border-[#30ba78]'
                          }`}
                        >
                          <span className="text-xs font-semibold pr-2 leading-tight">{optLabel}</span>
                          {isSelected && (
                            <span className="material-symbols-outlined text-xs text-[#30ba78] shrink-0">check_circle</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STEP 5: Premarital or Carrier Screening (No percentages) */}
                <div className="pt-4 border-t border-neutral-100 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-bold text-[#0c322c]">
                      {isAr ? '٥. الفحوصات الطبية للمقبلين على الزواج أو فحص النواقل' : '5. Premarital or carrier screening'}
                    </h3>
                    <span className="text-[10px] text-neutral-400 font-semibold">{isAr ? 'الخطوة ٥ من ٥' : 'Step 5 of 5'}</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    {isAr
                      ? 'هل أكمل كلا الشريكين فحوصات النواقل الجينية الرسمية المعتمدة؟'
                      : 'Have both partners completed official genetic carrier panel tests?'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {SCREENING_STATUS.map(([key, label], idx) => {
                      const isSelected = scrIdx === idx;
                      const optLabel = isAr && AR_SCREENING_STATUS[key] ? AR_SCREENING_STATUS[key] : label;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setScrIdx(idx)}
                          className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[#0c322c] text-white border-[#30ba78] ring-1 ring-[#30ba78]'
                              : 'bg-white text-[#0c322c] border-neutral-200 hover:border-[#30ba78]'
                          }`}
                        >
                          <span className="text-xs font-semibold pr-2 leading-tight">{optLabel}</span>
                          {isSelected && (
                            <span className="material-symbols-outlined text-xs text-[#30ba78] shrink-0">check_circle</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Recessive match checkbox */}
                  <label className="flex items-start gap-3 p-3 mt-3 rounded-xl border border-[#fe7c3f]/40 bg-[#fe7c3f]/5 cursor-pointer hover:bg-[#fe7c3f]/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={sameCarrier}
                      onChange={(e) => setSameCarrier(e.target.checked)}
                      className="w-4 h-4 mt-0.5 accent-[#fe7c3f] rounded cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-[#0c322c] leading-tight">
                      {isAr ? (
                        <>أخبرنا الطبيب أو المختبر أننا <b>كلينا نحمل نفس</b> الطفرة الوراثية المتنحية (مثل الثلاسيميا، الأنيميا المنجلية، أو الضمور العضلي SMA).</>
                      ) : (
                        <>A doctor or lab told us we <b>both carry the same</b> recessive condition (e.g. Beta-Thalassemia, Sickle Cell, SMA).</>
                      )}
                    </span>
                  </label>
                </div>

              </div>

            </div>

            {/* Right Column: Computed Results, Flip Tiles, 100 Dots Pictogram, Next Steps - Same height */}
            <div className="lg:col-span-5 bg-gradient-to-b from-[#192072] to-[#0c322c] text-white p-6 sm:p-7 rounded-2xl shadow-xl border border-[#2453ff]/40 flex flex-col justify-between h-full space-y-6">
              
              <div className="space-y-6">
                <div className="space-y-1 border-b border-white/10 pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#90ebcd]">
                    {isStarted
                      ? (isAr ? 'تقييمك السريري' : 'Your Clinical Estimate')
                      : (isAr ? 'في انتظار تحديد القرابة' : 'Awaiting Kinship Selections')}
                  </span>
                  <p className="text-xs text-[#efefef]">
                    {isAr
                      ? 'الاحتمال الإضافي، بسبب صلة القرابة العائلية، لإصابة طفل بحالة وراثية خطيرة:'
                      : 'Extra chance, because of the family link, that a child has a serious inherited condition:'}
                  </p>
                  <div className="text-3xl sm:text-4xl font-black text-[#30ba78] pt-1">
                    {!isStarted
                      ? '—'
                      : currentF === 0 && !sameCarrier
                      ? (isAr ? 'لا يوجد خطر إضافي ناتج عن القرابة' : 'No extra risk from relatedness')
                      : (isAr ? `إضافي بنحو ${formatPct(currentExtra)}` : `about ${formatPct(currentExtra)} extra`)}
                  </div>
                  {isStarted && currentF > 0 && !sameCarrier && (
                    <p className="text-[11px] text-neutral-300">
                      {isAr
                        ? `المجال المحتمل: ${formatPct(rangeLo)} إلى ${formatPct(rangeHi)} إضافي`
                        : `Likely range: ${formatPct(rangeLo)} to ${formatPct(rangeHi)} extra`}
                    </p>
                  )}
                  {!isStarted && (
                    <p className="text-[11px] text-neutral-300">
                      {isAr
                        ? 'حدد صلة القرابة في الخطوات السابقة لحساب النطاق المحتمل'
                        : 'Select your relationship on the left to calculate range'}
                    </p>
                  )}
                  {/* One-liner explaining what this % denotes for everyday users */}
                  <p className="text-[11px] text-[#90ebcd] leading-snug pt-1.5 font-medium border-t border-white/10 mt-2">
                    {isAr
                      ? 'يوضح هذا الرقم الاحتمال الإضافي التقديري — بخلاف النسبة الطبيعية العامة (~٣٪) التي تنطبق على جميع الأزواج حول العالم — لاحتمال وراثة الطفل لحالة جينية بسبب السلف المشترك.'
                      : 'This denotes the estimated extra likelihood—beyond the general ~3% natural baseline that applies to all couples worldwide—that a child may inherit a serious genetic condition due to shared family ancestry.'}
                  </p>
                </div>

                {/* Four Data Metric Cells (Interactive Flip Cards, No Ellipsis) */}
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Tile 1: F */}
                  <div
                    onClick={() => toggleTile('f')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleTile('f'); }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer min-h-[96px] flex flex-col justify-between select-none relative group"
                    title={isAr ? 'انقر للقلب وقراءة الشرح' : 'Click to flip and read explanation'}
                  >
                    {!flippedTiles['f'] ? (
                      <>
                        <div>
                          <b className="text-lg font-black text-[#90ebcd]">
                            {!isStarted ? '—' : currentF === 0 ? '0' : (currentF <= 0.005 ? '< 1/200' : `1/${Math.round(1 / currentF)}`)}
                          </b>
                          <p className="text-[10px] text-neutral-300 font-medium">
                            {isAr ? 'معامل القرابة والمصاهرة (F)' : 'Shared-ancestry level (F)'}
                          </p>
                        </div>
                        <span className="text-[9px] text-[#90ebcd]/70 group-hover:text-[#90ebcd] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[11px]">flip</span>
                          <span>{isAr ? 'انقر لمعرفة المزيد' : 'Click to learn more'}</span>
                        </span>
                      </>
                    ) : (
                      <div className="text-[10px] text-[#efefef] leading-tight space-y-1">
                        <b className="text-[#90ebcd] block text-[11px]">{isAr ? 'معامل القرابة (F)' : 'Shared Ancestry (F)'}</b>
                        <p className="text-[10px] text-neutral-200">
                          {isAr
                            ? 'معامل رايت لزواج الأقارب. يقيس نسبة الجينات التي يرثها الطفل وتكون متطابقة بسبب وجود أسلاف مشتركين.'
                            : 'Wright’s inbreeding coefficient. Measures the proportion of genes a child inherits that are identical from common ancestors.'}
                        </p>
                        <span className="text-[9px] text-neutral-400 block pt-0.5">{isAr ? 'انقر للعودة' : 'Click to flip back'}</span>
                      </div>
                    )}
                  </div>

                  {/* Tile 2: L */}
                  <div
                    onClick={() => toggleTile('l')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleTile('l'); }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer min-h-[96px] flex flex-col justify-between select-none relative group"
                    title={isAr ? 'انقر للقلب وقراءة الشرح' : 'Click to flip and read explanation'}
                  >
                    {!flippedTiles['l'] ? (
                      <>
                        <div>
                          <b className="text-lg font-black text-[#30ba78]">
                            {!isStarted ? '—' : `×${currentL.toFixed(2)}`}
                          </b>
                          <p className="text-[10px] text-neutral-300 font-medium">
                            {isAr ? 'المعامل السريري للعائلة (L)' : 'Family multiplier (L)'}
                          </p>
                        </div>
                        <span className="text-[9px] text-[#30ba78]/70 group-hover:text-[#30ba78] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[11px]">flip</span>
                          <span>{isAr ? 'انقر لمعرفة المزيد' : 'Click to learn more'}</span>
                        </span>
                      </>
                    ) : (
                      <div className="text-[10px] text-[#efefef] leading-tight space-y-1">
                        <b className="text-[#30ba78] block text-[11px]">{isAr ? 'المعامل السريري للعائلة (L)' : 'Family Multiplier (L)'}</b>
                        <p className="text-[10px] text-neutral-200">
                          {isAr
                            ? 'وزن سريري يعدل الاحتمال بناءً على الحالات العائلية المسجلة، حالات الإجهاض، أو فحوصات النواقل.'
                            : 'Clinical weight adjusting risk based on reported family conditions, miscarriages, or premarital carrier screening.'}
                        </p>
                        <span className="text-[9px] text-neutral-400 block pt-0.5">{isAr ? 'انقر للعودة' : 'Click to flip back'}</span>
                      </div>
                    )}
                  </div>

                  {/* Tile 3: Total Chance */}
                  <div
                    onClick={() => toggleTile('tot')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleTile('tot'); }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer min-h-[96px] flex flex-col justify-between select-none relative group"
                    title={isAr ? 'انقر للقلب وقراءة الشرح' : 'Click to flip and read explanation'}
                  >
                    {!flippedTiles['tot'] ? (
                      <>
                        <div>
                          <b className="text-lg font-black text-white">
                            {!isStarted
                              ? (isAr ? '~٣.٠٪ (المعدل الأساسي)' : '~3.0% (Baseline)')
                              : (isAr ? `حوالي ${formatPct(totalChance)}` : `about ${formatPct(totalChance)}`)}
                          </b>
                          <p className="text-[10px] text-neutral-300 font-medium">
                            {isAr ? 'الاحتمال الإجمالي (مع الأساس ~٣٪)' : 'Total chance (w/ ~3% baseline)'}
                          </p>
                        </div>
                        <span className="text-[9px] text-white/70 group-hover:text-white flex items-center gap-1">
                          <span className="material-symbols-outlined text-[11px]">flip</span>
                          <span>{isAr ? 'انقر لمعرفة المزيد' : 'Click to learn more'}</span>
                        </span>
                      </>
                    ) : (
                      <div className="text-[10px] text-[#efefef] leading-tight space-y-1">
                        <b className="text-white block text-[11px]">{isAr ? 'الاحتمال التراكمي الإجمالي' : 'Total Combined Chance'}</b>
                        <p className="text-[10px] text-neutral-200">
                          {isAr
                            ? 'الاحتمال الإجمالي يجمع بين الأساس السكاني الطبيعي (~٣٪) الذي ينطبق على جميع الأزواج وبين احتمال صلة القرابة.'
                            : 'The overall chance, combining the natural ~3% general population baseline that applies to all couples with the family link.'}
                        </p>
                        <span className="text-[9px] text-neutral-400 block pt-0.5">{isAr ? 'انقر للعودة' : 'Click to flip back'}</span>
                      </div>
                    )}
                  </div>

                  {/* Tile 4: 1 child in N (NO ELLIPSIS) */}
                  <div
                    onClick={() => toggleTile('oneIn')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleTile('oneIn'); }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer min-h-[96px] flex flex-col justify-between select-none relative group"
                    title={isAr ? 'انقر للقلب وقراءة الشرح' : 'Click to flip and read explanation'}
                  >
                    {!flippedTiles['oneIn'] ? (
                      <>
                        <div>
                          <b className="text-lg font-black text-[#fe7c3f]">
                            {!isStarted
                              ? (isAr ? '١ من كل ٣٣ (الأساس)' : '1 in 33 (Baseline)')
                              : (isAr ? `١ من كل ${oneInCount}` : `1 in ${oneInCount}`)}
                          </b>
                          <p className="text-[10px] text-neutral-300 font-medium">
                            {isAr ? 'تقريباً طفل ١ من كل' : 'Roughly, 1 child in'}
                          </p>
                        </div>
                        <span className="text-[9px] text-[#fe7c3f]/70 group-hover:text-[#fe7c3f] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[11px]">flip</span>
                          <span>{isAr ? 'انقر لمعرفة المزيد' : 'Click to learn more'}</span>
                        </span>
                      </>
                    ) : (
                      <div className="text-[10px] text-[#efefef] leading-tight space-y-1">
                        <b className="text-[#fe7c3f] block text-[11px]">{isAr ? 'منظور التكرار الإحصائي' : 'Frequency Perspective'}</b>
                        <p className="text-[10px] text-neutral-200">
                          {isAr
                            ? `تكرار إحصائي: يُقدر احتمال إصابة طفل واحد تقريباً من بين كل ${isStarted ? oneInCount : 33} طفلاً يولدون لأزواج بهذا التاريخ العائلي.`
                            : `Statistical frequency: roughly 1 child out of every ${isStarted ? oneInCount : 33} born to couples with this background may be affected.`}
                        </p>
                        <span className="text-[9px] text-neutral-400 block pt-0.5">{isAr ? 'انقر للعودة' : 'Click to flip back'}</span>
                      </div>
                    )}
                  </div>

                </div>

                {/* 100 Children Pictogram Visualizer */}
                <div className="space-y-2 pt-2">
                  <b className="text-xs font-bold text-white">
                    {isAr ? 'من بين كل ١٠٠ طفل:' : 'Out of 100 children:'}
                  </b>
                  <div className="grid grid-cols-10 gap-1.5 p-3 rounded-xl bg-black/30 border border-white/10">
                    {Array.from({ length: 100 }).map((_, i) => {
                      // First 3 dots: background population risk (about 3%)
                      const isBackground = i < 3;
                      // Extra risk dots (only if started and has extra)
                      const isExtra = isStarted && i >= 3 && i < 3 + Math.floor(sameCarrier ? 25 : currentExtra);
                      const isFraction = isStarted && !sameCarrier && i === 3 + Math.floor(currentExtra) && currentExtra % 1 > 0.1;

                      let dotBg = 'bg-white/20'; // Neutral
                      if (isBackground) dotBg = 'bg-[#90ebcd]'; // Baseline risk
                      if (isExtra) dotBg = 'bg-[#fe7c3f]'; // Added family link risk
                      if (isFraction) dotBg = 'bg-[#fe7c3f]/60';

                      return (
                        <div
                          key={i}
                          className={`w-2.5 h-2.5 rounded-full ${dotBg}`}
                          title={isBackground ? 'Usual background risk (3%)' : isExtra ? 'Added risk from family link' : 'Healthy outcome'}
                        />
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-neutral-300 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#90ebcd]"></span>
                      {isAr ? 'المعدل الطبيعي العام (~٣٪)' : 'Usual background (~3%)'}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#fe7c3f]"></span>
                      {isAr ? 'الاحتمال الإضافي للقرابة' : 'Added family link'}
                    </span>
                  </p>
                </div>

                {/* Risk Band Banner */}
                <div className={`p-4 rounded-xl text-xs space-y-1.5 border transition-all ${
                  riskBandLevel === 'ok'
                    ? 'bg-white/10 border-white/20 text-[#efefef]'
                    : riskBandLevel === 'mid'
                    ? 'bg-[#fe7c3f]/20 border-[#fe7c3f]/50 text-white'
                    : 'bg-[#fe7c3f]/30 border-[#fe7c3f] text-white shadow-lg'
                }`}>
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">
                      {riskBandLevel === 'ok' ? 'check_circle' : riskBandLevel === 'mid' ? 'info' : 'warning'}
                    </span>
                    <span>{riskBandTitle}</span>
                  </p>
                  <p className="text-[11px] leading-relaxed">{riskBandDesc}</p>
                </div>

                {/* Sensible Next Steps */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <b className="text-xs font-bold text-white flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-[#30ba78]">checklist</span>
                    <span>{isAr ? 'خطوات عملية موصى بها:' : 'Sensible next steps:'}</span>
                  </b>
                  <ul className="text-[11px] text-[#efefef] space-y-1.5 list-disc pl-4 leading-relaxed">
                    <li>
                      {isAr
                        ? 'إجراء الفحص الطبي للمقبلين على الزواج لكلا الشريكين (الثلاسيميا، الأنيميا المنجلية، نقص G6PD).'
                        : 'Complete premarital screening for both partners (Thalassemia, Sickle Cell, G6PD).'}
                    </li>
                    <li>
                      {isAr
                        ? 'حجز جلسة استشارة وراثية معتمدة لتوثيق شجرة العائلة الرسمية لثلاثة أجيال.'
                        : 'Schedule a genetic counseling review to draw your official 3-generation pedigree tree.'}
                    </li>
                    <li>
                      {isAr
                        ? 'تسجيل أي حالات وراثية أو أمراض مبكرة في العائلتين قبل الاستشارة.'
                        : 'Record any inherited conditions or early child illness in either family before consulting.'}
                    </li>
                    <li>
                      {isAr
                        ? 'عند حدوث الحمل، استشارة الطبيب بشأن الفحوصات المبكرة وفحص ما قبل الولادة غير الجراحي (NIPT).'
                        : 'Once pregnant, consult about early scans and non-invasive prenatal testing (NIPT).'}
                    </li>
                  </ul>
                </div>
              </div>

              {/* Save / Access in Vault CTA */}
              <button
                type="button"
                onClick={() => openAuth('signin')}
                className="w-full py-3 rounded-xl bg-[#30ba78] hover:bg-[#90ebcd] text-[#0c322c] text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg mt-4"
              >
                <span>{isAr ? 'حفظ التقييم في الخزينة الصحية' : 'Save Assessment in Clinical Vault'}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>

            </div>

          </div>

          {/* ==================== 4B. CALCULATION FORMULA & EDUCATIONAL ACCORDION ==================== */}
          <div className="mt-8 border border-neutral-300 rounded-2xl bg-white shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setIsFormulaExpanded(!isFormulaExpanded)}
              className="w-full p-4 sm:p-5 flex items-center justify-between bg-neutral-50 hover:bg-neutral-100/80 transition-colors text-left cursor-pointer select-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#192072]/10 flex items-center justify-center text-[#192072]">
                  <span className="material-symbols-outlined text-base text-[#2453ff]">functions</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0c322c]">
                    {isAr ? 'كيف يتم حساب هذا التقدير الوراثي' : 'How this estimate is worked out'}
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    {isAr
                      ? 'معامل رايت لزواج الأقارب، نموذج المكافئات المميتة، والمعاملات السريرية'
                      : 'Wright’s inbreeding coefficient, lethal equivalents model, and clinical multipliers'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#192072]">
                <span>
                  {isFormulaExpanded
                    ? (isAr ? 'إخفاء المعادلة' : 'Collapse formula')
                    : (isAr ? 'عرض المعادلة' : 'Expand formula')}
                </span>
                <span className={`material-symbols-outlined text-base transition-transform duration-200 ${isFormulaExpanded ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </div>
            </button>

            {isFormulaExpanded && (
              <div className="p-5 sm:p-6 text-xs text-[#0c322c] space-y-4 border-t border-neutral-200 bg-white leading-relaxed animate-in fade-in duration-200">
                <p className="text-neutral-700">
                  {isAr
                    ? 'هذه طريقة مبسطة صُممت لتوفير الوضوح، مبنية على معامل رايت لزواج الأقارب ونموذج "المكافئات المميتة" القياسي.'
                    : 'This is a simple method I designed for clarity. It builds on Wright’s inbreeding coefficient and a standard “lethal equivalents” model.'}
                </p>

                <div className="space-y-3 pl-3.5 border-l-2 border-[#30ba78]">
                  <div>
                    <b className="font-bold text-[#0c322c]">
                      {isAr ? 'الخطوة ١، صلة القرابة السلفية:' : 'Step 1, shared ancestry:'}
                    </b>{' '}
                    <span className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-[11px] text-[#192072]">
                      F = Σ (½)<sup>n₁+n₂+1</sup> × (1 + F<sub>A</sub>)
                    </span>{' '}
                    {isAr
                      ? 'مجموع كل سلف مشترك، حيث n₁ و n₂ هما عدد الأجيال لكل شريك، و F_A هي درجة زواج الأقارب للأسلاف أنفسهم.'
                      : 'summed over every shared ancestor, where n₁ and n₂ are generations from each partner, and FA is the ancestors’ own inbreeding (step 2).'}
                  </div>

                  <div>
                    <b className="font-bold text-[#0c322c]">
                      {isAr ? 'الخطوة ٢، المعامل العائلي:' : 'Step 2, family multiplier:'}
                    </b>{' '}
                    <span className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-[11px] text-[#192072]">
                      L = history × pregnancies × screening
                    </span>
                    {isAr
                      ? '، بحد أقصى ٣. التاريخ العائلي لوجود مرض وراثي يُحسب بمقدار ×١.٨ (×١.٢ إذا كان غير مؤكد)، تكرار فقدان الحمل أو مرض غير مفسر للطفل ×١.٥، ونتيجة الفحص السليمة ×٠.٧.'
                      : ', limited to a maximum of 3. Family history of an inherited condition counts ×1.8 (×1.2 if unsure), repeated pregnancy loss or an unexplained child illness ×1.5, and a clear screening result ×0.7.'}
                  </div>

                  <div>
                    <b className="font-bold text-[#0c322c]">
                      {isAr ? 'الخطوة ٣، الاحتمال الإضافي:' : 'Step 3, extra risk:'}
                    </b>{' '}
                    <span className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-[11px] text-[#192072]">
                      Extra = 1 − e<sup>−k·F·L</sup>
                    </span>{' '}
                    {isAr
                      ? 'مع k = 0.49 ليتوافق مع الدراسات السريرية المنشورة لأبناء العم المباشرين.'
                      : 'with k = 0.49. I chose k so that first cousins with L = 1 give about 3 percentage points of extra risk, in line with published studies. The range shown uses L × 0.6 to L × 1.5.'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                  <b className="font-bold text-amber-950">{isAr ? 'تنبيه مهم:' : 'Important:'}</b>{' '}
                  {isAr
                    ? 'المعاملات هي تقديرات سريرية استرشادية وليست قيماً حتمية مطلقة. إذا كان كلا الشريكين يحملان نفس الجين المتنحي فإن كل حمل يحمل احتمال ١ من ٤ (٢٥٪) للإصابة.'
                    : 'the multipliers are judgment-based estimates, not validated clinical values. If you both carry the same recessive condition, the answer is not an estimate: each pregnancy has a 1 in 4 chance of being affected.'}
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-[#30ba78]/30 text-emerald-950 text-[11px] leading-relaxed">
                  <b className="font-bold text-[#0c322c]">{isAr ? 'إشعار تعليمي:' : 'Educational Notice:'}</b>{' '}
                  {isAr
                    ? 'هذه الأداة مخصصة للتوعية ولا تغني عن الاستشارة الطبية. لا يمكنها قراءة الشيفرة الوراثية الفعلية. زواج الأقارب لا يعني حتمية إصابة الأطفال: معظم أطفال الأقارب يولدون بصحة كاملة. يمكن للمستشار الوراثي مراجعة شجرة عائلتك الفعلية.'
                    : 'Educational tool only, not medical advice. It can’t see your actual genes. Relatives marrying does not mean children will have a condition: most children of cousins are healthy. A genetic counsellor can review your real family tree.'}
                </div>
              </div>
            )}
          </div>

          {/* ==================== 4C. WHAT DOES MY RESULT MEAN? ==================== */}
          <div className="mt-8 p-6 sm:p-7 rounded-2xl bg-white border border-neutral-300 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
              <span className="material-symbols-outlined text-[#30ba78] text-xl">help</span>
              <h3 className="text-base sm:text-lg font-bold text-[#0c322c]">
                {isAr ? 'ماذا تعني نتائجي؟' : 'What does my result mean?'}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
                <b className="text-xs font-bold text-[#0c322c] block">
                  {isAr ? 'حامل لجين وراثي' : 'Carrier'}
                </b>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {isAr
                    ? 'تحمل تغيراً جينياً ولكنك بصحة جيدة في العادة. معظم الأشخاص يحملون تغيراً جينياً واحداً على الأقل.'
                    : 'You carry a gene change but are usually healthy. Many people are carriers of at least one.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
                <b className="text-xs font-bold text-[#0c322c] block">
                  {isAr ? 'خطر على مستوى الزوجين' : 'Couple-level risk'}
                </b>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {isAr
                    ? 'ما إذا كنت أنت وشريك حياتك تحملان تغيرات في نفس الجين، مما يؤثر على احتمال إصابة الطفل.'
                    : 'Whether you and your partner carry changes in the same gene, which affects the chance for a child.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
                <b className="text-xs font-bold text-[#0c322c] block">
                  {isAr ? 'الاحتمال المحتمل للطفل' : 'Possible child risk'}
                </b>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {isAr
                    ? 'هو مجرد احتمال إحصائي وليس تنبؤاً قاطعاً. العديد من الأزواج ذوي الاحتمال المرتفع ينجبون أطفالاً أصحاء.'
                    : 'A probability, not a prediction. Many couples with a higher chance have healthy children.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
                <b className="text-xs font-bold text-[#0c322c] block">
                  {isAr ? 'الاحتمال مقابل التشخيص' : 'Risk vs. diagnosis'}
                </b>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {isAr
                    ? 'الاحتمال يصف نسبة الإمكانية، بينما التشخيص يعني وجود الحالة المرضية بالفعل.'
                    : 'Risk describes a chance. A diagnosis means a condition is present.'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ==================== 5. THINGS WORTH REMEMBERING (DARK TEXTURE BACKGROUND) ==================== */}
      <section id="things-worth-remembering" className="py-20 bg-gradient-to-br from-[#192072] via-[#0f2a24] to-[#0c322c] text-white relative overflow-hidden border-t border-[#2453ff]/30">
        
        {/* Abstract blueprint grid background */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="zk-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#2453ff" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#zk-grid)" />
        </svg>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#30ba78]/20 text-[#90ebcd] border border-[#30ba78]/30">
              <span className="material-symbols-outlined text-sm text-[#30ba78]">lightbulb</span>
              <span>{isAr ? 'إرشادات ورؤى مهمة' : 'Guidance & Perspective'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {isAr ? 'أمور تستحق أن نتذكرها' : 'Things worth remembering'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#30ba78]/20 flex items-center justify-center text-[#30ba78]">
                <span className="material-symbols-outlined text-base">check_circle</span>
              </div>
              <p className="text-sm text-[#efefef] font-medium leading-relaxed">
                {isAr
                  ? 'أن تكون حاملاً لجين أمر شائع جداً. هذا ليس تشخيصاً بمرض وليس خطأ أحد.'
                  : 'Being a carrier is common. It is not a diagnosis and it is not a fault.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#90ebcd]/20 flex items-center justify-center text-[#90ebcd]">
                <span className="material-symbols-outlined text-base">info</span>
              </div>
              <p className="text-sm text-[#efefef] font-medium leading-relaxed">
                {isAr
                  ? 'الاحتمال هو مجرد إمكانية وليس أمراً حتمياً.'
                  : 'A risk is a possibility, not a certainty.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2453ff]/20 flex items-center justify-center text-[#2453ff]">
                <span className="material-symbols-outlined text-base">balance</span>
              </div>
              <p className="text-sm text-[#efefef] font-medium leading-relaxed">
                {isAr
                  ? 'حالة كل زوجين فريدة، وكذلك كل قرار يتخذانه.'
                  : 'Every couple\'s situation is different, and so is every decision.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#fe7c3f]/20 flex items-center justify-center text-[#fe7c3f]">
                <span className="material-symbols-outlined text-base">forum</span>
              </div>
              <p className="text-sm text-[#efefef] font-medium leading-relaxed">
                {isAr
                  ? 'الاستشارة الوراثية هي حوار مطمئن وليست حكماً أو فريضة.'
                  : 'Counselling is a conversation, not a verdict.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-2.5 md:col-span-2 lg:col-span-2">
              <div className="w-8 h-8 rounded-lg bg-[#30ba78]/20 flex items-center justify-center text-[#30ba78]">
                <span className="material-symbols-outlined text-base">verified_user</span>
              </div>
              <p className="text-sm text-[#efefef] font-medium leading-relaxed">
                {isAr
                  ? 'أنت صاحب القرار في معلوماتك وخياراتك بالكامل.'
                  : 'You are in charge of your information and your choices.'}
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ==================== 6. FIND A SCREENING CENTRE IN ABU DHABI ==================== */}
      <section id="screening-centers" className="py-16 bg-[#efefef] text-[#0c322c] border-t border-b border-neutral-300 scroll-mt-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#30ba78]/15 text-[#0c322c] border border-[#30ba78]/30 mb-2">
                <span className="material-symbols-outlined text-sm text-[#30ba78]">pin_drop</span>
                <span>{isAr ? 'شبكة مراكز الفحص المعتمدة' : 'Official Screening Network'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0c322c] tracking-tight">
                {isAr ? 'ابحث عن مركز فحص في إمارة أبوظبي' : 'Find a screening centre in Abu Dhabi'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-md leading-relaxed">
              {isAr
                ? 'المرافق الرسمية المعتمدة للفحص الطبي للمقبلين على الزواج في أبوظبي، العين، ومنطقة الظفرة.'
                : 'Official pre-marital screening facilities across Abu Dhabi, Al Ain, and Al Dhafra offering accredited testing packages.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Abu Dhabi */}
            <div className="p-6 rounded-2xl bg-white border border-neutral-200 hover:border-[#30ba78] transition-all space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-[#30ba78]">
                <span className="material-symbols-outlined text-xl">apartment</span>
                <b className="text-base font-bold text-[#0c322c]">{isAr ? 'أبوظبي' : 'Abu Dhabi'}</b>
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed font-normal">
                {isAr
                  ? 'مراكز بني ياس، مدينة خليفة، الشامخة، المقطع، البطين، والبهية الصحية.'
                  : 'Baniyas, Madinat Khalifa, Al Shamkha, Al Maqtaa, Al Bateen and Al Bahia Healthcare Centers.'}
              </p>
            </div>

            {/* Al Ain */}
            <div className="p-6 rounded-2xl bg-white border border-neutral-200 hover:border-[#2453ff] transition-all space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-[#2453ff]">
                <span className="material-symbols-outlined text-xl">local_hospital</span>
                <b className="text-base font-bold text-[#0c322c]">{isAr ? 'العين' : 'Al Ain'}</b>
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed font-normal">
                {isAr
                  ? 'مراكز المويجعي، المقام، نعمة، الهير، القوع، الهيلي، وسويحان الصحية؛ مركز عود التوبة للتشخيص والفحص؛ مزيد للرعاية الصحية؛ اليحر للرعاية الصحية.'
                  : 'Al Muwaiji, Al Maqam, Neima, Al Hayer, Al Quaa, Al Hili and Sweihan Healthcare Centers; Oud Al Touba Diagnostic and Screening Center; Mezyad Healthcare; Al Yahar Healthcare.'}
              </p>
            </div>

            {/* Al Dhafra Region */}
            <div className="p-6 rounded-2xl bg-white border border-neutral-200 hover:border-[#fe7c3f] transition-all space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-[#fe7c3f]">
                <span className="material-symbols-outlined text-xl">medical_services</span>
                <b className="text-base font-bold text-[#0c322c]">{isAr ? 'منطقة الظفرة' : 'Al Dhafra Region'}</b>
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed font-normal">
                {isAr
                  ? 'مركز الظفرة لطب الأسرة؛ مستشفيات غياثي، المرفأ، السلع، دلما، وليوا.'
                  : 'Al Dhafra Family Medicine Center; Ghiathy, Marfa, Al Sila, Delma and Liwa Hospitals.'}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ==================== 6. FEATURE 2: CERTIFIED GENETICS SPECIALISTS & AI (CRISP WHITE / FOG) ==================== */}
      <section id="feature-genetics" className="py-20 bg-white text-[#0c322c] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="max-w-3xl space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0c322c] tracking-tight">
              {isAr ? 'أخصائيو علم الوراثة المعتمدون والذكاء الاصطناعي' : 'Certified Genetics Specialists & AI Intelligence'}
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
              {isAr
                ? 'استشارات وراثية تراعي خصوصية المجتمع مع مسارات تقارير معتمدة دولياً CLIA/CAP لتمكين العائلات بمعلومات سريرية دقيقة ومحترمة.'
                : 'Culturally harmonized hereditary counseling and CLIA/CAP certified report workflows. Empowering families with actionable, culturally respectful clinical pedigree intelligence.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-2xl bg-[#efefef]/60 shadow-sm border border-neutral-200 space-y-3 hover:border-[#30ba78] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#30ba78]/15 text-[#30ba78] flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">account_tree</span>
              </div>
              <h3 className="text-base font-bold text-[#0c322c]">
                {isAr ? 'شجرة عائلة لثلاثة أجيال' : '3-Generation Pedigree'}
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {isAr
                  ? 'مخططات أنساب سريرية قياسية توثق حالات النواقل وصلات القرابة المزدوجة وفق معايير ACMG.'
                  : 'Standardized clinical pedigree charts mapping probands, carrier alleles, and dual-parental consanguinity with ACMG compliance.'}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#efefef]/60 shadow-sm border border-neutral-200 space-y-3 hover:border-[#2453ff] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#2453ff]/15 text-[#2453ff] flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">biotech</span>
              </div>
              <h3 className="text-base font-bold text-[#0c322c]">
                {isAr ? 'تقييم مخاطر الزوجين' : 'Pre-marital Couple Risk'}
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {isAr
                  ? 'مطابقة احتمالات بونيت التلقائية للحالات الوراثية الشائعة (الثلاسيميا، نقص الخميرة G6PD، الأنيميا المنجلية).'
                  : 'Automated Punnett probability matching for common Middle Eastern and South Asian carrier conditions (Thalassemia, G6PD, Sickle Cell).'}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#efefef]/60 shadow-sm border border-neutral-200 space-y-3 hover:border-[#fe7c3f] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#fe7c3f]/15 text-[#fe7c3f] flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">psychology</span>
              </div>
              <h3 className="text-base font-bold text-[#0c322c]">
                {isAr ? 'تحليل وراثي ذكي' : 'AI Genetic Intelligence'}
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {isAr
                  ? 'تحليل فوري لتقارير الفحوصات بصيغة PDF مع تنقية البيانات الشخصية والحفاظ على الخصوصية التامة.'
                  : 'Instant parsing of laboratory PDF screening reports with automated redaction of sensitive PII and candidate de-identification.'}
              </p>
            </div>

          </div>

          {/* Testimonial Card directly from attachment */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#192072] to-[#0c322c] text-white shadow-xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1 text-[#fe7c3f]">
                <span className="material-symbols-outlined text-lg">star</span>
                <span className="material-symbols-outlined text-lg">star</span>
                <span className="material-symbols-outlined text-lg">star</span>
                <span className="material-symbols-outlined text-lg">star</span>
                <span className="material-symbols-outlined text-lg">star</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#30ba78]/20 text-[#90ebcd] border border-[#30ba78]/40 text-xs font-bold">
                <span className="material-symbols-outlined text-sm">verified</span>
                <span>{isAr ? 'أخصائي وراثي معتمد' : 'Verified Geneticist'}</span>
              </div>
            </div>

            <blockquote className="text-base sm:text-lg italic font-medium text-[#efefef] leading-relaxed">
              {isAr
                ? '"منحتنا منصة Guardian Angel وضوحاً استثنائياً حول المؤشرات الوراثية العائلية مع حماية بياناتنا الوراثية بأعلى معايير الأمان."'
                : '"GuardianAngel provided our family with unparalleled clarity on hereditary cardiac markers while strictly keeping our DNA signatures protected under hardware keys."'}
            </blockquote>

            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-10 rounded-full bg-[#30ba78] text-[#0c322c] font-black flex items-center justify-center text-sm shadow">
                AT
              </div>
              <div>
                <p className="text-sm font-bold text-white">{isAr ? 'د. أريس ثورن، ماجستير CGC' : 'Dr. Aris Thorne, MS, CGC'}</p>
                <p className="text-xs text-[#90ebcd]">{isAr ? 'أخصائي علم الجينات السريري • تحالف بوسطن الصحي' : 'Clinical Genomic Specialist • Boston Health Alliance'}</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ==================== 7. FOOTER ==================== */}
      <footer className="py-12 bg-[#0c322c] border-t border-white/10 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center">
              <img src="/static/screen/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Guardian Angel</p>
              <p className="text-[10px] text-[#90ebcd]">
                {isAr ? 'منصة الذكاء الجيني والوراثي' : 'Genomics Intelligence Platform'}
              </p>
            </div>
          </div>

          <div className="max-w-3xl space-y-2.5 text-xs text-[#efefef]/90 leading-relaxed pt-2 border-t border-white/10">
            <p>
              {isAr
                ? 'مبادرة من فريق Pairadox لزيادة الوعي بالمخاطر الصحية الوراثية ولمساعدة العائلات على اتخاذ قرارات واثقة ومستنيرة، مع الاحترام الكامل لقيم كل عائلة وثقافتها وخصوصيتها.'
                : 'An initiative by the Pairadox Team to raise awareness of inherited health risks and to help families make informed, confident choices, with respect for every family’s values, culture and privacy.'}
            </p>
            <p className="text-neutral-400 text-[11px]">
              {isAr
                ? 'يوفر هذا التطبيق معلومات عامة ولا يحل محل الاستشارة الطبية أو التشخيص أو الاستشارة الوراثية التخصصية. يرجى التحدث مع أخصائي رعاية صحية مؤهل بخصوص نتائجك.'
                : 'This app provides general information and does not replace medical advice, diagnosis or genetic counselling. Please speak with a qualified healthcare professional about your results.'}
            </p>
            <p className="text-neutral-400 text-[11px] pt-1">
              © 2026 Pairadox Team
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
