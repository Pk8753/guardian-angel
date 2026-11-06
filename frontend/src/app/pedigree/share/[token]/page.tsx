'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PedigreeCanvas } from '@/components/pedigree/PedigreeCanvas';
import { ExportToolbar } from '@/components/pedigree/ExportToolbar';
import { FamilyRecord, PedigreeMember } from '@/components/pedigree/types';
import { ShieldCheck, GitBranch, Lock, Info } from 'lucide-react';

export default function SharedPedigreePage() {
  const params = useParams();
  const token = params?.token as string;
  const [family, setFamily] = useState<FamilyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`/api/pedigree/share/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error('Shared chart not found or link has expired');
        return res.json();
      })
      .then((data) => setFamily(data.family || data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const members: PedigreeMember[] = family?.members || [];

  return (
    <div className="min-h-screen bg-fog flex flex-col font-sans">
      {/* Top Clinical Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pine text-white flex items-center justify-center font-bold">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-800">
                GuardianAngel Clinical Pedigree Viewer
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono text-[10px]">
                {family?.family_id || 'FA-DEIDENTIFIED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Cryptographically signed de-identified view &bull; Read-only clinical inspection mode
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Lock className="w-3.5 h-3.5 text-pine" />
            <span>Zero-Knowledge De-Identified</span>
          </div>

          {family && (
            <ExportToolbar
              familyId={family.family_id}
              familyName={family.family_name}
              shareToken={token}
              members={members}
            />
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-4">
        {loading ? (
          <div className="h-[500px] flex items-center justify-center text-xs text-slate-400">
            Loading secure pedigree lineage...
          </div>
        ) : error ? (
          <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <Info className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Unable to Load Pedigree</h3>
            <p className="text-xs text-slate-500 max-w-xs">{error}</p>
          </div>
        ) : (
          <>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  {family?.family_name} ({family?.family_id})
                </h2>
                <p className="text-xs text-slate-500">
                  {members.length} members mapped &bull; Consanguinity:{' '}
                  {family?.is_consanguineous ? 'Present (First-Cousin Union =)' : 'None documented'}
                </p>
              </div>
              <span className="text-xs text-pine font-bold bg-mint/25 px-3 py-1 rounded-full border border-mint">
                NSGC Standard Symbols
              </span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
              <PedigreeCanvas
                members={members}
                isConsanguineous={family?.is_consanguineous}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

