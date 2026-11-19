'use client';

import React, { useState, useEffect } from 'react';
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
  Check,
  Trash2,
  X,
  UserCheck,
  Stethoscope,
  ChevronRight,
  ExternalLink,
  AlertTriangle
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

  // Hydration state from backend
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState<boolean>(true);

  // Active Modals & Interaction States
  const [isLearnModalOpen, setIsLearnModalOpen] = useState<boolean>(false);
  const [selectedCondition, setSelectedCondition] = useState<any>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);

  // Booking Form State
  const [bookingAssessmentType, setBookingAssessmentType] = useState<'self' | 'couple'>('self');
  const [bookingCoupleId, setBookingCoupleId] = useState<number | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [sharePersonalDetails, setSharePersonalDetails] = useState<number>(1);
  const [isBookingSubmitting, setIsBookingSubmitting] = useState<boolean>(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);

  // Document Upload State
  const [isUploadingDoc, setIsUploadingDoc] = useState<boolean>(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Comprehension Feedback State
  const [comprehensionSubmitted, setComprehensionSubmitted] = useState<string | null>(null);
  const [isSubmittingComprehension, setIsSubmittingComprehension] = useState<boolean>(false);

  const handleComprehensionFeedback = async (rating: 'clear' | 'somewhat' | 'questions') => {
    setIsSubmittingComprehension(true);
    try {
      const res = await fetch('/api/patient/comprehension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          topic: 'patient_dashboard_overview',
          notes: rating === 'questions' ? 'User requested counselor assistance' : null
        })
      });
      if (res.ok) {
        setComprehensionSubmitted(rating);
      }
    } catch (e) {
      console.error('Failed to submit comprehension feedback', e);
    } finally {
      setIsSubmittingComprehension(false);
    }
  };

  // Genomic Literacy Accordion / Tab State
  const [activeLiteracyTab, setActiveLiteracyTab] = useState<'carrier' | 'consanguinity' | 'choices' | 'myths'>('carrier');

  // Load Dashboard State from real backend
  const loadDashboardState = async () => {
    try {
      const res = await fetch('/api/patient/dashboard-state');
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success' && json.data) {
          setDashboardData(json.data);

          // Default provider selection
          if (json.data.providers && json.data.providers.length > 0) {
            const firstProv = json.data.providers[0];
            setSelectedProviderId((prev) => prev ?? firstProv.id);
            if (firstProv.available_slots && firstProv.available_slots.length > 0) {
              setSelectedSlot((prev) => prev || firstProv.available_slots[0].full_label || firstProv.available_slots[0].time);
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to load patient dashboard state:', e);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  useEffect(() => {
    loadDashboardState();
  }, []);

  // Handle Document Upload (supports real files & sample files)
  const handleUploadDocument = async (fileName: string, ownerType: 'self' | 'partner' = 'self') => {
    setIsUploadingDoc(true);
    setUploadError(null);
    setUploadSuccessMsg(null);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_name: fileName,
          file_url: `/data/documents/${fileName}`,
          owner_type: ownerType,
          quick_assessment_id: dashboardData?.quick_assessment?.id || null
        })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setUploadSuccessMsg(`"${fileName}" was securely saved to your health vault.`);
        await loadDashboardState();
      } else {
        setUploadError(data.message || 'Could not save report.');
      }
    } catch {
      setUploadError('Failed to upload document. Please verify server connection.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Handle Document Delete
  const handleDeleteDocument = async (docId: number) => {
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (res.ok) {
        await loadDashboardState();
      }
    } catch (e) {
      console.error('Failed to delete document', e);
    }
  };

  // Handle Appointment Booking Submit
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProviderId || !selectedSlot) {
      return;
    }

    setIsBookingSubmitting(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_id: selectedProviderId,
          assessment_type: bookingAssessmentType,
          couple_assessment_id: bookingAssessmentType === 'couple' ? bookingCoupleId : null,
          scheduled_at: selectedSlot,
          notes: bookingNotes,
          share_personal_details: sharePersonalDetails
        })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setBookingSuccessMsg(`Your appointment on ${selectedSlot} is confirmed!`);
        await loadDashboardState();
        setTimeout(() => {
          setIsBookingModalOpen(false);
          setBookingSuccessMsg(null);
          setBookingNotes('');
        }, 1800);
      }
    } catch (e) {
      console.error('Booking failed', e);
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  // Handle Appointment Cancellation
  const handleCancelAppointment = async (apptId: number) => {
    try {
      const res = await fetch(`/api/appointments/${apptId}/cancel`, { method: 'POST' });
      if (res.ok) {
        await loadDashboardState();
      }
    } catch (e) {
      console.error('Failed to cancel appointment', e);
    }
  };

  const hasQuickAssessment = Boolean(dashboardData?.profile?.has_quick_assessment);
  const profileRisk = dashboardData?.profile?.risk_level || 'Pending';
  const profileSummary = dashboardData?.profile?.plain_summary || 'Your health information is ready for review.';
  const appointments = dashboardData?.appointments || [];
  const coupleAssessments = dashboardData?.couple_assessments || [];
  const documents = dashboardData?.documents || [];
  const conditions = dashboardData?.conditions || [];
  const providers = dashboardData?.providers || [];

  const selectedProvider = providers.find((p: any) => p.id === selectedProviderId) || providers[0];

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
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto pb-16">
      {/* ==================== 1. WELCOMING HERO OR ZERO-STATE BANNER ==================== */}
      {!hasQuickAssessment ? (
        /* ZERO-DATA / DIRECT SIGNUP BANNER */
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#192072] via-teal-900 to-slate-900 text-white p-5 sm:p-7 lg:p-8 shadow-md border border-teal-500/30">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold tracking-wide uppercase border border-emerald-400/30 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  New Family Member
                </span>
                <span className="text-teal-200 text-xs font-semibold">&bull; Private &amp; Anonymized</span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
                Welcome to Guardian Angel, {firstName}! 🌿
              </h1>
              <p className="text-teal-100/90 text-xs sm:text-sm leading-relaxed">
                You haven&apos;t taken your <strong>Family Health Risk Assessment</strong> yet. In just 2 minutes, understand how family kinship and carrier traits may affect your future children, and receive calm, personalized guidance.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <Link
                href="/login#estimator"
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs transition shadow-lg flex items-center justify-center gap-2"
              >
                <span>Take 2-Minute Quick Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* HYDRATED PATIENT PROFILE HERO */
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-teal-950 via-teal-900 to-slate-900 text-white p-5 sm:p-6 shadow-sm border border-teal-800/40">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Welcome, {firstName} 👋
              </h1>
              <p className="text-teal-100/90 text-xs sm:text-sm">
                Your personal health vault is active, private, and fully up to date.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className={`px-3 py-1.5 rounded-xl font-bold text-xs border ${
                profileRisk === 'ok'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  : profileRisk === 'hi'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
              }`}>
                {profileRisk === 'ok' ? 'Baseline Population Health' : profileRisk === 'hi' ? 'Action Advised' : 'Moderate Consideration'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 1B. RISK VS. DIAGNOSIS CLARITY BANNER ==================== */}
      <div className="rounded-2xl sm:rounded-3xl bg-teal-50/80 border border-teal-200 p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-teal-800 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
          </div>
          <p className="text-xs sm:text-sm font-bold text-teal-950 leading-snug">
            Being a carrier does not mean you are sick, and an estimate is not a diagnosis.
          </p>
        </div>
      </div>

      {/* ==================== 1C. 4-STEP CARE TRACKER ==================== */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
              🧭
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">Your Family Health Journey</h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Clear milestones from initial check to full peace of mind</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          {/* Step 1 */}
          <div className={`p-3 rounded-2xl border transition ${hasQuickAssessment ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${hasQuickAssessment ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {hasQuickAssessment ? '✓' : '1'}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider">{hasQuickAssessment ? 'Completed' : 'Step 1'}</span>
            </div>
            <div className="font-bold text-xs">1. Quick Check</div>
            <p className="text-[11px] text-slate-500 leading-snug mt-0.5">Family history &amp; kinship assessment</p>
          </div>

          {/* Step 2 */}
          {(() => {
            const hasAppt = appointments.filter((a: any) => a.status !== 'cancelled').length > 0;
            return (
              <div className={`p-3 rounded-2xl border transition ${hasAppt ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' : hasQuickAssessment ? 'bg-teal-50/70 border-teal-300 text-teal-950' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${hasAppt ? 'bg-emerald-600 text-white' : hasQuickAssessment ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {hasAppt ? '✓' : '2'}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">{hasAppt ? 'Booked' : hasQuickAssessment ? 'Available' : 'Step 2'}</span>
                </div>
                <div className="font-bold text-xs">2. Counselor Session</div>
                <p className="text-[11px] text-slate-500 leading-snug mt-0.5">Discuss questions with UAE genetic counselor</p>
              </div>
            );
          })()}

          {/* Step 3 */}
          {(() => {
            const hasDocs = documents.length > 0;
            return (
              <div className={`p-3 rounded-2xl border transition ${hasDocs ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${hasDocs ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {hasDocs ? '✓' : '3'}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">{hasDocs ? 'Uploaded' : 'Step 3'}</span>
                </div>
                <div className="font-bold text-xs">3. Confirmatory Lab Test</div>
                <p className="text-[11px] text-slate-500 leading-snug mt-0.5">Premarital screening / CBC &amp; electrophoresis</p>
              </div>
            );
          })()}

          {/* Step 4 */}
          {(() => {
            const step4Active = (documents.length > 0 || coupleAssessments.length > 0) && profileRisk === 'hi';
            return (
              <div className={`p-3 rounded-2xl border transition ${step4Active ? 'bg-amber-50/70 border-amber-300 text-amber-950' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step4Active ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    4
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">{step4Active ? 'Guidance Ready' : 'Peace of Mind'}</span>
                </div>
                <div className="font-bold text-xs">4. Specialist Care (if needed)</div>
                <p className="text-[11px] text-slate-500 leading-snug mt-0.5">PGT-M, IVF planning or pediatric follow-up</p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ==================== 2. CURRENT STATE OF ANALYSIS DETAIL CARDS ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Your Health Status */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Heart className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Your Current Health</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              You are healthy and asymptomatic; carrying a single trait does not affect your vitality.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center text-[11px] text-emerald-700 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            <span>Healthy Single-Gene Carrier</span>
          </div>
        </div>

        {/* Card 2: Family & Future Baby Risk */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Dna className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Future Baby Planning</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              A child is affected only if both parents carry the exact same trait.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center text-[11px] text-teal-800 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-teal-700" />
            <span>Partner screening provides 100% clarity</span>
          </div>
        </div>

        {/* Card 3: Actionable Next Step */}
        <div className="bg-white rounded-3xl p-5 border border-teal-200 bg-gradient-to-br from-white to-teal-50/40 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Recommended Next Step</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Start a Couple Assessment to check compatibility with your prospective partner calmly.
            </p>
          </div>
          <Link
            href="/couple-assessment?openModal=true"
            className="pt-2 border-t border-teal-100 inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-900"
          >
            <span>Start Couple Assessment</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ==================== 3. NEUTRAL "YOUR OPTIONS" SECTION (ZERO COERCION) ==================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-teal-800 text-white flex items-center justify-center text-xs font-bold">
                🌿
              </span>
              <span>Your Options &mdash; Explore At Your Own Pace</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              There is no single right path. These non-judgmental options are available whenever you and your family are ready.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Action 1: Learn More */}
          <div className="p-4 rounded-2xl bg-slate-50 hover:bg-teal-50/40 border border-slate-200 hover:border-teal-300 transition flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-900 flex items-center justify-center font-bold">
                <BookOpen className="w-4 h-4 text-teal-800" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">1. Learn About Conditions</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Explore plain-language guides on UAE conditions: Thalassemia, Sickle Cell, G6PD, SMA, and more.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedCondition(conditions[0] || null);
                setIsLearnModalOpen(true);
              }}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-teal-800 hover:text-white text-teal-900 border border-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <span>Explore Condition Guides</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action 2: Upload More Documents */}
          <div className="p-4 rounded-2xl bg-slate-50 hover:bg-teal-50/40 border border-slate-200 hover:border-teal-300 transition flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
                <Upload className="w-4 h-4 text-emerald-800" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">2. Upload Lab Reports</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Add CBC blood counts, electrophoresis, or DNA test PDFs to improve analysis precision.
              </p>
            </div>
            <label className="w-full py-2 px-3 rounded-xl bg-white hover:bg-emerald-800 hover:text-white text-emerald-900 border border-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer">
              <span>Attach Lab File</span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadDocument(file.name, 'self');
                }}
              />
            </label>
          </div>

          {/* Action 3: Book Counselor Session */}
          <div className="p-4 rounded-2xl bg-slate-50 hover:bg-teal-50/40 border border-slate-200 hover:border-teal-300 transition flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
                <Calendar className="w-4 h-4 text-blue-800" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">3. Talk to a Counselor</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Schedule a confidential 15-minute video call with a licensed UAE genetic counselor.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setBookingAssessmentType('self');
                setIsBookingModalOpen(true);
              }}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-blue-800 hover:text-white text-blue-900 border border-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <span>Book Counselor Call</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action 4: Start Couple Assessment */}
          <div className="p-4 rounded-2xl bg-teal-900 text-white transition flex flex-col justify-between space-y-3 shadow-sm">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
                <Users className="w-4 h-4 text-emerald-300" />
              </div>
              <h3 className="text-xs font-bold text-white">4. Couple Assessment</h3>
              <p className="text-[11px] text-teal-100/90 leading-relaxed">
                Evaluating a potential spouse? Check joint carrier probabilities and modern reproductive choices.
              </p>
            </div>
            <Link
              href="/couple-assessment?openModal=true"
              className="w-full py-2 px-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-black transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Add Potential Spouse</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ==================== 1-TAP COMPREHENSION FEEDBACK ==================== */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>💬</span>
              <span>Did this explanation make sense?</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Your quick feedback helps us keep genetic information simple and easy to understand for everyone.
            </p>
          </div>
        </div>

        {comprehensionSubmitted ? (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {comprehensionSubmitted === 'clear' && "Thank you for letting us know! We're glad this information is clear and reassuring."}
                {comprehensionSubmitted === 'somewhat' && "Thank you! Our guides and counselors are always available if you'd like more details."}
                {comprehensionSubmitted === 'questions' && "We understand genetics can feel complex. A friendly counselor is ready to walk you through everything."}
              </span>
            </div>
            {comprehensionSubmitted === 'questions' && (
              <button
                type="button"
                onClick={() => {
                  setBookingAssessmentType('self');
                  setIsBookingModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shrink-0 cursor-pointer self-start sm:self-auto"
              >
                Book Counselor Call
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              disabled={isSubmittingComprehension}
              onClick={() => handleComprehensionFeedback('clear')}
              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 border border-slate-200 text-xs font-bold text-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>😊 Yes, clearly</span>
            </button>

            <button
              type="button"
              disabled={isSubmittingComprehension}
              onClick={() => handleComprehensionFeedback('somewhat')}
              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 border border-slate-200 text-xs font-bold text-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>🤔 Somewhat</span>
            </button>

            <button
              type="button"
              disabled={isSubmittingComprehension}
              onClick={() => handleComprehensionFeedback('questions')}
              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-900 hover:border-blue-300 border border-slate-200 text-xs font-bold text-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>💬 I still have questions &rarr; Ask Counselor</span>
            </button>
          </div>
        )}
      </div>

      {/* ==================== 4. UPCOMING APPOINTMENTS SECTION ==================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Upcoming Genetic Counseling Appointments</h2>
              <p className="text-[11px] text-slate-500">
                {appointments.filter((a: any) => a.status !== 'cancelled').length} scheduled session(s)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setBookingAssessmentType('self');
              setIsBookingModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book New Appointment</span>
          </button>
        </div>

        {appointments.filter((a: any) => a.status !== 'cancelled').length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 text-center space-y-2">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-xs font-bold text-slate-700">No appointments scheduled</h3>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Our 5 sample licensed UAE genetic counselors are available for confidential in-person or video consultations.
            </p>
            <button
              type="button"
              onClick={() => {
                setBookingAssessmentType('self');
                setIsBookingModalOpen(true);
              }}
              className="mt-2 px-3 py-1.5 rounded-lg bg-teal-800 text-white text-xs font-bold hover:bg-teal-900 transition cursor-pointer"
            >
              Book 15-Minute Consultation
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {appointments
              .filter((a: any) => a.status !== 'cancelled')
              .map((appt: any) => (
                <div
                  key={appt.id}
                  className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-teal-700" />
                        {appt.provider_name || appt.counselor_name || 'Genetic Counselor'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                        {appt.status === 'scheduled' ? 'Confirmed' : appt.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      {appt.provider_credentials && <span>{appt.provider_credentials} &bull; </span>}
                      {appt.provider_specialty || 'Clinical Genetics'}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 pt-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{appt.scheduled_at || appt.date_time}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-teal-900">
                        <span>Target:</span>
                        <span className="text-teal-700">
                          {appt.assessment_type === 'couple'
                            ? `Couple (${appt.couple_partner_label || 'Partner Match'})`
                            : 'Self Analysis'}
                        </span>
                      </div>
                      {appt.share_personal_details === 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-800 text-[10px] font-bold">
                          🔒 Encrypted Ref: {appt.encrypted_patient_ref || 'REF-CONFIDENTIAL'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Video &amp; In-Person (Confidential)</span>
                    <button
                      type="button"
                      onClick={() => handleCancelAppointment(appt.id)}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                    >
                      Cancel Appointment
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* ==================== 5. SAVED COUPLE ASSESSMENTS & UPLOADED DOCUMENTS ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Saved Couple Assessments (One-to-Many) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Couple Assessments ({coupleAssessments.length})</h2>
                  <p className="text-[11px] text-slate-500">Profiles for potential spouses and matches</p>
                </div>
              </div>
              <Link
                href="/couple-assessment?openModal=true"
                className="text-xs font-bold text-teal-800 hover:text-teal-900 flex items-center gap-1"
              >
                <span>+ New Match</span>
              </Link>
            </div>

            {coupleAssessments.length === 0 ? (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 text-center space-y-2">
                <Users className="w-7 h-7 text-slate-300 mx-auto" />
                <h3 className="text-xs font-bold text-slate-700">No couple profiles created yet</h3>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Evaluate potential spouse compatibility before marriage with 100% privacy.
                </p>
                <Link
                  href="/couple-assessment?openModal=true"
                  className="inline-block mt-1 px-3 py-1.5 rounded-lg bg-teal-800 text-white text-xs font-bold hover:bg-teal-900 transition"
                >
                  Start First Couple Assessment
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {coupleAssessments.map((ca: any) => (
                  <div
                    key={ca.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-bold text-slate-900 truncate">
                        {ca.partner_label} ({ca.relationship_type})
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 leading-snug">
                        {ca.plain_summary}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setBookingAssessmentType('couple');
                        setBookingCoupleId(ca.id);
                        setIsBookingModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-teal-800 hover:text-white text-teal-900 border border-slate-200 font-bold text-[11px] shrink-0 transition shadow-2xs cursor-pointer"
                    >
                      Book for this Couple
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/couple-assessment"
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold text-center transition flex items-center justify-center gap-2 shadow-xs mt-3"
          >
            <Users className="w-4 h-4 text-teal-300" />
            <span>Open Couple Assessment Portal</span>
          </Link>
        </div>

        {/* Uploaded Documents Vault */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Uploaded Documents ({documents.length})</h2>
                  <p className="text-[11px] text-slate-500">Lab panels, screening PDFs &amp; clinical summaries</p>
                </div>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                Encrypted Vault
              </span>
            </div>

            {uploadSuccessMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{uploadSuccessMsg}</span>
              </div>
            )}

            {uploadError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Quick Demo Upload Sample Buttons */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">Quick-Upload Lab File:</span>
                <label className="text-[11px] font-bold text-teal-800 hover:text-teal-900 cursor-pointer">
                  Browse Device
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadDocument(file.name, 'self');
                    }}
                  />
                </label>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  disabled={isUploadingDoc}
                  onClick={() => handleUploadDocument('Premarital_CBC_Electrophoresis.pdf', 'self')}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 transition shadow-2xs cursor-pointer"
                >
                  📄 + Premarital CBC (Beta-Thal)
                </button>
                <button
                  type="button"
                  disabled={isUploadingDoc}
                  onClick={() => handleUploadDocument('G6PD_Enzyme_Assay.pdf', 'self')}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 transition shadow-2xs cursor-pointer"
                >
                  📄 + G6PD Enzyme Assay
                </button>
                <button
                  type="button"
                  disabled={isUploadingDoc}
                  onClick={() => handleUploadDocument('Partner_Electrophoresis_Negative.pdf', 'partner')}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 transition shadow-2xs cursor-pointer"
                >
                  📄 + Partner Report (Partner)
                </button>
              </div>
            </div>

            {/* Documents List */}
            {documents.length === 0 ? (
              <div className="p-4 rounded-xl text-center text-xs text-slate-400">
                No documents uploaded yet. Upload a report above to store it safely.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-teal-700 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900 truncate block max-w-[200px]">
                          {doc.file_name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {doc.owner_type === 'partner' ? '👤 Partner Document' : '👤 Self Document'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================== 6. QUICK NAVIGATION: LITERACY & AI ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/genomic-literacy"
          className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 hover:border-teal-300 shadow-xs transition group flex items-start justify-between gap-3"
        >
          <div className="space-y-1.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5 text-teal-700" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition">
              Genomic Literacy Guide
            </h3>
            <p className="text-xs text-slate-500 leading-snug">
              Explore 6 UAE conditions, carrier explainers, and mythbusters in simple language.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-800 group-hover:translate-x-0.5 transition shrink-0 mt-2" />
        </Link>

        <Link
          href="/ask-ai"
          className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 hover:border-teal-300 shadow-xs transition group flex items-start justify-between gap-3"
        >
          <div className="space-y-1.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-teal-700" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition">
              Ask Guardian AI
            </h3>
            <p className="text-xs text-slate-500 leading-snug">
              Have questions about your test results or family planning? Ask our calm educational AI.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-800 group-hover:translate-x-0.5 transition shrink-0 mt-2" />
        </Link>
      </div>

      {/* ==================== MODAL 2: BOOK GENETIC COUNSELOR APPOINTMENT ==================== */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-800" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Book a Genetic Counselor Session
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {bookingSuccessMsg ? (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-950">Appointment Confirmed!</h4>
                <p className="text-xs text-emerald-800">{bookingSuccessMsg}</p>
                <p className="text-[11px] text-emerald-600">Video call link and calendar invite sent to your email.</p>
              </div>
            ) : (
              <form onSubmit={handleBookAppointment} className="space-y-4 text-xs">
                {/* 1. Target Assessment Selection */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 block">
                    1. Who is this consultation for?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBookingAssessmentType('self');
                        setBookingCoupleId(null);
                      }}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        bookingAssessmentType === 'self'
                          ? 'bg-teal-50 border-teal-700 text-teal-900 ring-1 ring-teal-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold">Self Analysis</div>
                      <div className="text-[10px] text-slate-500">Review my personal carrier traits</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBookingAssessmentType('couple');
                        if (coupleAssessments.length > 0 && !bookingCoupleId) {
                          setBookingCoupleId(coupleAssessments[0].id);
                        }
                      }}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        bookingAssessmentType === 'couple'
                          ? 'bg-teal-50 border-teal-700 text-teal-900 ring-1 ring-teal-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold">Couple Assessment</div>
                      <div className="text-[10px] text-slate-500">Joint pre-marital counseling</div>
                    </button>
                  </div>

                  {bookingAssessmentType === 'couple' && coupleAssessments.length > 0 && (
                    <div className="pt-1.5">
                      <label htmlFor="patient-target-couple-select" className="text-[11px] font-semibold text-slate-600">Select Couple Profile:</label>
                      <select
                        id="patient-target-couple-select"
                        value={bookingCoupleId || ''}
                        onChange={(e) => setBookingCoupleId(Number(e.target.value))}
                        className="w-full mt-1 p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-semibold outline-none"
                      >
                        {coupleAssessments.map((ca: any) => (
                          <option key={ca.id} value={ca.id}>
                            {ca.partner_label} ({ca.relationship_type})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* 2. Select Counselor / Provider */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 block">
                    2. Select Licensed UAE Genetic Counselor
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {providers.map((p: any) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedProviderId(p.id);
                          if (p.available_slots && p.available_slots.length > 0) {
                            setSelectedSlot(p.available_slots[0].full_label || p.available_slots[0].time);
                          }
                        }}
                        className={`p-3 rounded-xl border transition cursor-pointer flex flex-col gap-0.5 ${
                          selectedProviderId === p.id
                            ? 'bg-teal-50 border-teal-700 text-teal-900 ring-1 ring-teal-700'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{p.full_name}</span>
                          <span className="text-[10px] text-teal-800 font-semibold">{p.specialty}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          {p.location} &bull; {Array.isArray(p.languages) ? p.languages.join(', ') : 'Arabic, English'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Select Time Slot */}
                {selectedProvider && selectedProvider.available_slots && (
                  <div className="space-y-1.5">
                    <label htmlFor="patient-timeslot-select" className="font-bold text-slate-800 block">
                      3. Select Available Slot
                    </label>
                    <select
                      id="patient-timeslot-select"
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-semibold outline-none"
                    >
                      {selectedProvider.available_slots.slice(0, 16).map((slot: any, idx: number) => (
                        <option key={idx} value={slot.full_label || slot.time}>
                          {slot.full_label || `${slot.display_date} at ${slot.time}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 4. Privacy & Personal Identity Sharing Choice */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="font-bold text-slate-800 block text-xs">
                    4. Privacy &amp; Identity Sharing Choice
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Share my personal details (name &amp; contact) with the counselor?
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="radio"
                        name="shareDetails"
                        checked={sharePersonalDetails === 1}
                        onChange={() => setSharePersonalDetails(1)}
                        className="text-teal-700 focus:ring-teal-700"
                      />
                      <span>Yes &mdash; Share my name &amp; email</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="radio"
                        name="shareDetails"
                        checked={sharePersonalDetails === 0}
                        onChange={() => setSharePersonalDetails(0)}
                        className="text-teal-700 focus:ring-teal-700"
                      />
                      <span>No &mdash; Anonymous encrypted ref (SHA-256)</span>
                    </label>
                  </div>
                </div>

                {/* Optional Notes */}
                <div className="space-y-1">
                  <label htmlFor="patient-booking-notes" className="font-bold text-slate-800 block">
                    Optional notes or questions for the counselor:
                  </label>
                  <textarea
                    id="patient-booking-notes"
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="E.g., We both completed pre-marital screening and want to understand Beta-Thalassemia trait implications."
                    rows={2}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs outline-none focus:bg-white"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">100% confidential. No insurance required.</span>
                  <button
                    type="submit"
                    disabled={isBookingSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isBookingSubmitting ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>Confirm Consultation</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
