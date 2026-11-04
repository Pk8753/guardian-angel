'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { PedigreeCanvas } from '@/components/pedigree/PedigreeCanvas';
import { ModuleAModal } from '@/components/pedigree/ModuleAModal';
import { ModuleBModal } from '@/components/pedigree/ModuleBModal';
import { ExportToolbar } from '@/components/pedigree/ExportToolbar';
import { PedigreeMember, FamilyRecord } from '@/components/pedigree/types';
import {
  Plus,
  Users,
  GitBranch,
  ShieldAlert,
  Info,
  Edit2,
  Trash2,
  Share2,
  Search,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export default function PedigreePage() {
  const [families, setFamilies] = useState<FamilyRecord[]>([]);
  const [activeFamily, setActiveFamily] = useState<FamilyRecord | null>(null);
  const [selectedMember, setSelectedMember] = useState<PedigreeMember | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [isModuleAOpen, setIsModuleAOpen] = useState(false);
  const [isModuleBOpen, setIsModuleBOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<PedigreeMember | null>(null);
  const [relativeTarget, setRelativeTarget] = useState<PedigreeMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch families on load
  const loadFamilies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/families');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setFamilies(data);
          // Set first family or keep active family updated
          setActiveFamily((prev) => {
            if (prev) {
              const matched = data.find((f: FamilyRecord) => f.family_id === prev.family_id);
              return matched || data[0];
            }
            return data[0];
          });
        } else {
          setFamilies([]);
          setActiveFamily(null);
        }
      }
    } catch (e) {
      console.error('Failed to load families:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFamilies();
  }, [loadFamilies]);

  // Handle Create Family (Module A)
  const handleCreateFamily = async (formData: any) => {
    const res = await fetch('/api/families', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create family');
    }

    const newFamily = await res.json();
    await loadFamilies();
    setActiveFamily(newFamily);
    // Immediately prompt to add proband/self
    setEditingMember(null);
    setRelativeTarget(null);
    setIsModuleBOpen(true);
  };

  // Handle Add / Edit Member (Module B)
  const handleSaveMember = async (formData: any) => {
    if (!activeFamily) return;

    if (editingMember) {
      // Update existing
      const res = await fetch(`/api/families/${activeFamily.family_id}/members/${editingMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update member');
      }
    } else {
      // Add relative
      const payload = {
        ...formData,
        target_relative_id: relativeTarget?.id || null
      };

      const res = await fetch(`/api/families/${activeFamily.family_id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add member');
      }
    }

    await loadFamilies();
  };

  // Handle Delete Member
  const handleDeleteMember = async (memberId: string | number) => {
    if (!activeFamily) return;
    if (!confirm('Are you sure you want to delete this family member from the chart?')) return;

    try {
      const res = await fetch(`/api/families/${activeFamily.family_id}/members/${memberId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSelectedMember(null);
        await loadFamilies();
      }
    } catch (e) {
      console.error('Delete member error', e);
    }
  };

  // Handle Drag Position Save
  const handlePositionChange = async (memberId: string | number, x: number, y: number) => {
    if (!activeFamily) return;
    try {
      await fetch(`/api/families/${activeFamily.family_id}/members/${memberId}/position`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_x: x, custom_y: y })
      });
    } catch (e) {
      console.error('Position save error', e);
    }
  };

  const members = activeFamily?.members || [];
  const filteredMembers = searchQuery
    ? members.filter(
        (m) =>
          m.pseudonym.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.conditions.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : members;

  return (
    <AuthGuard>
      <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5">
          {/* Top Clinical Lineage Advisory Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-teal-800 flex items-center justify-center text-white shadow-sm shrink-0">
                <GitBranch className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                    Clinical Lineage Advisory
                  </span>
                  {activeFamily?.is_consanguineous ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200">
                      Consanguineous Union (F = 0.0625)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                      Outbred Pedigree
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[11px] font-bold border border-teal-200">
                    NSGC Compliant
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-mono font-bold">
                    Zero-Knowledge E2EE
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Autonomous layered layout with couple/union nodes, consanguinity double-bar notation, and live
                  phenotype tracking compliant with ACMG/NSGC genetics recommendations.
                </p>
              </div>
            </div>

            {/* Family Switcher & Create Pedigree Launcher */}
            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
              {families.length > 0 && (
                <select
                  value={activeFamily?.family_id || ''}
                  onChange={(e) => {
                    const chosen = families.find((f) => f.family_id === e.target.value);
                    if (chosen) {
                      setActiveFamily(chosen);
                      setSelectedMember(null);
                    }
                  }}
                  className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-xs"
                >
                  {families.map((f) => (
                    <option key={f.family_id} value={f.family_id}>
                      {f.family_name} ({f.family_id})
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={() => setIsModuleAOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create Family Pedigree</span>
              </button>
            </div>
          </div>

          {/* Primary Toolbar Panel */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search member or condition..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            {/* Quick Actions and Exports */}
            <div className="flex items-center justify-between sm:justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setEditingMember(null);
                  setRelativeTarget(selectedMember || null);
                  setIsModuleBOpen(true);
                }}
                disabled={!activeFamily}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl shadow-xs transition disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {selectedMember
                    ? `Add Relative to ${selectedMember.display_label || selectedMember.pseudonym}`
                    : 'Add Relative (Module B)'}
                </span>
              </button>

              {activeFamily && (
                <ExportToolbar
                  familyId={activeFamily.family_id}
                  familyName={activeFamily.family_name}
                  shareToken={activeFamily.share_token}
                  members={members}
                />
              )}
            </div>
          </div>

          {/* Canvas & Inspection Side Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* Left 3 cols: Canvas */}
            <div className="lg:col-span-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
              {activeFamily ? (
                <>
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 text-xs text-slate-500 mb-2">
                    <span className="font-semibold text-slate-700">
                      Lineage: {activeFamily.family_name} ({activeFamily.family_id}) &bull;{' '}
                      {members.length} member{members.length === 1 ? '' : 's'} mapped
                    </span>
                    <span className="italic">Click node to inspect &bull; Drag to adjust position</span>
                  </div>

                  <PedigreeCanvas
                    members={filteredMembers}
                    isConsanguineous={activeFamily.is_consanguineous}
                    selectedMemberId={selectedMember?.id}
                    onSelectMember={(m) => setSelectedMember(m)}
                    onAddRelative={(m) => {
                      setSelectedMember(m);
                      setRelativeTarget(m);
                      setEditingMember(null);
                      setIsModuleBOpen(true);
                    }}
                    onPositionChange={handlePositionChange}
                  />
                </>
              ) : (
                <div className="h-[500px] flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                    <Users className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">No Pedigree Lineage Initialized</h3>
                    <p className="text-xs text-slate-500 max-w-sm mt-1">
                      Start your clinical genetics record by creating a new family pedigree chart.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModuleAOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-xl shadow-md transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Family Pedigree</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right 1 col: Selected Member Inspector */}
            <div className="lg:col-span-1 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2.5 mb-3 flex items-center justify-between">
                <span>Clinical Inspector</span>
                {selectedMember && (
                  <span className="text-teal-700 font-mono text-[11px]">
                    {selectedMember.display_label || selectedMember.generation}
                  </span>
                )}
              </h3>

              {selectedMember ? (
                <div className="space-y-4 text-xs">
                  {/* Member Badge & Identification */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-sm">
                        {selectedMember.pseudonym}
                      </span>
                      {selectedMember.is_proband && (
                        <span className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded font-bold text-[10px]">
                          PROBAND (P)
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 capitalize">
                      {selectedMember.sex} &bull; {selectedMember.relationship_to_proband.replace(/_/g, ' ')}
                    </div>
                    {selectedMember.age_or_age_at_death && (
                      <div className="text-slate-600">
                        {selectedMember.is_deceased
                          ? `Deceased (age ${selectedMember.age_or_age_at_death})`
                          : `Age: ${selectedMember.age_or_age_at_death} years`}
                      </div>
                    )}
                  </div>

                  {/* Phenotype / Carrier Status */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-600">Phenotypic Classification</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">AFFECTED</span>
                        <span className={selectedMember.is_affected ? 'font-bold text-teal-700' : 'text-slate-600'}>
                          {selectedMember.is_affected ? 'Yes (Solid Fill)' : 'No'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">CARRIER</span>
                        <span className={selectedMember.is_carrier ? 'font-bold text-teal-700' : 'text-slate-600'}>
                          {selectedMember.is_carrier ? 'Carrier (Central Dot)' : 'Non-carrier'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Documented Conditions */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-600">Clinical Conditions</span>
                    {selectedMember.conditions && selectedMember.conditions.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedMember.conditions.map((c, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-lg text-[10px] font-medium"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-[11px]">No conditions documented.</p>
                    )}
                  </div>

                  {/* Inspector Actions */}
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRelativeTarget(selectedMember);
                        setEditingMember(null);
                        setIsModuleBOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-800 text-white rounded-xl text-xs font-semibold hover:bg-teal-900 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Relative to this Person</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMember(selectedMember);
                          setRelativeTarget(null);
                          setIsModuleBOpen(true);
                        }}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteMember(selectedMember.id)}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-xl text-xs font-semibold transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-2">
                  <Info className="w-6 h-6 opacity-60" />
                  <p className="text-xs">
                    Select any individual on the canvas to inspect clinical genetics, carrier risk, or add relatives.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Module A Modal (Create Family) */}
      <ModuleAModal
        isOpen={isModuleAOpen}
        onClose={() => setIsModuleAOpen(false)}
        onSubmit={handleCreateFamily}
      />

      {/* Module B Modal (Add / Edit Relative) */}
      <ModuleBModal
        isOpen={isModuleBOpen}
        onClose={() => {
          setIsModuleBOpen(false);
          setEditingMember(null);
          setRelativeTarget(null);
        }}
        onSubmit={handleSaveMember}
        relativeTarget={relativeTarget}
        existingMember={editingMember}
        isFirstMember={!members || members.length === 0}
      />
      </div>
    </AuthGuard>
  );
}

