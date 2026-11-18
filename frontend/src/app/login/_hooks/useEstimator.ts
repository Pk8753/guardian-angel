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
  const [uploadedDocs, setUploadedDocs] = React.useState<Array<{ file_name: string; file_url?: string; owner_type?: string }>>([]);

  const toggleTile = React.useCallback((key: string) => {
    setFlippedTiles((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const addUploadedDoc = React.useCallback((doc: { file_name: string; file_url?: string; owner_type?: string }) => {
    setUploadedDocs((prev) => [...prev, doc]);
  }, []);

  const removeUploadedDoc = React.useCallback((fileName: string) => {
    setUploadedDocs((prev) => prev.filter((d) => d.file_name !== fileName));
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
    setUploadedDocs([]);
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
    uploadedDocs,
    setUploadedDocs,
    addUploadedDoc,
    removeUploadedDoc,
    handleResetEstimator,
    assessment,
  };
}

export type UseEstimatorReturn = ReturnType<typeof useEstimator>;

