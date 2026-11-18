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
} from '../_constants';
import { formatPct } from '../_utils';
import { DotGrid100 } from './shared/DotGrid100';

export function DesktopLoginView() {
  const { estimator, auth } = useLoginContext();
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
    flippedTiles,
    toggleTile,
    isFormulaExpanded,
    setIsFormulaExpanded,
    uploadedDocs,
    addUploadedDoc,
    removeUploadedDoc,
    handleResetEstimator,
    assessment,
  } = estimator;

  const handleSaveAssessment = React.useCallback(() => {
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
      documents: uploadedDocs,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('ga_pending_guest_assessment', JSON.stringify(payload));
    }
    auth.openAuth('register');
  }, [gender, relStatus, relIdx, genIdx, histIdx, pregIdx, scrIdx, sameCarrier, assessment, uploadedDocs, auth]);

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

  return (
    <>
      <div className="hidden lg:grid grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Questionnaire seeking input from user */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-2xl shadow-md border border-neutral-200 flex flex-col justify-between h-full space-y-6">
          <div className="space-y-6">
            {/* Questionnaire Header & Start Again Button */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#30ba78] text-lg">tune</span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#0c322c]">
                  Kinship Questionnaire (5 Steps)
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetEstimator}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#efefef] text-[#0c322c] hover:bg-[#90ebcd]/40 border border-neutral-300 hover:border-[#30ba78] transition-all cursor-pointer shadow-xs"
                title="Clear all inputs and results to start again"
              >
                <span className="material-symbols-outlined text-sm text-[#fe7c3f]">restart_alt</span>
                <span>Start Again</span>
              </button>
            </div>

            {/* Demographics & Relationship Status (Questions 1 & 2) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-neutral-100">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0c322c] flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-[#2453ff]">person</span>
                  <span>Biological Sex</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {GENDER_OPTIONS.map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setGender(val as 'male' | 'female')}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-bold text-center transition-all cursor-pointer ${
                        gender === val
                          ? 'bg-[#0c322c] text-white border-[#30ba78] ring-1 ring-[#30ba78]'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:border-[#30ba78]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0c322c] flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-[#fe7c3f]">favorite</span>
                  <span>Relationship Status</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {RELATIONSHIP_STATUS_OPTIONS.map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRelStatus(val as 'planning' | 'married')}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-bold text-center transition-all cursor-pointer ${
                        relStatus === val
                          ? 'bg-[#0c322c] text-white border-[#30ba78] ring-1 ring-[#30ba78]'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:border-[#30ba78]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* STEP 1: Consanguinity */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-bold text-[#0c322c]">
                  1. How are you and your partner related?
                </h3>
                <span className="text-[10px] text-neutral-400 font-semibold">Step 1 of 5</span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Father’s side or mother’s side makes no difference to the calculation.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {RELATIONSHIPS.map(([key, title, desc], idx) => {
                  const isSelected = relIdx === idx;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setRelIdx(idx)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#0c322c] text-white border-[#30ba78] ring-2 ring-[#30ba78]/30 shadow-xs'
                          : 'bg-white text-[#0c322c] border-neutral-200 hover:border-[#30ba78]'
                      }`}
                    >
                      <div className="pr-2 min-w-0">
                        <p
                          className={`text-xs sm:text-sm font-bold leading-snug ${
                            isSelected ? 'text-white' : 'text-[#0c322c]'
                          }`}
                        >
                          {title}
                        </p>
                        {desc && (
                          <p
                            className={`text-[11px] mt-1 leading-relaxed ${
                              isSelected ? 'text-[#90ebcd]' : 'text-neutral-500'
                            }`}
                          >
                            {desc}
                          </p>
                        )}
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-[#30ba78] text-[#0c322c]'
                            : 'bg-neutral-100 text-neutral-400'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {isSelected ? 'check' : ''}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: Amplified Risk / Earlier Generations */}
            <div className="pt-4 border-t border-neutral-100 space-y-2">
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-bold text-[#0c322c]">
                  2. Has marriage between relatives happened in earlier generations?
                </h3>
                <span className="text-[10px] text-neutral-400 font-semibold">Step 2 of 5</span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Assesses <b>generational genetic overlap</b> (e.g. were your grandparents also
                cousins?), which can amplify shared hereditary factors.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {EARLIER_GENERATIONS.map(([key, label, desc], idx) => {
                  const isSelected = genIdx === idx;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setGenIdx(idx)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#0c322c] text-white border-[#30ba78] ring-1 ring-[#30ba78]'
                          : 'bg-white text-[#0c322c] border-neutral-200 hover:border-[#30ba78]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold leading-tight">{label}</span>
                          {isSelected && (
                            <span className="material-symbols-outlined text-xs text-[#30ba78]">
                              check_circle
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[10px] mt-1 leading-tight ${
                            isSelected ? 'text-[#90ebcd]' : 'text-neutral-500'
                          }`}
                        >
                          {desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 3: Family History */}
            <div className="pt-4 border-t border-neutral-100 space-y-2">
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-bold text-[#0c322c]">
                  3. Is there an inherited condition in either family?
                </h3>
                <span className="text-[10px] text-neutral-400 font-semibold">Step 3 of 5</span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Common UAE genetic conditions to consider: <b>Beta-Thalassemia</b>,{' '}
                <b>Sickle Cell Disease</b>, <b>Cystic Fibrosis</b>,{' '}
                <b>Spinal Muscular Atrophy (SMA)</b>, or unexplained infant loss.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {FAMILY_HISTORY.map(([key, label, desc], idx) => {
                  const isSelected = histIdx === idx;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setHistIdx(idx)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#0c322c] text-white border-[#30ba78] ring-1 ring-[#30ba78]'
                          : 'bg-white text-[#0c322c] border-neutral-200 hover:border-[#30ba78]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold leading-tight">{label}</span>
                          {isSelected && (
                            <span className="material-symbols-outlined text-xs text-[#30ba78]">
                              check_circle
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[10px] mt-1 leading-tight ${
                            isSelected ? 'text-[#90ebcd]' : 'text-neutral-500'
                          }`}
                        >
                          {desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 4: Past Pregnancies */}
            <div className="pt-4 border-t border-neutral-100 space-y-2">
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-bold text-[#0c322c]">4. Past pregnancies</h3>
                <span className="text-[10px] text-neutral-400 font-semibold">Step 4 of 5</span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Any history of repeated miscarriages or unexplained early child illness.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {PAST_PREGNANCIES.map(([key, label], idx) => {
                  const isSelected = pregIdx === idx;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPregIdx(idx)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#0c322c] text-white border-[#30ba78] ring-1 ring-[#30ba78]'
                          : 'bg-white text-[#0c322c] border-neutral-200 hover:border-[#30ba78]'
                      }`}
                    >
                      <span className="text-xs font-semibold pr-2 leading-tight">{label}</span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-xs text-[#30ba78] shrink-0">
                          check_circle
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 5: Premarital or Carrier Screening */}
            <div className="pt-4 border-t border-neutral-100 space-y-2">
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-bold text-[#0c322c]">
                  5. Premarital or carrier screening
                </h3>
                <span className="text-[10px] text-neutral-400 font-semibold">Step 5 of 5</span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Have both partners completed official genetic carrier panel tests?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {SCREENING_STATUS.map(([key, label], idx) => {
                  const isSelected = scrIdx === idx;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setScrIdx(idx)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#0c322c] text-white border-[#30ba78] ring-1 ring-[#30ba78]'
                          : 'bg-white text-[#0c322c] border-neutral-200 hover:border-[#30ba78]'
                      }`}
                    >
                      <span className="text-xs font-semibold pr-2 leading-tight">{label}</span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-xs text-[#30ba78] shrink-0">
                          check_circle
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Recessive match checkbox */}
              <label className="flex items-start gap-3 p-3 mt-3 rounded-xl border border-[#fe7c3f]/40 bg-[#fe7c3f]/5 cursor-pointer hover:bg-[#fe7c3f]/10 transition-colors">
                <input
                  type="checkbox"
                  checked={sameCarrier}
                  onChange={(e) => setSameCarrier(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-[#fe7c3f] rounded cursor-pointer"
                />
                <span className="text-xs font-semibold text-[#0c322c] leading-tight">
                  A doctor or lab told us we <b>both carry the same</b> recessive condition (e.g.
                  Beta-Thalassemia, Sickle Cell, SMA).
                </span>
              </label>

              {/* Optional Document Attachment */}
              <div className="pt-4 border-t border-neutral-100 space-y-2 mt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#30ba78]">upload_file</span>
                    <h3 className="text-xs font-bold text-[#0c322c]">
                      Attach Medical Report (Optional)
                    </h3>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    Vault Pre-load
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Attach premarital screening results or a lab PDF to save into your vault.
                </p>
                <div className="border border-dashed border-neutral-300 hover:border-[#30ba78] rounded-xl p-3 bg-neutral-50/70 transition-colors space-y-2">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-neutral-300 hover:border-[#30ba78] text-xs font-bold text-[#0c322c] shadow-2xs">
                      <span className="material-symbols-outlined text-sm text-[#30ba78]">attach_file</span>
                      <span>Upload from Device</span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg,.txt"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            addUploadedDoc({
                              file_name: file.name,
                              file_url: `/data/documents/${file.name}`,
                              owner_type: 'self'
                            });
                          }
                        }}
                      />
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-neutral-400 font-semibold">Sample files:</span>
                      <button
                        type="button"
                        onClick={() => addUploadedDoc({
                          file_name: 'Premarital_CBC_Report.pdf',
                          file_url: '/data/documents/Premarital_CBC_Report.pdf',
                          owner_type: 'self'
                        })}
                        className="px-2 py-0.5 rounded bg-white hover:bg-emerald-50 text-neutral-700 hover:text-emerald-800 border border-neutral-200 text-[10px] font-bold shadow-2xs cursor-pointer"
                      >
                        + Premarital CBC
                      </button>
                      <button
                        type="button"
                        onClick={() => addUploadedDoc({
                          file_name: 'Carrier_Screen_Thalassemia.pdf',
                          file_url: '/data/documents/Carrier_Screen_Thalassemia.pdf',
                          owner_type: 'self'
                        })}
                        className="px-2 py-0.5 rounded bg-white hover:bg-emerald-50 text-neutral-700 hover:text-emerald-800 border border-neutral-200 text-[10px] font-bold shadow-2xs cursor-pointer"
                      >
                        + Hemoglobin Assay
                      </button>
                    </div>
                  </div>

                  {uploadedDocs && uploadedDocs.length > 0 && (
                    <div className="pt-2 border-t border-neutral-200 space-y-1">
                      {uploadedDocs.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white px-2.5 py-1 rounded-lg border border-neutral-200 text-xs">
                          <span className="font-semibold text-[#0c322c] truncate max-w-[260px] flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-xs text-[#30ba78]">description</span>
                            {doc.file_name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeUploadedDoc(doc.file_name)}
                            className="text-rose-600 hover:text-rose-800 font-bold text-[11px] cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Computed Results, Flip Tiles, 100 Dots Pictogram, Next Steps */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#192072] to-[#0c322c] text-white p-6 sm:p-7 rounded-2xl shadow-xl border border-[#2453ff]/40 flex flex-col justify-between h-full space-y-6">
          <div className="space-y-6">
            <div className="space-y-1 border-b border-white/10 pb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#90ebcd]">
                {isStarted ? 'Your Clinical Estimate' : 'Awaiting Kinship Selections'}
              </span>
              <p className="text-xs text-[#efefef]">
                Extra chance, because of the family link, that a child has a serious inherited
                condition:
              </p>
              <div className="text-3xl sm:text-4xl font-black text-[#30ba78] pt-1">
                {!isStarted
                  ? '—'
                  : currentF === 0 && !sameCarrier
                  ? 'No extra risk from relatedness'
                  : `about ${formatPct(currentExtra)} extra`}
              </div>
              {isStarted && currentF > 0 && !sameCarrier && (
                <p className="text-[11px] text-neutral-300">
                  Likely range: {formatPct(rangeLo)} to {formatPct(rangeHi)} extra
                </p>
              )}
              {!isStarted && (
                <p className="text-[11px] text-neutral-300">
                  Select your relationship on the left to calculate range
                </p>
              )}
              <p className="text-[11px] text-[#90ebcd] leading-snug pt-1.5 font-medium border-t border-white/10 mt-2">
                This denotes the estimated extra likelihood—beyond the general ~3% natural baseline
                that applies to all couples worldwide—that a child may inherit a serious genetic
                condition due to shared family ancestry.
              </p>
            </div>

            {/* Four Data Metric Cells (Interactive Flip Cards) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Tile 1: F */}
              <div
                onClick={() => toggleTile('f')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') toggleTile('f');
                }}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer min-h-[96px] flex flex-col justify-between select-none relative group"
                title="Click to flip and read explanation"
              >
                {!flippedTiles['f'] ? (
                  <>
                    <div>
                      <b className="text-lg font-black text-[#90ebcd]">
                        {!isStarted
                          ? '—'
                          : currentF === 0
                          ? '0'
                          : currentF <= 0.005
                          ? '< 1/200'
                          : `1/${Math.round(1 / currentF)}`}
                      </b>
                      <p className="text-[10px] text-neutral-300 font-medium">
                        Shared-ancestry level (F)
                      </p>
                    </div>
                    <span className="text-[9px] text-[#90ebcd]/70 group-hover:text-[#90ebcd] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[11px]">flip</span>
                      <span>Click to learn more</span>
                    </span>
                  </>
                ) : (
                  <div className="text-[10px] text-[#efefef] leading-tight space-y-1">
                    <b className="text-[#90ebcd] block text-[11px]">Shared Ancestry (F)</b>
                    <p className="text-[10px] text-neutral-200">
                      Wright’s inbreeding coefficient. Measures the proportion of genes a child
                      inherits that are identical from common ancestors.
                    </p>
                    <span className="text-[9px] text-neutral-400 block pt-0.5">Click to flip back</span>
                  </div>
                )}
              </div>

              {/* Tile 2: L */}
              <div
                onClick={() => toggleTile('l')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') toggleTile('l');
                }}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer min-h-[96px] flex flex-col justify-between select-none relative group"
                title="Click to flip and read explanation"
              >
                {!flippedTiles['l'] ? (
                  <>
                    <div>
                      <b className="text-lg font-black text-[#30ba78]">
                        {!isStarted ? '—' : `×${currentL.toFixed(2)}`}
                      </b>
                      <p className="text-[10px] text-neutral-300 font-medium">Family multiplier (L)</p>
                    </div>
                    <span className="text-[9px] text-[#30ba78]/70 group-hover:text-[#30ba78] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[11px]">flip</span>
                      <span>Click to learn more</span>
                    </span>
                  </>
                ) : (
                  <div className="text-[10px] text-[#efefef] leading-tight space-y-1">
                    <b className="text-[#30ba78] block text-[11px]">Family Multiplier (L)</b>
                    <p className="text-[10px] text-neutral-200">
                      Clinical weight adjusting risk based on reported family conditions,
                      miscarriages, or premarital carrier screening.
                    </p>
                    <span className="text-[9px] text-neutral-400 block pt-0.5">Click to flip back</span>
                  </div>
                )}
              </div>

              {/* Tile 3: Total Chance */}
              <div
                onClick={() => toggleTile('tot')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') toggleTile('tot');
                }}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer min-h-[96px] flex flex-col justify-between select-none relative group"
                title="Click to flip and read explanation"
              >
                {!flippedTiles['tot'] ? (
                  <>
                    <div>
                      <b className="text-lg font-black text-white">
                        {!isStarted ? '~3.0% (Baseline)' : `about ${formatPct(totalChance)}`}
                      </b>
                      <p className="text-[10px] text-neutral-300 font-medium">
                        Total chance (w/ ~3% baseline)
                      </p>
                    </div>
                    <span className="text-[9px] text-white/70 group-hover:text-white flex items-center gap-1">
                      <span className="material-symbols-outlined text-[11px]">flip</span>
                      <span>Click to learn more</span>
                    </span>
                  </>
                ) : (
                  <div className="text-[10px] text-[#efefef] leading-tight space-y-1">
                    <b className="text-white block text-[11px]">Total Combined Chance</b>
                    <p className="text-[10px] text-neutral-200">
                      The overall chance, combining the natural ~3% general population baseline that
                      applies to all couples with the family link.
                    </p>
                    <span className="text-[9px] text-neutral-400 block pt-0.5">Click to flip back</span>
                  </div>
                )}
              </div>

              {/* Tile 4: 1 child in N */}
              <div
                onClick={() => toggleTile('oneIn')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') toggleTile('oneIn');
                }}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer min-h-[96px] flex flex-col justify-between select-none relative group"
                title="Click to flip and read explanation"
              >
                {!flippedTiles['oneIn'] ? (
                  <>
                    <div>
                      <b className="text-lg font-black text-[#fe7c3f]">
                        {!isStarted ? '1 in 33 (Baseline)' : `1 in ${oneInCount}`}
                      </b>
                      <p className="text-[10px] text-neutral-300 font-medium">Roughly, 1 child in</p>
                    </div>
                    <span className="text-[9px] text-[#fe7c3f]/70 group-hover:text-[#fe7c3f] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[11px]">flip</span>
                      <span>Click to learn more</span>
                    </span>
                  </>
                ) : (
                  <div className="text-[10px] text-[#efefef] leading-tight space-y-1">
                    <b className="text-[#fe7c3f] block text-[11px]">Frequency Perspective</b>
                    <p className="text-[10px] text-neutral-200">
                      Statistical frequency: roughly 1 child out of every{' '}
                      {isStarted ? oneInCount : 33} born to couples with this background may be
                      affected.
                    </p>
                    <span className="text-[9px] text-neutral-400 block pt-0.5">Click to flip back</span>
                  </div>
                )}
              </div>
            </div>

            {/* 100 Children Dot Grid */}
            <DotGrid100
              variant="desktop"
              isStarted={isStarted}
              sameCarrier={sameCarrier}
              currentExtra={currentExtra}
            />

            {/* Risk Band Banner */}
            <div
              className={`p-4 rounded-xl text-xs space-y-1.5 border transition-all ${
                riskBandLevel === 'ok'
                  ? 'bg-white/10 border-white/20 text-[#efefef]'
                  : riskBandLevel === 'mid'
                  ? 'bg-[#fe7c3f]/20 border-[#fe7c3f]/50 text-white'
                  : 'bg-[#fe7c3f]/30 border-[#fe7c3f] text-white shadow-lg'
              }`}
            >
              <p className="font-bold text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">
                  {riskBandLevel === 'ok'
                    ? 'check_circle'
                    : riskBandLevel === 'mid'
                    ? 'info'
                    : 'warning'}
                </span>
                <span>{riskBandTitle}</span>
              </p>
              <p className="text-[11px] leading-relaxed">{riskBandDesc}</p>
            </div>

            {/* Sensible Next Steps */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <b className="text-xs font-bold text-white flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-[#30ba78]">checklist</span>
                <span>Sensible next steps:</span>
              </b>
              <ul className="text-[11px] text-[#efefef] space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>
                  Complete premarital screening for both partners (Thalassemia, Sickle Cell, G6PD).
                </li>
                <li>
                  Schedule a genetic counseling review to draw your official 3-generation pedigree tree.
                </li>
                <li>
                  Record any inherited conditions or early child illness in either family before consulting.
                </li>
                <li>Once pregnant, consult about early scans and non-invasive prenatal testing (NIPT).</li>
              </ul>
            </div>
          </div>

          {/* Save / Access in Vault CTA */}
          <button
            type="button"
            onClick={handleSaveAssessment}
            className="w-full py-3 rounded-xl bg-[#30ba78] hover:bg-[#90ebcd] text-[#0c322c] text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg mt-4"
          >
            <span>Save Assessment in Clinical Vault</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* ==================== 4B. CALCULATION FORMULA & EDUCATIONAL ACCORDION ==================== */}
      <div className="mt-8 border border-neutral-300 rounded-2xl bg-white shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setIsFormulaExpanded(!isFormulaExpanded)}
          className="w-full p-4 sm:p-5 flex items-center justify-between bg-neutral-50 hover:bg-neutral-100/80 transition-colors text-left cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#192072]/10 flex items-center justify-center text-[#192072]">
              <span className="material-symbols-outlined text-base text-[#2453ff]">functions</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0c322c]">How this estimate is worked out</h3>
              <p className="text-[11px] text-neutral-500">
                Wright’s inbreeding coefficient, lethal equivalents model, and clinical multipliers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#192072]">
            <span>{isFormulaExpanded ? 'Collapse formula' : 'Expand formula'}</span>
            <span
              className={`material-symbols-outlined text-base transition-transform duration-200 ${
                isFormulaExpanded ? 'rotate-180' : ''
              }`}
            >
              expand_more
            </span>
          </div>
        </button>

        {isFormulaExpanded && (
          <div className="p-5 sm:p-6 text-xs text-[#0c322c] space-y-4 border-t border-neutral-200 bg-white leading-relaxed animate-in fade-in duration-200">
            <p className="text-neutral-700">
              This is a simple method I designed for clarity. It builds on Wright’s inbreeding
              coefficient and a standard “lethal equivalents” model.
            </p>

            <div className="space-y-3 pl-3.5 border-l-2 border-[#30ba78]">
              <div>
                <b className="font-bold text-[#0c322c]">Step 1, shared ancestry:</b>{' '}
                <span className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-[11px] text-[#192072]">
                  F = Σ (½)<sup>n₁+n₂+1</sup> × (1 + F<sub>A</sub>)
                </span>{' '}
                summed over every shared ancestor, where n₁ and n₂ are generations from each
                partner, and F<sub>A</sub> is the ancestors’ own inbreeding (step 2).
              </div>

              <div>
                <b className="font-bold text-[#0c322c]">Step 2, family multiplier:</b>{' '}
                <span className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-[11px] text-[#192072]">
                  L = history × pregnancies × screening
                </span>
                , limited to a maximum of 3. Family history of an inherited condition counts ×1.8
                (×1.2 if unsure), repeated pregnancy loss or an unexplained child illness ×1.5, and
                a clear screening result ×0.7.
              </div>

              <div>
                <b className="font-bold text-[#0c322c]">Step 3, extra risk:</b>{' '}
                <span className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-[11px] text-[#192072]">
                  Extra = 1 − e<sup>−k·F·L</sup>
                </span>{' '}
                with k = 0.49. I chose k so that first cousins with L = 1 give about 3 percentage
                points of extra risk, in line with published studies. The range shown uses L × 0.6
                to L × 1.5.
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
              <b className="font-bold text-amber-950">Important:</b> the multipliers are
              judgment-based estimates, not validated clinical values. If you both carry the same
              recessive condition, the answer is not an estimate: each pregnancy has a 1 in 4 chance
              of being affected.
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-[#30ba78]/30 text-emerald-950 text-[11px] leading-relaxed">
              <b className="font-bold text-[#0c322c]">Educational Notice:</b> Educational tool only,
              not medical advice. It can’t see your actual genes. Relatives marrying does not mean
              children will have a condition: most children of cousins are healthy. A genetic
              counsellor can review your real family tree.
            </div>
          </div>
        )}
      </div>

      {/* ==================== 4C. WHAT DOES MY RESULT MEAN? ==================== */}
      <div className="mt-8 p-6 sm:p-7 rounded-2xl bg-white border border-neutral-300 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
          <span className="material-symbols-outlined text-[#30ba78] text-xl">help</span>
          <h3 className="text-base sm:text-lg font-bold text-[#0c322c]">What does my result mean?</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
            <b className="text-xs font-bold text-[#0c322c] block">Carrier</b>
            <p className="text-xs text-neutral-600 leading-relaxed">
              You carry a gene change but are usually healthy. Many people are carriers of at least
              one.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
            <b className="text-xs font-bold text-[#0c322c] block">Couple-level risk</b>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Whether you and your partner carry changes in the same gene, which affects the chance
              for a child.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
            <b className="text-xs font-bold text-[#0c322c] block">Possible child risk</b>
            <p className="text-xs text-neutral-600 leading-relaxed">
              A probability, not a prediction. Many couples with a higher chance have healthy
              children.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
            <b className="text-xs font-bold text-[#0c322c] block">Risk vs. diagnosis</b>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Risk describes a chance. A diagnosis means a condition is present.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

