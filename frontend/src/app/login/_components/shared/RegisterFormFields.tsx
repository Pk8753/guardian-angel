'use client';

import * as React from 'react';
import { FieldErrors } from '../../_types';

interface RegisterFormFieldsProps {
  regFirstName: string;
  setRegFirstName: (val: string) => void;
  regSecondName: string;
  setRegSecondName: (val: string) => void;
  regUsername: string;
  setRegUsername: (val: string) => void;
  regDob: string;
  setRegDob: (val: string) => void;
  regEmail: string;
  setRegEmail: (val: string) => void;
  regLocation: string;
  setRegLocation: (val: string) => void;
  regPassword: string;
  setRegPassword: (val: string) => void;
  showRegPassword: boolean;
  setShowRegPassword: (val: boolean) => void;
  isRegSubmitting: boolean;
  otpSent: boolean;
  otpVerified: boolean;
  otpInput: string;
  setOtpInput: (val: string) => void;
  otpLoading: boolean;
  clearFieldError: (key: string) => void;
  handleSendOtp: () => void;
  handleVerifyOtp: () => void;
  handleRegister: (e: React.FormEvent) => void;
}

export function RegisterFormFields({
  regFirstName,
  setRegFirstName,
  regSecondName,
  setRegSecondName,
  regUsername,
  setRegUsername,
  regDob,
  setRegDob,
  regEmail,
  setRegEmail,
  regLocation,
  setRegLocation,
  regPassword,
  setRegPassword,
  showRegPassword,
  setShowRegPassword,
  isRegSubmitting,
  otpSent,
  otpVerified,
  otpInput,
  setOtpInput,
  otpLoading,
  clearFieldError,
  handleSendOtp,
  handleVerifyOtp,
  handleRegister,
}: RegisterFormFieldsProps) {
  return (
    <form onSubmit={handleRegister} className="space-y-3" noValidate>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-bold text-[#0c322c]">First Name *</label>
          <input
            type="text"
            placeholder="First Name"
            value={regFirstName}
            onChange={(e) => {
              setRegFirstName(e.target.value);
              clearFieldError('regFirstName');
            }}
            className="w-full h-9 px-2.5 text-xs rounded border border-neutral-200 focus:border-[#30ba78] bg-neutral-50"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-[#0c322c]">Second Name *</label>
          <input
            type="text"
            placeholder="Second Name"
            value={regSecondName}
            onChange={(e) => {
              setRegSecondName(e.target.value);
              clearFieldError('regSecondName');
            }}
            className="w-full h-9 px-2.5 text-xs rounded border border-neutral-200 focus:border-[#30ba78] bg-neutral-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-bold text-[#0c322c]">Username *</label>
          <input
            type="text"
            placeholder="username"
            value={regUsername}
            onChange={(e) => {
              setRegUsername(e.target.value);
              clearFieldError('regUsername');
            }}
            className="w-full h-9 px-2.5 text-xs rounded border border-neutral-200 focus:border-[#30ba78] bg-neutral-50"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-[#0c322c]">Date of Birth *</label>
          <input
            type="date"
            value={regDob}
            onChange={(e) => {
              setRegDob(e.target.value);
              clearFieldError('regDob');
            }}
            className="w-full h-9 px-2 text-xs rounded border border-neutral-200 focus:border-[#30ba78] bg-neutral-50"
          />
        </div>
      </div>

      <div>
        <label className="text-[11px] font-bold text-[#0c322c]">Location *</label>
        <input
          type="text"
          placeholder="e.g. Abu Dhabi, UAE or Mumbai, India"
          value={regLocation}
          onChange={(e) => {
            setRegLocation(e.target.value);
            clearFieldError('regLocation');
          }}
          className="w-full h-9 px-2.5 text-xs rounded border border-neutral-200 focus:border-[#30ba78] bg-neutral-50"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-[#0c322c]">Email *</label>
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={otpLoading}
            className="text-[10px] font-bold text-[#30ba78] hover:underline"
          >
            {otpLoading ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send Verification OTP'}
          </button>
        </div>
        <input
          type="email"
          placeholder="you@domain.com"
          value={regEmail}
          onChange={(e) => {
            setRegEmail(e.target.value);
            clearFieldError('regEmail');
          }}
          className="w-full h-9 px-2.5 text-xs rounded border border-neutral-200 focus:border-[#30ba78] bg-neutral-50"
        />
      </div>

      <div className="p-2.5 rounded-lg bg-[#efefef] border border-neutral-200 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-neutral-600">Verification OTP:</span>
          {otpVerified && (
            <span className="text-[#30ba78] font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">verified</span> Verified
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            maxLength={6}
            placeholder="Enter verification code"
            value={otpInput}
            disabled={otpVerified}
            onChange={(e) => setOtpInput(e.target.value)}
            className="flex-1 h-8 px-2 text-xs rounded border border-neutral-300 bg-white"
          />
          <button
            type="button"
            onClick={handleVerifyOtp}
            disabled={otpVerified}
            className="px-3 h-8 bg-[#0c322c] text-white hover:bg-[#30ba78] hover:text-[#0c322c] text-xs font-bold rounded transition-colors"
          >
            Verify
          </button>
        </div>
      </div>

      <div>
        <label className="text-[11px] font-bold text-[#0c322c]">Password *</label>
        <div className="relative flex items-center">
          <input
            type={showRegPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            value={regPassword}
            onChange={(e) => {
              setRegPassword(e.target.value);
              clearFieldError('regPassword');
            }}
            className="w-full h-9 pl-2.5 pr-8 text-xs rounded border border-neutral-200 focus:border-[#30ba78] bg-neutral-50"
          />
          <button
            type="button"
            onClick={() => setShowRegPassword(!showRegPassword)}
            className="absolute right-2 text-neutral-400 p-1"
          >
            <span className="material-symbols-outlined text-sm">
              {showRegPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isRegSubmitting || !otpVerified}
        className="w-full h-10 bg-[#30ba78] hover:bg-[#90ebcd] disabled:bg-neutral-300 text-[#0c322c] text-xs font-extrabold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-1"
      >
        <span>Create Vault Account</span>
        <span className="material-symbols-outlined text-sm">check</span>
      </button>
    </form>
  );
}

