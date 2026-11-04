import { z } from 'zod';

export const familySchema = z.object({
  family_name: z.string().min(1, 'Family name is required').default('Primary Pedigree Lineage'),
  proband_name: z.string().min(1, 'Proband name is required').default('Index Proband'),
  is_consanguineous: z.boolean().default(false),
  consanguinity_notes: z.string().optional().default(''),
  share_enabled: z.boolean().optional().default(false)
});

export type FamilyFormData = z.infer<typeof familySchema>;

export const memberSchema = z.object({
  pseudonym: z.string().min(1, 'Name or pseudonym is required'),
  sex: z.enum(['male', 'female', 'other', 'unknown', 'pregnancy_loss']).default('female'),
  relationship_to_proband: z.string().default('full_sibling'),
  is_proband: z.boolean().default(false),
  is_deceased: z.boolean().default(false),
  age_or_age_at_death: z.number().nullable().optional(),
  cause_of_death: z.string().optional(),
  is_carrier: z.boolean().default(false),
  is_affected: z.boolean().default(false),
  conditions: z.array(z.string()).default([]),
  notes: z.string().optional(),
  target_relative_id: z.union([z.number(), z.string()]).nullable().optional(),
  father_id: z.union([z.number(), z.string()]).nullable().optional(),
  mother_id: z.union([z.number(), z.string()]).nullable().optional(),
  custom_x: z.number().nullable().optional(),
  custom_y: z.number().nullable().optional()
});

export type MemberFormData = z.infer<typeof memberSchema>;
