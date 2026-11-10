import {
  RelationshipTuple,
  EarlierGenTuple,
  FamilyHistoryTuple,
  PastPregnanciesTuple,
  ScreeningStatusTuple,
  DemographicOptionTuple,
} from './_types';

// Modern Unified Palette for Login Page
export const COLORS = {
  pine: '#0c322c',
  white: '#ffffff',
  jungle: '#30ba78',
  fog: '#efefef',
  midnight: '#192072',
  persimmon: '#fe7c3f',
  waterhole: '#2453ff',
  mint: '#90ebcd',
} as const;

// ==================== CLINICAL INBREEDING RISK MODEL DATA ====================
// Sourced directly from /Users/pankaj/Downloads/Family Health Risk Estimator.html
export const RELATIONSHIPS: RelationshipTuple[] = [
  ['fc', 'First cousins', 'Your parents are brothers or sisters (children of the same grandparents)', 1 / 16],
  ['sc', 'Second cousins', 'You share great-grandparents', 1 / 64],
  ['none', 'Unrelated', 'No known biological or genealogical relationship', 0],
  ['dfc', 'Double first cousins', 'Two brothers married two sisters, so you share both sets of grandparents', 1 / 8],
  ['fc1', 'First cousins once removed', 'For example, your partner is your first cousin’s child', 1 / 32],
  ['rem', 'Distant relatives (third cousins or beyond)', 'Same tribe or extended family, a more distant link', 1 / 256],
  ['un', 'Uncle and niece, or aunt and nephew', 'Second-degree biological relationship', 1 / 8],
  ['hs', 'Half siblings', 'Share one biological parent', 1 / 8],
];

export const EARLIER_GENERATIONS: EarlierGenTuple[] = [
  ['no', 'No', 'No known marriage between relatives in earlier generations', 0],
  ['yes', 'Yes', 'Parents, grandparents or earlier ancestors were also relatives (amplifies generational genetic overlap)', 0.0625],
  ['unsure', 'Unsure', 'Family history in earlier generations is incomplete or uncertain', 0.03125],
];

export const FAMILY_HISTORY: FamilyHistoryTuple[] = [
  ['no', 'No', 'No known condition in either family', 1.0],
  ['yes', 'Yes', 'Yes, known history or carrier in either family (e.g. Beta-Thalassemia, Sickle Cell Disease, Cystic Fibrosis, SMA)', 1.8],
  ['unsure', 'Unsure', 'Not sure or family history incomplete', 1.2],
];

export const PAST_PREGNANCIES: PastPregnanciesTuple[] = [
  ['1', 'No pregnancies yet, or all healthy', 1.0],
  ['1.5', 'Two or more miscarriages, or a child who was seriously ill/died without clear cause', 1.5],
];

export const SCREENING_STATUS: ScreeningStatusTuple[] = [
  ['1', 'Not done yet', 1.0],
  ['0.7', 'Done, and no concerns were found (CLIA/CAP carrier panel clear)', 0.7],
];

export const GENDER_OPTIONS: DemographicOptionTuple[] = [
  ['male', 'Male', 'Biological male partner assessment'],
  ['female', 'Female', 'Biological female partner assessment'],
];

export const RELATIONSHIP_STATUS_OPTIONS: DemographicOptionTuple[] = [
  ['planning', 'Planning to marry', 'Prospective couple preparing for premarital screening'],
  ['married', 'Already married', 'Married couple seeking hereditary and family planning insight'],
];

export const K_FACTOR = 0.487;

export const MOBILE_SLIDE_TITLES: Record<number, string> = {
  0: '1. Gender',
  1: '2. Relationship Status',
  2: '3. Consanguinity',
  3: 'Genetics Insight',
  4: '4. Amplified Risk',
  5: '5. Family History',
  6: 'Cultural Perspective',
  7: '6. Past Pregnancies',
  8: '7. Carrier Screening',
  9: 'Calculated Risk',
  10: 'Clinical Summary',
  11: 'Understanding Results',
};

