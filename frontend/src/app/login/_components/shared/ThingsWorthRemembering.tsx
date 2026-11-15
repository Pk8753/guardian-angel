'use client';

import * as React from 'react';

export function ThingsWorthRemembering() {
  return (
    <section
      id="things-worth-remembering"
      className="scroll-mt-14 min-h-[100dvh] lg:min-h-0 flex flex-col justify-center py-16 sm:py-20 bg-gradient-to-br from-[#192072] via-[#0f2a24] to-[#0c322c] text-white relative overflow-hidden border-t border-[#2453ff]/30"
    >
      {/* Abstract blueprint grid background */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="zk-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#2453ff" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#zk-grid)" />
      </svg>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6 sm:space-y-8 my-auto">
        <div className="text-center space-y-2 sm:space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#30ba78]/20 text-[#90ebcd] border border-[#30ba78]/30">
            <span className="material-symbols-outlined text-sm text-[#30ba78]">lightbulb</span>
            <span>Guidance & Perspective</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Things worth remembering
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 pt-1 sm:pt-2">
          <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#30ba78]/20 flex items-center justify-center text-[#30ba78]">
              <span className="material-symbols-outlined text-base">check_circle</span>
            </div>
            <p className="text-xs sm:text-sm text-[#efefef] font-medium leading-relaxed">
              Being a carrier is common. It is not a diagnosis and it is not a fault.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#90ebcd]/20 flex items-center justify-center text-[#90ebcd]">
              <span className="material-symbols-outlined text-base">info</span>
            </div>
            <p className="text-xs sm:text-sm text-[#efefef] font-medium leading-relaxed">
              A risk is a possibility, not a certainty.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#2453ff]/20 flex items-center justify-center text-[#2453ff]">
              <span className="material-symbols-outlined text-base">balance</span>
            </div>
            <p className="text-xs sm:text-sm text-[#efefef] font-medium leading-relaxed">
              Every couple&apos;s situation is different, and so is every decision.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#fe7c3f]/20 flex items-center justify-center text-[#fe7c3f]">
              <span className="material-symbols-outlined text-base">forum</span>
            </div>
            <p className="text-xs sm:text-sm text-[#efefef] font-medium leading-relaxed">
              Counselling is a conversation, not a verdict.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-2 md:col-span-2 lg:col-span-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#30ba78]/20 flex items-center justify-center text-[#30ba78]">
              <span className="material-symbols-outlined text-base">verified_user</span>
            </div>
            <p className="text-xs sm:text-sm text-[#efefef] font-medium leading-relaxed">
              You are in charge of your information and your choices.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
