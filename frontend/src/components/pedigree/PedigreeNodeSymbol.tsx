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
            className="transition-colors group-hover:stroke-teal-700"
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
            className="transition-colors group-hover:stroke-teal-700"
          />
        );
      case 'pregnancy_loss':
        return (
          <polygon
            points={`0,${-half} ${half},${half} ${-half},${half}`}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            className="transition-colors group-hover:stroke-teal-700"
          />
        );
      case 'star':
        return (
          <polygon
            points="0,-22 5.6,-7.7 20.9,-6.8 9,3 12.9,17.8 0,9.5 -12.9,17.8 -9,3 -20.9,-6.8 -5.6,-7.7"
            fill={isCarrier ? '#c6f5e5' : fillColor}
            stroke={isSelected ? '#006a60' : (isCarrier ? '#0f766e' : strokeColor)}
            strokeWidth={strokeWidth}
            className="transition-colors group-hover:stroke-teal-700"
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
            className="transition-colors group-hover:stroke-teal-700"
          />
        );
    }
  };

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="cursor-pointer select-none group transition-opacity hover:opacity-90"
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

      {/* Carrier Right-Half Shading (ACMG / NSGC Standard from Image 1 & 2) */}
      {isCarrier && !isAffected && (
        <>
          {member.sex === 'male' && (
            <rect
              x={0}
              y={-half}
              width={half}
              height={size}
              fill="#0f766e"
            />
          )}
          {member.sex === 'female' && (
            <path
              d={`M 0,${-half} A ${half} ${half} 0 0 1 0,${half} Z`}
              fill="#0f766e"
            />
          )}
          {(member.sex === 'other' || member.sex === 'unknown' || !['male', 'female', 'star', 'pregnancy_loss'].includes(member.sex)) && (
            <polygon
              points={`0,${-half} ${half},0 0,${half}`}
              fill="#0f766e"
            />
          )}
          {/* Re-stroke border so half-fill doesn't overlap stroke */}
          {member.sex === 'male' && (
            <rect
              x={-half}
              y={-half}
              width={size}
              height={size}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              rx={2}
            />
          )}
          {member.sex === 'female' && (
            <circle
              cx={0}
              cy={0}
              r={half}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          )}
          {(member.sex === 'other' || member.sex === 'unknown' || !['male', 'female', 'star', 'pregnancy_loss'].includes(member.sex)) && (
            <polygon
              points={`0,${-half} ${half},0 0,${half} ${-half},0`}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          )}
          {/* Center vertical divider */}
          <line
            x1={0}
            y1={-half}
            x2={0}
            y2={half}
            stroke={strokeColor}
            strokeWidth={1.5}
          />
        </>
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

      {/* Proband Arrow (↗ P) - ACMG/NSGC Standard Annotation */}
      {member.is_proband && (
        <g className="proband-annotation">
          <line
            x1={-half - 14}
            y1={half + 14}
            x2={-half - 2}
            y2={half + 2}
            stroke="#0f766e"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <polygon
            points={`${-half - 2},${half + 2} ${-half - 9},${half + 2} ${-half - 2},${half + 9}`}
            fill="#0f766e"
          />
          <text
            x={-half - 18}
            y={half + 22}
            textAnchor="middle"
            fontSize="11"
            fontWeight="bold"
            fill="#0f766e"
            fontFamily="monospace"
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
    </g>
  );
};

