'use client';

import * as React from 'react';
import { SlideDirection } from '../_types';

export function useMobileSlideshow(onResetEstimator?: () => void) {
  const [isAssessmentActive, setIsAssessmentActive] = React.useState<boolean>(false);
  const [mobileSlide, setMobileSlide] = React.useState<number>(0);
  const [slideDirection, setSlideDirection] = React.useState<SlideDirection>('next');
  const [isMobileCentresOpen, setIsMobileCentresOpen] = React.useState<boolean>(false);
  const [isMobileFormulaOpen, setIsMobileFormulaOpen] = React.useState<boolean>(false);

  const touchStartX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);

  const openAssessment = React.useCallback((slideNumber: number = 0) => {
    setMobileSlide(slideNumber);
    setSlideDirection('next');
    setIsAssessmentActive(true);
  }, []);

  const closeAssessment = React.useCallback(() => {
    setIsAssessmentActive(false);
  }, []);

  const goToSlide = React.useCallback(
    (n: number) => {
      if (n < 0 || n > 11) return;
      setSlideDirection(n >= mobileSlide ? 'next' : 'prev');
      setMobileSlide(n);
    },
    [mobileSlide]
  );

  const nextSlide = React.useCallback(() => {
    if (mobileSlide < 11) {
      setSlideDirection('next');
      setMobileSlide((prev) => prev + 1);
    }
  }, [mobileSlide]);

  const prevSlide = React.useCallback(() => {
    setSlideDirection('prev');
    if (mobileSlide > 0) {
      setMobileSlide((prev) => prev - 1);
    } else {
      setIsAssessmentActive(false);
    }
  }, [mobileSlide]);

  const handleSelectAndAdvance = React.useCallback(
    (setter: () => void, targetSlide?: number) => {
      setter();
      setSlideDirection('next');
      setTimeout(() => {
        setMobileSlide((prev) => (targetSlide !== undefined ? targetSlide : Math.min(prev + 1, 11)));
      }, 280);
    },
    []
  );

  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = React.useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      const diffX = touchStartX.current - e.changedTouches[0].clientX;
      const diffY = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        if (diffX > 0) {
          nextSlide();
        } else {
          prevSlide();
        }
      }
      touchStartX.current = null;
      touchStartY.current = null;
    },
    [nextSlide, prevSlide]
  );

  const handleReset = React.useCallback(() => {
    if (onResetEstimator) {
      onResetEstimator();
    }
    setMobileSlide(0);
  }, [onResetEstimator]);

  return {
    isAssessmentActive,
    setIsAssessmentActive,
    openAssessment,
    closeAssessment,
    mobileSlide,
    setMobileSlide,
    slideDirection,
    goToSlide,
    nextSlide,
    prevSlide,
    handleSelectAndAdvance,
    handleTouchStart,
    handleTouchEnd,
    isMobileCentresOpen,
    setIsMobileCentresOpen,
    isMobileFormulaOpen,
    setIsMobileFormulaOpen,
    handleReset,
  };
}

export type UseMobileSlideshowReturn = ReturnType<typeof useMobileSlideshow>;

