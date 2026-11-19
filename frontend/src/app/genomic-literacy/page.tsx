'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { useUIStore } from '@/stores/useUIStore';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Heart,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
  Stethoscope,
  HelpCircle,
  Dna
} from 'lucide-react';

interface Condition {
  id?: number;
  slug: string;
  name: string;
  category: string;
  plain_summary: string;
  next_steps_info: string;
}

const DEFAULT_CONDITIONS: Condition[] = [
  {
    slug: 'beta-thalassemia',
    name: 'Beta-Thalassemia',
    category: 'Blood Condition',
    plain_summary: 'An inherited blood condition affecting hemoglobin. Healthy carriers live completely normal lives; pre-marital screening helps couples plan safely.',
    next_steps_info: 'A routine blood test (CBC with hemoglobin electrophoresis) checks carrier status. If both partners carry the trait, genetic counseling and PGT-M or prenatal screening provide clear pathways for having healthy children.'
  },
  {
    slug: 'sickle-cell-disease',
    name: 'Sickle Cell Disease',
    category: 'Blood Condition',
    plain_summary: 'Red blood cells can become crescent-shaped. Carrier status is completely healthy and common in the UAE.',
    next_steps_info: 'Carrier testing is standard in UAE pre-marital screening. Couples who both carry the trait have a 75% chance in each pregnancy of having a child without the condition, with safe medical choices available.'
  },
  {
    slug: 'g6pd-deficiency',
    name: 'G6PD Deficiency (Favism)',
    category: 'Enzyme Trait',
    plain_summary: 'A common enzyme trait where red blood cells are sensitive to fava beans and certain medications.',
    next_steps_info: 'Simple dietary awareness (avoiding fava beans and specific antibiotics) ensures full, vibrant health. Screening confirms which foods to avoid.'
  },
  {
    slug: 'spinal-muscular-atrophy',
    name: 'Spinal Muscular Atrophy (SMA)',
    category: 'Neuromuscular Trait',
    plain_summary: 'A rare inherited condition affecting motor nerves. Healthy carriers experience no symptoms whatsoever.',
    next_steps_info: 'Routine DNA carrier screening detects SMA carrier status with 95%+ accuracy. If both partners carry it, IVF with PGT-M allows parents to select unaffected embryos.'
  },
  {
    slug: 'cystic-fibrosis',
    name: 'Cystic Fibrosis',
    category: 'Respiratory & Digestive Trait',
    plain_summary: 'An inherited condition affecting mucus and sweat glands. Single-gene carriers have zero symptoms and normal vitality.',
    next_steps_info: 'Standard carrier testing checks common CF mutations. Modern family planning options give carrier couples complete reassurance.'
  },
  {
    slug: 'familial-hypercholesterolemia',
    name: 'Familial Hypercholesterolemia (FH)',
    category: 'Metabolic & Cardiovascular',
    plain_summary: 'An inherited condition causing high LDL cholesterol from a young age, easily managed with early routine care.',
    next_steps_info: 'A simple lipid blood test identifies elevated cholesterol early. Highly effective lifestyle steps and gentle medications keep the heart completely healthy.'
  }
];

export default function GenomicLiteracyPage() {
  const { activeLocale } = useUIStore();
  const [conditions, setConditions] = useState<Condition[]>(DEFAULT_CONDITIONS);
  const [expandedCondition, setExpandedCondition] = useState<string | null>(null);
  const [activeGuideTab, setActiveGuideTab] = useState<'carrier' | 'consanguinity' | 'choices' | 'myths'>('carrier');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    fetch('/api/patient/conditions')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.conditions && data.conditions.length > 0) {
          setConditions(data.conditions);
        }
      })
      .catch(() => {});
  }, []);

  const toggleAccordion = (slug: string) => {
    setExpandedCondition((prev) => (prev === slug ? null : slug));
  };

  const categories = ['all', ...Array.from(new Set(conditions.map((c) => c.category)))];
  const filteredConditions = filterCategory === 'all'
    ? conditions
    : conditions.filter((c) => c.category === filterCategory);

  return (
    <AuthGuard>
      <div className="flex h-screen bg-fog overflow-hidden font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full pb-24 md:pb-12">
            {/* Header Banner */}
            <div className="rounded-3xl bg-gradient-to-br from-teal-950 via-teal-900 to-slate-900 text-white p-6 sm:p-8 shadow-sm border border-teal-800/40 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-teal-800/80 text-teal-200 text-xs font-bold uppercase tracking-wider border border-teal-500/30">
                  Genomic Literacy
                </span>
                <span className="text-teal-300 text-xs font-semibold">&bull; UAE Healthcare Standards</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Genetics Made Simple &amp; Calm
              </h1>
              <p className="text-teal-100/90 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Clear, plain-language answers about carrier traits, family inheritance, and safe medical choices. No medical jargon — just empowering clarity for you and your family.
              </p>
            </div>

            {/* Foundational Knowledge Guides (4 Tabs) */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-sm">
                    <BookOpen className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Foundational Guides</h2>
                    <p className="text-xs text-slate-500">Tap a topic to understand how inheritance works</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setActiveGuideTab('carrier')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      activeGuideTab === 'carrier'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    What is a Carrier?
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveGuideTab('consanguinity')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      activeGuideTab === 'consanguinity'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Related Marriages
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveGuideTab('choices')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      activeGuideTab === 'choices'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Your Choices
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveGuideTab('myths')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      activeGuideTab === 'myths'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Myth vs. Fact
                  </button>
                </div>
              </div>

              {/* Guide Content Display */}
              <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 text-xs text-slate-700 leading-relaxed">
                {activeGuideTab === 'carrier' && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-teal-800 text-white flex items-center justify-center text-xs">1</span>
                      What does having a &quot;Carrier Trait&quot; actually mean?
                    </h3>
                    <p>
                      Think of your genes as two matching instruction manuals &mdash; one inherited from your mother and one from your father.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-emerald-800 block text-xs">✅ You are completely healthy</span>
                        <span className="text-[11px] text-slate-600 leading-normal block">
                          Because you have a healthy working copy of the gene, you will not experience symptoms, fall sick, or have reduced vitality.
                        </span>
                      </div>
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-teal-800 block text-xs">👶 What about future children?</span>
                        <span className="text-[11px] text-slate-600 leading-normal block">
                          A child can only develop an autosomal recessive condition if <strong>both parents</strong> carry the exact same trait. If only one parent carries it, your child cannot have the disease.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeGuideTab === 'consanguinity' && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-teal-800 text-white flex items-center justify-center text-xs">2</span>
                      Marrying a Relative (Consanguinity &amp; First Cousins)
                    </h3>
                    <p>
                      In the UAE and the wider region, marriages between relatives are deeply rooted in family tradition and respect. Scientifically:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-emerald-800 block text-xs">🌟 Over 95%+ of babies are completely healthy</span>
                        <span className="text-[11px] text-slate-600 leading-normal block">
                          The vast majority of pregnancies between first cousins result in normal, thriving, healthy children.
                        </span>
                      </div>
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-teal-800 block text-xs">🔬 Why routine screening provides peace of mind</span>
                        <span className="text-[11px] text-slate-600 leading-normal block">
                          Because relatives share common ancestors, there is a slightly higher chance of sharing the same recessive trait. Routine screening gives total clarity beforehand.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeGuideTab === 'choices' && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-teal-800 text-white flex items-center justify-center text-xs">3</span>
                      Empowering Choices: What if both partners carry the same trait?
                    </h3>
                    <p>
                      If pre-marital screening shows both partners carry the same trait, modern UAE healthcare provides multiple safe, non-judgmental options:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-900 block text-xs">1. IVF with PGT-M</span>
                        <span className="text-[11px] text-slate-600 leading-normal block">
                          Embryos are checked before pregnancy, allowing parents to transfer only unaffected embryos for a guaranteed healthy baby.
                        </span>
                      </div>
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-900 block text-xs">2. Prenatal Testing (NIPT)</span>
                        <span className="text-[11px] text-slate-600 leading-normal block">
                          Safe maternal blood checks during early pregnancy provide complete information and peace of mind.
                        </span>
                      </div>
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-900 block text-xs">3. Early Pediatric Care</span>
                        <span className="text-[11px] text-slate-600 leading-normal block">
                          Knowing in advance ensures specialized pediatric care and preventative therapies from day one.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeGuideTab === 'myths' && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-teal-800 text-white flex items-center justify-center text-xs">4</span>
                      Common Genetic Myths Debunked
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs">
                          <span>❌ Myth:</span>
                          <span className="text-slate-800">&ldquo;If I feel healthy, I cannot be a carrier.&rdquo;</span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          <strong>Fact:</strong> Carriers almost always feel 100% healthy! Carrier status does not affect physical stamina, sports, or diet.
                        </p>
                      </div>

                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs">
                          <span>❌ Myth:</span>
                          <span className="text-slate-800">&ldquo;Genetic screening brings only bad news.&rdquo;</span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          <strong>Fact:</strong> Screening is preventative and reassuring. Most results confirm compatibility, and for traits found, effective solutions exist.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* UAE-Relevant Conditions Accordion Cards */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-sm">
                    <Dna className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      UAE-Relevant Conditions Guide
                    </h2>
                    <p className="text-xs text-slate-500">
                      Tap any card to view clear next steps &amp; screening guidance
                    </p>
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFilterCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer capitalize ${
                        filterCategory === cat
                          ? 'bg-teal-800 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat === 'all' ? 'All Conditions' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accordion Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredConditions.map((condition) => {
                  const isExpanded = expandedCondition === condition.slug;
                  return (
                    <div
                      key={condition.slug}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        isExpanded
                          ? 'bg-teal-50/40 border-teal-300 shadow-xs'
                          : 'bg-white border-slate-200/90 hover:border-slate-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleAccordion(condition.slug)}
                        className="w-full p-4 text-left flex items-start justify-between gap-3 cursor-pointer"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-slate-900">
                              {condition.name}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                              {condition.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-snug">
                            {condition.plain_summary}
                          </p>
                        </div>

                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-teal-800" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </button>

                      {/* Expandable Next Steps */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-teal-200/60 space-y-2 bg-white/70">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Clear Next Steps &amp; Action Plan</span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed pl-5">
                            {condition.next_steps_info}
                          </p>
                          <div className="pt-2 pl-5 flex items-center gap-3">
                            <Link
                              href="/couple-assessment"
                              className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 hover:text-teal-950"
                            >
                              <span>Check with a partner</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                            <span className="text-slate-300">&bull;</span>
                            <Link
                              href="/counselors"
                              className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 hover:text-teal-950"
                            >
                              <span>Book counselor consultation</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

