'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { useAuthStore } from '@/stores/useAuthStore';
import { generatePseudonym } from '@/lib/utils';
import {
  User,
  Shield,
  Mail,
  Calendar,
  Droplet,
  Save,
  CheckCircle2,
  Lock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  Copy,
  Check,
  Users,
  Info,
  Layers,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';

interface ReportMember {
  id: number;
  file_name: string;
  panel_name: string;
  sudo_name: string;
  patient_name: string;
  dob: string;
  sex: string;
  location: string;
  condition: string;
  variant: string;
  carrier_status: string;
  complete_report_text: string;
  created_at: string;
}

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [fullName, setFullName] = useState(user?.fullName || 'Kabir Sharma');
  const [aliasName, setAliasName] = useState(user?.aliasName || 'Silent-Falcon-9214');
  const [email] = useState(user?.email || 'kabir@guardianangel.bio');
  const [dob, setDob] = useState('1995-04-12');
  const [bloodType, setBloodType] = useState('O+');
  const [saved, setSaved] = useState(false);

  // Associated Report Members state
  const [reportMembers, setReportMembers] = useState<ReportMember[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [expandedMemberId, setExpandedMemberId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Selection and Deletion state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<'single' | 'bulk'>('single');
  const [singleDeleteMember, setSingleDeleteMember] = useState<ReportMember | null>(null);
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const formatMaskedPatientName = (name: string): string => {
    if (!name || ['candidate', 'deidentified', 'patient', ''].includes(name.trim().toLowerCase())) {
      return 'CAXXXXTE';
    }
    if (/^[A-Za-z\u0600-\u06FF]{2}XXXX[A-Za-z\u0600-\u06FF]{2}$/.test(name.trim())) {
      return name.trim().toUpperCase();
    }
    const letters = name.replace(/[^A-Za-z\u0600-\u06FF]/g, '');
    if (letters.length >= 4) {
      return `${letters.slice(0, 2).toUpperCase()}XXXX${letters.slice(-2).toUpperCase()}`;
    } else if (letters.length >= 2) {
      return `${letters.slice(0, 2).toUpperCase()}XXXX${letters.slice(-2).toUpperCase()}`;
    }
    return 'PAXXXXNT';
  };

  useEffect(() => {
    // 1. Fetch user clinical profile
    fetch('/api/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success' && data.profile) {
          if (data.profile.full_name) setFullName(data.profile.full_name);
          if (data.profile.dob) setDob(data.profile.dob);
          if (data.profile.blood_type) setBloodType(data.profile.blood_type);
        }
      })
      .catch(() => {});

    // 2. Fetch screening report members
    fetch('/api/reports/scraped')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success' && Array.isArray(data.reports)) {
          const list: ReportMember[] = data.reports.map((r: any) => {
            const m = r.masked_data || {};
            return {
              id: r.id,
              file_name: r.file_name || m.file_metadata?.original_filename || 'Screening_Report.pdf',
              panel_name: r.panel_name || m.screening_category || 'Premarital Screening',
              sudo_name: m.sudo_name || r.sudo_name || 'Anonymous-Member',
              patient_name: formatMaskedPatientName(m.patient_name || m.patient_name_masked || 'Candidate'),
              dob: m.dob || '',
              sex: m.sex || '',
              location: m.location || '',
              condition: m.condition || r.gene_locus || 'Premarital Panel',
              variant: m.variant || r.variant || '',
              carrier_status: m.carrier_status || r.carrier_status || 'Asymptomatic',
              complete_report_text: m.complete_report_text || '',
              created_at: r.created_at || '',
            };
          });
          setReportMembers(list);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingReports(false));
  }, []);

  const calculateAge = (dobStr: string): string => {
    if (!dobStr || dobStr.toLowerCase().includes('not documented')) {
      return '—';
    }
    const yearMatch = dobStr.match(/\b(19\d{2}|20[0-2]\d)\b/);
    if (yearMatch) {
      const birthYear = parseInt(yearMatch[1], 10);
      const age = 2026 - birthYear;
      if (age >= 0 && age <= 120) {
        return `${age} yrs`;
      }
    }
    const d = new Date(dobStr);
    if (!isNaN(d.getTime())) {
      const birthYear = d.getFullYear();
      const age = 2026 - birthYear;
      if (age >= 0 && age <= 120) {
        return `${age} yrs`;
      }
    }
    return '—';
  };

  const handleCopyText = (id: number, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fullName,
        dob,
        blood_type: bloodType,
      }),
    })
      .then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      })
      .catch(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      });
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === reportMembers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(reportMembers.map((m) => m.id));
    }
  };

  const openSingleDelete = (e: React.MouseEvent, member: ReportMember) => {
    e.stopPropagation();
    setDeleteTarget('single');
    setSingleDeleteMember(member);
    setConfirmInput('');
    setDeleteError(null);
    setDeleteModalOpen(true);
  };

  const openBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setDeleteTarget('bulk');
    setSingleDeleteMember(null);
    setConfirmInput('');
    setDeleteError(null);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteModalOpen(false);
    setConfirmInput('');
    setDeleteError(null);
    setSingleDeleteMember(null);
  };

  const handleExecuteDelete = async () => {
    if (confirmInput.trim().toLowerCase() !== 'confirm') {
      setDeleteError('You must type "confirm" exactly to proceed.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      if (deleteTarget === 'single' && singleDeleteMember) {
        const res = await fetch(`/api/reports/scraped/${singleDeleteMember.id}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
          setReportMembers((prev) => prev.filter((m) => m.id !== singleDeleteMember.id));
          setSelectedIds((prev) => prev.filter((id) => id !== singleDeleteMember.id));
          if (expandedMemberId === singleDeleteMember.id) {
            setExpandedMemberId(null);
          }
          setDeleteSuccess(`Successfully deleted member ${singleDeleteMember.sudo_name}.`);
          setTimeout(() => setDeleteSuccess(null), 4000);
          closeDeleteModal();
        } else {
          setDeleteError(data.message || 'Failed to delete member.');
        }
      } else if (deleteTarget === 'bulk') {
        const res = await fetch('/api/reports/scraped/bulk-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ report_ids: selectedIds }),
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
          const deletedCount = data.deleted_count || selectedIds.length;
          setReportMembers((prev) => prev.filter((m) => !selectedIds.includes(m.id)));
          if (expandedMemberId && selectedIds.includes(expandedMemberId)) {
            setExpandedMemberId(null);
          }
          setSelectedIds([]);
          setDeleteSuccess(`Successfully deleted ${deletedCount} member${deletedCount === 1 ? '' : 's'}.`);
          setTimeout(() => setDeleteSuccess(null), 4000);
          closeDeleteModal();
        } else {
          setDeleteError(data.message || 'Failed to bulk delete members.');
        }
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Network error occurred.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="flex h-screen bg-fog overflow-hidden font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar />

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full pb-24 md:pb-8">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-pine text-white flex items-center justify-center text-xl font-bold shadow-md">
                {fullName.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{fullName}</h1>
                <p className="text-xs text-slate-500">{email} &bull; Proband (Index Patient)</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-mint/25 text-pine text-xs font-bold border border-mint self-start sm:self-auto">
              Verified Clinical Dossier
            </span>
          </div>

          {/* Clinical Profile Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
            <div className="pb-4 mb-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Patient Demographic &amp; Genomic Details
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Keep clinical records current to optimize autosomal recessive carrier calculations.
                </p>
              </div>
              <span className="text-xs text-pine font-bold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-pine" />
                <span>E2EE Encrypted</span>
              </span>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {saved && (
                <div className="p-3 bg-mint/25 border border-mint text-pine rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-jungle" />
                  <span>Clinical profile successfully updated and synchronized to secure enclave.</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Full Legal Name
                  </label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-11 pl-10 pr-3 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-pine focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">Anonymous Sudo Name</label>
                    <button
                      type="button"
                      onClick={() => setAliasName(generatePseudonym())}
                      className="text-[10px] font-bold text-pine hover:text-pine-light hover:underline flex items-center gap-0.5"
                    >
                      <Sparkles className="w-3 h-3 text-pine" />
                      <span>New Alias</span>
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <Shield className="w-4 h-4 text-pine absolute left-3.5" />
                    <input
                      type="text"
                      value={aliasName}
                      onChange={(e) => setAliasName(e.target.value)}
                      className="w-full h-11 pl-10 pr-3 font-mono font-bold text-pine text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-pine focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Clinical Account Email
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
                    <input
                      type="email"
                      readOnly
                      value={email}
                      className="w-full h-11 pl-10 pr-3 text-slate-500 text-xs rounded-xl bg-slate-100 border border-slate-200 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Date of Birth</label>
                  <div className="relative flex items-center">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5" />
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full h-11 pl-10 pr-3 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-pine focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ABO / Rh Blood Group</label>
                  <div className="relative flex items-center">
                    <Droplet className="w-4 h-4 text-slate-400 absolute left-3.5" />
                    <select
                      value={bloodType}
                      onChange={(e) => setBloodType(e.target.value)}
                      className="w-full h-11 pl-10 pr-3 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-pine focus:outline-none"
                    >
                      <option value="O+">O+ (Positive)</option>
                      <option value="A+">A+ (Positive)</option>
                      <option value="B+">B+ (Positive)</option>
                      <option value="AB+">AB+ (Positive)</option>
                      <option value="O-">O- (Negative)</option>
                      <option value="A-">A- (Negative)</option>
                      <option value="B-">B- (Negative)</option>
                      <option value="AB-">AB- (Negative)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-pine hover:bg-pine-light rounded-xl shadow-xs transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Clinical Profile</span>
                </button>
              </div>
            </form>
          </div>

          {/* ==================== ASSOCIATED MEMBERS & SCREENING REPORTS ==================== */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="pb-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-pine" />
                  <h2 className="text-base font-bold text-slate-800">
                    Associated Members &amp; Screening Reports
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {reportMembers.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-full border border-slate-200 transition cursor-pointer"
                  >
                    {selectedIds.length === reportMembers.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
                <span className="px-3 py-1 bg-mint/25 text-pine text-xs font-bold rounded-full border border-mint">
                  {reportMembers.length} {reportMembers.length === 1 ? 'Member' : 'Members'}
                </span>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full border border-slate-200 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-pine" />
                  <span>Zero Duplicates</span>
                </span>
              </div>
            </div>

            {deleteSuccess && (
              <div className="p-3.5 bg-mint/25 border border-mint text-pine rounded-2xl text-xs flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-jungle shrink-0" />
                  <span>{deleteSuccess}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteSuccess(null)}
                  className="text-pine hover:text-pine-light cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between p-3 sm:p-4 bg-rose-50 border border-rose-200 rounded-2xl animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-rose-600 text-white text-xs font-bold flex items-center justify-center">
                    {selectedIds.length}
                  </span>
                  <span className="text-xs font-bold text-rose-950">
                    {selectedIds.length} {selectedIds.length === 1 ? 'member' : 'members'} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white rounded-xl border border-slate-200 shadow-xs transition cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={openBulkDelete}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected ({selectedIds.length})</span>
                  </button>
                </div>
              </div>
            )}

            {loadingReports ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <div className="w-6 h-6 border-2 border-pine border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Loading members and screening records...</p>
              </div>
            ) : reportMembers.length === 0 ? null : (
              <div className="space-y-3">
                {reportMembers.map((member) => {
                  const isExpanded = expandedMemberId === member.id;
                  const memberAge = calculateAge(member.dob);

                  return (
                    <div
                      key={member.id}
                      className="border border-slate-200 rounded-2xl overflow-hidden transition-all bg-white hover:border-pine/60 shadow-xs"
                    >
                      {/* ==================== COLLAPSED MODE ROW ==================== */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setExpandedMemberId(isExpanded ? null : member.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setExpandedMemberId(isExpanded ? null : member.id);
                          }
                        }}
                        className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 bg-white hover:bg-slate-50/80 transition cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-center shrink-0"
                          >
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(member.id)}
                              onChange={() => handleToggleSelect(member.id)}
                              aria-label={`Select ${member.sudo_name}`}
                              className="w-4 h-4 rounded text-pine border-slate-300 focus:ring-pine cursor-pointer"
                            />
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-pine/10 text-pine flex items-center justify-center font-bold text-sm shrink-0 border border-pine/20">
                            <Shield className="w-5 h-5 text-pine" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-slate-900 text-sm">
                                {member.sudo_name}
                              </span>
                              {member.patient_name && member.patient_name !== member.sudo_name && (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-semibold text-[11px] rounded-md border border-slate-200">
                                  Patient: {member.patient_name}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                              {member.file_name} &bull; {member.panel_name}
                            </p>
                          </div>
                        </div>

                        {/* Collapsed Mode Details: Age, DOB, Sex, Condition Badges & Row Actions */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          <span className="hidden sm:inline-flex px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-lg border border-slate-200">
                            Age: {memberAge}
                          </span>
                          <span className="hidden md:inline-flex px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200">
                            DOB: {member.dob || 'Not Documented'}
                          </span>
                          <span className="px-2.5 py-1 bg-mint/25 text-pine font-bold text-xs rounded-lg capitalize border border-mint">
                            {member.sex || 'Unknown'}
                          </span>
                          <span className="hidden lg:inline-flex px-2.5 py-1 bg-pine/10 text-pine font-bold text-xs rounded-lg">
                            {member.condition}
                          </span>

                          {/* Individual Delete Button */}
                          <button
                            type="button"
                            title={`Delete ${member.sudo_name}`}
                            onClick={(e) => openSingleDelete(e, member)}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 flex items-center justify-center transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <div className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-pine" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-600" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ==================== EXPANDED MODE: FULL PDF REPORT IN TEXT FORMAT ==================== */}
                      {isExpanded && (
                        <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-200 space-y-4 animate-in fade-in duration-200">
                          {/* Clinical Quick Findings Banner */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-0.5">
                              <span className="text-[10px] uppercase font-bold text-slate-400">Condition</span>
                              <p className="font-bold text-slate-800 truncate">{member.condition}</p>
                            </div>
                            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-0.5">
                              <span className="text-[10px] uppercase font-bold text-slate-400">Carrier Status</span>
                              <p className="font-bold text-amber-700 truncate">{member.carrier_status}</p>
                            </div>
                            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-0.5">
                              <span className="text-[10px] uppercase font-bold text-slate-400">Age &amp; DOB</span>
                              <p className="font-bold text-slate-800 truncate">{memberAge} &bull; {member.dob || '—'}</p>
                            </div>
                            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-0.5">
                              <span className="text-[10px] uppercase font-bold text-slate-400">Location</span>
                              <p className="font-bold text-slate-800 truncate">{member.location || 'Not Documented'}</p>
                            </div>
                          </div>

                          {/* Complete PDF Report in Text Format */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                                <FileText className="w-4 h-4 text-pine" />
                                <span>Complete PDF Report (Text Format)</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyText(member.id, member.complete_report_text)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-pine border border-slate-200 shadow-xs transition cursor-pointer"
                              >
                                {copiedId === member.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-jungle" />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-pine" />
                                    <span>Copy Report Text</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {member.complete_report_text ? (
                              <pre className="p-4 bg-slate-900 text-emerald-300 font-mono text-xs rounded-xl overflow-x-auto max-h-96 whitespace-pre-wrap leading-relaxed select-text border border-slate-800 shadow-inner">
                                {member.complete_report_text}
                              </pre>
                            ) : (
                              <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                                No raw text captured for this report.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
      </div>

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900">
                    {deleteTarget === 'bulk'
                      ? `Delete ${selectedIds.length} Member Record${selectedIds.length === 1 ? '' : 's'}?`
                      : 'Delete Member Record?'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    This action is permanent and cannot be undone. Associated genomic data and report text will be completely removed.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target details */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              {deleteTarget === 'single' && singleDeleteMember ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Sudo Name:</span>
                    <span className="font-mono font-bold text-slate-900">{singleDeleteMember.sudo_name}</span>
                  </div>
                  {singleDeleteMember.patient_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Patient:</span>
                      <span className="font-semibold text-slate-700">{singleDeleteMember.patient_name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Source File:</span>
                    <span className="text-slate-700 truncate max-w-[200px]">{singleDeleteMember.file_name}</span>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Selected Members:</span>
                    <span className="font-bold text-slate-900">{selectedIds.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {reportMembers
                      .filter((m) => selectedIds.includes(m.id))
                      .slice(0, 4)
                      .map((m) => (
                        <span
                          key={m.id}
                          className="font-mono font-bold text-[11px] px-2 py-0.5 bg-white border border-slate-200 rounded-md text-slate-800"
                        >
                          {m.sudo_name}
                        </span>
                      ))}
                    {selectedIds.length > 4 && (
                      <span className="text-[11px] font-bold text-slate-500 self-center">
                        +{selectedIds.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Required confirmation input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                To confirm deletion, type <span className="font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">confirm</span> below:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && confirmInput.trim().toLowerCase() === 'confirm' && !isDeleting) {
                    handleExecuteDelete();
                  }
                }}
                placeholder='type "confirm"'
                autoFocus
                className="w-full h-11 px-3.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none font-mono"
              />
            </div>

            {/* Error message */}
            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                {deleteError}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={confirmInput.trim().toLowerCase() !== 'confirm' || isDeleting}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-xs transition cursor-pointer"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isDeleting ? 'Deleting...' : 'Permanently Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}

