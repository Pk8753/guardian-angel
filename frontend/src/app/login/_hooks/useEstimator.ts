'use client';

import * as React from 'react';
import { Gender, RelStatus, FlippedTiles } from '../_types';
import { calculateFullAssessment } from '../_utils';

export function useEstimator() {
  const [gender, setGender] = React.useState<Gender | null>(null);
  const [relStatus, setRelStatus] = React.useState<RelStatus | null>(null);
  const [relIdx, setRelIdx] = React.useState<number | null>(null);
  const [genIdx, setGenIdx] = React.useState<number | null>(null);
  const [histIdx, setHistIdx] = React.useState<number | null>(null);
  const [pregIdx, setPregIdx] = React.useState<number | null>(null);
  const [scrIdx, setScrIdx] = React.useState<number | null>(null);
  const [sameCarrier, setSameCarrier] = React.useState<boolean>(false);

  const [flippedTiles, setFlippedTiles] = React.useState<FlippedTiles>({});
  const [isFormulaExpanded, setIsFormulaExpanded] = React.useState<boolean>(false);

  const toggleTile = React.useCallback((key: string) => {
    setFlippedTiles((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleResetEstimator = React.useCallback(() => {
    setGender(null);
    setRelStatus(null);
    setRelIdx(null);
    setGenIdx(null);
    setHistIdx(null);
    setPregIdx(null);
    setScrIdx(null);
    setSameCarrier(false);
    setFlippedTiles({});
  }, []);

  const assessment = React.useMemo(() => {
    return calculateFullAssessment(
      gender,
      relStatus,
      relIdx,
      genIdx,
      histIdx,
      pregIdx,
      scrIdx,
      sameCarrier
    );
  }, [gender, relStatus, relIdx, genIdx, histIdx, pregIdx, scrIdx, sameCarrier]);

  return {
    gender,
    setGender,
    relStatus,
    setRelStatus,
    relIdx,
    setRelIdx,
    genIdx,
    setGenIdx,
    histIdx,
    setHistIdx,
    pregIdx,
    setPregIdx,
    scrIdx,
    setScrIdx,
    sameCarrier,
    setSameCarrier,
    flippedTiles,
    toggleTile,
    isFormulaExpanded,
    setIsFormulaExpanded,
    handleResetEstimator,
    assessment,
  };
}

export type UseEstimatorReturn = ReturnType<typeof useEstimator>;

