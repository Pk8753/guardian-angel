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
  const [isBookingSubmitting, setIsBookingSubmitting] = useState<boolean>(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);

  // Document Upload State
  const [isUploadingDoc, setIsUploadingDoc] = useState<boolean>(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
          notes: bookingNotes
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
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-teal-950 via-teal-900 to-slate-900 text-white p-5 sm:p-6 lg:p-8 shadow-md border border-teal-700/40">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-teal-800/80 text-teal-200 text-xs font-bold tracking-wide uppercase border border-teal-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Personal Health Vault
                </span>
                <span className="text-teal-300 text-xs font-semibold">&bull; Private &amp; Zero-Knowledge</span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
                Welcome back, {firstName} 👋
              </h1>
              <p className="text-teal-100/90 text-xs sm:text-sm leading-relaxed">
                Here is your complete health overview. We translate complex genetic details into plain, practical answers so you and your family can plan with absolute confidence.
              </p>
            </div>

            {/* Quick Health Summary Pill Box */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex flex-col gap-2 w-full sm:w-auto min-w-0 sm:min-w-[300px]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-teal-200 font-semibold">Your Overall Status</span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
                  profileRisk === 'ok'
                    ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30'
                    : profileRisk === 'hi'
                    ? 'bg-rose-400/20 text-rose-300 border-rose-400/30'
                    : 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                }`}>
                  {profileRisk === 'ok' ? 'General Population Baseline' : profileRisk === 'hi' ? 'Action Advised' : 'Moderate Consideration'}
                </span>
              </div>
              <div className="text-base font-black text-white">
                {profileSummary}
              </div>
              <p className="text-[11px] text-teal-100/80 leading-relaxed">
                You are healthy and normal. Routine screening and simple choices ensure total clarity for your future baby.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 2. CURRENT STATE OF ANALYSIS DETAIL CARDS ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Your Health Status */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Heart className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Your Current Health</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Carrying an inherited trait means your body has one healthy copy of the gene. <strong>You are completely healthy and asymptomatic.</strong> Everyday life and vitality are completely normal.
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
              An autosomal recessive condition can only affect a child if <strong>both mother and father</strong> carry the exact same trait. If only one parent carries it, your child has <strong>zero risk</strong> of having the disease.
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
              Check compatibility with your potential match or spouse. Create a dedicated Couple Assessment to review shared carrier likelihood calmly.
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

      {/* ==================== 3. FOUR PERSONALIZED ACTIONABLE NEXT STEPS ==================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-teal-800 text-white flex items-center justify-center text-xs font-bold">
                🎯
              </span>
              <span>Your Actionable Next Steps</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Practical, reassuring recommendations tailored to your current analysis and family history.
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

                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-teal-900 mt-1">
                      <span>Target:</span>
                      <span className="text-teal-700">
                        {appt.assessment_type === 'couple'
                          ? `Couple (${appt.couple_partner_label || 'Partner Match'})`
                          : 'Self Analysis'}
                      </span>
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

      {/* ==================== 6. GENOMIC LITERACY: GENETICS MADE SIMPLE ==================== */}
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
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-bold max-w-full overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveLiteracyTab('carrier')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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
                What does having a &quot;Carrier Trait&quot; actually mean?
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
                In many cultures across the UAE and region, cousin marriages are very common and deeply respected. Scientifically:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-emerald-800 block mb-1">🌟 Over 95%+ of babies are completely healthy</span>
                  <span>The vast majority of pregnancies between first cousins result in normal, healthy children.</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-teal-800 block mb-1">🔬 Why pre-marital testing matters</span>
                  <span>Because relatives share common ancestors, there is a slightly higher chance of sharing the same recessive gene. A simple pre-marital check provides complete clarity.</span>
                </div>
              </div>
            </div>
          )}

          {activeLiteracyTab === 'choices' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-teal-800 text-white flex items-center justify-center text-xs">3</span>
                Empowering Choices: What if both partners carry a trait?
              </h3>
              <p>
                If testing shows that both you and your partner carry the same trait, modern medicine provides multiple safe options:
              </p>
              <ul className="space-y-2 list-disc pl-4 text-slate-700">
                <li><strong>Pre-implantation Genetic Testing (PGT-M with IVF):</strong> Embryos are tested before pregnancy, allowing only healthy, unaffected embryos to be transferred.</li>
                <li><strong>Non-Invasive Prenatal Testing (NIPT):</strong> Simple blood tests during early pregnancy check the baby&apos;s health safely.</li>
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
                    <span className="font-bold text-slate-800">&quot;If I feel strong and healthy, I can&apos;t be a carrier.&quot;</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      <strong>Fact:</strong> Carriers almost always feel completely healthy! Carrier status has nothing to do with physical fitness or diet.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5">
                  <span className="text-rose-600 font-bold text-xs shrink-0">MYTH:</span>
                  <div>
                    <span className="font-bold text-slate-800">&quot;Genetic tests are scary and always find bad news.&quot;</span>
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

      {/* ==================== 7. GENWELL AI ASSISTANT ==================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-800" />
            <h2 className="text-base font-extrabold text-slate-900">Ask GenWell AI (Patient View)</h2>
            <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200">
              Plain English Answers
            </span>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
            <label htmlFor="patient-genwell-model-dash" className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Model:</label>
            <select
              id="patient-genwell-model-dash"
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2 py-1 font-semibold focus:ring-1 focus:ring-teal-700 outline-none cursor-pointer"
            >
              <option value="gemini-3.0-flash">⚡ Gemini 3.0 Flash</option>
              <option value="gemini-3.5-flash">🧪 Gemini 3.5 Flash</option>
              <option value="gemini-2.5-flash">🛡️ Gemini 2.5 Flash</option>
              <option value="gemini-1.5-flash">📦 Gemini 1.5 Flash</option>
            </select>
          </div>
        </div>

        <p className="text-xs text-slate-600">
          Ask any question about your family tree, carrier traits, or testing in everyday plain language.
        </p>

        {/* Input */}
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
            placeholder="Ask about family carrier status, baby safety, or pre-marital screening..."
            disabled={aiLoading}
            className="w-full pl-3.5 pr-11 py-2.5 text-sm sm:text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 transition disabled:opacity-50"
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

        {aiLoading && (
          <div className="p-3.5 bg-teal-50/60 border border-teal-200 rounded-xl flex items-center gap-2.5 text-xs text-teal-800 animate-pulse">
            <span className="w-3.5 h-3.5 border-2 border-teal-700 border-t-transparent rounded-full animate-spin" />
            <span>GenWell AI is preparing reassuring, evidence-based guidance for you...</span>
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

        {/* Popular Questions */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            COMMON QUESTIONS PATIENTS ASK
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {patientInquiries.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onAskQuestion(item.q)}
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-xs text-slate-700 flex items-center justify-between transition cursor-pointer"
              >
                <span className="truncate">{item.q}</span>
                <ArrowRight className="w-3 h-3 text-slate-400 shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== MODAL 1: LEARN ABOUT CONDITIONS (6 UAE CONDITIONS) ==================== */}
      {isLearnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-800" />
                <h3 className="text-base font-extrabold text-slate-900">
                  UAE-Relevant Genetic Conditions Guide
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLearnModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              These conditions are part of the standard pre-marital and neonatal screening panel in the UAE. Understanding them in everyday terms helps couples plan with confidence.
            </p>

            {/* Condition List */}
            <div className="space-y-3">
              {conditions.map((cond: any) => (
                <div
                  key={cond.slug}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900">{cond.name}</h4>
                    <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200">
                      {cond.category}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    {cond.plain_summary}
                  </p>
                  <div className="pt-2 border-t border-slate-200/60 text-[11px] text-teal-900 bg-white p-2.5 rounded-xl border border-slate-200">
                    <strong>Clear Next Steps:</strong> {cond.next_steps_info}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsLearnModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

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
                        className={`p-3 rounded-xl border transition cursor-pointer flex flex-col gap-1 ${
                          selectedProviderId === p.id
                            ? 'bg-teal-50 border-teal-700 text-teal-900 ring-1 ring-teal-700'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{p.full_name}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">{p.location}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">{p.specialty}</p>
                        <p className="text-[10px] text-teal-800">{p.bio}</p>
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
