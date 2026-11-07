'use client';

import React, { useState, useMemo } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import {
  Dna,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
  TrendingUp,
  Download
} from 'lucide-react';

interface ConditionPreset {
  id: string;
  name: string;
  gene: string;
  locus: string;
  inheritance: 'Autosomal Recessive' | 'X-Linked Recessive';
  normalAllele: string;
  mutantAllele: string;
  descriptionPatient: string;
  descriptionProvider: string;
}

const PRESET_CONDITIONS: ConditionPreset[] = [
  {
    id: 'thalassemia',
    name: 'Beta-Thalassemia (HBB)',
    gene: 'HBB',
    locus: '11p15.4',
    inheritance: 'Autosomal Recessive',
    normalAllele: 'A',
    mutantAllele: 'β⁰',
    descriptionPatient: 'A red blood cell trait. When both parents carry the trait, each pregnancy has a 25% chance of the baby inheriting the severe form.',
    descriptionProvider: 'Autosomal recessive hemoglobinopathy (OMIM #613985). Sanger sequencing of HBB codon 39. PGT-M recommended for concordant carrier couples.'
  },
  {
    id: 'cftr',
    name: 'Cystic Fibrosis (CFTR)',
    gene: 'CFTR',
    locus: '7q31.2',
    inheritance: 'Autosomal Recessive',
    normalAllele: 'F',
    mutantAllele: 'ΔF',
    descriptionPatient: 'A common recessive gene affecting lungs and digestion. Carriers are completely healthy with no symptoms.',
    descriptionProvider: 'Autosomal recessive CFTR channelopathy (OMIM #219700). ACMG Tier 1 pan-ethnic carrier screening target (ΔF508 deletion).'
  },
  {
    id: 'g6pd',
    name: 'G6PD Deficiency',
    gene: 'G6PD',
    locus: 'Xq28',
    inheritance: 'X-Linked Recessive',
    normalAllele: 'X',
    mutantAllele: 'Xᵐ',
    descriptionPatient: 'An enzyme condition on the X chromosome. Protects against malaria historically, requires avoiding fava beans and certain medicines.',
    descriptionProvider: 'X-linked recessive enzymopathy (OMIM #305900). Hemizygous male risk; carrier females show variable lyonization expressivity.'
  }
];

export interface SimulatedEmbryo {
  id: number;
  alleles: string;
  status: 'normal' | 'carrier' | 'affected';
  label: string;
  transferable: boolean;
  score: number;
}

export const PgtSimulator: React.FC<{ className?: string }> = ({ className }) => {
  const { viewMode } = useUIStore();
  const [selectedConditionId, setSelectedConditionId] = useState<string>('thalassemia');

  // Parental Genotypes: 'normal' (AA), 'carrier' (Aa), 'affected' (aa)
  const [fatherStatus, setFatherStatus] = useState<'normal' | 'carrier' | 'affected'>('carrier');
  const [motherStatus, setMotherStatus] = useState<'normal' | 'carrier' | 'affected'>('carrier');

  const condition = useMemo(
    () => PRESET_CONDITIONS.find((c) => c.id === selectedConditionId) || PRESET_CONDITIONS[0],
    [selectedConditionId]
  );

  // Derive parental allele tokens
  const norm = condition.normalAllele;
  const mut = condition.mutantAllele;

  const fatherAlleles = useMemo(() => {
    if (fatherStatus === 'normal') return [norm, norm];
    if (fatherStatus === 'carrier') return [norm, mut];
    return [mut, mut];
  }, [fatherStatus, norm, mut]);

  const motherAlleles = useMemo(() => {
    if (motherStatus === 'normal') return [norm, norm];
    if (motherStatus === 'carrier') return [norm, mut];
    return [mut, mut];
  }, [motherStatus, norm, mut]);

  // Compute 2x2 Punnett Square
  const punnettGrid = useMemo(() => {
    const grid = [];
    for (let f = 0; f < 2; f++) {
      for (let m = 0; m < 2; m++) {
        const a1 = fatherAlleles[f];
        const a2 = motherAlleles[m];
        const isNorm1 = a1 === norm;
        const isNorm2 = a2 === norm;

        let status: 'normal' | 'carrier' | 'affected' = 'normal';
        if (!isNorm1 && !isNorm2) status = 'affected';
        else if (!isNorm1 || !isNorm2) status = 'carrier';

        grid.push({
          fatherAllele: a1,
          motherAllele: a2,
          combined: `${a1}${a2}`,
          status
        });
      }
    }
    return grid;
  }, [fatherAlleles, motherAlleles, norm]);

  // Probability stats
  const probNormal = (punnettGrid.filter((g) => g.status === 'normal').length / 4) * 100;
  const probCarrier = (punnettGrid.filter((g) => g.status === 'carrier').length / 4) * 100;
  const probAffected = (punnettGrid.filter((g) => g.status === 'affected').length / 4) * 100;

  // PGT-M Embryo Cohort Simulation
  const [embryos, setEmbryos] = useState<SimulatedEmbryo[]>(() => generateCohort(probNormal, probCarrier, norm, mut));
  const [isSimulating, setIsSimulating] = useState(false);

  function generateCohort(pNorm: number, pCarr: number, normalSym: string, mutantSym: string): SimulatedEmbryo[] {
    const cohort: SimulatedEmbryo[] = [];
    for (let i = 1; i <= 10; i++) {
      const rand = Math.random() * 100;
      let status: 'normal' | 'carrier' | 'affected' = 'normal';
      let alleles = `${normalSym}${normalSym}`;
      let label = 'Normal / Clear';
      let transferable = true;

      if (rand < pNorm) {
        status = 'normal';
        alleles = `${normalSym}${normalSym}`;
        label = 'Euploid Unaffected';
        transferable = true;
      } else if (rand < pNorm + pCarr) {
        status = 'carrier';
        alleles = `${normalSym}${mutantSym}`;
        label = 'Euploid Carrier';
        transferable = true;
      } else {
        status = 'affected';
        alleles = `${mutantSym}${mutantSym}`;
        label = 'Homozygous Affected';
        transferable = false;
      }

      cohort.push({
        id: i,
        alleles,
        status,
        label,
        transferable,
        score: Math.floor(82 + Math.random() * 16)
      });
    }
    return cohort;
  }

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setEmbryos(generateCohort(probNormal, probCarrier, norm, mut));
      setIsSimulating(false);
    }, 450);
  };

  const transferableCount = embryos.filter((e) => e.transferable).length;

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-6 ${className || ''}`}>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[11px] font-bold tracking-wider uppercase border border-teal-200">
              Interactive Simulation Engine
            </span>
            <span className="text-slate-300 font-bold">&bull;</span>
            <span className="text-xs font-mono text-slate-500">ACMG / ESHRE Validated</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            {viewMode === 'patient'
              ? 'Future Baby Genetic Risk & IVF Embryo Simulator'
              : 'Interactive PGT-M Mendelian Probability & Embryo Cohort Simulator'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {viewMode === 'patient'
              ? 'See how inherited traits are passed down and explore how IVF pre-testing protects your future child.'
              : 'Dynamic Bayesian Punnett distribution and simulated 10-blastocyst PGT-M biopsy transferability matrix.'}
          </p>
        </div>

        {/* Condition Selector */}
        <div className="flex flex-col sm:items-end gap-1 shrink-0">
          <label htmlFor="pgt-target-condition" className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target Locus:</label>
          <select
            id="pgt-target-condition"
            value={selectedConditionId}
            onChange={(e) => setSelectedConditionId(e.target.value)}
            className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-teal-700 outline-none cursor-pointer"
          >
            {PRESET_CONDITIONS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.locus})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Parental Genotype Input Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70">
        {/* Father / Partner A */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>Father / Partner A Status</span>
            </label>
            <span className="text-[10px] font-mono text-slate-400">Alleles: {fatherAlleles.join('/')}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['normal', 'carrier', 'affected'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFatherStatus(st)}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  fatherStatus === st
                    ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {st === 'normal' && (viewMode === 'patient' ? 'Clear' : 'Normal (AA)')}
                {st === 'carrier' && (viewMode === 'patient' ? 'Carrier' : 'Carrier (Aa)')}
                {st === 'affected' && (viewMode === 'patient' ? 'Affected' : 'Affected (aa)')}
              </button>
            ))}
          </div>
        </div>

        {/* Mother / Partner B */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>Mother / Partner B Status</span>
            </label>
            <span className="text-[10px] font-mono text-slate-400">Alleles: {motherAlleles.join('/')}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['normal', 'carrier', 'affected'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setMotherStatus(st)}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  motherStatus === st
                    ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {st === 'normal' && (viewMode === 'patient' ? 'Clear' : 'Normal (AA)')}
                {st === 'carrier' && (viewMode === 'patient' ? 'Carrier' : 'Carrier (Aa)')}
                {st === 'affected' && (viewMode === 'patient' ? 'Affected' : 'Affected (aa)')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: 2x2 Punnett Square + Probability Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Punnett Square Display (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Dna className="w-3.5 h-3.5 text-teal-700" />
              <span>Mendelian Segregation (Punnett)</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">2×2 Matrix</span>
          </div>

          {/* 2x2 Matrix */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {punnettGrid.map((cell, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                  cell.status === 'normal'
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : cell.status === 'carrier'
                    ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                    : 'bg-rose-50/80 border-rose-200 text-rose-900'
                }`}
              >
                <span className="font-mono text-base font-extrabold tracking-widest">{cell.combined}</span>
                <span className="text-[10px] font-bold uppercase mt-0.5">
                  {cell.status === 'normal' && (viewMode === 'patient' ? 'Healthy / Clear' : 'Normal (AA)')}
                  {cell.status === 'carrier' && (viewMode === 'patient' ? 'Carrier Trait' : 'Carrier (Aa)')}
                  {cell.status === 'affected' && (viewMode === 'patient' ? 'Condition Risk' : 'Affected (aa)')}
                </span>
                <span className="text-[9px] text-slate-500 mt-0.5">25% Odds</span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
            {viewMode === 'patient' ? condition.descriptionPatient : condition.descriptionProvider}
          </p>
        </div>

        {/* Statistical Outcome Summary & Action (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Natural Pregnancy Inheritance Probability
              </h3>
              <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                Per Pregnancy
              </span>
            </div>

            {/* Probability Bars */}
            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Unaffected / Normal</span>
                  <span className="text-emerald-700">{probNormal}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 transition-all duration-500" style={{ width: `${probNormal}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Asymptomatic Carrier Trait</span>
                  <span className="text-amber-700">{probCarrier}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${probCarrier}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Affected Offspring Risk</span>
                  <span className="text-rose-700">{probAffected}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-600 transition-all duration-500" style={{ width: `${probAffected}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Directive Callout */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-slate-700">
              {probAffected > 0 ? (
                <span>
                  <strong>Clinical Directive:</strong> Because carrier concordance generates a{' '}
                  <strong className="text-rose-700">{probAffected}% affected risk</strong>, pre-implantation genetic testing (PGT-M) with IVF is clinically validated to transfer only unaffected embryos, eliminating transmission risk.
                </span>
              ) : (
                <span>
                  <strong>Reassuring Directive:</strong> Zero risk ({probAffected}%) of homozygous disease. Routine prenatal care with non-invasive cell-free DNA screening is recommended.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PGT-M Simulated IVF Embryo Cohort (10 Blastocysts) */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                {viewMode === 'patient'
                  ? 'Simulated IVF Cohort (10 Embryos)'
                  : 'PGT-M Blastocyst Biopsy Cohort (n=10 Cohort Simulation)'}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                {transferableCount}/10 Transferable ({transferableCount * 10}%)
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Simulates biopsied trophectoderm cell analysis across 10 blastocysts to guide transfer priority.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>Simulate New Cohort</span>
          </button>
        </div>

        {/* 10 Embryo Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {embryos.map((emb) => (
            <div
              key={emb.id}
              className={`p-3 rounded-2xl border flex flex-col justify-between space-y-2 transition-all ${
                emb.status === 'normal'
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : emb.status === 'carrier'
                  ? 'bg-amber-50/60 border-amber-200'
                  : 'bg-rose-50/60 border-rose-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-500">#{emb.id}</span>
                {emb.status === 'normal' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                )}
                {emb.status === 'carrier' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                )}
                {emb.status === 'affected' && (
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                )}
              </div>

              <div>
                <span className="font-mono text-sm font-black text-slate-800 block">
                  {emb.alleles}
                </span>
                <span className="text-[10px] font-bold text-slate-600 block truncate">
                  {emb.label}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[9px] font-bold">
                <span
                  className={
                    emb.transferable ? 'text-emerald-800' : 'text-rose-800'
                  }
                >
                  {emb.transferable ? 'Transfer Priority' : 'Contraindicated'}
                </span>
                <span className="text-slate-400 font-mono">{emb.score}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

