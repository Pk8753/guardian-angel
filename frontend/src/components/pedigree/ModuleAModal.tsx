'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { familySchema, FamilyFormData } from '@/lib/validations/pedigree';
import { X, Users, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ModuleAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FamilyFormData & { family_id?: string }) => Promise<void>;
  initialData?: Partial<FamilyFormData> & { family_id?: string };
}

export const ModuleAModal: React.FC<ModuleAModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<FamilyFormData>({
    resolver: zodResolver(familySchema),
    defaultValues: {
      family_name: initialData?.family_name || 'Primary Pedigree Lineage',
      proband_name: initialData?.proband_name || 'Index Proband',
      is_consanguineous: initialData?.is_consanguineous || false,
      consanguinity_notes: initialData?.consanguinity_notes || ''
    }
  });

  const isConsanguineous = watch('is_consanguineous');

  if (!isOpen) return null;

  const handleFormSubmit = async (values: FamilyFormData) => {
    try {
      setSubmitting(true);
      setError(null);
      await onSubmit(values);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save family details');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">
                {initialData ? 'Edit Family Lineage' : 'Step 1: Family Record Creation (Module A)'}
              </h3>
              <p className="text-xs text-slate-500">
                System auto-assigns Family ID (e.g. F-000123) and cryptographically sealed share link
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
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Family Title / Lineage Identifier
            </label>
            <input
              type="text"
              {...register('family_name')}
              placeholder="e.g. Sharma-Kapoor Maternal Pedigree"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
            />
            {errors.family_name && (
              <p className="text-xs text-red-600 mt-1">{errors.family_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Proband / Index Case Reference
            </label>
            <input
              type="text"
              {...register('proband_name')}
              placeholder="e.g. Kabir Sharma (Self / Proband)"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
            />
            {errors.proband_name && (
              <p className="text-xs text-red-600 mt-1">{errors.proband_name.message}</p>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                {...register('is_consanguineous')}
                className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800">
                  Biological Consanguinity Present in Union
                </span>
                <p className="text-slate-500">
                  Enables double horizontal union lines (=) and heightened recessive variant screening.
                </p>
              </div>
            </label>
          </div>

          {isConsanguineous && (
            <div className="pl-7 space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Consanguinity Details (e.g., First Cousins, Uncle-Niece)
              </label>
              <input
                type="text"
                {...register('consanguinity_notes')}
                placeholder="e.g. First cousins via maternal grandparents"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>ACMG/NSGC pedigree compliance</span>
            </div>
            <div className="flex items-center gap-2">
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
                {submitting ? 'Saving...' : initialData ? 'Save Changes' : 'Create & Proceed'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

