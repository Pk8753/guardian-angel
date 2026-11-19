'use client';

import * as React from 'react';
import { useLoginContext } from '../_hooks/useLoginContext';
import {
  GENDER_OPTIONS,
  RELATIONSHIP_STATUS_OPTIONS,
  RELATIONSHIPS,
  EARLIER_GENERATIONS,
  FAMILY_HISTORY,
  PAST_PREGNANCIES,
  SCREENING_STATUS,
  MOBILE_SLIDE_TITLES,
} from '../_constants';
import { formatPct } from '../_utils';
import { DotGrid100 } from './shared/DotGrid100';

export function MobileLoginView() {
  const { estimator, mobile, auth } = useLoginContext();

  const {
    gender,
    setGender,
    relStatus,
    setRelStatus,
    relIdx,
    setRelIdx,
    genIdx,
    setGenIdx,
    histIdx,
    setHistIdx,
    pregIdx,
    setPregIdx,
    scrIdx,
    setScrIdx,
    sameCarrier,
    setSameCarrier,
    assessment,
  } = estimator;

  const {
    currentF,
    currentL,
    currentExtra,
    rangeLo,
    rangeHi,
    totalChance,
    oneInCount,
    isStarted,
    riskBandLevel,
    riskBandTitle,
    riskBandDesc,
  } = assessment;

  const {
    isAssessmentActive,
    openAssessment,
    closeAssessment,
    mobileSlide,
    slideDirection,
    goToSlide,
    prevSlide,
    handleSelectAndAdvance,
    handleTouchStart,
    handleTouchEnd,
    isMobileCentresOpen,
    setIsMobileCentresOpen,
    isMobileFormulaOpen,
    setIsMobileFormulaOpen,
    handleReset,
  } = mobile;

  // Closes assessment and opens full-screen native mobile Auth view
  const handleSaveToVault = React.useCallback(() => {
    const payload = {
      answers: {
        gender,
        relStatus,
        relIdx,
        genIdx,
        histIdx,
        pregIdx,
        scrIdx,
        sameCarrier,
      },
      risk_estimate: assessment,
      plain_summary: assessment.riskBandDesc || 'Completed premarital risk estimation.',
      next_steps: [
        "Complete premarital screening for both partners (Thalassemia, Sickle Cell, G6PD).",
        "Schedule a genetic counseling review to discuss carrier traits.",
        "Record any inherited conditions in either family before consulting."
      ],
      documents: estimator.uploadedDocs || [],
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('ga_pending_guest_assessment', JSON.stringify(payload));
    }
    closeAssessment();
    auth.openAuth('register');
  }, [gender, relStatus, relIdx, genIdx, histIdx, pregIdx, scrIdx, sameCarrier, assessment, estimator.uploadedDocs, closeAssessment, auth]);

  const selectedRel = relIdx !== null ? RELATIONSHIPS[relIdx] : null;
  const relTitle = selectedRel ? selectedRel[1] : 'Unrelated partners';
  const relDesc = selectedRel ? selectedRel[2] : 'No known biological relationship';
  const genTitle = genIdx !== null ? EARLIER_GENERATIONS[genIdx][1] : 'No known earlier inbreeding';
  const histTitle = histIdx !== null ? FAMILY_HISTORY[histIdx][1] : 'No known condition reported';
  const healthyCount = Math.max(0, 100 - Math.round(totalChance));

  return (
    <>
      {/* Mobile Dedicated View (block lg:hidden): Launch Interactive Slideshow Assessment */}
      <div className="block lg:hidden min-h-[calc(100dvh-4rem)] flex flex-col justify-center space-y-4 mb-8">
        <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-lg border border-neutral-200 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-[#0c322c] flex items-center justify-center mx-auto border border-[#30ba78]/40 shadow-xs">
            <span className="material-symbols-outlined text-3xl text-[#30ba78]">tune</span>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-2xl font-black text-[#0c322c] tracking-tight">
              Interactive Mobile Screener
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed max-w-sm mx-auto">
              A tap-to-select, slide-based clinical screener optimized for your phone. Calculates
              kinship coefficient and hereditary risks in under 2 minutes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => openAssessment(0)}
            className="w-full py-4 bg-[#30ba78] hover:bg-[#90ebcd] text-[#0c322c] text-sm font-black rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">play_arrow</span>
            <span>{isStarted ? 'Resume / View Assessment' : 'Start Quick Assessment'}</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>

          <div className="flex items-center justify-center gap-4 text-[11px] text-neutral-500 pt-1">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-[#30ba78]">lock</span>
              <span>100% Private</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-[#2453ff]">speed</span>
              <span>Takes ~2 mins</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-[#fe7c3f]">verified</span>
              <span>UAE Guidelines</span>
            </span>
          </div>
        </div>
      </div>

      {/* ==================== MOBILE ASSESSMENT SLIDESHOW (100DVH NATIVE FEEL) ==================== */}
      {isAssessmentActive && (
        <div
          className="fixed inset-0 z-50 h-[100dvh] max-h-[100dvh] bg-[#efefef] text-[#0c322c] flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-200"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top Clean Minimal Navigation Bar */}
          <div className="px-4 py-3 bg-white border-b border-neutral-200 flex items-center justify-between flex-shrink-0 shadow-xs z-30">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={prevSlide}
                className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-[#0c322c] flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                title="Previous Screen"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
              </button>
              <div className="flex flex-col">
                <span className="text-xs font-black tracking-tight text-[#0c322c]">
                  Guardian Angel
                </span>
                <span className="text-[10px] font-bold text-[#30ba78]">
                  {MOBILE_SLIDE_TITLES[mobileSlide] || 'Assessment'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {isStarted && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2 py-1 text-[10px] font-bold text-[#fe7c3f] bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Restart Assessment"
                >
                  <span className="material-symbols-outlined text-[13px]">restart_alt</span>
                  <span>Reset</span>
                </button>
              )}
              <button
                type="button"
                onClick={closeAssessment}
                className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                title="Exit to Overview"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          </div>

          {/* Dynamic Assessment Slides */}
          <div className="flex-1 min-h-0 flex flex-col justify-between p-4 overflow-y-auto z-20">
            <div
              key={mobileSlide}
              className={`h-full flex flex-col justify-between ${
                slideDirection === 'next' ? 'story-slide-next' : 'story-slide-prev'
              }`}
            >
              {/* SLIDE 0: QUESTION 1 - GENDER */}
              {mobileSlide === 0 && (
                <div className="h-full flex flex-col justify-between py-1">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#192072]/10 text-[#192072] border border-[#192072]/20">
                      <span className="material-symbols-outlined text-sm text-[#2453ff]">person</span>
                      <span>Question 1 of 5</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-[#0c322c] tracking-tight leading-snug">
                      1. What is your biological sex?
                    </h2>

                    <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                      Inherited conditions (such as X-linked traits or G6PD deficiency) depend on
                      biological sex for clinical inheritance modeling.
                    </p>

                    <div className="space-y-3 pt-2">
                      {GENDER_OPTIONS.map(([val, label, desc]) => {
                        const isSelected = gender === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              handleSelectAndAdvance(() => setGender(val as 'male' | 'female'))
                            }
                            className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                              isSelected
                                ? 'bg-[#0c322c] text-white border-[#30ba78] ring-2 ring-[#30ba78]/30 shadow-md'
                                : 'bg-white text-[#0c322c] border-neutral-200 hover:border-[#30ba78] shadow-xs'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <span className="text-base font-extrabold leading-tight block">
                                {label}
                              </span>
                              <p
                                className={`text-xs ${
                                  isSelected ? 'text-[#90ebcd]' : 'text-neutral-500'
                                }`}
                              >
                                {desc}
                              </p>
                            </div>
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-[#30ba78] text-[#0c322c]'
                                  : 'bg-neutral-100 text-neutral-400'
                              }`}
                            >
                              <span className="material-symbols-outlined text-base">
                                {isSelected ? 'check' : 'arrow_forward'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-[11px] text-center text-neutral-400 pt-2">
                    🔒 100% confidential. No answers leave this device.
                  </p>
                </div>
              )}

              {/* SLIDE 1: QUESTION 2 - RELATIONSHIP STATUS */}
              {mobileSlide === 1 && (
                <div className="h-full flex flex-col justify-between py-1">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#192072]/10 text-[#192072] border border-[#192072]/20">
                      <span className="material-symbols-outlined text-sm text-[#2453ff]">
                        favorite
                      </span>
                      <span>Question 2 of 5</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-[#0c322c] tracking-tight leading-snug">
                      2. What is your relationship status?
                    </h2>

                    <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                      Helps tailor premarital guidance or proactive family planning pathways.
                    </p>

                    <div className="space-y-3 pt-2">
                      {RELATIONSHIP_STATUS_OPTIONS.map(([val, label, desc]) => {
                        const isSelected = relStatus === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              handleSelectAndAdvance(() =>
                                setRelStatus(val as 'planning' | 'married')
                              )
                            }
                            className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                              isSelected
                                ? 'bg-[#0c322c] text-white border-[#30ba78] ring-2 ring-[#30ba78]/30 shadow-md'
                                : 'bg-white text-[#0c322c] border-neutral-200 hover:border-[#30ba78] shadow-xs'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <span className="text-base font-extrabold leading-tight block">
                                {label}
                              </span>
                              <p
                                className={`text-xs ${
                                  isSelected ? 'text-[#90ebcd]' : 'text-neutral-500'
                                }`}
                              >
                                {desc}
                              </p>
                            </div>
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-[#30ba78] text-[#0c322c]'
                                  : 'bg-neutral-100 text-neutral-400'
                              }`}
                            >
                              <span className="material-symbols-outlined text-base">
                                {isSelected ? 'check' : 'arrow_forward'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-[11px] text-center text-neutral-400 pt-2">
                    💡 Pre-marital screening in the UAE is mandatory and comprehensive.
                  </p>
                </div>
              )}

              {/* SLIDE 2: QUESTION 3 - CONSANGUINITY */}
              {mobileSlide === 2 && (
                <div className="h-full flex flex-col justify-between py-1">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#30ba78]/20 text-[#0c322c] border border-[#30ba78]/40">
                      <span className="material-symbols-outlined text-sm text-[#30ba78]">
                        family_restroom
                      </span>
                      <span>Question 3 of 5 • Consanguinity</span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-black text-[#0c322c] tracking-tight leading-snug">
                      3. How are you and your partner related?
                    </h2>

                    <p className="text-xs text-neutral-600 leading-tight">
                      Father’s side or mother’s side makes no difference to the calculation.
                    </p>

                    <div className="space-y-2 pt-1 max-h-[55vh] overflow-y-auto pr-1">
                      {RELATIONSHIPS.map(([key, title, desc], idx) => {
                        const isSelected = relIdx === idx;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleSelectAndAdvance(() => setRelIdx(idx))}
                            className={`w-full text-left p-3 sm:p-3.5 rounded-2xl border transition-all flex items-start justify-between cursor-pointer active:scale-[0.99] ${
                              isSelected
                                ? 'bg-[#0c322c] text-white border-[#30ba78] ring-2 ring-[#30ba78]/30 shadow-md'
                                : 'bg-white text-[#0c322c] border-neutral-200 hover:border-[#30ba78] shadow-xs'
                            }`}
                          >
                            <div className="pr-3">
                              <span
                                className={`text-sm font-extrabold leading-tight block ${
                                  isSelected ? 'text-white' : 'text-[#0c322c]'
                                }`}
                              >
                                {title}
                              </span>
                              {desc && (
                                <p
                                  className={`text-xs mt-0.5 leading-relaxed ${
                                    isSelected ? 'text-[#90ebcd]' : 'text-neutral-500'
                                  }`}
                                >
                                  {desc}
                                </p>
                              )}
                            </div>
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                isSelected
                                  ? 'bg-[#30ba78] text-[#0c322c]'
                                  : 'bg-neutral-100 text-neutral-400'
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm">
                                {isSelected ? 'check' : 'arrow_forward'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-[10px] text-center text-neutral-400 pt-1">
                    Select one option to continue to the next screen.
                  </p>
                </div>
              )}

              {/* SLIDE 3: EDUCATIONAL SNIPPET 1 */}
              {mobileSlide === 3 && (
                <div className="h-full flex flex-col justify-between py-2">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#30ba78]/20 text-[#0c322c] border border-[#30ba78]/40">
                      <span className="material-symbols-outlined text-sm text-[#30ba78]">
                        lightbulb
                      </span>
                      <span>Genetics Insight • Did You Know?</span>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#0c322c] flex items-center justify-center border border-[#30ba78]/40 shadow-xs">
                      <span className="material-symbols-outlined text-2xl text-[#30ba78]">
                        genetics
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-[#0c322c] tracking-tight leading-snug">
                      Being a carrier is common. It is not a diagnosis.
                    </h2>

                    <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-2.5 text-xs text-neutral-700 leading-relaxed">
                      <p>
                        Every human carries between 2 to 5 silent recessive gene variants. Most
                        carriers live completely healthy lives without any symptoms.
                      </p>
                      <p className="text-[#0c322c] font-semibold">
                        When relatives marry, they are more likely to share the same variants.
                        Pre-marital screening identifies these early so you have complete peace of
                        mind and proactive pathways.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center gap-2.5 text-xs text-[#0c322c]">
                      <span className="material-symbols-outlined text-[#30ba78] text-lg shrink-0">
                        verified_user
                      </span>
                      <span className="text-[11px] text-neutral-600">
                        Covered by UAE premarital screening:{' '}
                        <strong className="text-[#0c322c]">570 genes & 845+ conditions</strong>.
                      </span>
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => goToSlide(4)}
                      className="w-full py-3.5 bg-[#30ba78] hover:bg-[#90ebcd] text-[#0c322c] text-sm font-black rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <span>Continue</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SLIDE 4: QUESTION 4 - AMPLIFIED RISK */}
              {mobileSlide === 4 && (
                <div className="h-full flex flex-col justify-between py-1">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#192072]/10 text-[#192072] border border-[#192072]/20">
                      <span className="material-symbols-outlined text-sm text-[#2453ff]">
                        account_tree
                      </span>
                      <span>Question 4 of 5 • Amplified Risk</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-[#0c322c] tracking-tight leading-snug">
                      4. Were your parents or your partner’s parents also relatives?
                    </h2>

                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed">
                      <b>Why this matters:</b> This helps assess <b>generational genetic overlap</b>{' '}
                      (multi-generational consanguinity), which can slightly increase shared
                      hereditary factors.
                    </div>

                    <div className="space-y-3 pt-1">
                      {EARLIER_GENERATIONS.map(([key, label, desc], idx) => {
                        const isSelected = genIdx === idx;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleSelectAndAdvance(() => setGenIdx(idx))}
                            className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                              isSelected
                                ? 'bg-[#0c322c] text-white border-[#30ba78] ring-2 ring-[#30ba78]/30 shadow-md'
                                : 'bg-white text-[#0c322c] border-neutral-200 hover:border-[#30ba78] shadow-xs'
                            }`}
                          >
                            <div className="pr-3">
                              <span className="text-base font-extrabold leading-tight block">
                                {label}
                              </span>
                              <p
                                className={`text-xs mt-0.5 ${
                                  isSelected ? 'text-[#90ebcd]' : 'text-neutral-500'
                                }`}
                              >
                                {desc}
                              </p>
                            </div>
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-[#30ba78] text-[#0c322c]'
                                  : 'bg-neutral-100 text-neutral-400'
                              }`}
                            >
                              <span className="material-symbols-outlined text-base">
                                {isSelected ? 'check' : 'arrow_forward'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-[11px] text-center text-neutral-400 pt-2">
                    Select one option to continue to the next question.
                  </p>
                </div>
              )}

              {/* SLIDE 5: QUESTION 5 - FAMILY HISTORY */}
              {mobileSlide === 5 && (
                <div className="h-full flex flex-col justify-between py-1">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#192072]/10 text-[#192072] border border-[#192072]/20">
                      <span className="material-symbols-outlined text-sm text-[#2453ff]">
                        health_and_safety
                      </span>
                      <span>Question 5 of 5 • Family History</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-[#0c322c] tracking-tight leading-snug">
                      5. Is there any known history of inherited diseases in either family?
                    </h2>

                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-1">
                      <b className="block font-bold text-amber-950">
                        Common UAE genetic conditions to consider:
                      </b>
                      <p>
                        • <b>Beta-Thalassemia</b> &bull; <b>Sickle Cell Disease</b> &bull;{' '}
                        <b>Cystic Fibrosis</b> &bull; <b>Spinal Muscular Atrophy (SMA)</b>, or
                        unexplained infant loss.
                      </p>
                    </div>

                    <div className="space-y-3 pt-1">
                      {FAMILY_HISTORY.map(([key, label, desc], idx) => {
                        const isSelected = histIdx === idx;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleSelectAndAdvance(() => setHistIdx(idx))}
                            className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                              isSelected
                                ? 'bg-[#0c322c] text-white border-[#30ba78] ring-2 ring-[#30ba78]/30 shadow-md'
                                : 'bg-white text-[#0c322c] border-neutral-200 hover:border-[#30ba78] shadow-xs'
                            }`}
                          >
                            <div className="pr-3">
                              <span className="text-base font-extrabold leading-tight block">
                                {label}
                              </span>
                              <p
                                className={`text-xs mt-0.5 ${
                                  isSelected ? 'text-[#90ebcd]' : 'text-neutral-500'
                                }`}
                              >
                                {desc}
                              </p>
                            </div>
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-[#30ba78] text-[#0c322c]'
                                  : 'bg-neutral-100 text-neutral-400'
                              }`}
                            >
                              <span className="material-symbols-outlined text-base">
                                {isSelected ? 'check' : 'arrow_forward'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-[11px] text-center text-neutral-400 pt-2">
                    Select one option to continue to the next screen.
                  </p>
                </div>
              )}

              {/* SLIDE 6: EDUCATIONAL SNIPPET 2 */}
              {mobileSlide === 6 && (
                <div className="h-full flex flex-col justify-between py-2">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#fe7c3f]/20 text-[#fe7c3f] border border-[#fe7c3f]/30">
                      <span className="material-symbols-outlined text-sm text-[#fe7c3f]">
                        diversity_1
                      </span>
                      <span>Cultural Heritage & Reassurance</span>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#fe7c3f] flex items-center justify-center border border-[#fe7c3f]/40 shadow-xs">
                      <span className="material-symbols-outlined text-2xl">favorite</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-[#0c322c] tracking-tight leading-snug">
                      A risk is a probability, not a certainty.
                    </h2>

                    <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-2.5 text-xs text-neutral-700 leading-relaxed">
                      <p>
                        Family is at the heart of life in the UAE, and marriage within families is a
                        long-standing, respected tradition.
                      </p>
                      <p className="text-[#0c322c] font-semibold">
                        The vast majority of children born to cousins are completely healthy!
                        Knowing your genetic picture empowers proactive choices—including genetic
                        counseling, carrier screening, and targeted prenatal scans.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center gap-2.5 text-xs text-[#0c322c]">
                      <span className="material-symbols-outlined text-[#30ba78] text-lg shrink-0">
                        check_circle
                      </span>
                      <span className="text-[11px] text-neutral-600">
                        Counselling is a supportive conversation, not a verdict.
                      </span>
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => goToSlide(7)}
                      className="w-full py-3.5 bg-[#30ba78] hover:bg-[#90ebcd] text-[#0c322c] text-sm font-black rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <span>Continue</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SLIDE 7: QUESTION 6 - PAST PREGNANCIES */}
              {mobileSlide === 7 && (
                <div className="h-full flex flex-col justify-between py-1">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#192072]/10 text-[#192072] border border-[#192072]/20">
                      <span className="material-symbols-outlined text-sm text-[#2453ff]">
                        pregnant_woman
                      </span>
                      <span>Question 6 • Reproductive History</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-[#0c322c] tracking-tight leading-snug">
                      6. Any past pregnancy complications?
                    </h2>

                    <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                      Any history of two or more miscarriages, or a child who was seriously ill
                      without a clear cause.
                    </p>

                    <div className="space-y-3 pt-2">
                      {PAST_PREGNANCIES.map(([key, label], idx) => {
                        const isSelected = pregIdx === idx;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleSelectAndAdvance(() => setPregIdx(idx))}
                            className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                              isSelected
                                ? 'bg-[#0c322c] text-white border-[#30ba78] ring-2 ring-[#30ba78]/30 shadow-md'
                                : 'bg-white text-[#0c322c] border-neutral-200 hover:border-[#30ba78] shadow-xs'
                            }`}
                          >
                            <span className="text-sm sm:text-base font-extrabold pr-3 leading-snug">
                              {label}
                            </span>
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-[#30ba78] text-[#0c322c]'
                                  : 'bg-neutral-100 text-neutral-400'
                              }`}
                            >
                              <span className="material-symbols-outlined text-base">
                                {isSelected ? 'check' : 'arrow_forward'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-[11px] text-center text-neutral-400 pt-2">
                    Select one option to continue to the final question.
                  </p>
                </div>
              )}

              {/* SLIDE 8: QUESTION 7 - CARRIER SCREENING & RECESSIVE MATCH */}
              {mobileSlide === 8 && (
                <div className="h-full flex flex-col justify-between py-1">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#192072]/10 text-[#192072] border border-[#192072]/20">
                      <span className="material-symbols-outlined text-sm text-[#2453ff]">
                        biotech
                      </span>
                      <span>Question 7 • Laboratory Testing</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-[#0c322c] tracking-tight leading-snug">
                      7. Premarital or carrier screening status
                    </h2>

                    <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                      Have both partners completed official genetic carrier panel tests?
                    </p>

                    <div className="space-y-2.5 pt-1">
                      {SCREENING_STATUS.map(([key, label], idx) => {
                        const isSelected = scrIdx === idx;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setScrIdx(idx)}
                            className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                              isSelected
                                ? 'bg-[#0c322c] text-white border-[#30ba78] ring-2 ring-[#30ba78]/30 shadow-md'
                                : 'bg-white text-[#0c322c] border-neutral-200 hover:border-[#30ba78] shadow-xs'
                            }`}
                          >
                            <span className="text-xs sm:text-sm font-extrabold pr-3 leading-snug">
                              {label}
                            </span>
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-[#30ba78] text-[#0c322c]' : 'bg-neutral-100 text-neutral-400'
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm">
                                {isSelected ? 'check' : 'arrow_forward'}
                              </span>
                            </div>
                          </button>
                        );
                      })}

                      {/* Recessive match toggle card */}
                      <label
                        className={`flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${
                          sameCarrier
                            ? 'bg-amber-100/70 border-amber-500 text-amber-950 ring-2 ring-amber-400/40 shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 shadow-xs'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={sameCarrier}
                          onChange={(e) => setSameCarrier(e.target.checked)}
                          className="w-4 h-4 mt-0.5 accent-[#fe7c3f] rounded cursor-pointer shrink-0"
                        />
                        <span className="text-xs font-semibold leading-snug">
                          A doctor or lab told us we <b>both carry the same</b> recessive condition
                          (e.g. Beta-Thalassemia, Sickle Cell, SMA).
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => goToSlide(9)}
                      className="w-full py-3.5 bg-[#30ba78] hover:bg-[#90ebcd] text-[#0c322c] text-sm font-black rounded-2xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <span>Calculate Clinical Estimate</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SLIDE 9: RESULTS SCREEN (PRIMARY NUMBERS & 100 DOTS) */}
              {mobileSlide === 9 && (
                <div className="h-full flex flex-col justify-between py-1 overflow-y-auto">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          riskBandLevel === 'ok'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : riskBandLevel === 'mid'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-red-100 text-red-900 border border-red-300'
                        }`}
                      >
                        {riskBandTitle}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-bold">
                        Step 1 of 3 Results
                      </span>
                    </div>

                    {/* Primary Risk Number Card */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c322c] to-[#192072] text-white shadow-md text-center space-y-1">
                      <span className="text-[11px] text-[#90ebcd] font-semibold uppercase tracking-wider block">
                        Extra chance due to family link
                      </span>
                      <div className="text-3xl font-black text-[#30ba78] leading-tight">
                        {!isStarted
                          ? '—'
                          : currentF === 0 && !sameCarrier
                          ? 'No extra risk'
                          : sameCarrier
                          ? '25% chance per pregnancy'
                          : `about ${formatPct(currentExtra)} extra`}
                      </div>
                      {isStarted && currentF > 0 && !sameCarrier && (
                        <p className="text-[11px] text-neutral-300">
                          Likely range: {formatPct(rangeLo)} to {formatPct(rangeHi)} extra
                        </p>
                      )}
                    </div>

                    {/* 100 Children Dot Grid */}
                    <DotGrid100
                      variant="mobile"
                      isStarted={isStarted}
                      sameCarrier={sameCarrier}
                      currentExtra={currentExtra}
                    />

                    {/* 4 Mini Stat Badges */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-white border border-neutral-200 text-center shadow-xs">
                        <span className="text-sm font-black text-[#0c322c] block">
                          {!isStarted
                            ? '—'
                            : currentF === 0
                            ? '0'
                            : currentF <= 0.005
                            ? '< 1/200'
                            : `1/${Math.round(1 / currentF)}`}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-semibold">
                          Shared Ancestry (F)
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-neutral-200 text-center shadow-xs">
                        <span className="text-sm font-black text-[#30ba78] block">
                          {!isStarted ? '—' : `×${currentL.toFixed(2)}`}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-semibold">
                          Multiplier (L)
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-neutral-200 text-center shadow-xs">
                        <span className="text-sm font-black text-[#0c322c] block">
                          {!isStarted ? '~3.0%' : `about ${formatPct(totalChance)}`}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-semibold">
                          Total Chance
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-neutral-200 text-center shadow-xs">
                        <span className="text-sm font-black text-[#fe7c3f] block">
                          {!isStarted ? '1 in 33' : `1 in ${oneInCount}`}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-semibold">
                          1 Child in
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3">
                    <button
                      type="button"
                      onClick={() => goToSlide(10)}
                      className="w-full py-3.5 bg-[#30ba78] hover:bg-[#90ebcd] text-[#0c322c] text-xs font-black rounded-2xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <span>Next: Clinical Summary & Explanation</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveToVault}
                      className="w-full py-2.5 bg-white hover:bg-neutral-50 text-[#0c322c] rounded-2xl border border-neutral-200 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[#30ba78] text-sm">lock</span>
                      <span>Save Assessment in Clinical Vault</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SLIDE 10: SAMPLE CLINICAL EXPLANATION & PERSONALIZED SUMMARY */}
              {mobileSlide === 10 && (
                <div className="h-full flex flex-col justify-between py-1 overflow-y-auto">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                        Clinical Synthesis
                      </span>
                      <span className="text-[10px] text-neutral-500 font-bold">
                        Step 2 of 3 Results
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-3">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-[#30ba78] shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-lg">clinical_notes</span>
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-[#0c322c] leading-tight">
                            Personalized Assessment Summary
                          </h3>
                          <p className="text-[11px] text-neutral-500 leading-snug">
                            Clinical breakdown based on your relationship and family profile
                          </p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2 text-xs">
                        <div className="flex items-baseline justify-between border-b border-neutral-200 pb-1.5">
                          <span className="font-bold text-[#0c322c]">Relationship:</span>
                          <span className="font-semibold text-neutral-700 text-right">{relTitle}</span>
                        </div>

                        <div className="flex items-baseline justify-between border-b border-neutral-200 pb-1.5">
                          <span className="font-bold text-[#0c322c]">Generational Kinship:</span>
                          <span className="font-semibold text-neutral-700 text-right">{genTitle}</span>
                        </div>

                        <div className="flex items-baseline justify-between">
                          <span className="font-bold text-[#0c322c]">Family History:</span>
                          <span className="font-semibold text-neutral-700 text-right">{histTitle}</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-50/60 border border-[#30ba78]/30 space-y-2 text-xs text-neutral-800 leading-relaxed">
                        <b className="font-bold text-[#0c322c] block">Sample Clinical Interpretation:</b>
                        <p>
                          Out of 100 children born to couples with this exact profile, approximately{' '}
                          <strong className="text-[#30ba78] font-black">{healthyCount}</strong> are born
                          completely healthy and free of inherited conditions.
                        </p>
                        <p className="text-[11px] text-neutral-600">
                          {riskBandDesc}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
                        <b className="text-xs font-bold text-[#0c322c] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[#30ba78] text-sm">checklist</span>
                          <span>Sensible Next Steps in the UAE:</span>
                        </b>
                        <ul className="text-[11px] text-neutral-600 space-y-1 list-disc pl-4 leading-normal">
                          <li>Complete mandatory premarital screening (Thalassemia, Sickle Cell, G6PD).</li>
                          <li>Review report with a certified clinical genetic counselor.</li>
                          <li>Ask about expanded carrier panels if earlier generation history is uncertain.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3">
                    <button
                      type="button"
                      onClick={() => goToSlide(11)}
                      className="w-full py-3.5 bg-[#30ba78] hover:bg-[#90ebcd] text-[#0c322c] text-xs font-black rounded-2xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <span>Next: What Does My Result Mean?</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveToVault}
                      className="w-full py-2.5 bg-white hover:bg-neutral-50 text-[#0c322c] rounded-2xl border border-neutral-200 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[#30ba78] text-sm">lock</span>
                      <span>Save Assessment in Clinical Vault</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SLIDE 11: WHAT DOES MY RESULT MEAN? (DEDICATED NATIVE SCREEN) */}
              {mobileSlide === 11 && (
                <div className="h-full flex flex-col justify-between py-1 overflow-y-auto">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                        Guidance & Definitions
                      </span>
                      <span className="text-[10px] text-neutral-500 font-bold">
                        Step 3 of 3 Results
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-xl font-black text-[#0c322c] tracking-tight">
                        What does my result mean?
                      </h2>
                      <p className="text-xs text-neutral-600 leading-snug">
                        Understanding core clinical concepts for proactive family planning
                      </p>
                    </div>

                    {/* 4 Informational Cards */}
                    <div className="space-y-2.5">
                      <div className="p-3.5 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#30ba78] text-lg">dna</span>
                          <b className="text-xs font-black text-[#0c322c]">Carrier Status</b>
                        </div>
                        <p className="text-[11px] text-neutral-600 leading-relaxed">
                          You carry a gene variation but are healthy. Almost all individuals are
                          silent carriers of 2 to 5 recessive traits without symptoms.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#2453ff] text-lg">favorite</span>
                          <b className="text-xs font-black text-[#0c322c]">Couple-Level Match</b>
                        </div>
                        <p className="text-[11px] text-neutral-600 leading-relaxed">
                          A recessive risk only arises when <b>both partners</b> share the exact same
                          carrier variant. Pre-marital screening identifies this early.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#fe7c3f] text-lg">analytics</span>
                          <b className="text-xs font-black text-[#0c322c]">Possible Child Risk</b>
                        </div>
                        <p className="text-[11px] text-neutral-600 leading-relaxed">
                          A probability, not a certainty. The vast majority of children born to
                          relatives are completely healthy.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#192072] text-lg">verified</span>
                          <b className="text-xs font-black text-[#0c322c]">Risk vs. Diagnosis</b>
                        </div>
                        <p className="text-[11px] text-neutral-600 leading-relaxed">
                          Risk describes a mathematical chance before pregnancy. A diagnosis is a
                          confirmed clinical condition. Knowledge provides peace of mind.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3">
                    <button
                      type="button"
                      onClick={handleSaveToVault}
                      className="w-full py-3.5 bg-[#30ba78] hover:bg-[#90ebcd] text-[#0c322c] text-xs font-black rounded-2xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <span className="material-symbols-outlined text-sm">lock</span>
                      <span>Save Assessment in Clinical Vault</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIsMobileCentresOpen(true)}
                        className="py-2.5 px-3 bg-white hover:bg-neutral-50 text-[#0c322c] rounded-2xl border border-neutral-200 text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[#30ba78] text-sm">
                          pin_drop
                        </span>
                        <span>Screening Centres</span>
                      </button>

                      <button
                        type="button"
                        onClick={closeAssessment}
                        className="py-2.5 px-3 bg-white hover:bg-neutral-50 text-[#0c322c] rounded-2xl border border-neutral-200 text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer active:scale-95"
                      >
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        <span>Done & Return</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ==================== BOTTOM SHEET: SCREENING CENTRES ==================== */}
          {isMobileCentresOpen && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
              <div className="w-full max-h-[85vh] bg-white text-[#0c322c] rounded-t-3xl p-5 overflow-y-auto space-y-3.5 shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="w-12 h-1.5 rounded-full bg-neutral-300 mx-auto" />
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#30ba78] text-xl">
                      pin_drop
                    </span>
                    <b className="text-sm font-extrabold text-[#0c322c]">
                      Screening Centres in Abu Dhabi
                    </b>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileCentresOpen(false)}
                    className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                    <b className="text-[#30ba78] font-bold block">Abu Dhabi</b>
                    <p className="text-neutral-700 leading-relaxed">
                      Baniyas, Madinat Khalifa, Al Shamkha, Al Maqtaa, Al Bateen and Al Bahia
                      Healthcare Centers.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                    <b className="text-[#2453ff] font-bold block">Al Ain</b>
                    <p className="text-neutral-700 leading-relaxed">
                      Al Muwaiji, Al Maqam, Neima, Al Hayer, Al Quaa, Al Hili and Sweihan Healthcare
                      Centers; Oud Al Touba Diagnostic Center; Mezyad; Al Yahar.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                    <b className="text-[#fe7c3f] font-bold block">Al Dhafra Region</b>
                    <p className="text-neutral-700 leading-relaxed">
                      Al Dhafra Family Medicine Center; Ghiathy, Marfa, Al Sila, Delma and Liwa
                      Hospitals.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileCentresOpen(false)}
                  className="w-full py-2.5 bg-[#0c322c] text-white text-xs font-bold rounded-xl hover:bg-[#30ba78] hover:text-[#0c322c] transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* ==================== BOTTOM SHEET: FORMULA & METHODOLOGY ==================== */}
          {isMobileFormulaOpen && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
              <div className="w-full max-h-[85vh] bg-white text-[#0c322c] rounded-t-3xl p-5 overflow-y-auto space-y-3.5 shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="w-12 h-1.5 rounded-full bg-neutral-300 mx-auto" />
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#2453ff] text-xl">
                      functions
                    </span>
                    <b className="text-sm font-extrabold text-[#0c322c]">
                      How This Estimate is Worked Out
                    </b>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileFormulaOpen(false)}
                    className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>

                <div className="space-y-2.5 text-xs text-neutral-700 leading-relaxed">
                  <p>
                    Built on Wright’s inbreeding coefficient and a standard “lethal equivalents”
                    model.
                  </p>

                  <div className="space-y-2 pl-3 border-l-2 border-[#30ba78]">
                    <div>
                      <b className="text-[#0c322c] block">Step 1: Shared Ancestry (F)</b>
                      <span className="font-mono bg-neutral-100 px-1 py-0.5 rounded text-[10px] text-[#192072]">
                        F = Σ (½)<sup>n₁+n₂+1</sup> × (1 + F<sub>A</sub>)
                      </span>
                    </div>
                    <div>
                      <b className="text-[#0c322c] block">Step 2: Clinical Multiplier (L)</b>
                      <span className="font-mono bg-neutral-100 px-1 py-0.5 rounded text-[10px] text-[#192072]">
                        L = history × pregnancies × screening ≤ 3.0
                      </span>
                    </div>
                    <div>
                      <b className="text-[#0c322c] block">Step 3: Extra Kinship Risk</b>
                      <span className="font-mono bg-neutral-100 px-1 py-0.5 rounded text-[10px] text-[#192072]">
                        Extra = 1 − e<sup>−k·F·L</sup> (k = 0.487)
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                    <b>Note:</b> If both carry the same recessive condition, the chance is 1 in 4
                    (25%) per pregnancy.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileFormulaOpen(false)}
                  className="w-full py-2.5 bg-[#0c322c] text-white text-xs font-bold rounded-xl hover:bg-[#30ba78] hover:text-[#0c322c] transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
