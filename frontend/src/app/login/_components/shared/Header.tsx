'use client';

import * as React from 'react';
import { useLoginContext } from '../../_hooks/useLoginContext';

export function Header() {
  const { auth, header } = useLoginContext();

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        header.isScrolled
          ? 'bg-[#0c322c]/95 backdrop-blur-md shadow-xl py-3 border-b border-[#30ba78]/30'
          : 'bg-[#0c322c] py-4 border-b border-[#192072]/40'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Header Left: Logo and Brand Name */}
        <div className="flex items-center gap-3">
          <a href="#hero" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md border border-[#30ba78]/40 group-hover:scale-105 transition-transform">
              <img
                src="/static/screen/logo.png"
                alt="Guardian Angel Logo"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-white group-hover:text-[#30ba78] transition-colors">
                Guardian Angel
              </span>
              <span className="text-[10px] text-[#90ebcd] font-semibold tracking-wider uppercase -mt-0.5">
                Genomics Intelligence
              </span>
            </div>
          </a>

          {/* In-page Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 ml-8 text-xs font-semibold text-[#efefef]">
            <a href="#hero" className="hover:text-[#30ba78] transition-colors">
              Overview
            </a>
            <a href="#estimator" className="hover:text-[#30ba78] transition-colors">
              Risk Estimator
            </a>
            <a href="#things-worth-remembering" className="hover:text-[#30ba78] transition-colors">
              Guidance
            </a>
            <a href="#screening-centers" className="hover:text-[#30ba78] transition-colors">
              Screening Centres
            </a>
            <a href="#feature-genetics" className="hover:text-[#30ba78] transition-colors">
              Specialists & AI
            </a>
          </nav>
        </div>

        {/* Header Right: Single Clear Action & Language Switcher */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => auth.openAuth('signin')}
            className="px-4 py-2 text-xs font-bold bg-[#30ba78] text-[#0c322c] hover:bg-[#90ebcd] rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </div>
    </header>
  );
}

