import {
  RELATIONSHIPS,
  EARLIER_GENERATIONS,
  FAMILY_HISTORY,
  PAST_PREGNANCIES,
  SCREENING_STATUS,
  K_FACTOR,
} from './_constants';
import { EstimateResult, Gender, RelStatus, RiskBandLevel } from './_types';

export const computeEstimate = (
  rI: number | null,
  gI: number | null,
  hI: number | null,
  pI: number | null,
  sI: number | null
) => {
  const rVal = rI !== null ? RELATIONSHIPS[rI][3] : 0;
  const faVal = gI !== null ? EARLIER_GENERATIONS[gI][3] : 0;
  const fVal = rVal * (1 + faVal);
  const histVal = hI !== null ? FAMILY_HISTORY[hI][3] : 1.0;
  const pregVal = pI !== null ? PAST_PREGNANCIES[pI][2] : 1.0;
  const scrVal = sI !== null ? SCREENING_STATUS[sI][2] : 1.0;
  let lVal = histVal * pregVal * scrVal;
  lVal = Math.min(lVal, 3.0);
  const exRisk = (1 - Math.exp(-K_FACTOR * fVal * lVal)) * 100;
  return { fVal, lVal, exRisk };
};

export const formatPct = (val: number): string =>
  val >= 0.1 ? val.toFixed(1) + '%' : val.toFixed(2) + '%';

export const isValidEmail = (email: string): boolean => {
  return /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(email.trim());
};

export const getRiskBand = (
  isStarted: boolean,
  sameCarrier: boolean,
  currentF: number,
  currentExtra: number
): { riskBandLevel: RiskBandLevel; riskBandTitle: string; riskBandDesc: string } => {
  if (sameCarrier) {
    return {
      riskBandLevel: 'hi',
      riskBandTitle: 'Shared Carrier Match Identified',
      riskBandDesc:
        'When both partners carry the same recessive condition, each pregnancy has a 1 in 4 (25%) chance of being affected. While this requires careful clinical planning, modern genomics offers clear, proven pathways—including targeted carrier counseling and reproductive options—so you can proceed with confidence and peace of mind.',
    };
  }

  if (!isStarted) {
    return {
      riskBandLevel: 'ok',
      riskBandTitle: 'Awaiting Selections',
      riskBandDesc:
        'Please choose your relationship and family background in the 5 steps on the left to view your personalized assessment.',
    };
  }

  if (currentF === 0) {
    return {
      riskBandLevel: 'ok',
      riskBandTitle: 'Standard Baseline Risk',
      riskBandDesc:
        'Partners are not biologically related. Standard baseline population risk (~3%) applies. Routine premarital screening provides reassuring confirmation.',
    };
  }

  if (currentExtra < 1.5) {
    return {
      riskBandLevel: 'ok',
      riskBandTitle: 'Low Added Risk',
      riskBandDesc:
        'The family link adds only a modest consideration. The vast majority of children are born healthy. Routine premarital screening gives you and your partner reassuring confirmation.',
    };
  }

  if (currentExtra < 4.0) {
    return {
      riskBandLevel: 'mid',
      riskBandTitle: 'Moderate Added Risk',
      riskBandDesc:
        'A modest added chance is identified from shared ancestry. Please remember that most children born to cousins are completely healthy. Completing targeted premarital screening gives you reassuring clarity to plan ahead with confidence.',
    };
  }

  return {
    riskBandLevel: 'hi',
    riskBandTitle: 'Higher Added Risk',
    riskBandDesc:
      'We understand this can feel concerning, but knowledge is your greatest strength. While closer kinship links mean premarital carrier screening and certified genetic counselor review are especially valuable, please remember that most children born to relatives are healthy. Taking proactive steps together empowers you to move forward with complete clarity and confidence.',
  };
};

export const calculateFullAssessment = (
  gender: Gender | null,
  relStatus: RelStatus | null,
  relIdx: number | null,
  genIdx: number | null,
  histIdx: number | null,
  pregIdx: number | null,
  scrIdx: number | null,
  sameCarrier: boolean
): EstimateResult => {
  const isStarted =
    gender !== null ||
    relStatus !== null ||
    relIdx !== null ||
    genIdx !== null ||
    histIdx !== null ||
    pregIdx !== null ||
    scrIdx !== null ||
    sameCarrier;

  const { fVal: currentF, lVal: currentL, exRisk: currentExtra } = computeEstimate(
    relIdx,
    genIdx,
    histIdx,
    pregIdx,
    scrIdx
  );

  const rangeLo = (1 - Math.exp(-K_FACTOR * currentF * (currentL * 0.6))) * 100;
  const rangeHi = (1 - Math.exp(-K_FACTOR * currentF * (currentL * 1.5))) * 100;
  const totalChance = 3.0 + (isStarted ? (sameCarrier ? 25.0 : currentExtra) : 0);
  const oneInCount = Math.max(1, Math.round(100 / totalChance));

  const { riskBandLevel, riskBandTitle, riskBandDesc } = getRiskBand(
    isStarted,
    sameCarrier,
    currentF,
    currentExtra
  );

  return {
    currentF,
    currentL,
    currentExtra,
    rangeLo,
    rangeHi,
    totalChance,
    oneInCount,
    isStarted,
    riskBandLevel,
    riskBandTitle,
    riskBandDesc,
  };
};

