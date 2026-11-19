'use client';

import * as React from 'react';
import { useLoginContext } from '../../_hooks/useLoginContext';
import { DantoraHelixCanvas } from './DantoraHelixCanvas';

export function HeroSection() {
  const { auth, mobile } = useLoginContext();

  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gradient-to-br from-[#0c322c] via-[#0f2a24] to-[#192072] text-white"
    >
      {/* Dantora Diagonal Chromosome Fluid DNA & All-Around Circular Bokeh Canvas */}
      <DantoraHelixCanvas />

      {/* Subtle SVG Grid & Abstract Hex/Node Network Texture */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.09] pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="hero-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#90ebcd" strokeWidth="1" />
            <circle cx="48" cy="48" r="1.5" fill="#30ba78" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>

      {/* Multi-color ambient light accents */}
      <div className="absolute -top-32 -right-32 w-[30rem] h-[30rem] rounded-full bg-[#2453ff]/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-32 w-96 h-96 rounded-full bg-[#30ba78]/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-[#fe7c3f]/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Story Section 1: Intro Headline, Subheadline & 3 Core Principles */}
        <div className="min-h-[100dvh] lg:min-h-0 pt-24 pb-8 lg:pt-28 lg:pb-12 flex flex-col justify-between lg:block">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1 justify-center">
            {/* Left Column: Headline, Subheadline, Actions & 3 Core Principles */}
            <div className="lg:col-span-7 space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight leading-tight text-white">
                Your Family’s Health Story <span className="text-[#30ba78]">Matters.</span>
              </h1>

              <p className="text-xs sm:text-sm text-[#efefef] leading-relaxed max-w-xl font-normal">
                Clear, caring guidance to help couples and families understand inherited health risks
                and make choices that fit their values. Private by design.
              </p>

              {/* Desktop CTA row */}
              <div className="hidden lg:flex items-center gap-2 pt-1 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() => mobile.openAssessment(0)}
                  className="px-4 py-2.5 rounded-lg bg-[#30ba78] hover:bg-[#90ebcd] text-[#0c322c] text-xs font-black flex items-center gap-1.5 shadow-sm flex-shrink-0 cursor-pointer whitespace-nowrap active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-sm">tune</span>
                  <span>Quick Assessment</span>
                </button>

                <button
                  type="button"
                  onClick={() => auth.openAuth('signin')}
                  className="px-3.5 py-2.5 rounded-lg bg-[#192072] hover:bg-[#2453ff] text-white text-xs font-bold flex items-center gap-1 border border-[#90ebcd]/30 shadow-sm flex-shrink-0 cursor-pointer whitespace-nowrap"
                >
                  <span>Access Health Vault</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/api/uaepass/login';
                  }}
                  className="px-3 py-2.5 rounded-lg bg-black hover:bg-neutral-900 text-white text-xs font-bold flex items-center gap-1 border border-white/20 flex-shrink-0 cursor-pointer whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[#30ba78] text-sm">
                    fingerprint
                  </span>
                  <span>UAE PASS</span>
                </button>
              </div>

              {/* 3 Core Principles: Editorial Pillars */}
              <div className="grid grid-cols-3 gap-3 pt-3.5 border-t border-white/10">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 text-[#30ba78]">
                    <span className="material-symbols-outlined text-sm">diversity_1</span>
                    <span className="text-xs sm:text-sm font-extrabold text-white">Your family</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-[#90ebcd]/80 font-normal leading-tight">
                    At the heart of care
                  </p>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 text-[#90ebcd]">
                    <span className="material-symbols-outlined text-sm">favorite</span>
                    <span className="text-xs sm:text-sm font-extrabold text-white">Your values</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-[#90ebcd]/80 font-normal leading-tight">
                    Respected & prioritized
                  </p>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 text-[#fe7c3f]">
                    <span className="material-symbols-outlined text-sm">how_to_reg</span>
                    <span className="text-xs sm:text-sm font-extrabold text-white">
                      Your informed choice
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-[#90ebcd]/80 font-normal leading-tight">
                    Empowered decisions
                  </p>
                </div>
              </div>

              {/* Mobile Quick Launcher in First Screen */}
              <div className="pt-4 lg:hidden space-y-2">
                <button
                  type="button"
                  onClick={() => mobile.openAssessment(0)}
                  className="w-full py-4 rounded-2xl bg-[#30ba78] hover:bg-[#90ebcd] text-[#0c322c] text-sm font-black flex items-center justify-center gap-2 shadow-lg cursor-pointer whitespace-nowrap active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-xl">tune</span>
                  <span>Start 2-Min Quick Assessment</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => auth.openAuth('signin')}
                    className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-1 border border-white/20 cursor-pointer"
                  >
                    <span>Patient Vault</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = '/api/uaepass/login';
                    }}
                    className="flex-1 py-3 rounded-xl bg-black hover:bg-neutral-900 text-white text-xs font-bold flex items-center justify-center gap-1 border border-white/20 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[#30ba78] text-sm">
                      fingerprint
                    </span>
                    <span>UAE PASS</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column (Desktop Only): UAE Programme Card */}
            <div className="hidden lg:block lg:col-span-5 relative">
              <div className="rounded-2xl p-4 sm:p-5 bg-[#192072]/70 backdrop-blur-md border border-[#2453ff]/40 shadow-2xl space-y-3 relative overflow-hidden">
                <div className="flex justify-center border-b border-white/10 pb-2.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/10 border border-white/20 shadow-xs">
                    <div className="w-3.5 h-2.5 rounded-xs overflow-hidden flex relative shadow-xs flex-shrink-0">
                      <div className="w-1/3 h-full bg-[#e52320]" />
                      <div className="w-2/3 h-full flex flex-col">
                        <div className="h-1/3 bg-[#00732f]" />
                        <div className="h-1/3 bg-[#ffffff]" />
                        <div className="h-1/3 bg-[#000000]" />
                      </div>
                    </div>
                    <span className="text-white font-extrabold tracking-wide">
                      The UAE programme
                    </span>
                  </div>
                </div>

                <div className="text-center space-y-0.5">
                  <h3 className="text-sm sm:text-base font-black text-white leading-snug">
                    Mandatory pre-marital screening
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-[#efefef] leading-relaxed">
                    Official nationwide protocol required for prospective couples to ensure health
                    clarity and proactive family planning.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex flex-col items-center justify-center text-center">
                    <div className="w-6 h-6 rounded-md bg-[#30ba78]/20 flex items-center justify-center text-[#30ba78] mb-1">
                      <span className="material-symbols-outlined text-sm">genetics</span>
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-white leading-none">
                      570
                    </span>
                    <span className="text-xs font-bold text-[#90ebcd] tracking-wide mt-0.5">
                      Genes
                    </span>
                    <p className="text-[9.5px] sm:text-[10px] text-neutral-300 font-medium pt-0.5 leading-tight">
                      Covered by genetic testing
                    </p>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex flex-col items-center justify-center text-center">
                    <div className="w-6 h-6 rounded-md bg-[#fe7c3f]/20 flex items-center justify-center text-[#fe7c3f] mb-1">
                      <span className="material-symbols-outlined text-sm">health_and_safety</span>
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-white leading-none">
                      845+
                    </span>
                    <span className="text-xs font-bold text-[#fe7c3f] tracking-wide mt-0.5">
                      Conditions
                    </span>
                    <p className="text-[9.5px] sm:text-[10px] text-neutral-300 font-medium pt-0.5 leading-tight">
                      Preventable genetic conditions addressed
                    </p>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex flex-col items-center justify-center text-center">
                    <div className="w-6 h-6 rounded-md bg-[#2453ff]/20 flex items-center justify-center text-[#2453ff] mb-1">
                      <span className="material-symbols-outlined text-sm">bloodtype</span>
                    </div>
                    <span className="text-xs sm:text-sm font-black text-white leading-tight">
                      Screening Types
                    </span>
                    <p className="text-[9.5px] sm:text-[10px] text-[#90ebcd] font-semibold leading-tight pt-1">
                      Genetic, infectious disease, and blood disorders
                    </p>
                  </div>

                  <a
                    href="#screening-centers"
                    className="p-2.5 sm:p-3 rounded-xl bg-[#30ba78]/15 hover:bg-[#30ba78]/25 border border-[#30ba78]/40 hover:border-[#30ba78] transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-md bg-[#30ba78] flex items-center justify-center text-[#0c322c] mb-1 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-sm">apartment</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-[#30ba78] group-hover:text-[#90ebcd] font-black text-xs sm:text-sm leading-tight">
                      <span>Find a screening centre</span>
                      <span className="material-symbols-outlined text-xs">arrow_downward</span>
                    </div>
                    <p className="text-[9.5px] sm:text-[10px] text-neutral-300 font-medium pt-0.5 leading-tight">
                      Official centres in Abu Dhabi, Al Ain & Al Dhafra
                    </p>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Scroll Hint */}
          <div className="lg:hidden text-center pt-2 pb-1 text-white/50 text-[11px] flex items-center justify-center gap-1">
            <span>Scroll for UAE Screening Guidelines</span>
            <span className="material-symbols-outlined text-sm animate-bounce">arrow_downward</span>
          </div>
        </div>

        {/* Story Section 2: UAE Programme & Why This Matters (Dedicated screen on mobile) */}
        <div className="min-h-[100dvh] lg:min-h-0 flex flex-col justify-center py-16 lg:py-0 border-t border-white/10 lg:border-t-0 scroll-mt-14">
          
          {/* Mobile Card: The UAE Programme (Shown on mobile as part of Story Screen 2) */}
          <div className="block lg:hidden rounded-3xl p-5 bg-[#192072]/80 backdrop-blur-md border border-[#2453ff]/40 shadow-xl space-y-3 mb-6">
            <div className="flex justify-center border-b border-white/10 pb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/10 border border-white/20">
                <div className="w-3.5 h-2.5 rounded-xs overflow-hidden flex relative shadow-xs flex-shrink-0">
                  <div className="w-1/3 h-full bg-[#e52320]" />
                  <div className="w-2/3 h-full flex flex-col">
                    <div className="h-1/3 bg-[#00732f]" />
                    <div className="h-1/3 bg-[#ffffff]" />
                    <div className="h-1/3 bg-[#000000]" />
                  </div>
                </div>
                <span className="text-white font-extrabold tracking-wide">
                  The UAE programme
                </span>
              </div>
            </div>

            <div className="text-center space-y-0.5">
              <h3 className="text-sm font-black text-white leading-snug">
                Mandatory pre-marital screening
              </h3>
              <p className="text-[10px] text-[#efefef] leading-relaxed">
                Official nationwide protocol required for prospective couples.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <span className="text-lg font-black text-white block">570</span>
                <span className="text-[10px] font-bold text-[#90ebcd] block">Genes Covered</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <span className="text-lg font-black text-white block">845+</span>
                <span className="text-[10px] font-bold text-[#fe7c3f] block">Conditions</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <span className="text-xs font-black text-white block">Screening Types</span>
                <span className="text-[9px] text-[#90ebcd] leading-tight block pt-0.5">Genetic & Blood</span>
              </div>
              <a
                href="#screening-centers"
                className="p-2.5 rounded-xl bg-[#30ba78]/20 border border-[#30ba78]/40 text-center flex flex-col items-center justify-center"
              >
                <span className="text-xs font-bold text-[#30ba78] block">Find a centre</span>
                <span className="text-[9px] text-neutral-300 leading-tight block pt-0.5">Abu Dhabi & Al Ain</span>
              </a>
            </div>
          </div>

          {/* Why This Matters Editorial */}
          <div className="text-center max-w-3xl mx-auto space-y-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Why this matters
            </h2>
            <p className="text-xs sm:text-[13px] text-[#efefef] leading-relaxed font-normal">
              Family is at the heart of life in the UAE, and marriages within families are a
              long-standing, respected tradition. Because relatives are more likely to share certain
              genetic changes, some inherited conditions can be more common in children of related
              parents. Knowing this early gives families more choices, not fewer.
            </p>
            <p className="text-xs sm:text-[13px] text-[#90ebcd] leading-relaxed font-medium">
              The UAE already requires pre-marital screening. This platform helps you make sense of
              what comes next: what your results mean, what they don’t mean, and where to get support.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => mobile.openAssessment(0)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#30ba78] hover:bg-[#90ebcd] text-[#0c322c] text-sm font-black flex items-center justify-center gap-2 shadow-lg cursor-pointer whitespace-nowrap active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-lg">tune</span>
                <span>Open Risk Estimator</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
