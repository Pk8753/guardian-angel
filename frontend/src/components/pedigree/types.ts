export type Sex = 'male' | 'female' | 'other' | 'unknown' | 'pregnancy_loss';

export type RelationType =
  | 'self'
  | 'father'
  | 'mother'
  | 'full_sibling'
  | 'half_sibling_father'
  | 'half_sibling_mother'
  | 'twin_identical'
  | 'twin_fraternal'
  | 'spouse'
  | 'partner'
  | 'son'
  | 'daughter'
  | 'paternal_uncle'
  | 'paternal_aunt'
  | 'maternal_uncle'
  | 'maternal_aunt'
  | 'paternal_grandfather'
  | 'paternal_grandmother'
  | 'maternal_grandfather'
  | 'maternal_grandmother'
  | 'first_cousin'
  | 'adopted_child'
  | 'pregnancy_loss';

export interface ConditionCatalogItem {
  id: string;
  name: string;
  category: 'inherited' | 'chromosomal' | 'fertility' | string;
  inheritance_pattern: string;
  omim_id?: string;
  flag_india_pinned?: boolean;
}

export interface PedigreeMember {
  id: number | string;
  family_id: string;
  pseudonym: string;
  generation?: string; // 'I', 'II', 'III', 'IV'
  generation_index?: number;
  order_in_generation?: number;
  display_label?: string; // e.g. "II-3"
  sex: Sex;
  relationship_to_proband: string;
  is_proband: boolean;
  is_deceased: boolean;
  age_or_age_at_death?: number | null;
  cause_of_death?: string | null;
  is_carrier: boolean;
  is_affected: boolean;
  conditions: string[];
  notes?: string;
  father_id?: number | string | null;
  mother_id?: number | string | null;
  spouse_ids?: (number | string)[];
  twin_group_id?: string | null;
  is_identical_twin?: boolean;
  custom_x?: number | null;
  custom_y?: number | null;
  // Computed layout coordinates
  x?: number;
  y?: number;
}

export interface PedigreeUnion {
  id: string;
  parent1_id: number | string;
  parent2_id: number | string;
  is_consanguineous?: boolean;
  x: number; // midpoint
  y: number; // union horizontal line y
  children_ids: (number | string)[];
}

export interface FamilyRecord {
  id: string;
  family_id: string; // e.g. "F-000123"
  family_name: string;
  proband_name: string;
  is_consanguineous: boolean;
  consanguinity_notes?: string;
  created_at: string;
  updated_at: string;
  share_token?: string;
  share_status?: 'private' | 'link_shared' | 'consult_shared';
  members?: PedigreeMember[];
}

