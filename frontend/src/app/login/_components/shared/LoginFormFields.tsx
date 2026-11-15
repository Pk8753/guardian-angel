'use client';

import * as React from 'react';
import { FieldErrors } from '../../_types';
import { SocialAuthButtons } from './SocialAuthButtons';

interface LoginFormFieldsProps {
  signInUsername: string;
  setSignInUsername: (val: string) => void;
  signInPassword: string;
  setSignInPassword: (val: string) => void;
  showSignInPassword: boolean;
  setShowSignInPassword: (val: boolean) => void;
  isSignInSubmitting: boolean;
  fieldErrors: FieldErrors;
  clearFieldError: (key: string) => void;
  handleSignIn: (e: React.FormEvent) => void;
  fillDemoCreds: (u: string, p: string) => void;
}

export function LoginFormFields({
  signInUsername,
  setSignInUsername,
  signInPassword,
  setSignInPassword,
  showSignInPassword,
  setShowSignInPassword,
  isSignInSubmitting,
  fieldErrors,
  clearFieldError,
  handleSignIn,
  fillDemoCreds,
}: LoginFormFieldsProps) {
  return (
    <form onSubmit={handleSignIn} className="space-y-3.5" noValidate>
      <div className="space-y-1">
        <label className="text-xs font-bold text-[#0c322c]" htmlFor="modal_signin_username">
          Username or Email
        </label>
        <input
          id="modal_signin_username"
          type="text"
          placeholder="Username or email"
          value={signInUsername}
          onChange={(e) => {
            setSignInUsername(e.target.value);
            clearFieldError('signInUsername');
          }}
          className={`w-full h-10 px-3 text-sm rounded-lg border focus:outline-none transition-all ${
            fieldErrors.signInUsername
              ? 'border-red-500 ring-2 ring-red-100 bg-red-50/50'
              : 'border-neutral-200 focus:border-[#30ba78] focus:ring-2 focus:ring-[#30ba78]/20 bg-neutral-50'
          }`}
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#0c322c]" htmlFor="modal_signin_password">
            Password
          </label>
          <span className="text-[10px] text-[#2453ff] hover:underline cursor-pointer">
            Forgot Password?
          </span>
        </div>
        <div className="relative flex items-center">
          <input
            id="modal_signin_password"
            type={showSignInPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            value={signInPassword}
            onChange={(e) => {
              setSignInPassword(e.target.value);
              clearFieldError('signInPassword');
            }}
            className={`w-full h-10 pl-3 pr-10 text-sm rounded-lg border focus:outline-none transition-all ${
              fieldErrors.signInPassword
                ? 'border-red-500 ring-2 ring-red-100 bg-red-50/50'
                : 'border-neutral-200 focus:border-[#30ba78] focus:ring-2 focus:ring-[#30ba78]/20 bg-neutral-50'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowSignInPassword(!showSignInPassword)}
            className="absolute right-2.5 text-neutral-400 hover:text-neutral-700 p-1"
          >
            <span className="material-symbols-outlined text-base">
              {showSignInPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSignInSubmitting}
        className="w-full h-10 bg-[#30ba78] hover:bg-[#90ebcd] text-[#0c322c] text-xs font-extrabold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-1"
      >
        <span>Sign In</span>
        <span className="material-symbols-outlined text-sm">arrow_forward</span>
      </button>

      <SocialAuthButtons fillDemoCreds={fillDemoCreds} />
    </form>
  );
}

