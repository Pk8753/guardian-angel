import React from 'react';
import { PedigreeMember } from './types';

interface PedigreeNodeSymbolProps {
  member: PedigreeMember;
  isSelected?: boolean;
  onSelect?: (member: PedigreeMember) => void;
  onAddRelative?: (member: PedigreeMember) => void;
  onEdit?: (member: PedigreeMember) => void;
}

export const PedigreeNodeSymbol: React.FC<PedigreeNodeSymbolProps> = ({
  member,
  isSelected,
  onSelect,
  onAddRelative,
  onEdit
}) => {
  const x = member.x ?? 100;
  const y = member.y ?? 100;
  const size = 44;
  const half = size / 2;

  // Fill logic
  const isAffected = member.is_affected;
  const isCarrier = member.is_carrier;
  const fillColor = isAffected ? '#0f766e' : '#ffffff';
  const strokeColor = isSelected ? '#006a60' : '#1e293b';
  const strokeWidth = isSelected ? 3 : 2;

  const renderShape = () => {
    switch (member.sex) {
      case 'male':
        return (
          <rect
            x={-half}
            y={-half}
            width={size}
            height={size}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rx={2}
          />
        );
      case 'female':
        return (
          <circle
            cx={0}
            cy={0}
            r={half}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        );
      case 'pregnancy_loss':
        return (
          <polygon
            points={`0,${-half} ${half},${half} ${-half},${half}`}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        );
      case 'other':
      case 'unknown':
      default:
        // Diamond
        return (
          <polygon
            points={`0,${-half} ${half},0 0,${half} ${-half},0`}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        );
    }
  };

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="cursor-pointer select-none transition-transform hover:scale-105"
      onClick={() => onSelect?.(member)}
    >
      {/* Selection Glow */}
      {isSelected && (
        <circle
          cx={0}
          cy={0}
          r={half + 8}
          fill="none"
          stroke="#006a60"
          strokeWidth={2}
          strokeDasharray="4 3"
          className="animate-spin-slow opacity-80"
        />
      )}

      {/* Symbol Shape */}
      {renderShape()}

      {/* Carrier dot if carrier and not fully affected */}
      {isCarrier && !isAffected && (
        <circle cx={0} cy={0} r={5} fill="#0f766e" />
      )}

      {/* Deceased diagonal strike-through */}
      {member.is_deceased && (
        <line
          x1={-half - 6}
          y1={half + 6}
          x2={half + 6}
          y2={-half - 6}
          stroke="#475569"
          strokeWidth={2.5}
        />
      )}

      {/* Proband Arrow (points to lower-left corner of the shape) */}
      {member.is_proband && (
        <g transform={`translate(${-half - 12}, ${half + 12})`}>
          <line
            x1={-14}
            y1={14}
            x2={0}
            y2={0}
            stroke="#006a60"
            strokeWidth={2.5}
            markerEnd="url(#proband-arrowhead)"
          />
          <text
            x={-18}
            y={22}
            fill="#006a60"
            fontSize="13"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            P
          </text>
        </g>
      )}

      {/* Generation & Member ID (e.g. II-3) */}
      <text
        x={0}
        y={-half - 8}
        textAnchor="middle"
        className="text-[11px] font-mono font-bold fill-slate-700"
      >
        {member.display_label || `${member.generation || 'I'}-${member.order_in_generation || 1}`}
      </text>

      {/* Labels below symbol */}
      <text
        x={0}
        y={half + 16}
        textAnchor="middle"
        className="text-[11px] font-medium fill-slate-800"
      >
        {member.pseudonym}
      </text>

      {/* Age / Status */}
      <text
        x={0}
        y={half + 28}
        textAnchor="middle"
        className="text-[10px] fill-slate-500 font-sans"
      >
        {member.is_deceased
          ? `d. ${member.age_or_age_at_death ? `${member.age_or_age_at_death}y` : ''}`
          : member.age_or_age_at_death
          ? `${member.age_or_age_at_death} yrs`
          : ''}
      </text>

      {/* Conditions list */}
      {member.conditions && member.conditions.length > 0 && (
        <text
          x={0}
          y={half + 40}
          textAnchor="middle"
          className="text-[9px] font-semibold fill-teal-700 truncate max-w-[90px]"
        >
          {member.conditions.slice(0, 2).join(', ')}
          {member.conditions.length > 2 ? '...' : ''}
        </text>
      )}

      {/* Quick Add Relative Button (visible on hover or when selected) */}
      {isSelected && (
        <g
          transform={`translate(${half + 8}, 0)`}
          className="cursor-pointer hover:opacity-90"
          onClick={(e) => {
            e.stopPropagation();
            onAddRelative?.(member);
          }}
        >
          <circle cx={10} cy={0} r={12} fill="#006a60" />
          <text
            x={10}
            y={4}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="14"
            fontWeight="bold"
          >
            +
          </text>
        </g>
      )}
    </g>
  );
};

