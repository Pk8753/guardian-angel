'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { PedigreeMember, PedigreeUnion } from './types';
import { computePedigreeLayout, LayoutResult } from './layoutEngine';
import { PedigreeNodeSymbol } from './PedigreeNodeSymbol';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Shield, BookOpen, X, Info } from 'lucide-react';

interface PedigreeCanvasProps {
  members: PedigreeMember[];
  isConsanguineous?: boolean;
  selectedMemberId?: string | number | null;
  onSelectMember?: (member: PedigreeMember) => void;
  onAddRelative?: (member: PedigreeMember) => void;
  onPositionChange?: (memberId: string | number, x: number, y: number) => void;
  filterTier?: string; // 'all' | 'gen1' | 'gen2' | 'gen3'
  className?: string;
}

export const PedigreeCanvas: React.FC<PedigreeCanvasProps> = ({
  members,
  isConsanguineous = false,
  selectedMemberId,
  onSelectMember,
  onAddRelative,
  onPositionChange,
  filterTier = 'all',
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const [draggingId, setDraggingId] = useState<string | number | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasDragged = useRef<boolean>(false);
  const [isSymbolsGuideOpen, setIsSymbolsGuideOpen] = useState<boolean>(false);

  // Whenever members are created, added, or loaded, re-center tree view
  useEffect(() => {
    if (transformRef.current) {
      transformRef.current.centerView(1);
    }
  }, [members.length]);

  // Filter members by generation tier if specified
  const tierFilteredMembers = useMemo(() => {
    if (!filterTier || filterTier === 'all') return members;
    return members.filter((m) => {
      const g = (m.generation || '').toUpperCase();
      if (filterTier === 'gen1') return g === 'I' || g === 'GEN1';
      if (filterTier === 'gen2') return g === 'II' || g === 'GEN2';
      if (filterTier === 'gen3') return g === 'III' || g === 'GEN3';
      return true;
    });
  }, [members, filterTier]);

  // Compute layered layout with couple/union nodes & generation baselines
  const layout: LayoutResult = useMemo(() => {
    return computePedigreeLayout(tierFilteredMembers, isConsanguineous);
  }, [tierFilteredMembers, isConsanguineous]);

  const memberMap = useMemo(() => {
    const map = new Map<string | number, PedigreeMember>();
    layout.members.forEach((m) => {
      map.set(m.id, m);
      map.set(String(m.id), m);
      if (!isNaN(Number(m.id))) map.set(Number(m.id), m);
    });
    return map;
  }, [layout.members]);

  // Handle Drag Repositioning vs Clean Click Selection
  const handleMouseDown = (e: React.MouseEvent, member: PedigreeMember) => {
    e.stopPropagation();
    setDraggingId(member.id);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    hasDragged.current = false;
    const currX = member.x ?? 100;
    const currY = member.y ?? 100;
    setDragOffset({
      x: e.clientX - currX,
      y: e.clientY - currY
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId) return;
    const dx = Math.abs(e.clientX - dragStartPos.current.x);
    const dy = Math.abs(e.clientY - dragStartPos.current.y);
    if (dx > 4 || dy > 4) {
      hasDragged.current = true;
      const newX = Math.round(e.clientX - dragOffset.x);
      const newY = Math.round(e.clientY - dragOffset.y);
      onPositionChange?.(draggingId, newX, newY);
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-white rounded-2xl border border-outline-variant/30 overflow-hidden shadow-inner select-none flex flex-col ${className || 'h-[620px]'}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        minScale={0.3}
        maxScale={2.5}
        centerOnInit
        limitToBounds={false}
        panning={{ disabled: !!draggingId }}
      >
        {({ zoomIn, zoomOut, resetTransform, instance }) => (
          <>
            {/* Top Right Floating Zoom & Pan Controls matching screen.png */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200/80 shadow-md">
              <button
                type="button"
                onClick={() => zoomOut(0.15)}
                className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-teal-800 hover:bg-slate-100 rounded-lg transition-colors text-xs font-bold"
                title="Zoom Out"
              >
                &minus;
              </button>
              <span className="text-[11px] font-mono font-bold text-slate-600 px-1.5 min-w-[42px] text-center">
                {Math.round((instance?.transformState?.scale || 1) * 100)}%
              </span>
              <button
                type="button"
                onClick={() => zoomIn(0.15)}
                className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-teal-800 hover:bg-slate-100 rounded-lg transition-colors text-xs font-bold"
                title="Zoom In"
              >
                &#43;
              </button>
              <div className="h-4 w-px bg-slate-200 mx-1" />
              <button
                type="button"
                onClick={() => {
                  if (transformRef.current) {
                    transformRef.current.centerView(1);
                  } else {
                    resetTransform();
                  }
                }}
                className="px-2 py-1 text-slate-600 hover:text-teal-800 hover:bg-slate-100 rounded-lg transition-colors text-[11px] font-semibold flex items-center gap-1"
                title="Center & Fit Pedigree"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Fit</span>
              </button>
            </div>

            {/* Transform Canvas Area */}
            <TransformComponent wrapperClass="w-full flex-1 min-h-0" contentClass="w-full h-full">
              <svg
                id="pedigree-svg-root"
                width={layout.bounds.width}
                height={layout.bounds.height}
                viewBox={`0 0 ${layout.bounds.width} ${layout.bounds.height}`}
                className="w-full h-full"
              >
                <defs>
                  {/* Subtle Grid Pattern */}
                  <pattern id="pedigree-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.8" opacity="0.6" />
                  </pattern>
                </defs>

                {/* Grid Background */}
                <rect width="100%" height="100%" fill="url(#pedigree-grid)" />

                {/* Generational Guide Labels & Dividers matching screen.png */}
                {layout.generations.map((gen, idx) => {
                  let genSubtitle = 'Proband Tier';
                  if (idx === 0) genSubtitle = '1940-1965';
                  else if (idx === 1) genSubtitle = '1965-1990';

                  return (
                    <g key={`gen-${gen.index}`}>
                      <line
                        x1={30}
                        y1={gen.y}
                        x2={layout.bounds.width - 30}
                        y2={gen.y}
                        stroke="#cbd5e1"
                        strokeWidth={1}
                        strokeDasharray="4 6"
                        opacity="0.5"
                      />
                      <rect
                        x={20}
                        y={gen.y - 14}
                        width={100}
                        height={26}
                        rx={8}
                        fill="#ffffff"
                        stroke="#cbd5e1"
                        strokeWidth={1}
                        className="shadow-2xs"
                      />
                      <text
                        x={70}
                        y={gen.y + 3}
                        textAnchor="middle"
                        className="text-[11px] font-mono font-bold fill-slate-700"
                      >
                        {gen.roman} <tspan className="text-[10px] font-normal fill-slate-400">({genSubtitle})</tspan>
                      </text>
                    </g>
                  );
                })}

                {/* Relationship Lines (Couple / Union Nodes) */}
                {layout.unions.map((union) => {
                  const p1 = memberMap.get(union.parent1_id) ?? memberMap.get(String(union.parent1_id)) ?? memberMap.get(Number(union.parent1_id));
                  const p2 = memberMap.get(union.parent2_id) ?? memberMap.get(String(union.parent2_id)) ?? memberMap.get(Number(union.parent2_id));
                  if (!p1 || !p2 || p1.x === undefined || p2.x === undefined || p1.y === undefined || p2.y === undefined) {
                    return null;
                  }

                  const minX = Math.min(p1.x, p2.x);
                  const maxX = Math.max(p1.x, p2.x);
                  const unionY = Math.round((p1.y + p2.y) / 2);
                  const unionMidX = (p1.x + p2.x) / 2;

                  return (
                    <g key={`union-${union.id}`}>
                      {/* Spousal Line: single or double (consanguineous) */}
                      {union.is_consanguineous ? (
                        <>
                          <line
                            x1={minX + 22}
                            y1={unionY - 3}
                            x2={maxX - 22}
                            y2={unionY - 3}
                            stroke="#0f766e"
                            strokeWidth={2.5}
                          />
                          <line
                            x1={minX + 22}
                            y1={unionY + 3}
                            x2={maxX - 22}
                            y2={unionY + 3}
                            stroke="#0f766e"
                            strokeWidth={2.5}
                          />

                          {/* 1ST COUSINS Badge matching screen.png */}
                          <g>
                            <rect
                              x={unionMidX - 42}
                              y={unionY - 20}
                              width={84}
                              height={16}
                              rx={8}
                              fill="#f0fdf4"
                              stroke="#0f766e"
                              strokeWidth={1}
                            />
                            <text
                              x={unionMidX}
                              y={unionY - 8}
                              textAnchor="middle"
                              fontSize="9"
                              fontWeight="bold"
                              fill="#0f766e"
                              fontFamily="sans-serif"
                            >
                              1ST COUSINS
                            </text>
                          </g>
                        </>
                      ) : (
                        <line
                          x1={minX + 22}
                          y1={unionY}
                          x2={maxX - 22}
                          y2={unionY}
                          stroke="#334155"
                          strokeWidth={2}
                        />
                      )}

                      {/* Drop stem to children crossbar */}
                      {union.children_ids.length > 0 && (() => {
                        const children = union.children_ids
                          .map((cid) => memberMap.get(cid) ?? memberMap.get(String(cid)) ?? memberMap.get(Number(cid)))
                          .filter((c): c is PedigreeMember => !!c && c.x !== undefined && c.y !== undefined);

                        if (children.length === 0) return null;

                        const childXs = children.map((c) => c.x!);
                        const minChildY = Math.min(...children.map((c) => c.y!));
                        const sibshipY = Math.min(unionY + 65, Math.round((unionY + minChildY) / 2));
                        // Crucial fix: sibMinX and sibMaxX MUST include unionMidX so the horizontal line
                        // always bridges the parent drop stem and all children seamlessly
                        const sibMinX = Math.min(unionMidX, ...childXs);
                        const sibMaxX = Math.max(unionMidX, ...childXs);
                        const isFutureBranch = children.some((c) => c.sex === 'star');

                        return (
                          <g key={`stem-${union.id}`}>
                            {/* Vertical stem from union center to sibship bar */}
                            <line
                              x1={unionMidX}
                              y1={unionY}
                              x2={unionMidX}
                              y2={sibshipY}
                              stroke="#334155"
                              strokeWidth={2}
                              strokeDasharray={isFutureBranch ? "4 4" : undefined}
                            />

                            {/* Horizontal sibship crossbar connecting union stem to every child */}
                            <line
                              x1={sibMinX}
                              y1={sibshipY}
                              x2={sibMaxX}
                              y2={sibshipY}
                              stroke="#334155"
                              strokeWidth={2}
                              strokeDasharray={isFutureBranch ? "4 4" : undefined}
                            />

                            {/* Drop lines to each individual child */}
                            {children.map((child) => {
                              const isChildStar = child.sex === 'star';
                              return (
                                <g key={`child-drop-${child.id}`}>
                                  <line
                                    x1={child.x!}
                                    y1={sibshipY}
                                    x2={child.x!}
                                    y2={child.y! - 22}
                                    stroke={isChildStar ? "#0f766e" : "#334155"}
                                    strokeWidth={isChildStar ? 2.5 : 2}
                                    strokeDasharray={isChildStar ? "4 4" : undefined}
                                  />
                                  {child.is_identical_twin && (
                                    <line
                                      x1={child.x! - 12}
                                      y1={sibshipY + 25}
                                      x2={child.x! + 12}
                                      y2={sibshipY + 25}
                                      stroke="#0f766e"
                                      strokeWidth={2}
                                    />
                                  )}
                                </g>
                              );
                            })}
                          </g>
                        );
                      })()}
                    </g>
                  );
                })}

                {/* Single parent child lines (for half-siblings or single-parent branches) */}
                {layout.members.map((m) => {
                  if (m.father_id && m.mother_id) return null; // already handled by union
                  const singleParentId = m.father_id || m.mother_id;
                  if (!singleParentId) return null;
                  const parent = memberMap.get(singleParentId) ?? memberMap.get(String(singleParentId)) ?? memberMap.get(Number(singleParentId));
                  if (!parent || parent.x === undefined || parent.y === undefined || m.x === undefined || m.y === undefined) {
                    return null;
                  }
                  const isStar = m.sex === 'star';
                  return (
                    <g key={`single-parent-${m.id}`}>
                      <line
                        x1={parent.x}
                        y1={parent.y + 22}
                        x2={m.x}
                        y2={m.y - 22}
                        stroke={isStar ? "#0f766e" : "#334155"}
                        strokeWidth={isStar ? 2.5 : 2}
                        strokeDasharray={isStar ? "4 4" : undefined}
                      />
                    </g>
                  );
                })}

                {/* Individual Symbols */}
                {layout.members.map((member) => (
                  <g
                    key={`member-node-${member.id}`}
                    onMouseDown={(e) => handleMouseDown(e, member)}
                    onMouseUp={() => {
                      if (!hasDragged.current) {
                        onSelectMember?.(member);
                      }
                    }}
                  >
                    <PedigreeNodeSymbol
                      member={member}
                      isSelected={selectedMemberId === member.id}
                      onSelect={(m) => onSelectMember?.(m)}
                    />
                  </g>
                ))}
              </svg>
            </TransformComponent>

            {/* Bottom NSGC Standard Legend matching screen.png & Image 1 / 2 */}
            <div className="shrink-0 z-10 bg-white border-t border-outline-variant/30 px-4 py-2.5 flex items-center justify-between flex-wrap gap-3 text-[11px] text-on-surface-variant font-medium">
              <div className="flex items-center gap-3.5 flex-wrap">
                {/* Male */}
                <div className="flex items-center gap-1.5" title="Unaffected Male">
                  <div className="w-3.5 h-3.5 border-2 border-pine bg-white rounded-xs" />
                  <span>Male</span>
                </div>

                {/* Female */}
                <div className="flex items-center gap-1.5" title="Unaffected Female">
                  <div className="w-3.5 h-3.5 border-2 border-pine bg-white rounded-full" />
                  <span>Female</span>
                </div>

                {/* Not Specified */}
                <div className="flex items-center gap-1.5" title="Gender Not Specified">
                  <div className="w-3 h-3 border-2 border-pine bg-white rotate-45 rounded-2xs" />
                  <span>Unknown</span>
                </div>

                {/* Carrier */}
                <div className="flex items-center gap-1.5" title="Carrier (Heterozygous)">
                  <div className="w-3.5 h-3.5 border-2 border-pine rounded-full overflow-hidden flex">
                    <div className="w-1/2 h-full bg-white" />
                    <div className="w-1/2 h-full bg-pine" />
                  </div>
                  <span>Carrier</span>
                </div>

                {/* Affected */}
                <div className="flex items-center gap-1.5" title="Affected Individual">
                  <div className="w-3.5 h-3.5 border-2 border-pine bg-pine rounded-xs" />
                  <span>Affected</span>
                </div>

                {/* Deceased */}
                <div className="flex items-center gap-1.5" title="Deceased Relative">
                  <div className="w-3.5 h-3.5 border-2 border-pine bg-white relative overflow-hidden">
                    <div className="absolute inset-0 border-t-2 border-slate-700 -rotate-45 top-1" />
                  </div>
                  <span>Deceased</span>
                </div>

                {/* Proband */}
                <div className="flex items-center gap-1.5" title="Proband / Index Consultand">
                  <span className="font-mono font-bold text-pine text-xs flex items-center">
                    <span className="text-[10px]">↗</span>P
                  </span>
                  <span>Proband</span>
                </div>

                {/* Consanguineous */}
                <div className="flex items-center gap-1.5" title="Consanguineous Union (e.g. 1st Cousins)">
                  <div className="flex flex-col gap-0.5">
                    <div className="w-4 h-0.5 bg-pine" />
                    <div className="w-4 h-0.5 bg-pine" />
                  </div>
                  <span>Consanguineous</span>
                </div>

                {/* Future Child (Star) */}
                <div className="flex items-center gap-1.5" title="Projected Future Child">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-pine fill-amber-100 stroke-pine stroke-2">
                    <polygon points="12,2 15,8.5 22,9.3 17,14 18.5,21 12,17.5 5.5,21 7,14 2,9.3 9,8.5" />
                  </svg>
                  <span>Future Child</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSymbolsGuideOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-mint/25 hover:bg-mint/45 text-pine font-bold text-xs border border-mint transition cursor-pointer shadow-2xs"
                  title="View complete pedigree symbols, clinical meanings & annotations"
                >
                  <BookOpen className="w-3.5 h-3.5 text-pine" />
                  <span>View Symbols &amp; Meaning Guide</span>
                </button>
                <div className="hidden sm:flex items-center gap-1 text-[10px] text-on-surface-variant/70">
                  <Shield className="w-3 h-3 text-pine" />
                  <span>ACMG &amp; NSGC 2026</span>
                </div>
              </div>
            </div>
          </>
        )}
      </TransformWrapper>

      {/* ==================== ACMG & NSGC PEDIGREE SYMBOLS & MEANING GUIDE MODAL ==================== */}
      {isSymbolsGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-outline-variant/30 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-mint/30 text-pine flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5 text-pine" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-pine leading-tight">
                    Pedigree Symbols &amp; Meaning Guide
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    ACMG &amp; NSGC International Clinical Genetics Nomenclature
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSymbolsGuideOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Standard Individual Symbols Table (Matching Image 1) */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-pine uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-jungle" />
                <span>Standard Individual Symbols</span>
              </h4>
              <div className="overflow-x-auto rounded-xl border border-outline-variant/30">
                <table className="w-full text-xs text-left">
                  <thead className="bg-fog text-pine font-bold border-b border-outline-variant/20 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">State / Category</th>
                      <th className="py-2.5 px-3 text-center">Female</th>
                      <th className="py-2.5 px-3 text-center">Male</th>
                      <th className="py-2.5 px-3 text-center">Not Specified</th>
                      <th className="py-2.5 px-3">Clinical Meaning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15 text-[11px]">
                    {/* Row 1: Unaffected */}
                    <tr className="hover:bg-fog/40 transition">
                      <td className="py-2.5 px-3 font-semibold text-pine">Unaffected / Normal</td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="w-4 h-4 border-2 border-pine bg-white rounded-full mx-auto" />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="w-4 h-4 border-2 border-pine bg-white rounded-xs mx-auto" />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="w-3.5 h-3.5 border-2 border-pine bg-white rotate-45 rounded-2xs mx-auto" />
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        Standard phenotype; non-carrier or tested negative for condition.
                      </td>
                    </tr>
                    {/* Row 2: Affected */}
                    <tr className="hover:bg-fog/40 transition">
                      <td className="py-2.5 px-3 font-semibold text-pine">Affected Individual</td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="w-4 h-4 border-2 border-pine bg-pine rounded-full mx-auto" />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="w-4 h-4 border-2 border-pine bg-pine rounded-xs mx-auto" />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="w-3.5 h-3.5 border-2 border-pine bg-pine rotate-45 rounded-2xs mx-auto" />
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        Clinically expresses the hereditary disorder or pathogenic trait.
                      </td>
                    </tr>
                    {/* Row 3: Carrier */}
                    <tr className="hover:bg-fog/40 transition bg-mint/5">
                      <td className="py-2.5 px-3 font-semibold text-pine">Carrier (Heterozygous)</td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="w-4 h-4 border-2 border-pine rounded-full overflow-hidden flex mx-auto">
                          <div className="w-1/2 h-full bg-white" />
                          <div className="w-1/2 h-full bg-pine" />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="w-4 h-4 border-2 border-pine rounded-xs overflow-hidden flex mx-auto">
                          <div className="w-1/2 h-full bg-white" />
                          <div className="w-1/2 h-full bg-pine" />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="w-3.5 h-3.5 border-2 border-pine rotate-45 rounded-2xs overflow-hidden flex mx-auto">
                          <div className="w-1/2 h-full bg-white" />
                          <div className="w-1/2 h-full bg-pine" />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        Has 1 altered gene copy and 1 working copy. Healthy &amp; asymptomatic.
                      </td>
                    </tr>
                    {/* Row 4: Deceased */}
                    <tr className="hover:bg-fog/40 transition">
                      <td className="py-2.5 px-3 font-semibold text-pine">Deceased Individual</td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="w-4 h-4 border-2 border-pine bg-white rounded-full relative mx-auto">
                          <div className="absolute inset-0 border-t-2 border-slate-700 -rotate-45 top-1.5" />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="w-4 h-4 border-2 border-pine bg-white rounded-xs relative mx-auto">
                          <div className="absolute inset-0 border-t-2 border-slate-700 -rotate-45 top-1.5" />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="w-3.5 h-3.5 border-2 border-pine bg-white rotate-45 rounded-2xs relative mx-auto">
                          <div className="absolute inset-0 border-t-2 border-slate-700 -rotate-45 top-1" />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        Deceased family member (annotated with age or cause of death).
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Clinical Annotations & Tree Connections (Matching Image 2) */}
            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-bold text-pine uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-jungle" />
                <span>Tree Connections &amp; Annotations</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {/* Mating */}
                <div className="p-3 bg-fog/60 rounded-xl border border-outline-variant/20 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-outline-variant/30 flex items-center justify-center shrink-0">
                    <div className="w-5 h-0.5 bg-slate-700" />
                  </div>
                  <div>
                    <span className="font-bold text-pine block">Mating / Partnership</span>
                    <p className="text-[11px] text-slate-600">Single horizontal line connecting biological parents.</p>
                  </div>
                </div>

                {/* Consanguinity */}
                <div className="p-3 bg-fog/60 rounded-xl border border-outline-variant/20 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-outline-variant/30 flex items-center justify-center shrink-0 flex-col gap-0.5">
                    <div className="w-5 h-0.5 bg-pine" />
                    <div className="w-5 h-0.5 bg-pine" />
                  </div>
                  <div>
                    <span className="font-bold text-pine block">Consanguineous Union</span>
                    <p className="text-[11px] text-slate-600">Double horizontal line denoting shared ancestry (e.g. 1st cousins).</p>
                  </div>
                </div>

                {/* Proband */}
                <div className="p-3 bg-fog/60 rounded-xl border border-outline-variant/20 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-outline-variant/30 flex items-center justify-center shrink-0">
                    <span className="font-mono font-extrabold text-pine text-sm">↗ P</span>
                  </div>
                  <div>
                    <span className="font-bold text-pine block">Proband (↗ P)</span>
                    <p className="text-[11px] text-slate-600">Index individual initiating the screening or clinical assessment.</p>
                  </div>
                </div>

                {/* Offspring & Sibship */}
                <div className="p-3 bg-fog/60 rounded-xl border border-outline-variant/20 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-outline-variant/30 flex items-center justify-center shrink-0">
                    <div className="flex flex-col items-center">
                      <div className="w-0.5 h-2 bg-slate-700" />
                      <div className="w-5 h-0.5 bg-slate-700" />
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-pine block">Offspring &amp; Siblings</span>
                    <p className="text-[11px] text-slate-600">Children linked from parents in chronological birth order (left to right).</p>
                  </div>
                </div>

                {/* Star Child */}
                <div className="p-3 bg-fog/60 rounded-xl border border-outline-variant/20 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-outline-variant/30 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-pine fill-mint stroke-pine stroke-2">
                      <polygon points="12,2 15,8.5 22,9.3 17,14 18.5,21 12,17.5 5.5,21 7,14 2,9.3 9,8.5" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-bold text-pine block">Future Child (★ Star Child)</span>
                    <p className="text-[11px] text-slate-600">Projected offspring calculated from both parents&apos; screening reports.</p>
                  </div>
                </div>

                {/* Generation Tiers */}
                <div className="p-3 bg-fog/60 rounded-xl border border-outline-variant/20 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-outline-variant/30 flex items-center justify-center shrink-0 font-mono font-bold text-pine text-xs">
                    I, II, III
                  </div>
                  <div>
                    <span className="font-bold text-pine block">Generations &amp; Birth Order</span>
                    <p className="text-[11px] text-slate-600">Roman numerals (tiers I, II, III) and numeric order (1, 2, 3...) per generation.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20">
              <span className="text-[11px] text-slate-500">
                Complies with ACMG &amp; NSGC Clinical Pedigree Guidelines
              </span>
              <button
                type="button"
                onClick={() => setIsSymbolsGuideOpen(false)}
                className="px-4 py-2 bg-pine text-white text-xs font-semibold rounded-xl hover:bg-pine-light transition cursor-pointer"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
