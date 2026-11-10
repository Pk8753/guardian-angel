'use client';

import * as React from 'react';
import { useAuthFlow, UseAuthFlowReturn } from './useAuthFlow';
import { useEstimator, UseEstimatorReturn } from './useEstimator';
import { useMobileSlideshow, UseMobileSlideshowReturn } from './useMobileSlideshow';
import { useScrollHeader } from './useScrollHeader';

export interface LoginContextValue {
  auth: UseAuthFlowReturn;
  estimator: UseEstimatorReturn;
  mobile: UseMobileSlideshowReturn;
  header: { isScrolled: boolean };
}

const LoginContext = React.createContext<LoginContextValue | null>(null);

export function LoginProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthFlow();
  const estimator = useEstimator();
  const mobile = useMobileSlideshow(estimator.handleResetEstimator);
  const header = useScrollHeader();

  const value = React.useMemo(
    () => ({
      auth,
      estimator,
      mobile,
      header,
    }),
    [auth, estimator, mobile, header]
  );

  return <LoginContext.Provider value={value}>{children}</LoginContext.Provider>;
}

export function useLoginContext(): LoginContextValue {
  const context = React.useContext(LoginContext);
  if (!context) {
    throw new Error('useLoginContext must be used within a LoginProvider');
  }
  return context;
}

