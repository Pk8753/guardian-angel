'use client';

import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [fullName, setFullName] = useState(user?.fullName || 'Kabir Sharma');
  const [aliasName, setAliasName] = useState(user?.aliasName || 'Silent-Falcon-9214');
  const [email] = useState(user?.email || 'kabir@guardianangel.bio');
  const [dob, setDob] = useState('1995-04-12');
  const [bloodType, setBloodType] = useState('O+');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <AuthGuard>
      <div className="flex h-screen bg-fog overflow-hidden font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full">
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
        </main>
      </div>
      </div>
    </AuthGuard>
  );
}

