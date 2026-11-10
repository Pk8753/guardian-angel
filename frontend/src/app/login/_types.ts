export type Gender = 'male' | 'female';
export type RelStatus = 'planning' | 'married';
export type RiskBandLevel = 'ok' | 'mid' | 'hi';
export type AuthMode = 'signin' | 'register';
export type SlideDirection = 'next' | 'prev';

export type RelationshipTuple = [id: string, label: string, description: string, fScore: number];
export type EarlierGenTuple = [id: string, label: string, description: string, faScore: number];
export type FamilyHistoryTuple = [id: string, label: string, description: string, multiplier: number];
export type PastPregnanciesTuple = [id: string, label: string, multiplier: number];
export type ScreeningStatusTuple = [id: string, label: string, multiplier: number];
export type DemographicOptionTuple = [id: string, label: string, description: string];

export interface EstimateResult {
  currentF: number;
  currentL: number;
  currentExtra: number;
  rangeLo: number;
  rangeHi: number;
  totalChance: number;
  oneInCount: number;
  isStarted: boolean;
  riskBandLevel: RiskBandLevel;
  riskBandTitle: string;
  riskBandDesc: string;
}

export interface FieldErrors {
  [key: string]: boolean;
}

export interface FlippedTiles {
  [key: string]: boolean;
}

