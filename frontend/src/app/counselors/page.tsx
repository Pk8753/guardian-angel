'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { AuthGuard } from '@/components/layout/AuthGuard';
import {
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Video,
  MapPin,
  Globe,
  Sparkles,
  Send,
  Plus,
  Trash2,
  Check,
  X,
  Stethoscope,
  Heart,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  Users
} from 'lucide-react';

interface Counselor {
  id: number;
  full_name: string;
  credentials?: string;
  specialty: string;
  location: string;
  languages: string[];
  bio: string;
  available_slots: Array<{
    date: string;
    display_date: string;
    time: string;
    full_label: string;
  }>;
}

interface Appointment {
  id: number;
  provider_id: number;
  provider_name?: string;
  counselor_name?: string;
  provider_specialty?: string;
  provider_credentials?: string;
  assessment_type: 'self' | 'couple';
  couple_assessment_id?: number | null;
  couple_partner_label?: string | null;
  scheduled_at: string;
  status: string;
  notes?: string;
  share_personal_details?: number;
  encrypted_patient_ref?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export default function CounselorsPage() {
  const [providers, setProviders] = useState<Counselor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [coupleProfiles, setCoupleProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filter state
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');

  // Booking Form State
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [bookingType, setBookingType] = useState<'self' | 'couple'>('self');
  const [selectedCoupleId, setSelectedCoupleId] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [sharePersonalDetails, setSharePersonalDetails] = useState<number>(1);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Guardian AI Educational Chat
  const [aiQuery, setAiQuery] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Welcome to the Counseling Preparation Assistant. Ask me anything about what to expect during a pre-marital genetic consultation, common questions to ask your counselor, or how carrier status is discussed.',
      timestamp: 'Now'
    }
  ]);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [provRes, apptRes, coupleRes] = await Promise.all([
        fetch('/api/patient/providers'),
        fetch('/api/appointments'),
        fetch('/api/couple-assessments')
      ]);

      if (provRes.ok) {
        const provData = await provRes.json();
        const provList = provData.providers || [];
        setProviders(provList);
        if (provList.length > 0 && selectedProviderId === null) {
          setSelectedProviderId(provList[0].id);
          if (provList[0].available_slots && provList[0].available_slots.length > 0) {
            setSelectedSlot(provList[0].available_slots[0].full_label || provList[0].available_slots[0].time);
          }
        }
      }

      if (apptRes.ok) {
        const apptData = await apptRes.json();
        setAppointments(apptData.appointments || []);
      }

      if (coupleRes.ok) {
        const coupleData = await coupleRes.json();
        const list = coupleData.couple_assessments || [];
        setCoupleProfiles(list);
        if (list.length > 0 && selectedCoupleId === null) {
          setSelectedCoupleId(list[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load counselors data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isAiLoading]);

  // Open booking modal for a specific counselor
  const handleSelectCounselorToBook = (provider: Counselor) => {
    setSelectedProviderId(provider.id);
    if (provider.available_slots && provider.available_slots.length > 0) {
      setSelectedSlot(provider.available_slots[0].full_label || provider.available_slots[0].time);
    }
    setIsBookingOpen(true);
    setBookingSuccessMsg(null);
    setBookingError(null);
  };

  // Submit Appointment Booking
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProviderId || !selectedSlot) {
      setBookingError('Please select a counselor and an available time slot.');
      return;
    }

    setIsSubmittingBooking(true);
    setBookingError(null);

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_id: selectedProviderId,
          assessment_type: bookingType,
          couple_assessment_id: bookingType === 'couple' ? selectedCoupleId : null,
          scheduled_at: selectedSlot,
          notes: bookingNotes,
          share_personal_details: sharePersonalDetails
        })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setBookingSuccessMsg(`Your consultation on ${selectedSlot} has been confirmed! A calendar invite and confidential video link have been created.`);
        await loadData();
        setTimeout(() => {
          setIsBookingOpen(false);
          setBookingSuccessMsg(null);
          setBookingNotes('');
        }, 2200);
      } else {
        setBookingError(data.message || 'Could not complete booking.');
      }
    } catch {
      setBookingError('Network error while booking. Please try again.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Cancel Appointment
  const handleCancelAppointment = async (apptId: number) => {
    if (!confirm('Are you sure you want to cancel this counseling appointment?')) return;
    try {
      const res = await fetch(`/api/appointments/${apptId}/cancel`, { method: 'POST' });
      if (res.ok) {
        await loadData();
      }
    } catch (e) {
      console.error('Failed to cancel appointment', e);
    }
  };

  // Ask Guardian AI
  const handleAskAi = async (questionText: string) => {
    const q = questionText.trim();
    if (!q || isAiLoading) return;
    setAiQuery('');

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.answer || 'Genetic counselors are supportive healthcare professionals dedicated to giving couples calm clarity about carrier traits, family planning, and reproductive options without pressure or judgment.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error('AI response error');
      }
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: 'A genetic counseling session is completely non-judgmental and confidential. Your counselor reviews your family questionnaire or lab reports, translates complex genetics into everyday terms, answers your personal questions, and explains safe reproductive pathways such as PGT-M or routine pediatric follow-ups.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const selectedProvider = providers.find((p) => p.id === selectedProviderId) || providers[0];

  // Filtered providers
  const filteredProviders = providers.filter((p) => {
    if (locationFilter !== 'all' && !p.location.toLowerCase().includes(locationFilter.toLowerCase())) {
      return false;
    }
    if (languageFilter !== 'all' && !p.languages.some((l) => l.toLowerCase() === languageFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

  const activeAppointments = appointments.filter((a) => a.status !== 'cancelled');

  const presetQuestions = [
    'What happens during a pre-marital genetic counseling session?',
    'How do counselors explain carrier traits to prospective spouses?',
    'What questions should we prepare to ask our counselor?',
    'Will our families or employers be notified about our counseling session?'
  ];

  return (
    <AuthGuard>
      <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto w-full">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-900 text-xs font-bold uppercase tracking-wider border border-teal-200 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
                    Accredited Healthcare Providers
                  </span>
                  <span className="text-slate-400 text-xs">&bull;</span>
                  <span className="text-slate-600 text-xs font-semibold">Licensed UAE Genetic Counselors</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Genetic Counseling &amp; Family Guidance
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
                  Connect with licensed UAE genetic counselors for calm, compassionate, and non-judgmental guidance. Discuss personal carrier traits, pre-marital screening, and modern reproductive pathways.
                </p>
              </div>

              {/* Quick Action Button */}
              <button
                type="button"
                onClick={() => {
                  if (providers.length > 0) handleSelectCounselorToBook(providers[0]);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer shrink-0 self-start lg:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Book 15-Min Consultation</span>
              </button>
            </div>

            {/* Upcoming Appointments Banner if any exist */}
            {activeAppointments.length > 0 && (
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-teal-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-teal-700" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Your Upcoming Consultations ({activeAppointments.length})</h2>
                      <p className="text-[11px] text-slate-500">Confidential video &amp; clinic sessions</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeAppointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-teal-700" />
                            {appt.provider_name || appt.counselor_name || 'Licensed Genetic Counselor'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Confirmed
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500">
                          {appt.provider_specialty || 'Pre-Marital & Family Genetics'}
                        </div>

                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 pt-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{appt.scheduled_at}</span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-teal-900">
                            <span>Focus:</span>
                            <span className="text-teal-700">
                              {appt.assessment_type === 'couple'
                                ? `Couple Assessment (${appt.couple_partner_label || 'Partner Match'})`
                                : 'Personal Self Analysis'}
                            </span>
                          </div>
                          {appt.share_personal_details === 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-800 text-[10px] font-bold">
                              🔒 Encrypted Ref: {appt.encrypted_patient_ref || 'REF-CONFIDENTIAL'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">100% Confidential</span>
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
              </div>
            )}

            {/* Filter Bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-700">Filter Location:</span>
                {['all', 'Abu Dhabi', 'Dubai', 'Sharjah', 'Al Ain'].map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocationFilter(loc)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      locationFilter === loc
                        ? 'bg-teal-800 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {loc === 'all' ? 'All Emirates' : loc}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="patient-counselor-lang-filter" className="text-xs font-bold text-slate-700">Language:</label>
                <select
                  id="patient-counselor-lang-filter"
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold outline-none cursor-pointer"
                >
                  <option value="all">All Languages</option>
                  <option value="Arabic">Arabic</option>
                  <option value="English">English</option>
                  <option value="French">French</option>
                </select>
              </div>
            </div>

            {/* Directory of 5 Seeded Counselors */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>👨‍⚕️</span>
                  <span>Licensed UAE Genetic Counselors ({filteredProviders.length})</span>
                </h2>
                <span className="text-xs text-slate-500 font-medium">14-Day Rolling Calendar Available</span>
              </div>

              {isLoading ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading counselor directory...</div>
              ) : filteredProviders.length === 0 ? (
                <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-700">No counselors match your selected filters</p>
                  <button
                    type="button"
                    onClick={() => {
                      setLocationFilter('all');
                      setLanguageFilter('all');
                    }}
                    className="text-xs text-teal-800 font-bold underline cursor-pointer"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredProviders.map((counselor) => {
                    const initials = counselor.full_name
                      .replace('Dr. ', '')
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('');

                    return (
                      <div
                        key={counselor.id}
                        className="bg-white rounded-3xl p-5 border border-slate-200/90 hover:border-teal-300 transition shadow-xs flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          {/* Counselor Header */}
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center justify-center font-black text-sm shrink-0">
                              {initials}
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <h3 className="text-sm font-bold text-slate-900 leading-snug truncate">
                                {counselor.full_name}
                              </h3>
                              <p className="text-xs text-teal-800 font-semibold line-clamp-1">
                                {counselor.specialty}
                              </p>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-0.5">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{counselor.location}</span>
                              </div>
                            </div>
                          </div>

                          {/* Languages */}
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <Globe className="w-3 h-3 text-slate-400" />
                            {counselor.languages.map((lang, lIdx) => (
                              <span
                                key={lIdx}
                                className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold"
                              >
                                {lang}
                              </span>
                            ))}
                          </div>

                          {/* 1-Line Trimmed Bio */}
                          <p className="text-xs text-slate-600 leading-snug line-clamp-1">
                            {counselor.specialty} &bull; {counselor.location}
                          </p>

                          {/* Next Slot Badge */}
                          {counselor.available_slots && counselor.available_slots.length > 0 && (
                            <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-200/60 text-[11px] text-teal-950 flex items-center justify-between">
                              <span className="font-semibold">Next Available:</span>
                              <span className="font-bold text-teal-800">
                                {counselor.available_slots[0].display_date} &bull; {counselor.available_slots[0].time}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* CTA Button */}
                        <button
                          type="button"
                          onClick={() => handleSelectCounselorToBook(counselor)}
                          className="w-full py-2.5 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Book with {counselor.full_name.split(' ')[0] === 'Dr.' ? counselor.full_name.split(' ').slice(0, 2).join(' ') : counselor.full_name.split(' ')[0]}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ==================== GUARDIAN AI EDUCATIONAL MODULE ==================== */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
              {/* Persistent Medical Disclaimer Banner */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold">Educational Guide Only &mdash; Not Clinical or Medical Advice</div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    Guardian AI provides informational answers to help you prepare questions and understand genetic terms. Always discuss your screening results directly with a certified physician or accredited genetic counselor.
                  </p>
                </div>
              </div>

              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Guardian AI: Counseling Preparation Assistant</h3>
                    <p className="text-[11px] text-slate-500">Ask any question before your consultation</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                  Confidential Chat
                </span>
              </div>

              {/* Preset Questions Chips */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  SUGGESTED QUESTIONS TO ASK
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {presetQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAskAi(q)}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-xs text-slate-700 text-left flex items-center justify-between transition cursor-pointer"
                    >
                      <span className="truncate">{q}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Conversation Viewport */}
              <div
                ref={chatScrollRef}
                className="h-64 sm:h-72 overflow-y-auto space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/70 scroll-smooth"
              >
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start items-start gap-2'}`}
                  >
                    {msg.sender === 'ai' && (
                      <div className="w-6 h-6 rounded-full bg-teal-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-3 h-3 text-emerald-300" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs space-y-1 ${
                        msg.sender === 'user'
                          ? 'bg-teal-800 text-white rounded-tr-xs'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-2xs'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                      <span
                        className={`block text-[9px] text-right ${
                          msg.sender === 'user' ? 'text-teal-200' : 'text-slate-400'
                        }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))}

                {isAiLoading && (
                  <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-teal-200 text-xs text-teal-800 animate-pulse w-fit">
                    <span className="w-3.5 h-3.5 border-2 border-teal-700 border-t-transparent rounded-full animate-spin" />
                    <span>Preparing friendly guidance...</span>
                  </div>
                )}
              </div>

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAskAi(aiQuery);
                }}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="Ask a question about pre-marital counseling or genetic traits..."
                  disabled={isAiLoading}
                  className="w-full pl-4 pr-11 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 transition disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isAiLoading || !aiQuery.trim()}
                  className="absolute right-2 w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </main>
        </div>
      </div>

      {/* ==================== 14-DAY ROLLING BOOKING MODAL ==================== */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-teal-700" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Book Genetic Counseling Session
                  </h3>
                  <p className="text-xs text-slate-500">
                    15-Minute confidential consultation (Video or In-Person)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {bookingSuccessMsg ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-950">Appointment Confirmed!</h4>
                <p className="text-xs text-emerald-800 leading-relaxed">{bookingSuccessMsg}</p>
                <p className="text-[11px] text-emerald-600">You will receive a notification and calendar invite.</p>
              </div>
            ) : (
              <form onSubmit={handleBookAppointment} className="space-y-4 text-xs">
                {bookingError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* 1. Select Consultation Focus */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 block">
                    1. Consultation Focus
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBookingType('self')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        bookingType === 'self'
                          ? 'bg-teal-50 border-teal-700 text-teal-900 ring-1 ring-teal-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold">Self Analysis</div>
                      <div className="text-[10px] text-slate-500">My individual carrier traits</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBookingType('couple')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        bookingType === 'couple'
                          ? 'bg-teal-50 border-teal-700 text-teal-900 ring-1 ring-teal-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold">Couple Assessment</div>
                      <div className="text-[10px] text-slate-500">Joint pre-marital counseling</div>
                    </button>
                  </div>

                  {bookingType === 'couple' && (
                    <div className="pt-2">
                      <label htmlFor="patient-counselor-modal-couple" className="text-[11px] font-semibold text-slate-600">Select Couple Profile:</label>
                      {coupleProfiles.length === 0 ? (
                        <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg mt-1 border border-amber-200">
                          You haven&apos;t created any couple profiles yet. You can still proceed, or create one in the Couple Check tab.
                        </p>
                      ) : (
                        <select
                          id="patient-counselor-modal-couple"
                          value={selectedCoupleId || ''}
                          onChange={(e) => setSelectedCoupleId(Number(e.target.value))}
                          className="w-full mt-1 p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-semibold outline-none"
                        >
                          {coupleProfiles.map((cp) => (
                            <option key={cp.id} value={cp.id}>
                              {cp.partner_label} ({cp.relationship_type})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Select Counselor */}
                <div className="space-y-1.5">
                  <label htmlFor="patient-counselor-modal-provider" className="font-bold text-slate-800 block">
                    2. Select Counselor
                  </label>
                  <select
                    id="patient-counselor-modal-provider"
                    value={selectedProviderId || ''}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      setSelectedProviderId(id);
                      const p = providers.find((prov) => prov.id === id);
                      if (p && p.available_slots && p.available_slots.length > 0) {
                        setSelectedSlot(p.available_slots[0].full_label || p.available_slots[0].time);
                      }
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-semibold outline-none"
                  >
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} &bull; {p.specialty} ({p.location.split('(')[0].trim()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. 14-Day Rolling Time Slot Picker */}
                {selectedProvider && selectedProvider.available_slots && (
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 block">
                      3. Select Date &amp; Time (14-Day Rolling Slots)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                      {selectedProvider.available_slots.slice(0, 18).map((slot, sIdx) => {
                        const slotVal = slot.full_label || `${slot.display_date} at ${slot.time}`;
                        const isSelected = selectedSlot === slotVal;
                        return (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => setSelectedSlot(slotVal)}
                            className={`p-2 rounded-lg text-left transition cursor-pointer border text-[11px] ${
                              isSelected
                                ? 'bg-teal-800 text-white border-teal-800 shadow-2xs font-bold'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300'
                            }`}
                          >
                            <div className="font-semibold truncate">{slot.display_date}</div>
                            <div className={isSelected ? 'text-teal-200' : 'text-slate-500'}>{slot.time}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. Notes / Questions */}
                <div className="space-y-1">
                  <label htmlFor="patient-counselor-modal-notes" className="font-bold text-slate-800 block">
                    4. Optional Notes for Counselor
                  </label>
                  <textarea
                    id="patient-counselor-modal-notes"
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="e.g. We have questions about pre-marital thalassemia screening and carrier probabilities."
                    rows={2}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs outline-none focus:bg-white"
                  />
                </div>

                {/* 5. Privacy & Personal Identity Sharing Choice */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="font-bold text-slate-800 block text-xs">
                    5. Privacy &amp; Identity Sharing Choice
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Share my personal details (name &amp; contact) with the counselor?
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="radio"
                        name="shareDetailsCounselors"
                        checked={sharePersonalDetails === 1}
                        onChange={() => setSharePersonalDetails(1)}
                        className="text-teal-700 focus:ring-teal-700"
                      />
                      <span>Yes &mdash; Share my name &amp; email</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="radio"
                        name="shareDetailsCounselors"
                        checked={sharePersonalDetails === 0}
                        onChange={() => setSharePersonalDetails(0)}
                        className="text-teal-700 focus:ring-teal-700"
                      />
                      <span>No &mdash; Anonymous encrypted ref (SHA-256)</span>
                    </label>
                  </div>
                </div>

                {/* Submit Row */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Video &amp; In-Person &bull; Zero Insurance Required</span>
                  <button
                    type="submit"
                    disabled={isSubmittingBooking}
                    className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmittingBooking ? (
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
    </AuthGuard>
  );
}

