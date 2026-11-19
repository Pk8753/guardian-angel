'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import {
  Shield,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Calendar,
  Lock,
  Globe,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Check,
  Save,
  Users,
  Eye,
  EyeOff,
  Sparkles,
  HelpCircle,
  FileText,
  UserX
} from 'lucide-react';

interface ConsentPermission {
  id: number;
  target_type: 'partner' | 'counselor';
  target_id?: number | null;
  scope: string;
  status: 'active' | 'revoked';
  created_at?: string;
  revoked_at?: string;
}

export default function PrivacyProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { activeLocale, setActiveLocale } = useUIStore();

  // Profile Form State (Simplified Human Fields)
  const [fullName, setFullName] = useState<string>(user?.fullName || '');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [phone, setPhone] = useState<string>('');
  const [dob, setDob] = useState<string>(user?.dob || '1995-06-15');
  const [maritalStatus, setMaritalStatus] = useState<string>('Considering Marriage');
  const [preferredLanguage, setPreferredLanguage] = useState<string>(activeLocale === 'ar' ? 'Arabic' : 'English');

  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Consent & Audit State
  const [permissions, setPermissions] = useState<ConsentPermission[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState<boolean>(true);
  const [consentMsg, setConsentMsg] = useState<string | null>(null);

  // Default sharing toggles
  const [shareSummaryOnly, setShareSummaryOnly] = useState<boolean>(true);
  const [allowCounselorAccess, setAllowCounselorAccess] = useState<boolean>(true);
  const [allowResearchAnonymized, setAllowResearchAnonymized] = useState<boolean>(false);
  const [isUpdatingToggle, setIsUpdatingToggle] = useState<boolean>(false);

  // Load Profile and Consent Permissions
  const loadData = async () => {
    try {
      // 1. Load User Profile
      const profileRes = await fetch('/api/profile');
      if (profileRes.ok) {
        const data = await profileRes.json();
        if (data.status === 'success' && data.profile) {
          const p = data.profile;
          if (p.full_name) setFullName(p.full_name);
          if (p.email) setEmail(p.email);
          if (p.phone) setPhone(p.phone);
          if (p.dob) setDob(p.dob);
          if (p.kinship_degree) setMaritalStatus(p.kinship_degree);
        }
      }

      // 2. Load Consent Permissions
      const consentRes = await fetch('/api/patient/consent');
      if (consentRes.ok) {
        const consentData = await consentRes.json();
        const list: ConsentPermission[] = consentData.consent_permissions || [];
        setPermissions(list);

        // Reflect existing toggles if available
        const partnerPerm = list.find((item) => item.target_type === 'partner');
        if (partnerPerm) {
          setShareSummaryOnly(partnerPerm.status === 'active' && partnerPerm.scope === 'combined_summary_only');
        }
        const counselorPerm = list.find((item) => item.target_type === 'counselor');
        if (counselorPerm) {
          setAllowCounselorAccess(counselorPerm.status === 'active');
        }
      }
    } catch (e) {
      console.error('Failed to load profile & consent data:', e);
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccessMsg(null);

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          dob,
          phone,
          kinship_degree: maritalStatus
        })
      });

      if (res.ok) {
        updateUser({ fullName, dob });
        setProfileSuccessMsg('Your profile details have been securely updated.');
        setTimeout(() => setProfileSuccessMsg(null), 3500);
      }
    } catch (e) {
      console.error('Failed to save profile:', e);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Toggle Permission
  const handleToggleConsent = async (
    targetType: 'partner' | 'counselor',
    scope: string,
    newValue: boolean
  ) => {
    setIsUpdatingToggle(true);
    try {
      const res = await fetch('/api/patient/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: targetType,
          target_id: null,
          scope,
          status: newValue ? 'active' : 'revoked'
        })
      });

      if (res.ok) {
        if (targetType === 'partner') setShareSummaryOnly(newValue);
        if (targetType === 'counselor') setAllowCounselorAccess(newValue);

        const targetLabel = targetType === 'partner' ? 'Partner sharing' : 'Counselor record';
        setConsentMsg(`Privacy preference updated: ${targetLabel} access ${newValue ? 'granted' : 'restricted'}.`);
        setTimeout(() => setConsentMsg(null), 3000);
        await loadData();
      }
    } catch (e) {
      console.error('Failed to toggle consent permission:', e);
    } finally {
      setIsUpdatingToggle(false);
    }
  };

  // Handle Revoke Access
  const handleRevokeConsent = async (permId: number, name: string) => {
    try {
      const res = await fetch(`/api/patient/consent/${permId}/revoke`, { method: 'POST' });
      if (res.ok) {
        setConsentMsg(`Access for "${name}" has been revoked immediately.`);
        setTimeout(() => setConsentMsg(null), 3000);
        await loadData();
      }
    } catch (e) {
      console.error('Failed to revoke consent:', e);
    }
  };

  // Sync Preferred Language
  const handleLanguageChange = (lang: 'en' | 'ar') => {
    setActiveLocale(lang);
    setPreferredLanguage(lang === 'ar' ? 'Arabic' : 'English');
  };

  // Active permissions (status === 'active')
  const activePermissions = permissions.filter((p) => p.status === 'active');

  return (
    <AuthGuard>
      <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-24 md:pb-12 max-w-5xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-900 text-xs font-bold uppercase tracking-wider border border-teal-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                    Patient Privacy &amp; Data Control
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Privacy &amp; Profile
                </h1>
                <p className="text-xs sm:text-sm text-slate-600">
                  Manage your personal details, who can view your health data, and your sharing controls with 100% transparency.
                </p>
              </div>

              {/* Language Switcher Pill */}
              <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-2xs flex items-center gap-1 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleLanguageChange('en')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeLocale === 'en'
                      ? 'bg-teal-800 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('ar')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeLocale === 'ar'
                      ? 'bg-teal-800 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  العربية
                </button>
              </div>
            </div>

            {/* Notification Banner */}
            {consentMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{consentMsg}</span>
              </div>
            )}

            {/* ==================== 1. SIMPLIFIED PATIENT PROFILE ==================== */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                    <User className="w-5 h-5 text-teal-700" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Personal Information</h2>
                    <p className="text-[11px] text-slate-500">Your basic information for health summaries &amp; appointments</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                  Zero Crypto Jargon
                </span>
              </div>

              {profileSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 block">Full Name</label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-slate-400 absolute left-3" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Fatima Al Hosani"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 transition"
                      />
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 block">Date of Birth</label>
                    <div className="relative flex items-center">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3" />
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 transition"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 block">Email Address</label>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3" />
                      <input
                        type="email"
                        readOnly
                        value={email}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 cursor-not-allowed"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">Used for booking confirmations and session links.</span>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 block">Phone Number (Optional)</label>
                    <div className="relative flex items-center">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+971 50 123 4567"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 transition"
                      />
                    </div>
                  </div>

                  {/* Marital Status */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 block">Relationship &amp; Marital Status</label>
                    <select
                      value={maritalStatus}
                      onChange={(e) => setMaritalStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 transition"
                    >
                      <option value="Considering Marriage">Considering Marriage / Exploring Potential Matches</option>
                      <option value="Engaged / Pre-Marital Planning">Engaged &bull; Completing Pre-Marital Screening</option>
                      <option value="Married">Married &bull; Family &amp; Pregnancy Planning</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  {/* Preferred Language */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 block">Preferred Counseling Language</label>
                    <div className="relative flex items-center">
                      <Globe className="w-4 h-4 text-slate-400 absolute left-3" />
                      <select
                        value={preferredLanguage}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPreferredLanguage(val);
                          setActiveLocale(val === 'Arabic' ? 'ar' : 'en');
                        }}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 transition"
                      >
                        <option value="English">English</option>
                        <option value="Arabic">العربية (Arabic)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSavingProfile ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save Profile Changes</span>
                  </button>
                </div>
              </form>
            </div>

            {/* ==================== 2. GRANULAR PARTNER & COUNSELOR SHARING CONTROLS ==================== */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                    <Lock className="w-5 h-5 text-teal-700" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Granular Sharing Controls</h2>
                    <p className="text-[11px] text-slate-500">You decide exactly what is visible to partners, counselors, or research</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  Patient In Control
                </span>
              </div>

              <div className="space-y-3 pt-1">
                {/* Toggle 1: Partner Summary Only (Active by default) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        Share only our combined compatibility summary
                      </span>
                      <span className="px-2 py-0.2 rounded-full bg-teal-100 text-teal-900 text-[10px] font-bold">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Your prospective partner sees only whether your combined carrier traits are compatible. <strong>Your individual lab report PDFs, hemoglobin electrophoresis, and raw variants remain 100% private.</strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isUpdatingToggle}
                    onClick={() =>
                      handleToggleConsent(
                        'partner',
                        shareSummaryOnly ? 'full_report' : 'combined_summary_only',
                        !shareSummaryOnly
                      )
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      shareSummaryOnly ? 'bg-teal-800' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        shareSummaryOnly ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 2: Counselor Document Access */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 max-w-xl">
                    <span className="text-xs font-bold text-slate-900 block">
                      Allow booked genetic counselors to view my health summary &amp; lab reports
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Permits your licensed UAE counselor to review your family questionnaire answers and uploaded lab files before your consultation to save you time. Access can be revoked anytime.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isUpdatingToggle}
                    onClick={() =>
                      handleToggleConsent(
                        'counselor',
                        allowCounselorAccess ? 'combined_summary_only' : 'full_report',
                        !allowCounselorAccess
                      )
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      allowCounselorAccess ? 'bg-teal-800' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        allowCounselorAccess ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 3: UAE Community Research (Anonymized) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 max-w-xl">
                    <span className="text-xs font-bold text-slate-900 block">
                      Contribute anonymized carrier statistics to UAE community health research
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Helps UAE researchers understand regional carrier frequencies. <strong>Your name, email, and contact details are never included.</strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isUpdatingToggle}
                    onClick={() => setAllowResearchAnonymized(!allowResearchAnonymized)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      allowResearchAnonymized ? 'bg-teal-800' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        allowResearchAnonymized ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* ==================== 3. "WHO CAN SEE MY DATA" AUDIT LOG ==================== */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                    <Eye className="w-5 h-5 text-teal-700" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Who Can See My Data &bull; Active Audit Log</h2>
                    <p className="text-[11px] text-slate-500">Live list of active external access permissions to your health records</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  {activePermissions.length} Active Access Permission(s)
                </span>
              </div>

              {isLoadingPermissions ? (
                <div className="py-6 text-center text-xs text-slate-400">Loading audit log...</div>
              ) : activePermissions.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/70 text-center space-y-2">
                  <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-800">Your health records are strictly private to you.</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    No partner, counselor, or external party currently has active access to your reports or assessments.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activePermissions.map((perm) => (
                    <div
                      key={perm.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {perm.target_type === 'counselor' ? 'Licensed Genetic Counselor' : 'Partner Compatibility Match'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Active Access
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          <strong>Scope: </strong>
                          {perm.scope === 'combined_summary_only'
                            ? 'Compatibility summary only (individual labs hidden)'
                            : perm.scope === 'full_report'
                            ? 'Consultation overview & attached lab reports'
                            : perm.scope}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {perm.target_type === 'counselor' ? '👨‍⚕️ Healthcare Provider' : '👥 Partner Match'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRevokeConsent(perm.id, perm.target_type === 'counselor' ? 'Counselor' : 'Partner Match')}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-slate-200 hover:border-rose-300 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-2xs"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Revoke Access</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ==================== 4. ZERO-STORAGE & PRIVACY GUARANTEE ==================== */}
            <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-7 shadow-sm border border-teal-800/40 space-y-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-emerald-300" />
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  Your Privacy Rights Under UAE Health Data Regulations
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 space-y-1">
                  <div className="font-bold text-teal-200">🔒 Never Shared with Insurers</div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Carrier status is completely confidential. It cannot affect insurance eligibility or employment in the UAE.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 space-y-1">
                  <div className="font-bold text-teal-200">🗑️ Right to Full Erasure</div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    You can delete uploaded documents or your entire account with a single click. No residual records are kept.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 space-y-1">
                  <div className="font-bold text-teal-200">🌿 Zero Tracking &amp; Ads</div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Zero advertising trackers or data brokers. All computations are hosted in secure, sovereign UAE enclaves.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
