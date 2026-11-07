'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  ShieldCheck,
  Upload,
  Users,
  Dna,
  BookOpen,
  Calendar,
  Sparkles,
  Search,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Video,
  Clock,
  ArrowRight,
  FileText,
  Plus,
  RefreshCw,
  Lightbulb,
  Check
} from 'lucide-react';

interface PatientDashboardProps {
  user: any;
  activeFamily: any;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onAskQuestion: (q: string) => void;
  query: string;
  setQuery: (q: string) => void;
  aiAnswer: string | null;
  aiLoading: boolean;
  aiSource: string | null;
  aiLocus: string | null;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  user,
  activeFamily,
  selectedModel,
  onModelChange,
  onAskQuestion,
  query,
  setQuery,
  aiAnswer,
  aiLoading,
  aiSource,
  aiLocus
}) => {
  const firstName = user?.fullName ? user.fullName.split(' ')[0] : (user?.username || 'Friend');

  // Upload Report State
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isAnalyzingReport, setIsAnalyzingReport] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);

  // Booking Consultation State
  const [selectedSlot, setSelectedSlot] = useState<string>('Tomorrow, 2:30 PM');
  const [isBooked, setIsBooked] = useState<boolean>(false);

  // Genomic Literacy Accordion / Tab State
  const [activeLiteracyTab, setActiveLiteracyTab] = useState<'carrier' | 'consanguinity' | 'choices' | 'myths'>('carrier');

  // Handle Simulated Report Upload
  const handleSimulateUpload = (sampleName: string) => {
    setUploadedFile(sampleName);
    setIsAnalyzingReport(true);
    setExtractedData(null);

    setTimeout(() => {
      setIsAnalyzingReport(false);
      setExtractedData({
        title: 'Hemoglobin Variant Assay & Targeted DNA Screen',
        lab: 'Mayo Clinic / CLIA Certified Laboratory',
        identifiedTrait: 'Beta-Thalassemia Minor (Heterozygous Carrier)',
        gene: 'HBB (Chromosome 11)',
        significance: 'Carrier Trait Only — You are Healthy and Asymptomatic',
        clinicalRecommendation: 'Routine partner screening advised before pregnancy planning.'
      });
    }, 900);
  };

  const patientInquiries = [
    {
      q: 'Does being a carrier mean I have a disease or will get sick?',
      preview: 'Reassurance on carrier health'
    },
    {
      q: 'How do I talk to my partner about doing pre-marital carrier testing?',
      preview: 'Conversation starters with partner'
    },
    {
      q: 'If we are related (first cousins), what is the chance of having a healthy baby?',
      preview: 'Consanguinity & baby safety'
    },
    {
      q: 'What choices exist if both my partner and I carry the same trait?',
      preview: 'PGT-M & family choices'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ==================== 1. WELCOMING HERO & CURRENT STATE OF ANALYSIS ==================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white p-6 sm:p-8 shadow-md border border-teal-700/40">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-teal-700/60 text-teal-200 text-xs font-bold tracking-wide uppercase border border-teal-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Personal Health Vault
              </span>
              <span className="text-teal-300 text-xs font-semibold">&bull; Private &amp; Anonymized</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {firstName} 👋
            </h1>
            <p className="text-teal-100/90 text-xs sm:text-sm leading-relaxed">
              Here is your straightforward health overview. We translate complex genetic data into plain, practical answers so you and your family can plan with confidence.
            </p>
          </div>

          {/* Quick Health Summary Pill Box */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex flex-col gap-2 min-w-[280px]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-teal-200 font-semibold">Your Overall Status</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-bold text-[11px] border border-emerald-400/30">
                Good Standing
              </span>
            </div>
            <div className="text-lg font-black text-white">
              1 Documented Carrier Trait
            </div>
            <p className="text-[11px] text-teal-100/80 leading-relaxed">
              Beta-Thalassemia Trait. You are healthy and asymptomatic. No immediate medical intervention required.
            </p>
          </div>
        </div>
      </div>

      {/* ==================== CURRENT STATE OF ANALYSIS DETAIL CARDS ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Your Health Status */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Heart className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Your Current Health</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              You carry one gene copy for Beta-Thalassemia. <strong>You do not have the condition.</strong> Your body produces normal red blood cells and your everyday life is completely normal.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center text-[11px] text-emerald-700 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            <span>Healthy Single-Gene Carrier</span>
          </div>
        </div>

        {/* Card 2: Family & Future Baby Risk */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Dna className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Future Baby Planning</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              A child is only at risk if <strong>both mother and father</strong> carry the exact same trait. If your partner does not carry the trait, your baby has <strong>zero risk</strong> of having the disease.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center text-[11px] text-teal-800 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-teal-700" />
            <span>Partner screening provides 100% clarity</span>
          </div>
        </div>

        {/* Card 3: Actionable Next Step */}
        <div className="bg-white rounded-3xl p-5 border border-teal-200 bg-gradient-to-br from-white to-teal-50/40 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Recommended Next Step</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Schedule a simple pre-marital or pre-conception check for your partner. It requires just a routine cheek swab or blood sample.
            </p>
          </div>
          <Link
            href="/couple-assessment"
            className="pt-2 border-t border-teal-100 inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-900"
          >
            <span>Explore Partner Compatibility</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ==================== 2. UPLOAD REPORT & CREATE FAMILY TREE (DUAL BANNER) ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Upload Lab / Genetic Report Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Upload Lab or Genetic Report</h2>
                <p className="text-[11px] text-slate-500">PDF, clinical summary, or genomic test file</p>
              </div>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full border border-slate-200">
              AI Instant Reader
            </span>
          </div>

          {/* Interactive Dropzone / Upload Area */}
          <div className="border-2 border-dashed border-slate-200 hover:border-teal-600 rounded-2xl p-5 text-center bg-slate-50/50 hover:bg-teal-50/20 transition-all cursor-pointer space-y-2">
            <div className="w-10 h-10 rounded-full bg-white shadow-xs mx-auto flex items-center justify-center text-teal-800">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Drag and drop your report here, or click to browse
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Supports Hospital Lab PDFs, Blood Work, and Genomic Panels (.vcf, .txt)
              </p>
            </div>

            {/* Quick Demo Upload Buttons */}
            <div className="pt-2 flex items-center justify-center gap-2 flex-wrap">
              <span className="text-[10px] text-slate-400 font-semibold">Try sample file:</span>
              <button
                type="button"
                onClick={() => handleSimulateUpload('Hemoglobin_Variant_Screen_2026.pdf')}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 transition shadow-2xs"
              >
                📄 Lab Report (Beta-Thal)
              </button>
              <button
                type="button"
                onClick={() => handleSimulateUpload('Carrier_Panel_HBB_G6PD.vcf')}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 transition shadow-2xs"
              >
                🧬 Genomic VCF File
              </button>
            </div>
          </div>

          {/* Analyzing Spinner */}
          {isAnalyzingReport && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-3 text-xs text-teal-800 animate-pulse">
              <span className="w-4 h-4 border-2 border-teal-700 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing {uploadedFile} with clinical extraction engine...</span>
            </div>
          )}

          {/* Extracted Findings Card */}
          {extractedData && !isAnalyzingReport && (
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-teal-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-700" />
                  Report Extracted Successfully
                </span>
                <span className="text-[10px] font-mono text-teal-800">{uploadedFile}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-teal-100 space-y-1">
                <div className="flex justify-between text-slate-800 font-bold">
                  <span>Identified Trait:</span>
                  <span className="text-teal-900">{extractedData.identifiedTrait}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Gene Locus:</span>
                  <span className="font-mono">{extractedData.gene}</span>
                </div>
                <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                  <strong>Status:</strong> {extractedData.significance}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create / Expand Family Tree Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Your Family Health Tree</h2>
                  <p className="text-[11px] text-slate-500">
                    {activeFamily?.members?.length || 11} members mapped across 3 generations
                  </p>
                </div>
              </div>
              <Link
                href="/pedigree"
                className="text-xs font-bold text-teal-800 hover:text-teal-900 flex items-center gap-1"
              >
                <span>Full Tree</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Recording your parents, siblings, and partner helps our platform calculate inheritance risks and protect your future children before pregnancy.
            </p>
          </div>

          {/* Quick-Add Relative Actions */}
          <div className="grid grid-cols-3 gap-2.5">
            <Link
              href="/pedigree"
              className="p-3 rounded-xl bg-slate-50 hover:bg-teal-50/60 border border-slate-200 hover:border-teal-300 text-center transition flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-white shadow-2xs flex items-center justify-center text-teal-800 font-bold text-xs">
                +
              </div>
              <span className="text-[11px] font-bold text-slate-700">Add Parent</span>
            </Link>

            <Link
              href="/pedigree"
              className="p-3 rounded-xl bg-slate-50 hover:bg-teal-50/60 border border-slate-200 hover:border-teal-300 text-center transition flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-white shadow-2xs flex items-center justify-center text-teal-800 font-bold text-xs">
                +
              </div>
              <span className="text-[11px] font-bold text-slate-700">Add Sibling</span>
            </Link>

            <Link
              href="/pedigree"
              className="p-3 rounded-xl bg-slate-50 hover:bg-teal-50/60 border border-slate-200 hover:border-teal-300 text-center transition flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-white shadow-2xs flex items-center justify-center text-teal-800 font-bold text-xs">
                +
              </div>
              <span className="text-[11px] font-bold text-slate-700">Add Partner</span>
            </Link>
          </div>

          {/* Primary CTA */}
          <Link
            href="/pedigree"
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold text-center transition flex items-center justify-center gap-2 shadow-xs"
          >
            <Users className="w-4 h-4 text-teal-300" />
            <span>Open Interactive Family Tree Canvas</span>
          </Link>
        </div>
      </div>

      {/* ==================== 3. GENOMIC LITERACY: GENETICS MADE SIMPLE ==================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-800" />
              <h2 className="text-base font-extrabold text-slate-900">
                Genomic Literacy: Genetics Made Simple
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Everything you need to know about inherited traits, carrier status, and keeping your future baby safe.
            </p>
          </div>

          {/* Literacy Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveLiteracyTab('carrier')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeLiteracyTab === 'carrier'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              What is a Carrier?
            </button>
            <button
              type="button"
              onClick={() => setActiveLiteracyTab('consanguinity')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeLiteracyTab === 'consanguinity'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Related Marriages
            </button>
            <button
              type="button"
              onClick={() => setActiveLiteracyTab('choices')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeLiteracyTab === 'choices'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Your Choices
            </button>
            <button
              type="button"
              onClick={() => setActiveLiteracyTab('myths')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeLiteracyTab === 'myths'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Myth vs. Fact
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 text-xs text-slate-700 leading-relaxed">
          {activeLiteracyTab === 'carrier' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-teal-800 text-white flex items-center justify-center text-xs">1</span>
                What does having a "Carrier Trait" actually mean?
              </h3>
              <p>
                Think of your genes as two matching instruction manuals—one inherited from your mother and one from your father.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">✅ You are healthy</span>
                  <span>Because you have a healthy working copy of the gene, you will not experience symptoms or become ill.</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">👶 What about children?</span>
                  <span>A baby can only develop an autosomal recessive condition if <strong>both parents</strong> carry the exact same trait. If only one parent is a carrier, your child cannot have the disease.</span>
                </div>
              </div>
            </div>
          )}

          {activeLiteracyTab === 'consanguinity' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-teal-800 text-white flex items-center justify-center text-xs">2</span>
                Marrying a Relative (Consanguinity &amp; Cousins)
              </h3>
              <p>
                In many cultures, cousin marriages are very common and deeply respected. Scientifically:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-emerald-800 block mb-1">🌟 Over 95%+ of babies are healthy</span>
                  <span>The vast majority of pregnancies between first cousins result in completely normal, healthy children.</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-teal-800 block mb-1">🔬 Why pre-marital testing matters</span>
                  <span>Because cousins share grandparents, they have a slightly higher chance of sharing the same hidden carrier gene. A simple saliva or blood test identifies this trait so you can plan without stress.</span>
                </div>
              </div>
            </div>
          )}

          {activeLiteracyTab === 'choices' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-teal-800 text-white flex items-center justify-center text-xs">3</span>
                Empowering Choices: What happens if both partners carry a trait?
              </h3>
              <p>
                If testing shows that both you and your partner carry the same trait, modern medicine provides multiple safe options:
              </p>
              <ul className="space-y-2 list-disc pl-4 text-slate-700">
                <li><strong>Pre-implantation Genetic Testing (PGT-M with IVF):</strong> Embryos are tested before pregnancy, allowing only unaffected embryos to be transferred.</li>
                <li><strong>Non-Invasive Prenatal Testing (NIPT):</strong> Simple blood tests during early pregnancy check the baby's health safely.</li>
                <li><strong>Early Pediatric Care:</strong> Knowing in advance lets pediatricians provide immediate, specialized care from day one.</li>
              </ul>
            </div>
          )}

          {activeLiteracyTab === 'myths' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-teal-800 text-white flex items-center justify-center text-xs">4</span>
                Common Genetic Myths Debunked
              </h3>
              <div className="space-y-2">
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5">
                  <span className="text-rose-600 font-bold text-xs shrink-0">MYTH:</span>
                  <div>
                    <span className="font-bold text-slate-800">"If I feel strong and healthy, I can't be a carrier."</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      <strong>Fact:</strong> Carriers almost always feel completely healthy! Carrier status has nothing to do with physical fitness or diet.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5">
                  <span className="text-rose-600 font-bold text-xs shrink-0">MYTH:</span>
                  <div>
                    <span className="font-bold text-slate-800">"Genetic tests are scary and always find bad news."</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      <strong>Fact:</strong> Genetic testing is preventative and reassuring. Most people test clear, and for those who carry traits, actionable options exist to protect their baby.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================== 4. BOOK CONSULTATION & GENWELL AI ASSISTANT ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Book Genetic Consultation Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-800" />
                <h2 className="text-sm font-bold text-slate-900">Talk to a Human Genetic Counselor</h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                15 Min Virtual Call
              </span>
            </div>

            {/* Doctor Avatar & Bio Strip */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                AP
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Dr. Alisha Patel, MS, CGC</h3>
                <p className="text-[11px] text-slate-500">Board Certified Clinical Geneticist &bull; Mayo Clinic Affiliate</p>
                <div className="flex items-center gap-2 text-[10px] text-emerald-700 font-semibold mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Available for private video consultation</span>
                </div>
              </div>
            </div>

            {/* Time Slot Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                SELECT A TIME SLOT
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Tomorrow, 2:30 PM', 'Thursday, 10:00 AM', 'Friday, 4:00 PM'].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      setSelectedSlot(slot);
                      setIsBooked(false);
                    }}
                    className={`py-2 px-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer border text-center ${
                      selectedSlot === slot
                        ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Action */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsBooked(true)}
              className="w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>{isBooked ? 'Appointment Confirmed! Check Email' : `Confirm Session for ${selectedSlot}`}</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              100% confidential. No medical insurance required.
            </p>
          </div>
        </div>

        {/* GenWell AI Assistant (Plain Language Mode) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-800" />
                <h2 className="text-sm font-bold text-slate-900">Ask GenWell AI</h2>
                <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200">
                  Google AI Studio
                </span>
              </div>

              {/* Model Dropdown */}
              <div className="flex items-center gap-1 self-start sm:self-auto">
                <label htmlFor="patient-genwell-model" className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Model:</label>
                <select
                  id="patient-genwell-model"
                  value={selectedModel}
                  onChange={(e) => onModelChange(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2 py-0.5 font-semibold focus:ring-1 focus:ring-teal-700 outline-none cursor-pointer"
                >
                  <option value="gemini-3.0-flash">⚡ Gemini 3.0 Flash</option>
                  <option value="gemini-3.5-flash">🧪 Gemini 3.5 Flash</option>
                  <option value="gemini-2.5-flash">🛡️ Gemini 2.5 Flash</option>
                  <option value="gemini-1.5-flash">📦 Gemini 1.5 Flash</option>
                </select>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Ask anything about your family tree, carrier traits, or testing in plain English.
            </p>

            {/* Question Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (query.trim() && !aiLoading) onAskQuestion(query);
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about your family genes, carrier status, or baby safety..."
                disabled={aiLoading}
                className="w-full pl-3.5 pr-11 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 transition disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={aiLoading}
                className="absolute right-2 w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {aiLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </form>

            {/* Answer Display */}
            {aiLoading && (
              <div className="p-3.5 bg-teal-50/60 border border-teal-200 rounded-xl flex items-center gap-2.5 text-xs text-teal-800 animate-pulse">
                <span className="w-3.5 h-3.5 border-2 border-teal-700 border-t-transparent rounded-full animate-spin" />
                <span>GenWell AI is generating clear, reassuring guidance for you...</span>
              </div>
            )}

            {aiAnswer && !aiLoading && (
              <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                    GenWell Guidance
                  </span>
                  {aiSource && (
                    <span className="px-2 py-0.5 rounded-full bg-white text-teal-800 font-mono text-[9px] font-bold border border-teal-200">
                      {aiSource}
                    </span>
                  )}
                </div>
                <p className="text-slate-700 leading-relaxed text-xs whitespace-pre-line">{aiAnswer}</p>
              </div>
            )}
          </div>

          {/* Quick Suggested Inquiries */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              POPULAR QUESTIONS
            </span>
            <div className="space-y-1">
              {patientInquiries.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onAskQuestion(item.q)}
                  className="w-full text-left p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-xs text-slate-700 flex items-center justify-between transition cursor-pointer"
                >
                  <span className="truncate">{item.q}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

