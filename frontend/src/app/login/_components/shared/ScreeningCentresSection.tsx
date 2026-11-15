'use client';

import * as React from 'react';

export function ScreeningCentresSection() {
  return (
    <section
      id="screening-centers"
      className="scroll-mt-14 min-h-[100dvh] lg:min-h-0 flex flex-col justify-center py-16 bg-[#efefef] text-[#0c322c] border-t border-b border-neutral-300 relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#30ba78]/15 text-[#0c322c] border border-[#30ba78]/30 mb-2">
              <span className="material-symbols-outlined text-sm text-[#30ba78]">pin_drop</span>
              <span>Official Screening Network</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0c322c] tracking-tight">
              Find a screening centre in Abu Dhabi
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-600 max-w-md leading-relaxed">
            Official pre-marital screening facilities across Abu Dhabi, Al Ain, and Al Dhafra offering
            accredited testing packages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {/* Abu Dhabi */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-neutral-200 hover:border-[#30ba78] transition-all space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2 text-[#30ba78]">
              <span className="material-symbols-outlined text-xl">apartment</span>
              <b className="text-base font-bold text-[#0c322c]">Abu Dhabi</b>
            </div>
            <p className="text-xs text-neutral-700 leading-relaxed font-normal">
              Baniyas, Madinat Khalifa, Al Shamkha, Al Maqtaa, Al Bateen and Al Bahia Healthcare
              Centers.
            </p>
          </div>

          {/* Al Ain */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-neutral-200 hover:border-[#2453ff] transition-all space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2 text-[#2453ff]">
              <span className="material-symbols-outlined text-xl">local_hospital</span>
              <b className="text-base font-bold text-[#0c322c]">Al Ain</b>
            </div>
            <p className="text-xs text-neutral-700 leading-relaxed font-normal">
              Al Muwaiji, Al Maqam, Neima, Al Hayer, Al Quaa, Al Hili and Sweihan Healthcare
              Centers; Oud Al Touba Diagnostic and Screening Center; Mezyad Healthcare; Al Yahar
              Healthcare.
            </p>
          </div>

          {/* Al Dhafra Region */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-neutral-200 hover:border-[#fe7c3f] transition-all space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2 text-[#fe7c3f]">
              <span className="material-symbols-outlined text-xl">medical_services</span>
              <b className="text-base font-bold text-[#0c322c]">Al Dhafra Region</b>
            </div>
            <p className="text-xs text-neutral-700 leading-relaxed font-normal">
              Al Dhafra Family Medicine Center; Ghiathy, Marfa, Al Sila, Delma and Liwa Hospitals.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
