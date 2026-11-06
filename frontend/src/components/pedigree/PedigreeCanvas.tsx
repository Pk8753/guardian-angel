'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { PedigreeMember, PedigreeUnion } from './types';
import { computePedigreeLayout, LayoutResult } from './layoutEngine';
import { PedigreeNodeSymbol } from './PedigreeNodeSymbol';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Shield } from 'lucide-react';

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
    layout.members.forEach((m) => map.set(m.id, m));
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

                  {/* Proband Arrow Marker */}
                  <marker
                    id="proband-arrowhead"
                    viewBox="0 0 10 10"
                    refX="5"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0c322c" />
                  </marker>
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
                  const p1 = memberMap.get(union.parent1_id);
                  const p2 = memberMap.get(union.parent2_id);
                  if (!p1 || !p2 || p1.x === undefined || p2.x === undefined || p1.y === undefined || p2.y === undefined) {
                    return null;
                  }

                  const minX = Math.min(p1.x, p2.x);
                  const maxX = Math.max(p1.x, p2.x);
                  const unionY = p1.y;
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
                          .map((cid) => memberMap.get(cid))
                          .filter((c): c is PedigreeMember => !!c && c.x !== undefined && c.y !== undefined);

                        if (children.length === 0) return null;

                        const childXs = children.map((c) => c.x!);
                        const minChildY = Math.min(...children.map((c) => c.y!));
                        const sibshipY = Math.min(unionY + 65, Math.round((unionY + minChildY) / 2));
                        // Crucial fix: sibMinX and sibMaxX MUST include unionMidX so the horizontal line
                        // always bridges the parent drop stem and all children seamlessly
                        const sibMinX = Math.min(unionMidX, ...childXs);
                        const sibMaxX = Math.max(unionMidX, ...childXs);

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
                            />

                            {/* Horizontal sibship crossbar connecting union stem to every child */}
                            <line
                              x1={sibMinX}
                              y1={sibshipY}
                              x2={sibMaxX}
                              y2={sibshipY}
                              stroke="#334155"
                              strokeWidth={2}
                            />

                            {/* Drop lines to each individual child */}
                            {children.map((child) => (
                              <g key={`child-drop-${child.id}`}>
                                <line
                                  x1={child.x!}
                                  y1={sibshipY}
                                  x2={child.x!}
                                  y2={child.y! - 22}
                                  stroke="#334155"
                                  strokeWidth={2}
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
                            ))}
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
                  const parent = memberMap.get(singleParentId);
                  if (!parent || parent.x === undefined || parent.y === undefined || m.x === undefined || m.y === undefined) {
                    return null;
                  }

                  const midY = Math.round((parent.y + m.y) / 2);
                  const minX = Math.min(parent.x, m.x);
                  const maxX = Math.max(parent.x, m.x);

                  return (
                    <g key={`single-parent-${parent.id}-${m.id}`}>
                      <line x1={parent.x} y1={parent.y + 22} x2={parent.x} y2={midY} stroke="#334155" strokeWidth={2} />
                      <line x1={minX} y1={midY} x2={maxX} y2={midY} stroke="#334155" strokeWidth={2} />
                      <line x1={m.x} y1={midY} x2={m.x} y2={m.y - 22} stroke="#334155" strokeWidth={2} />
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

            {/* Bottom NSGC Standard Legend matching screen.png */}
            <div className="shrink-0 z-10 bg-white border-t border-outline-variant/30 px-4 py-2.5 flex items-center justify-between flex-wrap gap-3 text-[11px] text-on-surface-variant font-medium">
              <div className="flex items-center gap-4 flex-wrap">
                {/* Male */}
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 border-2 border-pine bg-white rounded-xs" />
                  <span>Male</span>
                </div>

                {/* Female */}
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 border-2 border-pine bg-white rounded-full" />
                  <span>Female</span>
                </div>

                {/* Affected */}
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 border-2 border-pine bg-pine rounded-xs" />
                  <span>Affected</span>
                </div>

                {/* Carrier */}
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 border-2 border-pine bg-white rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-pine rounded-full" />
                  </div>
                  <span>Carrier</span>
                </div>

                {/* Deceased */}
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 border-2 border-pine bg-white relative">
                    <div className="absolute inset-0 border-t border-pine -rotate-45 top-1.5" />
                  </div>
                  <span>Deceased</span>
                </div>

                {/* Proband */}
                <div className="flex items-center gap-1.5">
                  <span className="text-pine font-bold font-mono">↗ [P]</span>
                  <span>Proband</span>
                </div>

                {/* Consanguineous */}
                <div className="flex items-center gap-1.5">
                  <div className="flex flex-col gap-0.5">
                    <div className="w-4 h-0.5 bg-pine" />
                    <div className="w-4 h-0.5 bg-pine" />
                  </div>
                  <span>Consanguineous</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-on-surface-variant/70">
                <Shield className="w-3 h-3 text-pine" />
                <span>NSGC & ACMG Pedigree Standard 2026</span>
              </div>
            </div>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};
