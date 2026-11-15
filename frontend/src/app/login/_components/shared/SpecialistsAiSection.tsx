'use client';

import * as React from 'react';

export function SpecialistsAiSection() {
  return (
    <section
      id="feature-genetics"
      className="scroll-mt-14 min-h-[100dvh] lg:min-h-0 flex flex-col justify-center py-16 sm:py-20 bg-white text-[#0c322c] relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12 my-auto w-full">
        <div className="max-w-3xl space-y-2.5">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0c322c] tracking-tight">
            Certified Genetics Specialists & AI Intelligence
          </h2>
          <p className="text-xs sm:text-base text-neutral-600 leading-relaxed">
            Culturally harmonized hereditary counseling and CLIA/CAP certified report workflows.
            Empowering families with actionable, culturally respectful clinical pedigree intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="p-5 sm:p-6 rounded-3xl bg-[#efefef]/60 shadow-sm border border-neutral-200 space-y-2.5 hover:border-[#30ba78] transition-colors">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#30ba78]/15 text-[#30ba78] flex items-center justify-center">
              <span className="material-symbols-outlined text-lg sm:text-xl">account_tree</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#0c322c]">3-Generation Pedigree</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Standardized clinical pedigree charts mapping probands, carrier alleles, and
              dual-parental consanguinity with ACMG compliance.
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-3xl bg-[#efefef]/60 shadow-sm border border-neutral-200 space-y-2.5 hover:border-[#2453ff] transition-colors">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#2453ff]/15 text-[#2453ff] flex items-center justify-center">
              <span className="material-symbols-outlined text-lg sm:text-xl">biotech</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#0c322c]">Pre-marital Couple Risk</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Automated Punnett probability matching for common Middle Eastern and South Asian
              carrier conditions (Thalassemia, G6PD, Sickle Cell).
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-3xl bg-[#efefef]/60 shadow-sm border border-neutral-200 space-y-2.5 hover:border-[#fe7c3f] transition-colors">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#fe7c3f]/15 text-[#fe7c3f] flex items-center justify-center">
              <span className="material-symbols-outlined text-lg sm:text-xl">psychology</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#0c322c]">AI Genetic Intelligence</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Instant parsing of laboratory PDF screening reports with automated redaction of
              sensitive PII and candidate de-identification.
            </p>
          </div>
        </div>

        {/* Testimonial Card */}
        <div className="p-5 sm:p-8 rounded-3xl bg-gradient-to-r from-[#192072] to-[#0c322c] text-white shadow-xl border border-white/10 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1 text-[#fe7c3f]">
              <span className="material-symbols-outlined text-base sm:text-lg">star</span>
              <span className="material-symbols-outlined text-base sm:text-lg">star</span>
              <span className="material-symbols-outlined text-base sm:text-lg">star</span>
              <span className="material-symbols-outlined text-base sm:text-lg">star</span>
              <span className="material-symbols-outlined text-base sm:text-lg">star</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#30ba78]/20 text-[#90ebcd] border border-[#30ba78]/40 text-[11px] sm:text-xs font-bold">
              <span className="material-symbols-outlined text-sm">verified</span>
              <span>Verified Geneticist</span>
            </div>
          </div>

          <blockquote className="text-sm sm:text-lg italic font-medium text-[#efefef] leading-relaxed">
            &quot;GuardianAngel provided our family with unparalleled clarity on hereditary cardiac
            markers while strictly keeping our DNA signatures protected under hardware keys.&quot;
          </blockquote>

          <div className="flex items-center gap-3 pt-1 sm:pt-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#30ba78] text-[#0c322c] font-black flex items-center justify-center text-xs sm:text-sm shadow">
              AT
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-white">Dr. Aris Thorne, MS, CGC</p>
              <p className="text-[10px] sm:text-xs text-[#90ebcd]">
                Clinical Genomic Specialist • Boston Health Alliance
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
