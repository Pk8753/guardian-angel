'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { PedigreeCanvas } from '@/components/pedigree/PedigreeCanvas';
import { FamilyWizardModal } from '@/components/pedigree/FamilyWizardModal';
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
  ArrowRight,
  Shield,
  Dna,
  FileText,
  Activity,
  AlertTriangle,
  Upload,
  HeartPulse,
  ExternalLink,
  UploadCloud,
  X
} from 'lucide-react';

export default function PedigreePage() {
  const [families, setFamilies] = useState<FamilyRecord[]>([]);
  const [activeFamily, setActiveFamily] = useState<FamilyRecord | null>(null);
  const [selectedMember, setSelectedMember] = useState<PedigreeMember | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'gen1' | 'gen2' | 'gen3'>('all');
  const [showGlossary, setShowGlossary] = useState(false);

  // Wizard Modal State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [editingMember, setEditingMember] = useState<PedigreeMember | null>(null);
  const [initialRelation, setInitialRelation] = useState<string | null>(null);

  // Modal State for Choosing: Continue with Existing vs Create New Pedigree Tree
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState<boolean>(false);
  const [isCreatingNewTree, setIsCreatingNewTree] = useState<boolean>(false);
  const [nextSequentialId, setNextSequentialId] = useState<string>('FA-000001');
  const [selectedExistingFamilyId, setSelectedExistingFamilyId] = useState<string>('');

  // Delete Tree Modal State
  const [deleteTreeModalOpen, setDeleteTreeModalOpen] = useState(false);
  const [targetFamilyToDelete, setTargetFamilyToDelete] = useState<string | null>(null);
  const [targetFamilyNameToDelete, setTargetFamilyNameToDelete] = useState<string>('');
  const [deleteWithMembers, setDeleteWithMembers] = useState(false);
  const [treeConfirmInput, setTreeConfirmInput] = useState('');
  const [isDeletingTree, setIsDeletingTree] = useState(false);
  const [deleteTreeError, setDeleteTreeError] = useState<string | null>(null);

  // Fetch Next Sequential Chart ID (FA-000001, FA-000002, ...)
  const fetchNextFamilyId = async () => {
    try {
      const res = await fetch('/api/families/next-id');
      if (res.ok) {
        const data = await res.json();
        if (data?.next_family_id) {
          setNextSequentialId(data.next_family_id);
          return data.next_family_id;
        }
      }
    } catch (e) {
      console.error('Failed to fetch next family ID:', e);
    }
    return 'FA-000001';
  };

  // Load user families from API with resilient active family restoration
  const loadFamilies = useCallback(async (preferredFamilyId?: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/families');
      if (res.ok) {
        const data = await res.json();
        const list: FamilyRecord[] = Array.isArray(data) ? data : data.families || [];
        if (list.length > 0) {
          setFamilies(list);

          // Priority order for restoring active family:
          // 1. Explicit preferredFamilyId argument
          // 2. URL search parameter ?family_id=...
          // 3. sessionStorage 'ga_active_family_id'
          // 4. Current in-memory activeFamily?.family_id
          // 5. Most recent family with members (member_count > 0)
          // 6. list[0].family_id
          let targetId = preferredFamilyId;
          if (!targetId && typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            targetId = urlParams.get('family_id') || undefined;
            if (!targetId) {
              targetId = sessionStorage.getItem('ga_active_family_id') || undefined;
            }
          }

          if (!targetId && activeFamily?.family_id) {
            targetId = activeFamily.family_id;
          }

          // If targetId is not found in list, fallback to first family with members or list[0]
          const exists = list.some((f) => f.family_id === targetId);
          if (!exists) {
            const withMembers = list.find((f: any) => (f.member_count || f.members?.length || 0) > 0);
            targetId = withMembers ? withMembers.family_id : list[0].family_id;
          }

          const famRes = await fetch(`/api/families/${targetId}`);
          if (famRes.ok) {
            const famData = await famRes.json();
            const fullFam = famData.family || famData;
            setActiveFamily(fullFam);

            // Persist to sessionStorage and URL without reloading
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('ga_active_family_id', fullFam.family_id);
              const url = new URL(window.location.href);
              if (url.searchParams.get('family_id') !== fullFam.family_id) {
                url.searchParams.set('family_id', fullFam.family_id);
                url.searchParams.delete('create');
                window.history.replaceState({}, '', url.pathname + url.search);
              }
            }

            if (fullFam.members && fullFam.members.length > 0) {
              setSelectedMember((prev) => {
                if (prev) {
                  return fullFam.members.find((m: PedigreeMember) => m.id === prev.id) || fullFam.members[0];
                }
                const proband = fullFam.members.find((m: PedigreeMember) => m.is_proband);
                return proband || fullFam.members[0];
              });
            } else {
              setSelectedMember(null);
            }
          }
          return list;
        } else {
          setFamilies([]);
          setActiveFamily(null);
          setSelectedMember(null);
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('ga_active_family_id');
          }
          return [];
        }
      }
      return [];
    } catch (e) {
      console.error('Failed to load families:', e);
      return [];
    } finally {
      setLoading(false);
    }
  }, [activeFamily?.family_id]);

  // Handle flow when user clicks "Create Family Pedigree"
  const handleOpenCreateTreeFlow = async () => {
    setEditingMember(null);
    setInitialRelation(null);
    const nextId = await fetchNextFamilyId();

    if (families.length > 0) {
      // User already has at least one pedigree tree: prompt them!
      setSelectedExistingFamilyId(activeFamily?.family_id || families[0].family_id);
      setIsChoiceModalOpen(true);
    } else {
      // No trees yet: directly start new tree wizard
      setIsCreatingNewTree(true);
      setWizardStep(1);
      setIsWizardOpen(true);
    }
  };

  useEffect(() => {
    let requestedCreate = false;
    let initialFamId: string | undefined = undefined;

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('create') === 'true') {
        requestedCreate = true;
        // Strip ?create=true immediately from browser URL to prevent re-triggering on refresh
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('create');
        window.history.replaceState({}, '', cleanUrl.pathname + (cleanUrl.search ? cleanUrl.search : ''));
      }
      initialFamId = params.get('family_id') || undefined;
    }

    loadFamilies(initialFamId).then((loadedFamilies) => {
      if (requestedCreate) {
        const familyList = Array.isArray(loadedFamilies) ? loadedFamilies : [];
        if (familyList.length > 0) {
          fetchNextFamilyId().then(() => {
            setSelectedExistingFamilyId(initialFamId || familyList[0].family_id);
            setIsChoiceModalOpen(true);
          });
        } else {
          setIsCreatingNewTree(true);
          setWizardStep(1);
          setIsWizardOpen(true);
        }
      }
    });
  }, []);

  // Handle Family Switcher
  const handleSelectFamily = async (famId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/families/${famId}`);
      if (res.ok) {
        const data = await res.json();
        const fullFam = data.family || data;
        setActiveFamily(fullFam);
        setSelectedMember(fullFam.members?.[0] || null);

        // Synchronize active family across sessionStorage and URL
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('ga_active_family_id', famId);
          const url = new URL(window.location.href);
          url.searchParams.set('family_id', famId);
          url.searchParams.delete('create');
          window.history.replaceState({}, '', url.pathname + url.search);
        }
      }
    } catch (e) {
      console.error('Error switching family:', e);
    } finally {
      setLoading(false);
    }
  };

  // Callback when a new family is created in Wizard (Step 1 + Step 2)
  const handleFamilyCreated = async (familyData: any, probandData: any) => {
    // 1. Create family via API
    const famRes = await fetch('/api/families', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(familyData)
    });

    if (!famRes.ok) {
      const errData = await famRes.json().catch(() => ({}));
      throw new Error(errData.message || 'Could not save your family tree to server. Please try again.');
    }

    const famResult = await famRes.json();
    const createdFamily = famResult.family || famResult;

    // 2. Add proband node to backend if provided
    let probandNode: PedigreeMember | null = null;
    if (probandData) {
      const pRes = await fetch(`/api/families/${createdFamily.family_id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(probandData)
      });

      if (!pRes.ok) {
        const pErr = await pRes.json().catch(() => ({}));
        throw new Error(pErr.message || 'Could not save the primary patient (proband).');
      }

      const pData = await pRes.json();
      const probandId = pData.member_id || Date.now();
      const probandPseudonym = pData.member?.pseudonym || probandData.pseudonym || 'Proband';

      probandNode = {
        id: probandId,
        family_id: createdFamily.family_id,
        pseudonym: probandPseudonym,
        full_name: probandData.full_name || probandPseudonym,
        relationship_to_proband: 'self',
        sex: probandData.sex || 'female',
        is_proband: true,
        is_deceased: false,
        is_carrier: false,
        is_affected: (probandData.conditions || []).length > 0,
        conditions: probandData.conditions || [],
        dob: probandData.dob,
        living_status: 'Alive',
        location: probandData.location
      };
    }

    createdFamily.members = probandNode ? [probandNode] : [];
    setActiveFamily(createdFamily);
    setSelectedMember(probandNode);
    setFamilies((prev) => [createdFamily, ...prev.filter((f) => f.family_id !== createdFamily.family_id)]);

    // Persist active family ID into sessionStorage and URL immediately
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ga_active_family_id', createdFamily.family_id);
      const url = new URL(window.location.href);
      url.searchParams.set('family_id', createdFamily.family_id);
      url.searchParams.delete('create');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  };

  // Callback when a relative is added in Step 3
  const handleAddMember = async (memberData: any) => {
    if (!activeFamily) throw new Error('No active family chart selected.');

    const res = await fetch(`/api/families/${activeFamily.family_id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memberData)
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Failed to save relative to server.');
    }

    const json = await res.json();
    const serverMemberId = json.member_id || Date.now();
    const serverPseudonym = json.member?.pseudonym || memberData.pseudonym || 'Relative';

    // Auto-refresh the pedigree tree immediately from server with all generational relationships
    const famRes = await fetch(`/api/families/${activeFamily.family_id}`);
    if (famRes.ok) {
      const famData = await famRes.json();
      const fullFam = famData.family || famData;
      setActiveFamily(fullFam);
    } else {
      const newMemberNode: PedigreeMember = {
        id: serverMemberId,
        family_id: activeFamily.family_id,
        pseudonym: serverPseudonym,
        full_name: memberData.full_name || serverPseudonym,
        relationship_to_proband: memberData.relationship_to_proband || 'relative',
        sex: memberData.sex || 'male',
        is_proband: false,
        is_deceased: memberData.is_deceased || false,
        is_carrier: memberData.is_carrier || false,
        is_affected: memberData.is_affected || false,
        conditions: memberData.conditions || [],
        fertility_conditions: memberData.fertility_conditions,
        inherited_conditions: memberData.inherited_conditions,
        chromosomal_conditions: memberData.chromosomal_conditions,
        gene_variant: memberData.gene_variant,
        genetic_testing_status: memberData.genetic_testing_status,
        carrier_details: memberData.carrier_details,
        test_results: memberData.test_results,
        age_at_diagnosis: memberData.age_at_diagnosis,
        medical_history: memberData.medical_history,
        dob: memberData.dob,
        living_status: memberData.living_status,
        location: memberData.location || activeFamily.members?.[0]?.location || ''
      };

      setActiveFamily((prev) => {
        if (!prev) return null;
        const existing = prev.members || [];
        return {
          ...prev,
          members: [...existing.filter((m) => m.id !== serverMemberId), newMemberNode]
        };
      });
    }

    // Refresh family list member counts
    fetch('/api/families')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          const list = Array.isArray(data) ? data : data.families || [];
          setFamilies(list);
        }
      })
      .catch(() => {});
  };

  // Callback when editing a member
  const handleUpdateMember = async (memberId: string | number, memberData: any) => {
    if (!activeFamily) throw new Error('No active family chart selected.');

    const res = await fetch(`/api/families/${activeFamily.family_id}/members/${memberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memberData)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update family member on server.');
    }

    const famRes = await fetch(`/api/families/${activeFamily.family_id}`);
    if (famRes.ok) {
      const famData = await famRes.json();
      const fullFam = famData.family || famData;
      setActiveFamily(fullFam);
    } else {
      setActiveFamily((prev) => {
        if (!prev) return null;
        const updated = (prev.members || []).map((m) =>
          m.id === memberId ? { ...m, ...memberData } : m
        );
        return { ...prev, members: updated };
      });
    }
  };

  // Delete Member
  const handleDeleteMember = async (memberId: string | number) => {
    if (!activeFamily) return;
    if (!confirm('Are you sure you want to remove this family member from your chart?')) return;

    setActiveFamily((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        members: (prev.members || []).filter((m) => m.id !== memberId)
      };
    });
    setSelectedMember(null);

    try {
      await fetch(`/api/families/${activeFamily.family_id}/members/${memberId}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.error('Delete member error', e);
    }
  };

  // Delete Family Chart Modal Trigger
  const openDeleteTreeModal = (familyId: string, familyName?: string) => {
    setTargetFamilyToDelete(familyId);
    setTargetFamilyNameToDelete(familyName || (activeFamily?.family_name || activeFamily?.name || 'Current Family Chart'));
    setDeleteWithMembers(false);
    setTreeConfirmInput('');
    setDeleteTreeError(null);
    setDeleteTreeModalOpen(true);
  };

  const closeDeleteTreeModal = () => {
    if (isDeletingTree) return;
    setDeleteTreeModalOpen(false);
    setTargetFamilyToDelete(null);
    setTreeConfirmInput('');
    setDeleteTreeError(null);
  };

  const handleConfirmDeleteTree = async () => {
    if (!targetFamilyToDelete) return;
    if (treeConfirmInput.trim().toLowerCase() !== 'confirm') {
      setDeleteTreeError('You must type "confirm" to proceed.');
      return;
    }

    setIsDeletingTree(true);
    setDeleteTreeError(null);

    try {
      const res = await fetch(`/api/families/${targetFamilyToDelete}?delete_members=${deleteWithMembers ? 'true' : 'false'}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delete_members: deleteWithMembers }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete family chart.');
      }

      // Update local family list
      const deletedId = targetFamilyToDelete;
      const updatedList = families.filter((f) => f.family_id !== deletedId);
      setFamilies(updatedList);

      if (updatedList.length > 0) {
        // Switch to the first remaining family
        const nextFamily = updatedList[0];
        handleSelectFamily(nextFamily.family_id);
      } else {
        // No families left: clear active family and session storage
        setActiveFamily(null);
        setSelectedMember(null);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('ga_active_family_id');
          const url = new URL(window.location.href);
          url.searchParams.delete('family_id');
          url.searchParams.delete('create');
          window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
        }
      }
      closeDeleteTreeModal();
    } catch (err: any) {
      console.error('Delete family error:', err);
      setDeleteTreeError(err.message || 'Failed to delete family chart. Please try again.');
    } finally {
      setIsDeletingTree(false);
    }
  };

  // Set as Proband
  const handleSetProband = async (member: PedigreeMember) => {
    if (!activeFamily) return;
    setActiveFamily((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        members: (prev.members || []).map((m) => ({
          ...m,
          is_proband: m.id === member.id
        }))
      };
    });

    try {
      await fetch(`/api/families/${activeFamily.family_id}/members/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_proband: true })
      });
    } catch (e) {
      console.error('Set proband error', e);
    }
  };

  // Drag position change
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

  // Filtered members by search query
  const searchedMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.pseudonym?.toLowerCase().includes(q) ||
        m.full_name?.toLowerCase().includes(q) ||
        m.relationship_to_proband?.toLowerCase().includes(q) ||
        m.gene_variant?.toLowerCase().includes(q) ||
        m.conditions?.some((c) => c.toLowerCase().includes(q))
    );
  }, [members, searchQuery]);

  return (
    <AuthGuard>
      <div className="flex h-screen bg-fog overflow-hidden font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar />

          <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-7 space-y-4 pb-24 md:pb-8">
            {/* ========================================================================= */}
            {/* Top Advisory Banner (Simple Words with Hover Tooltips)                   */}
            {/* ========================================================================= */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-pine text-white flex items-center justify-center shadow-xs shrink-0">
                  <GitBranch className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-xs font-bold text-pine uppercase tracking-wider"
                    >
                      Family Health Guidance
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Your visual family health tree. Automatically organizes generations, highlights shared health traits, and shows hereditary risks in simple diagrams.
                  </p>
                </div>
              </div>

              {/* Family Selector & Create Family Launcher */}
              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                {families.length > 0 && (
                  <select
                    value={activeFamily?.family_id || ''}
                    onChange={(e) => handleSelectFamily(e.target.value)}
                    className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700 shadow-xs"
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
                  onClick={handleOpenCreateTreeFlow}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-pine hover:bg-pine-light rounded-xl shadow-xs transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Family Pedigree</span>
                </button>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* Primary Toolbar Panel                                                     */}
            {/* ========================================================================= */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              {/* Search locus, phenotype, OMIM ID */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search trait, condition, or family relative..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
                />
              </div>

              {/* Generational Tier Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                {[
                  { id: 'all', label: 'All Generations' },
                  { id: 'gen1', label: 'Gen I (Grandparents)' },
                  { id: 'gen2', label: 'Gen II (Parents & You)' },
                  { id: 'gen3', label: 'Gen III (Children)' }
                ].map((tier) => (
                  <button
                    type="button"
                    key={tier.id}
                    onClick={() => setTierFilter(tier.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                      tierFilter === tier.id
                        ? 'bg-pine text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>

              {/* Action Buttons: Export & Add Family Member CTA */}
              <div className="flex items-center justify-between sm:justify-end gap-2.5">
                {activeFamily && (
                  <ExportToolbar
                    familyId={activeFamily.family_id}
                    familyName={activeFamily.family_name}
                    shareToken={activeFamily.share_token}
                    members={members}
                  />
                )}

                <button
                  type="button"
                  onClick={() => {
                    setEditingMember(null);
                    setInitialRelation(null);
                    setWizardStep(2);
                    setIsWizardOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Family Member</span>
                </button>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* Canvas (68%) & Inspector (32%) Grid Layout                                */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left 8 Cols (approx 68%): SVG Tree Canvas & Summary Metric Cards */}
              <div className="lg:col-span-8 space-y-4 flex flex-col">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col flex-1">
                  {activeFamily ? (
                    <>
                      {/* Family Tree Header */}
                      <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 text-xs text-slate-500 mb-3 gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-sm font-bold text-slate-900">
                            {activeFamily.family_name}
                          </h2>
                          <span className="px-2 py-0.5 rounded-md bg-mint/25 border border-mint text-pine font-mono text-[11px] font-bold">
                            Chart ID: {activeFamily.family_id}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{members.length} Member{members.length === 1 ? '' : 's'} Connected</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-slate-400 italic hidden sm:inline">
                            Click any person to view health details &bull; Drag to move
                          </span>
                          <button
                            type="button"
                            onClick={() => openDeleteTreeModal(activeFamily.family_id, activeFamily.family_name || activeFamily.name)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-700 border border-rose-200 rounded-lg transition shadow-2xs cursor-pointer"
                            title="Delete this family chart"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete Chart</span>
                          </button>
                        </div>
                      </div>

                      {/* Interactive SVG Tree Canvas */}
                      <PedigreeCanvas
                        members={searchedMembers}
                        isConsanguineous={activeFamily.is_consanguineous}
                        selectedMemberId={selectedMember?.id}
                        onSelectMember={(m) => setSelectedMember(m)}
                        onPositionChange={handlePositionChange}
                        filterTier={tierFilter}
                      />
                    </>
                  ) : (
                    <div className="h-[520px] flex flex-col items-center justify-center text-center p-8 space-y-4">
                      <div className="w-16 h-16 rounded-3xl bg-mint/25 border border-mint flex items-center justify-center text-pine shadow-xs">
                        <Users className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">
                          No Family Tree Created Yet
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm mt-1">
                          Build your family health chart in 3 easy steps. Tell us about your family, check your details, and add your relatives.
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap justify-center">
                        <button
                          type="button"
                          onClick={handleOpenCreateTreeFlow}
                          className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold text-white bg-pine hover:bg-pine-light rounded-xl shadow-md transition cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Create Family Pedigree</span>
                        </button>
                        <Link
                          href="/dashboard?upload=true"
                          className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold bg-mint/25 hover:bg-mint/40 text-pine border border-mint rounded-xl shadow-xs transition cursor-pointer"
                        >
                          <UploadCloud className="w-4 h-4 text-pine" />
                          <span>Upload Screening Report</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right 4 Cols (approx 32%): Active Pedigree Selection Inspector */}
              <div className="lg:col-span-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Selected Family Member
                  </h3>
                  {selectedMember && (
                    <span className="text-pine font-mono text-[11px] font-bold bg-mint/25 px-2 py-0.5 rounded-md border border-mint">
                      ID: {selectedMember.display_label || `PED-${selectedMember.generation || 'II'}-${selectedMember.id}`}
                    </span>
                  )}
                </div>

                {selectedMember ? (
                  <div className="space-y-4 text-xs flex-1">
                    {/* Top Identity Card */}
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-white border-2 border-teal-800 flex items-center justify-center text-pine font-bold text-sm shadow-xs shrink-0">
                          {selectedMember.sex === 'male' ? 'M' : selectedMember.sex === 'female' ? 'F' : 'U'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm truncate">
                              {selectedMember.full_name || selectedMember.pseudonym}
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px] mt-0.5 capitalize">
                            {selectedMember.relationship_to_proband.replace(/_/g, ' ')} &bull;{' '}
                            {selectedMember.dob ? `DOB ${selectedMember.dob}` : 'DOB Not Specified'} &bull;{' '}
                            {selectedMember.location || 'Location Not Specified'}
                          </p>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] border ${
                            selectedMember.is_affected
                              ? 'bg-teal-100 text-pine border-teal-300'
                              : selectedMember.is_carrier
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {selectedMember.is_affected
                            ? 'Has Health Condition'
                            : selectedMember.is_carrier
                            ? 'Carrier Status'
                            : 'Unaffected'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 font-mono text-[10px] font-bold">
                          {selectedMember.omim_locus || 'OMIM 300377'}
                        </span>
                      </div>
                    </div>

                    {/* Identified Variant Card */}
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Identified Health Trait / Gene
                      </span>
                      <div className="space-y-1 text-xs">
                        <div className="font-mono font-bold text-pine text-xs">
                          {selectedMember.gene_variant || 'HBB:c.315+1G>A'}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          Classification:{' '}
                          <span className="font-bold text-red-700">
                            Pathogenic (Inherited Risk)
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          Carrier Status:{' '}
                          <span className="font-semibold text-slate-800">
                            {selectedMember.carrier_details || 'Heterozygous Carrier'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Reported Conditions Card */}
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Reported Health Conditions
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedMember.conditions && selectedMember.conditions.length > 0 ? (
                          selectedMember.conditions.map((c, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-white border border-slate-300 text-slate-800 rounded-md text-[11px] font-semibold"
                            >
                              {c}
                            </span>
                          ))
                        ) : (
                          <>
                            <span className="px-2 py-0.5 bg-white border border-slate-300 text-slate-800 rounded-md text-[11px] font-semibold">
                              Beta-Thalassemia Trait
                            </span>
                            <span className="px-2 py-0.5 bg-white border border-slate-300 text-slate-800 rounded-md text-[11px] font-semibold">
                              Mild Anemia
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                        {selectedMember.medical_history ||
                          'Diagnosed during genetic screening. Good general health reported.'}
                      </p>
                    </div>

                    {/* Attached Report Card */}
                    {selectedMember.medical_report_name && (
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-pine font-semibold">
                          <FileText className="w-4 h-4" />
                          <span>{selectedMember.medical_report_name}</span>
                        </div>
                        <span className="text-[10px] bg-teal-100 text-pine px-2 py-0.5 rounded font-bold">
                          Attached Report
                        </span>
                      </div>
                    )}

                    {/* Inspector Action Buttons */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMember(selectedMember);
                          setWizardStep(2);
                          setIsWizardOpen(true);
                        }}
                        className="w-full py-2 px-3 bg-pine hover:bg-pine-light text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Details &amp; Health Conditions</span>
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMember(selectedMember);
                            setWizardStep(2);
                            setIsWizardOpen(true);
                          }}
                          className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingMember(null);
                            setInitialRelation(null);
                            setWizardStep(2);
                            setIsWizardOpen(true);
                          }}
                          className="py-1.5 px-3 bg-mint/25 hover:bg-teal-100 text-pine border border-mint rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add Relative</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteMember(selectedMember.id)}
                        className="w-full py-1.5 px-3 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove from Tree</span>
                      </button>
                    </div>

                    {/* Genetic Risk Notice in Simple Words */}
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                        <span>Hereditary Health Guidance</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-amber-800">
                        When both partners carry an inherited carrier trait (such as Thalassemia or Sickle Cell), there is a 25% chance in each pregnancy that the child may inherit both genes. Pre-marital genetic counseling is recommended.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                    <Info className="w-7 h-7 opacity-50" />
                    <p className="text-xs">
                      Click on any family member in the chart to see their health details, carrier traits, or add relatives.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>

        {/* ========================================================================= */}
        {/* Family Tree Choice Modal (Continue Existing vs Create New Tree)           */}
        {/* ========================================================================= */}
        {isChoiceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-pine text-white flex items-center justify-center shadow-xs">
                    <GitBranch className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Family Pedigree Tree Options
                    </h3>
                    <p className="text-xs text-slate-500">
                      You have {families.length} family tree{families.length === 1 ? '' : 's'} in your records
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChoiceModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 text-xs">
                <p className="text-slate-600 text-xs">
                  Would you like to continue with an existing pedigree tree or create a new pedigree tree?
                </p>

                <div className="space-y-3">
                  {/* Option 1: Continue with Existing Tree */}
                  <div className="p-4 rounded-2xl border-2 border-slate-200 hover:border-teal-700 bg-white transition space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            Continue with Existing Tree
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-mint/25 border border-mint text-pine font-mono text-[11px] font-bold">
                            {selectedExistingFamilyId || activeFamily?.family_id}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Open your existing tree to view connections or add more relatives.
                        </p>
                      </div>
                    </div>

                    {/* Selector if multiple trees exist */}
                    {families.length > 1 && (
                      <div className="pt-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Select Tree:
                        </label>
                        <select
                          value={selectedExistingFamilyId || activeFamily?.family_id || ''}
                          onChange={(e) => setSelectedExistingFamilyId(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                        >
                          {families.map((f) => (
                            <option key={f.family_id} value={f.family_id}>
                              {f.family_name || f.name} ({f.family_id}) &bull; {f.member_count ?? 1} members
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const targetId = selectedExistingFamilyId || activeFamily?.family_id || families[0].family_id;
                          handleSelectFamily(targetId);
                          setIsChoiceModalOpen(false);
                          setIsCreatingNewTree(false);
                          setEditingMember(null);
                          setInitialRelation(null);
                          setWizardStep(2);
                          setIsWizardOpen(true);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-pine hover:bg-pine-light text-white rounded-xl text-xs font-bold transition shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Relatives to this Tree</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const targetId = selectedExistingFamilyId || activeFamily?.family_id || families[0].family_id;
                          handleSelectFamily(targetId);
                          setIsChoiceModalOpen(false);
                        }}
                        className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                      >
                        View Chart
                      </button>
                    </div>
                  </div>

                  {/* Option 2: Create New Tree */}
                  <div className="p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 hover:border-emerald-600 transition space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            Create New Pedigree Tree
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-mono text-[11px] font-bold border border-emerald-300">
                            {nextSequentialId}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">
                          Start a new pedigree tree with sequential Chart ID <strong className="font-mono text-emerald-900">{nextSequentialId}</strong>.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsChoiceModalOpen(false);
                        setIsCreatingNewTree(true);
                        setEditingMember(null);
                        setInitialRelation(null);
                        setWizardStep(1);
                        setIsWizardOpen(true);
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Start New Pedigree Tree ({nextSequentialId})</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* Family Wizard Modal (Step 1 -> Step 2 -> Step 3)                          */}
        {/* ========================================================================= */}
        <FamilyWizardModal
          isOpen={isWizardOpen}
          onClose={() => {
            setIsWizardOpen(false);
            setIsCreatingNewTree(false);
            setEditingMember(null);
            setInitialRelation(null);
            if (activeFamily?.family_id) {
              loadFamilies(activeFamily.family_id);
            }
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              if (url.searchParams.has('create')) {
                url.searchParams.delete('create');
                window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
              }
            }
          }}
          onFamilyCreated={handleFamilyCreated}
          onAddMember={handleAddMember}
          onUpdateMember={handleUpdateMember}
          existingFamily={isCreatingNewTree ? null : activeFamily}
          initialStep={wizardStep}
          editingMember={editingMember}
          initialRelation={initialRelation}
          newFamilyId={isCreatingNewTree ? nextSequentialId : null}
        />

        {/* ==================== DELETE TREE CONFIRMATION MODAL ==================== */}
        {deleteTreeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-900">
                      Delete Family Chart
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {targetFamilyNameToDelete || 'Selected Tree'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeDeleteTreeModal}
                  disabled={isDeletingTree}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scope Choice Options */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Choose deletion scope:
                </label>

                <div className="grid grid-cols-1 gap-2.5">
                  {/* Option 1: Delete Tree Only */}
                  <label
                    onClick={() => setDeleteWithMembers(false)}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition select-none ${
                      !deleteWithMembers
                        ? 'border-pine bg-mint/10 ring-1 ring-pine'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deleteTreeScope"
                      checked={!deleteWithMembers}
                      onChange={() => setDeleteWithMembers(false)}
                      className="mt-0.5 text-pine focus:ring-pine"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Delete only tree
                      </span>
                      <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                        Removes this pedigree chart. All members and their health dossiers will be preserved in your database and profile.
                      </span>
                    </div>
                  </label>

                  {/* Option 2: Delete Tree + Users */}
                  <label
                    onClick={() => setDeleteWithMembers(true)}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition select-none ${
                      deleteWithMembers
                        ? 'border-rose-500 bg-rose-50/70 ring-1 ring-rose-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deleteTreeScope"
                      checked={deleteWithMembers}
                      onChange={() => setDeleteWithMembers(true)}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-rose-900 block">
                        Delete tree and users in this tree
                      </span>
                      <span className="text-[11px] text-rose-700 leading-relaxed block mt-0.5">
                        Permanently removes this chart AND deletes all users/members in this tree from your account, including from the Patient Profile &amp; Details page.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Confirmation Input Prompt */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  To confirm deletion, type <span className="font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">confirm</span> below:
                </label>
                <input
                  type="text"
                  value={treeConfirmInput}
                  onChange={(e) => setTreeConfirmInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && treeConfirmInput.trim().toLowerCase() === 'confirm' && !isDeletingTree) {
                      handleConfirmDeleteTree();
                    }
                  }}
                  placeholder='type "confirm"'
                  autoFocus
                  className="w-full h-11 px-3.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none font-mono"
                />
              </div>

              {/* Error message */}
              {deleteTreeError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                  {deleteTreeError}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeDeleteTreeModal}
                  disabled={isDeletingTree}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteTree}
                  disabled={treeConfirmInput.trim().toLowerCase() !== 'confirm' || isDeletingTree}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-xs transition cursor-pointer"
                >
                  {isDeletingTree ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isDeletingTree ? 'Deleting...' : (deleteWithMembers ? 'Delete Tree & Users' : 'Delete Tree Only')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
