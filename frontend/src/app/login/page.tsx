'use client';

import * as React from 'react';
import { LoginProvider } from './_hooks/useLoginContext';
import { Header } from './_components/shared/Header';
import { HeroSection } from './_components/shared/HeroSection';
import { DesktopLoginView } from './_components/DesktopLoginView';
import { MobileLoginView } from './_components/MobileLoginView';
import { ThingsWorthRemembering } from './_components/shared/ThingsWorthRemembering';
import { ScreeningCentresSection } from './_components/shared/ScreeningCentresSection';
import { SpecialistsAiSection } from './_components/shared/SpecialistsAiSection';
import { Footer } from './_components/shared/Footer';
import { AuthModal } from './_components/shared/AuthModal';

export default function LoginPage() {
  return (
    <LoginProvider>
      <div className="min-h-screen w-full bg-[#efefef] text-[#0c322c] font-sans selection:bg-[#30ba78] selection:text-[#0c322c] overflow-x-hidden">
        {/* Fixed Header */}
        <Header />

        {/* Hero Section (Story Flow with Screen-Height Sections on Mobile) */}
        <HeroSection />

        {/* Family Health Risk Estimator Section */}
        <section id="estimator" className="scroll-mt-14 py-8 lg:py-20 bg-[#efefef] text-[#0c322c] relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="hidden lg:block text-center max-w-3xl mx-auto space-y-3 mb-10 sm:mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#192072]/10 text-[#192072] border border-[#192072]/20">
                <span className="material-symbols-outlined text-sm text-[#2453ff]">calculate</span>
                <span>Interactive Clinical Screener</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0c322c] tracking-tight">
                Family Health Risk Estimator
              </h2>
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                Many families in the UAE and across the region have marriages between relatives. This
                tool gives a clear, calm estimate of how that may affect the chance of an inherited
                condition in a child, and what to do next.
              </p>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-[#30ba78]/30 text-xs font-semibold">
                <span className="material-symbols-outlined text-sm text-[#30ba78]">lock</span>
                <span>
                  Your answers stay on your device. Nothing is sent or saved. Closing this page
                  clears everything.
                </span>
              </div>
            </div>

            {/* Mobile View: Launch Card, 100dvh Slideshow & Bottom Sheets */}
            <MobileLoginView />

            {/* Desktop View: 2-Column Dashboard, Flip Tiles & Methodology Accordion */}
            <DesktopLoginView />
          </div>
        </section>

        {/* Things Worth Remembering */}
        <ThingsWorthRemembering />

        {/* Screening Centres Section */}
        <ScreeningCentresSection />

        {/* Specialists & AI Intelligence Section */}
        <SpecialistsAiSection />

        {/* Footer */}
        <Footer />

        {/* Auth Modal (Shared across Web & Mobile - Native Fullscreen on Mobile, z-[100]) */}
        <AuthModal />
      </div>
    </LoginProvider>
  );
}
