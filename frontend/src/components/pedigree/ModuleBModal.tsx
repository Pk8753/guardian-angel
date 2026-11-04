'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { memberSchema, MemberFormData } from '@/lib/validations/pedigree';
import { PedigreeMember, ConditionCatalogItem } from './types';
import { X, UserPlus, AlertCircle, HeartPulse, Check, Pin } from 'lucide-react';

interface ModuleBModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MemberFormData) => Promise<void>;
  relativeTarget?: PedigreeMember | null;
  existingMember?: PedigreeMember | null;
  isFirstMember?: boolean;
}

const RELATION_OPTIONS = [
  { value: 'self', label: 'Proband (Self)' },
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'full_sibling', label: 'Full sibling' },
  { value: 'half_sibling_father', label: 'Half sibling (via father)' },
  { value: 'half_sibling_mother', label: 'Half sibling (via mother)' },
  { value: 'twin_identical', label: 'Twin (identical)' },
  { value: 'twin_fraternal', label: 'Twin (fraternal)' },
  { value: 'spouse', label: 'Spouse / Partner' },
  { value: 'son', label: 'Son' },
  { value: 'daughter', label: 'Daughter' },
  { value: 'paternal_uncle', label: 'Paternal uncle' },
  { value: 'paternal_aunt', label: 'Paternal aunt' },
  { value: 'maternal_uncle', label: 'Maternal uncle' },
  { value: 'maternal_aunt', label: 'Maternal aunt' },
  { value: 'paternal_grandfather', label: 'Paternal Grandfather' },
  { value: 'paternal_grandmother', label: 'Paternal Grandmother' },
  { value: 'maternal_grandfather', label: 'Maternal Grandfather' },
  { value: 'maternal_grandmother', label: 'Maternal Grandmother' },
  { value: 'first_cousin', label: 'First Cousin' },
  { value: 'adopted_child', label: 'Adopted child' },
  { value: 'pregnancy_loss', label: 'Pregnancy loss' }
];

export const ModuleBModal: React.FC<ModuleBModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  relativeTarget,
  existingMember,
  isFirstMember = false
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conditionsCatalog, setConditionsCatalog] = useState<ConditionCatalogItem[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>(
    existingMember?.conditions || []
  );

  // Fetch conditions catalog on mount
  useEffect(() => {
    fetch('/api/conditions')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setConditionsCatalog(data);
        }
      })
      .catch(() => {
        // Fallback clinical conditions if network error
        setConditionsCatalog([
          { id: 'hbb', name: 'Beta-Thalassemia Major', category: 'inherited', inheritance_pattern: 'AR', flag_india_pinned: true },
          { id: 'sca', name: 'Sickle Cell Anemia', category: 'inherited', inheritance_pattern: 'AR', flag_india_pinned: true },
          { id: 'sma', name: 'Spinal Muscular Atrophy (SMA)', category: 'inherited', inheritance_pattern: 'AR', flag_india_pinned: true },
          { id: 'cftr', name: 'Cystic Fibrosis', category: 'inherited', inheritance_pattern: 'AR', flag_india_pinned: false },
          { id: 'brca1', name: 'Hereditary Breast & Ovarian Cancer (BRCA1/2)', category: 'inherited', inheritance_pattern: 'AD', flag_india_pinned: true },
          { id: 'downs', name: 'Down Syndrome (Trisomy 21)', category: 'chromosomal', inheritance_pattern: 'Chromosomal', flag_india_pinned: false },
          { id: 'turner', name: 'Turner Syndrome (45,X)', category: 'chromosomal', inheritance_pattern: 'Chromosomal', flag_india_pinned: false },
          { id: 'kline', name: 'Klinefelter Syndrome (47,XXY)', category: 'chromosomal', inheritance_pattern: 'Chromosomal', flag_india_pinned: false },
          { id: 'azoospermia', name: 'Non-obstructive Azoospermia (AZF microdeletion)', category: 'fertility', inheritance_pattern: 'Y-linked', flag_india_pinned: false },
          { id: 'poi', name: 'Premature Ovarian Insufficiency (FMR1 premutation)', category: 'fertility', inheritance_pattern: 'X-linked', flag_india_pinned: false }
        ]);
      });
  }, []);

  const defaultRelation = isFirstMember
    ? 'self'
    : existingMember?.relationship_to_proband || 'full_sibling';

  const defaultSex =
    existingMember?.sex ||
    (defaultRelation === 'father' || defaultRelation === 'son' || defaultRelation.includes('uncle') || defaultRelation.includes('grandfather')
      ? 'male'
      : defaultRelation === 'mother' || defaultRelation === 'daughter' || defaultRelation.includes('aunt') || defaultRelation.includes('grandmother')
      ? 'female'
      : defaultRelation === 'pregnancy_loss'
      ? 'pregnancy_loss'
      : 'female');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      pseudonym: existingMember?.pseudonym || (isFirstMember ? 'Proband (Self)' : 'Relative Member'),
      sex: defaultSex as any,
      relationship_to_proband: defaultRelation,
      is_proband: isFirstMember ? true : existingMember?.is_proband || false,
      is_deceased: existingMember?.is_deceased || false,
      age_or_age_at_death: existingMember?.age_or_age_at_death ?? null,
      cause_of_death: existingMember?.cause_of_death || '',
      is_carrier: existingMember?.is_carrier || false,
      is_affected: existingMember?.is_affected || false,
      conditions: existingMember?.conditions || [],
      notes: existingMember?.notes || ''
    }
  });

  const isDeceased = watch('is_deceased');
  const watchedRelation = watch('relationship_to_proband');

  // Auto-set sex when selecting gendered relationships
  useEffect(() => {
    if (watchedRelation === 'father' || watchedRelation === 'son' || watchedRelation.includes('uncle') || watchedRelation.includes('grandfather')) {
      setValue('sex', 'male');
    } else if (watchedRelation === 'mother' || watchedRelation === 'daughter' || watchedRelation.includes('aunt') || watchedRelation.includes('grandmother')) {
      setValue('sex', 'female');
    } else if (watchedRelation === 'pregnancy_loss') {
      setValue('sex', 'pregnancy_loss');
    }
  }, [watchedRelation, setValue]);

  const toggleCondition = (condName: string) => {
    const updated = selectedConditions.includes(condName)
      ? selectedConditions.filter((c) => c !== condName)
      : [...selectedConditions, condName];
    setSelectedConditions(updated);
    setValue('conditions', updated);
  };

  const handleFormSubmit = async (values: MemberFormData) => {
    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({
        ...values,
        conditions: selectedConditions
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save relative');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">
                {isFirstMember
                  ? 'Step 2: Add Index Proband (Self)'
                  : existingMember
                  ? `Edit Individual (${existingMember.display_label || existingMember.pseudonym})`
                  : relativeTarget
                  ? `Add Relative to ${relativeTarget.pseudonym} (${relativeTarget.display_label || ''})`
                  : 'Add Family Member (Module B)'}
              </h3>
              <p className="text-xs text-slate-500">
                NSGC pedigree standardization with categorized hereditary conditions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Name / Pseudonym
              </label>
              <input
                type="text"
                {...register('pseudonym')}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                placeholder="e.g. Kabir or II-3"
              />
              {errors.pseudonym && (
                <p className="text-xs text-red-600 mt-1">{errors.pseudonym.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Relationship to Proband
              </label>
              <select
                {...register('relationship_to_proband')}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              >
                {RELATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Biological Sex (NSGC Symbol)
              </label>
              <select
                {...register('sex')}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              >
                <option value="male">Male (Square)</option>
                <option value="female">Female (Circle)</option>
                <option value="other">Unknown / Other (Diamond)</option>
                <option value="pregnancy_loss">Pregnancy Loss (Triangle)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Age / Age at Death
              </label>
              <input
                type="number"
                {...register('age_or_age_at_death', { valueAsNumber: true })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                placeholder="e.g. 29"
              />
            </div>
          </div>

          {/* Clinical Checkboxes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
              <input
                type="checkbox"
                {...register('is_proband')}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
              />
              <span className="text-xs font-medium text-slate-800">Proband (P)</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
              <input
                type="checkbox"
                {...register('is_affected')}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
              />
              <span className="text-xs font-medium text-slate-800">Affected (Solid)</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
              <input
                type="checkbox"
                {...register('is_carrier')}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
              />
              <span className="text-xs font-medium text-slate-800">Carrier (Dot)</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
              <input
                type="checkbox"
                {...register('is_deceased')}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
              />
              <span className="text-xs font-medium text-slate-800">Deceased (Slash)</span>
            </label>
          </div>

          {isDeceased && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cause of Death (Optional)
              </label>
              <input
                type="text"
                {...register('cause_of_death')}
                placeholder="e.g. Myocardial infarction or unknown"
                className="w-full px-3.5 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          )}

          {/* Genetic Conditions Catalog */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <HeartPulse className="w-4 h-4 text-teal-600" />
                <span>Documented Genetic Conditions</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {selectedConditions.length} selected
              </span>
            </div>

            {/* India Pinned Priority Conditions */}
            <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/70">
              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 mb-1.5">
                <Pin className="w-3.5 h-3.5 text-amber-600" />
                <span>India Priority Clinical Screening (High Prevalence)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {conditionsCatalog
                  .filter((c) => c.flag_india_pinned)
                  .map((cond) => {
                    const isChecked = selectedConditions.includes(cond.name);
                    return (
                      <button
                        key={cond.id}
                        type="button"
                        onClick={() => toggleCondition(cond.name)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                          isChecked
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-100/50'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3" />}
                        {cond.name}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* All Categorized Conditions */}
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {['inherited', 'chromosomal', 'fertility'].map((categoryKey) => {
                const list = conditionsCatalog.filter(
                  (c) => (c.category || '').toLowerCase() === categoryKey && !c.flag_india_pinned
                );
                if (list.length === 0) return null;
                const categoryTitle =
                  categoryKey === 'inherited'
                    ? 'Monogenic Inherited Conditions'
                    : categoryKey === 'chromosomal'
                    ? 'Chromosomal Aneuploidies'
                    : 'Fertility & Reproductive Risk';

                return (
                  <div key={categoryKey} className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {categoryTitle}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {list.map((cond) => {
                        const isChecked = selectedConditions.includes(cond.name);
                        return (
                          <button
                            key={cond.id}
                            type="button"
                            onClick={() => toggleCondition(cond.name)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                              isChecked
                                ? 'bg-teal-700 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3" />}
                            {cond.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Clinical Clinical Notes / Consanguinity Details
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="e.g. Diagnosed at age 14 via hemoglobin electrophoresis"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : existingMember ? 'Update Member' : 'Save & Render Node'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

