'use client';

import * as React from 'react';
import { useLoginContext } from '../../_hooks/useLoginContext';
import { AuthErrorBanner } from './AuthErrorBanner';
import { LoginFormFields } from './LoginFormFields';
import { RegisterFormFields } from './RegisterFormFields';

export function AuthModal() {
  const { auth } = useLoginContext();

  if (!auth.isAuthOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex sm:items-start sm:justify-end sm:p-6 bg-black/70 sm:backdrop-blur-sm animate-in fade-in duration-200">
      {/* Mobile View: Full-Screen 100dvh Native App Screen | Desktop: Compact Floating Modal */}
      <div className="w-full h-[100dvh] sm:h-auto sm:max-w-md bg-white text-[#0c322c] sm:rounded-2xl shadow-2xl sm:border sm:border-[#30ba78]/30 overflow-hidden sm:mt-14 flex flex-col justify-between animate-in slide-in-from-bottom sm:slide-in-from-top-4 duration-300">
        
        {/* Top Native App Navigation Bar with Notch / Safe Area support */}
        <div
          className="bg-[#0c322c] text-white flex items-center justify-between border-b border-[#30ba78]/20 shrink-0 shadow-sm px-4 py-3 sm:py-4"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0.75rem))' }}
        >
          <div className="flex items-center gap-2">
            {/* Back Button (Prominent on Mobile) */}
            <button
              type="button"
              onClick={auth.closeAuth}
              className="h-9 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 sm:hidden"
              title="Return"
              aria-label="Back"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              <span className="text-xs font-extrabold tracking-tight">Back</span>
            </button>

            {/* Title & Encryption status */}
            <div className="flex items-center gap-2 ml-1 sm:ml-0">
              <span className="material-symbols-outlined text-[#30ba78] text-xl">lock</span>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight leading-tight">
                  Patient Health Vault
                </span>
                <span className="text-[10px] text-[#90ebcd] font-semibold tracking-wider uppercase -mt-0.5">
                  Zero-Knowledge Encrypted
                </span>
              </div>
            </div>
          </div>

          {/* Close Button (X) */}
          <button
            type="button"
            onClick={auth.closeAuth}
            className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            title="Close"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Tab Switcher (Segmented Control on Mobile, Underline Tabs on Desktop) */}
        {!auth.isRegistrationSuccess && (
          <div className="p-2.5 sm:p-0 border-b border-[#efefef] bg-[#efefef] shrink-0">
            <div className="flex bg-neutral-200/80 sm:bg-transparent p-1 sm:p-0 rounded-xl sm:rounded-none">
              <button
                type="button"
                onClick={() => {
                  auth.setActiveTab('signin');
                  auth.setAuthError(null);
                }}
                className={`flex-1 py-2 sm:py-3 text-xs font-bold text-center transition-all cursor-pointer rounded-lg sm:rounded-none ${
                  auth.activeTab === 'signin'
                    ? 'bg-white text-[#0c322c] shadow-xs sm:shadow-none sm:border-b-2 sm:border-[#30ba78]'
                    : 'text-neutral-500 hover:text-[#0c322c]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  auth.setActiveTab('register');
                  auth.setAuthError(null);
                }}
                className={`flex-1 py-2 sm:py-3 text-xs font-bold text-center transition-all cursor-pointer rounded-lg sm:rounded-none ${
                  auth.activeTab === 'register'
                    ? 'bg-white text-[#0c322c] shadow-xs sm:shadow-none sm:border-b-2 sm:border-[#30ba78]'
                    : 'text-neutral-500 hover:text-[#0c322c]'
                }`}
              >
                Create Account
              </button>
            </div>
          </div>
        )}

        {/* Form Body - Native Scrollable Container */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 min-h-0 sm:max-h-[75vh]">
          {auth.isRegistrationSuccess ? (
            <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-5 animate-in fade-in zoom-in-95 duration-200 my-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-[#30ba78] text-[#30ba78] flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-4xl">check_circle</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-[#0c322c]">
                  Account Created Successfully!
                </h3>
                <p className="text-xs text-neutral-600 max-w-xs mx-auto leading-relaxed">
                  Your secure health vault has been established. Please sign in with your credentials to access your health vault.
                </p>
              </div>

              <button
                type="button"
                onClick={auth.goToSignInFromSuccess}
                className="w-full py-3 px-6 rounded-xl font-bold text-xs bg-[#30ba78] text-[#0c322c] hover:bg-[#30ba78]/90 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>Proceed to Sign In</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          ) : (
            <>
              <AuthErrorBanner authError={auth.authError} authSuccess={auth.authSuccess} />

              {auth.activeTab === 'signin' ? (
                <LoginFormFields
                  signInUsername={auth.signInUsername}
                  setSignInUsername={auth.setSignInUsername}
                  signInPassword={auth.signInPassword}
                  setSignInPassword={auth.setSignInPassword}
                  showSignInPassword={auth.showSignInPassword}
                  setShowSignInPassword={auth.setShowSignInPassword}
                  isSignInSubmitting={auth.isSignInSubmitting}
                  fieldErrors={auth.fieldErrors}
                  clearFieldError={auth.clearFieldError}
                  handleSignIn={auth.handleSignIn}
                  fillDemoCreds={auth.fillDemoCreds}
                />
              ) : (
                <RegisterFormFields
                  regFirstName={auth.regFirstName}
                  setRegFirstName={auth.setRegFirstName}
                  regSecondName={auth.regSecondName}
                  setRegSecondName={auth.setRegSecondName}
                  regUsername={auth.regUsername}
                  setRegUsername={auth.setRegUsername}
                  regDob={auth.regDob}
                  setRegDob={auth.setRegDob}
                  regEmail={auth.regEmail}
                  setRegEmail={auth.setRegEmail}
                  regLocation={auth.regLocation}
                  setRegLocation={auth.setRegLocation}
                  regPassword={auth.regPassword}
                  setRegPassword={auth.setRegPassword}
                  showRegPassword={auth.showRegPassword}
                  setShowRegPassword={auth.setShowRegPassword}
                  isRegSubmitting={auth.isRegSubmitting}
                  otpSent={auth.otpSent}
                  otpVerified={auth.otpVerified}
                  otpInput={auth.otpInput}
                  setOtpInput={auth.setOtpInput}
                  otpLoading={auth.otpLoading}
                  clearFieldError={auth.clearFieldError}
                  handleSendOtp={auth.handleSendOtp}
                  handleVerifyOtp={auth.handleVerifyOtp}
                  handleRegister={auth.handleRegister}
                />
              )}
            </>
          )}
        </div>

        {/* Footer Return Action & Security footnote on Mobile */}
        <div className="p-3 bg-neutral-50 border-t border-neutral-200 space-y-2 shrink-0 sm:hidden">
          <button
            type="button"
            onClick={auth.closeAuth}
            className="w-full py-2.5 text-xs font-bold text-neutral-600 hover:text-[#0c322c] bg-white border border-neutral-300 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Cancel & Return to Overview</span>
          </button>
          <p className="text-[10px] text-center text-neutral-400">
            🔒 256-bit hardware-isolated zero-knowledge encryption
          </p>
        </div>
      </div>
    </div>
  );
}
