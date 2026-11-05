'use client';

import React, { useRef, useState, useMemo } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { PedigreeMember, PedigreeUnion } from './types';
import { computePedigreeLayout, LayoutResult } from './layoutEngine';
import { PedigreeNodeSymbol } from './PedigreeNodeSymbol';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';

interface PedigreeCanvasProps {
  members: PedigreeMember[];
  isConsanguineous?: boolean;
  selectedMemberId?: string | number | null;
  onSelectMember?: (member: PedigreeMember) => void;
  onAddRelative?: (member: PedigreeMember) => void;
  onPositionChange?: (memberId: string | number, x: number, y: number) => void;
}

export const PedigreeCanvas: React.FC<PedigreeCanvasProps> = ({
  members,
  isConsanguineous = false,
  selectedMemberId,
  onSelectMember,
  onAddRelative,
  onPositionChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | number | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Compute layered layout with couple/union nodes & generation baselines
  const layout: LayoutResult = useMemo(() => {
    return computePedigreeLayout(members, isConsanguineous);
  }, [members, isConsanguineous]);

  const memberMap = useMemo(() => {
    const map = new Map<string | number, PedigreeMember>();
    layout.members.forEach((m) => map.set(m.id, m));
    return map;
  }, [layout.members]);

  // Handle Drag Repositioning
  const handleMouseDown = (e: React.MouseEvent, member: PedigreeMember) => {
    e.stopPropagation();
    setDraggingId(member.id);
    const currX = member.x ?? 100;
    const currY = member.y ?? 100;
    setDragOffset({
      x: e.clientX - currX,
      y: e.clientY - currY
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId) return;
    const newX = Math.round(e.clientX - dragOffset.x);
    const newY = Math.round(e.clientY - dragOffset.y);
    onPositionChange?.(draggingId, newX, newY);
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[650px] bg-slate-50/50 rounded-2xl border border-slate-200/80 overflow-hidden shadow-inner select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <TransformWrapper
        initialScale={1}
        minScale={0.3}
        maxScale={2.5}
        centerOnInit
        limitToBounds={false}
        panning={{ disabled: !!draggingId }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Top Right Floating Zoom & Pan Controls */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-md">
              <button
                type="button"
                onClick={() => zoomIn(0.2)}
                className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => zoomOut(0.2)}
                className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => resetTransform()}
                className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Reset View"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full">
              <svg
                id="pedigree-svg-root"
                width={layout.bounds.width}
                height={layout.bounds.height}
                viewBox={`0 0 ${layout.bounds.width} ${layout.bounds.height}`}
                className="w-full h-full"
              >
                <defs>
                  {/* Grid pattern */}
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
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#006a60" />
                  </marker>
                </defs>

                {/* Grid Background */}
                <rect width="100%" height="100%" fill="url(#pedigree-grid)" />

                {/* Generational Guide Labels & Dividers */}
                {layout.generations.map((gen) => (
                  <g key={`gen-${gen.index}`}>
                    <line
                      x1={40}
                      y1={gen.y}
                      x2={layout.bounds.width - 40}
                      y2={gen.y}
                      stroke="#cbd5e1"
                      strokeWidth={1}
                      strokeDasharray="4 6"
                      opacity="0.4"
                    />
                    <rect
                      x={35}
                      y={gen.y - 14}
                      width={36}
                      height={24}
                      rx={6}
                      fill="#f1f5f9"
                      stroke="#cbd5e1"
                      strokeWidth={1}
                    />
                    <text
                      x={53}
                      y={gen.y + 2}
                      textAnchor="middle"
                      className="text-xs font-mono font-bold fill-slate-600"
                    >
                      {gen.roman}
                    </text>
                  </g>
                ))}

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
                            y1={unionY - 2}
                            x2={maxX - 22}
                            y2={unionY - 2}
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

                      {/* Drop stem from union line to children crossbar if there are children */}
                      {union.children_ids.length > 0 && (() => {
                        const children = union.children_ids
                          .map((cid) => memberMap.get(cid))
                          .filter((c): c is PedigreeMember => !!c && c.x !== undefined && c.y !== undefined);

                        if (children.length === 0) return null;

                        const sibshipY = unionY + 60;
                        const childXs = children.map((c) => c.x!);
                        const sibMinX = Math.min(...childXs);
                        const sibMaxX = Math.max(...childXs);

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

                            {/* Horizontal sibship crossbar */}
                            <line
                              x1={sibMinX}
                              y1={sibshipY}
                              x2={sibMaxX}
                              y2={sibshipY}
                              stroke="#334155"
                              strokeWidth={2}
                            />

                            {/* Drop lines to each individual child */}
                            {children.map((child) => {
                              const isTwin = child.twin_group_id != null;
                              return (
                                <g key={`child-drop-${child.id}`}>
                                  <line
                                    x1={child.x!}
                                    y1={sibshipY}
                                    x2={child.x!}
                                    y2={child.y! - 22}
                                    stroke="#334155"
                                    strokeWidth={2}
                                  />
                                  {/* Twin connector crossbar if identical */}
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

                {/* Individual Symbols */}
                {layout.members.map((member) => (
                  <g
                    key={`member-node-${member.id}`}
                    onMouseDown={(e) => handleMouseDown(e, member)}
                  >
                    <PedigreeNodeSymbol
                      member={member}
                      isSelected={selectedMemberId === member.id}
                      onSelect={(m) => onSelectMember?.(m)}
                      onAddRelative={(m) => onAddRelative?.(m)}
                    />
                  </g>
                ))}
              </svg>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};

