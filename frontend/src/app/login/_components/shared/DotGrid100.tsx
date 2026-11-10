'use client';

import * as React from 'react';

interface DotGrid100Props {
  variant: 'desktop' | 'mobile';
  isStarted: boolean;
  sameCarrier: boolean;
  currentExtra: number;
}

export function DotGrid100({
  variant,
  isStarted,
  sameCarrier,
  currentExtra,
}: DotGrid100Props) {
  if (variant === 'mobile') {
    return (
      <div className="p-3 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-1.5">
        <div className="flex items-center justify-between text-xs text-neutral-700">
          <b className="text-[#0c322c]">Out of 100 children:</b>
          <span className="text-[10px] text-neutral-500 font-semibold">Population + Added</span>
        </div>
        <div className="grid grid-cols-10 gap-1.5 max-w-[200px] mx-auto py-1">
          {Array.from({ length: 100 }).map((_, i) => {
            const isBackground = i < 3;
            const isExtra =
              isStarted && i >= 3 && i < 3 + Math.floor(sameCarrier ? 25 : currentExtra);
            let dotBg = 'bg-neutral-200';
            if (isBackground) dotBg = 'bg-[#30ba78]';
            if (isExtra) dotBg = 'bg-[#fe7c3f]';
            return <div key={i} className={`w-2.5 h-2.5 rounded-full ${dotBg}`} />;
          })}
        </div>
        <div className="flex items-center justify-center gap-3 text-[10px] text-neutral-600 pt-0.5">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#30ba78]" /> Baseline (~3%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#fe7c3f]" /> Added link
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-neutral-200" /> Healthy
          </span>
        </div>
      </div>
    );
  }

  // Desktop variant
  return (
    <div className="space-y-2 pt-2">
      <b className="text-xs font-bold text-white">Out of 100 children:</b>
      <div className="grid grid-cols-10 gap-1.5 p-3 rounded-xl bg-black/30 border border-white/10">
        {Array.from({ length: 100 }).map((_, i) => {
          const isBackground = i < 3;
          const isExtra =
            isStarted && i >= 3 && i < 3 + Math.floor(sameCarrier ? 25 : currentExtra);
          const isFraction =
            isStarted &&
            !sameCarrier &&
            i === 3 + Math.floor(currentExtra) &&
            currentExtra % 1 > 0.1;

          let dotBg = 'bg-white/20';
          if (isBackground) dotBg = 'bg-[#90ebcd]';
          if (isExtra) dotBg = 'bg-[#fe7c3f]';
          if (isFraction) dotBg = 'bg-[#fe7c3f]/60';

          return (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full ${dotBg}`}
              title={
                isBackground
                  ? 'Usual background risk (3%)'
                  : isExtra
                  ? 'Added risk from family link'
                  : 'Healthy outcome'
              }
            />
          );
        })}
      </div>
      <p className="text-[10px] text-neutral-300 flex items-center gap-3">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#90ebcd]" /> Usual background (~3%)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#fe7c3f]" /> Added family link
        </span>
      </p>
    </div>
  );
}

