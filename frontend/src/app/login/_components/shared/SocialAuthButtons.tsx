'use client';

import * as React from 'react';

interface SocialAuthButtonsProps {
  fillDemoCreds: (u: string, p: string) => void;
}

export function SocialAuthButtons({ fillDemoCreds }: SocialAuthButtonsProps) {
  return (
    <>
      <div className="relative my-3 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative bg-white px-2 text-[10px] font-bold text-neutral-400 uppercase">
          or sign in with
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          window.location.href = '/api/uaepass/login';
        }}
        className="w-full h-11 bg-black hover:bg-neutral-800 text-white rounded-xl shadow-sm flex items-center justify-center gap-2 px-3 transition-all border border-neutral-800 cursor-pointer relative overflow-hidden"
      >
        <span className="material-symbols-outlined text-[20px] text-[#30ba78] shrink-0">
          fingerprint
        </span>
        <span className="font-bold text-xs tracking-wide text-white flex items-center gap-1.5">
          <span>Sign in with UAE PASS</span>
          <svg
            className="w-4 h-2.5 rounded-[1.5px] overflow-hidden shadow-sm shrink-0 border border-white/20"
            viewBox="0 0 24 16"
          >
            <rect width="24" height="5.33" fill="#00732f" />
            <rect y="5.33" width="24" height="5.33" fill="#ffffff" />
            <rect y="10.66" width="24" height="5.33" fill="#000000" />
            <rect width="6" height="16" fill="#ff0000" />
          </svg>
        </span>
        <div className="absolute bottom-0 left-0 right-0 h-[2.5px] flex">
          <div className="w-1/4 bg-[#ff0000]" />
          <div className="w-1/4 bg-[#00732f]" />
          <div className="w-1/4 bg-[#ffffff]" />
          <div className="w-1/4 bg-[#111827]" />
        </div>
      </button>

      <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-500">
        <span>Testing sandbox mode?</span>
        <a href="/api/uaepass/sandbox-login" className="font-bold text-[#30ba78] hover:underline">
          Instant Sandbox Login →
        </a>
      </div>

      <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-400">
        <span>Demo logins:</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => fillDemoCreds('admin', 'admin')}
            className="px-2 py-0.5 rounded bg-neutral-100 text-[#0c322c] hover:bg-[#30ba78]/20 font-semibold cursor-pointer"
          >
            admin
          </button>
          <button
            type="button"
            onClick={() => fillDemoCreds('user', 'user')}
            className="px-2 py-0.5 rounded bg-neutral-100 text-[#0c322c] hover:bg-[#30ba78]/20 font-semibold cursor-pointer"
          >
            user
          </button>
          <button
            type="button"
            onClick={() => fillDemoCreds('kabir', '123456')}
            className="px-2 py-0.5 rounded bg-neutral-100 text-[#0c322c] hover:bg-[#30ba78]/20 font-semibold cursor-pointer"
          >
            kabir
          </button>
        </div>
      </div>
    </>
  );
}

