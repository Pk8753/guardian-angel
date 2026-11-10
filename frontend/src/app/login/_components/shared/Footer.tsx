'use client';

import * as React from 'react';

export function Footer() {
  return (
    <footer className="py-12 bg-[#0c322c] border-t border-white/10 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center">
            <img
              src="/static/screen/logo.png"
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Guardian Angel</p>
            <p className="text-[10px] text-[#90ebcd]">Genomics Intelligence Platform</p>
          </div>
        </div>

        <div className="max-w-3xl space-y-2.5 text-xs text-[#efefef]/90 leading-relaxed pt-2 border-t border-white/10">
          <p>
            An initiative by the Pairadox Team to raise awareness of inherited health risks and to
            help families make informed, confident choices, with respect for every family’s values,
            culture and privacy.
          </p>
          <p className="text-neutral-400 text-[11px]">
            This app provides general information and does not replace medical advice, diagnosis or
            genetic counselling. Please speak with a qualified healthcare professional about your
            results.
          </p>
          <p className="text-neutral-400 text-[11px] pt-1">© 2026 Pairadox Team</p>
        </div>
      </div>
    </footer>
  );
}

