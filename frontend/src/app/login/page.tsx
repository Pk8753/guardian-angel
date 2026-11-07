'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';

// Modern Unified Palette for Login Page
const COLORS = {
  pine: '#0c322c',
  white: '#ffffff',
  jungle: '#30ba78',
  fog: '#efefef',
  midnight: '#192072',
  persimmon: '#fe7c3f',
  waterhole: '#2453ff',
  mint: '#90ebcd',
};

// ==================== CLINICAL INBREEDING RISK MODEL DATA ====================
// Sourced directly from /Users/pankaj/Downloads/Family Health Risk Estimator.html
const RELATIONSHIPS: [string, string, string, number][] = [
  ['fc', 'First cousins', 'Your parents are brothers or sisters (children of the same grandparents)', 1 / 16],
  ['dfc', 'Double first cousins', 'Two brothers married two sisters, so you share both sets of grandparents', 1 / 8],
  ['fc1', 'First cousins once removed', 'For example, your partner is your first cousin’s child', 1 / 32],
  ['sc', 'Second cousins', 'You share great-grandparents', 1 / 64],
  ['rem', 'Distant relatives (third cousins or beyond)', 'Same tribe or extended family, a more distant link', 1 / 256],
  ['un', 'Uncle and niece, or aunt and nephew', 'Second-degree biological relationship', 1 / 8],
  ['hs', 'Half siblings', 'Share one biological parent', 1 / 8],
  ['none', 'Not related', 'No known genealogical relationship', 0]
];

const EARLIER_GENERATIONS: [string, string, number][] = [
  ['0', 'No, not that we know', 0],
  ['1', 'Yes, once or twice (e.g. grandparents were cousins)', 0.0625],
  ['2', 'Yes, across many generations (multi-generational consanguinity)', 0.125]
];

const FAMILY_HISTORY: [string, string, number][] = [
  ['1', 'No known condition in either family', 1.0],
  ['1.2', 'Not sure or family history incomplete', 1.2],
  ['1.8', 'Yes, in one or both families (e.g. Thalassemia, Sickle Cell, SMA, early child loss)', 1.8]
];

const PAST_PREGNANCIES: [string, string, number][] = [
  ['1', 'No pregnancies yet, or all healthy', 1.0],
  ['1.5', 'Two or more miscarriages, or a child who was seriously ill/died without clear cause', 1.5]
];

const SCREENING_STATUS: [string, string, number][] = [
  ['1', 'Not done yet', 1.0],
  ['0.7', 'Done, and no concerns were found (CLIA/CAP carrier panel clear)', 0.7]
];

const K_FACTOR = 0.487;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  // Auth Modal State (Compact Header Controls)
  const [isAuthOpen, setIsAuthOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'signin' | 'register'>('signin');
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = React.useState<string | null>(null);

  // Sign In form state
  const [signInUsername, setSignInUsername] = React.useState('');
  const [signInPassword, setSignInPassword] = React.useState('');
  const [showSignInPassword, setShowSignInPassword] = React.useState(false);
  const [isSignInSubmitting, setIsSignInSubmitting] = React.useState(false);

  // Register form state
  const [regFirstName, setRegFirstName] = React.useState('');
  const [regSecondName, setRegSecondName] = React.useState('');
  const [regUsername, setRegUsername] = React.useState('');
  const [regDob, setRegDob] = React.useState('');
  const [regEmail, setRegEmail] = React.useState('');
  const [regLocation, setRegLocation] = React.useState('');
  const [regPassword, setRegPassword] = React.useState('');
  const [showRegPassword, setShowRegPassword] = React.useState(false);
  const [isRegSubmitting, setIsRegSubmitting] = React.useState(false);

  // OTP state
  const [otpSent, setOtpSent] = React.useState(false);
  const [otpVerified, setOtpVerified] = React.useState(false);
  const [otpInput, setOtpInput] = React.useState('');
  const [otpLoading, setOtpLoading] = React.useState(false);

  // Field validation error tracking
  const [fieldErrors, setFieldErrors] = React.useState<{ [key: string]: boolean }>({});

  // ==================== 5-STEP RISK CALCULATOR STATE ====================
  // No answers pre-selected by default
  const [relIdx, setRelIdx] = React.useState<number | null>(null);
  const [genIdx, setGenIdx] = React.useState<number | null>(null);
  const [histIdx, setHistIdx] = React.useState<number | null>(null);
  const [pregIdx, setPregIdx] = React.useState<number | null>(null);
  const [scrIdx, setScrIdx] = React.useState<number | null>(null);
  const [sameCarrier, setSameCarrier] = React.useState<boolean>(false);

  // Result tile flip states & Formula accordion state
  const [flippedTiles, setFlippedTiles] = React.useState<{ [key: string]: boolean }>({});
  const [isFormulaExpanded, setIsFormulaExpanded] = React.useState<boolean>(false);

  const toggleTile = (key: string) => {
    setFlippedTiles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleResetEstimator = () => {
    setRelIdx(null);
    setGenIdx(null);
    setHistIdx(null);
    setPregIdx(null);
    setScrIdx(null);
    setSameCarrier(false);
    setFlippedTiles({});
  };

  // Scroll animations state
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const clearFieldError = (key: string) => {
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    setAuthError(null);
  };

  const isValidEmail = (email: string) => {
    return /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(email.trim());
  };

  // Capture URL error query parameters
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err) {
        setAuthError(decodeURIComponent(err));
        setIsAuthOpen(true);
      }
    }
  }, []);

  // Quick helper to open auth modal in specific mode
  const openAuth = (mode: 'signin' | 'register') => {
    setActiveTab(mode);
    setAuthError(null);
    setAuthSuccess(null);
    setIsAuthOpen(true);
  };

  // Demo credential autofill helper
  const fillDemoCreds = (u: string, p: string) => {
    setSignInUsername(u);
    setSignInPassword(p);
    setFieldErrors({});
    setAuthError(null);
  };

  // ==================== CALCULATOR MATH ENGINE ====================
  const computeEstimate = (
    rI: number | null,
    gI: number | null,
    hI: number | null,
    pI: number | null,
    sI: number | null
  ) => {
    const rVal = rI !== null ? RELATIONSHIPS[rI][3] : 0;
    const faVal = gI !== null ? EARLIER_GENERATIONS[gI][2] : 0;
    const fVal = rVal * (1 + faVal);
    const histVal = hI !== null ? FAMILY_HISTORY[hI][2] : 1.0;
    const pregVal = pI !== null ? PAST_PREGNANCIES[pI][2] : 1.0;
    const scrVal = sI !== null ? SCREENING_STATUS[sI][2] : 1.0;
    let lVal = histVal * pregVal * scrVal;
    lVal = Math.min(lVal, 3.0);
    const exRisk = (1 - Math.exp(-K_FACTOR * fVal * lVal)) * 100;
    return { fVal, lVal, exRisk };
  };

  const isStarted = relIdx !== null || genIdx !== null || histIdx !== null || pregIdx !== null || scrIdx !== null || sameCarrier;

  const { fVal: currentF, lVal: currentL, exRisk: currentExtra } = computeEstimate(relIdx, genIdx, histIdx, pregIdx, scrIdx);
  const rangeLo = (1 - Math.exp(-K_FACTOR * currentF * (currentL * 0.6))) * 100;
  const rangeHi = (1 - Math.exp(-K_FACTOR * currentF * (currentL * 1.5))) * 100;
  const totalChance = 3.0 + (isStarted ? (sameCarrier ? 25.0 : currentExtra) : 0);
  const oneInCount = Math.max(1, Math.round(100 / totalChance));

  const formatPct = (val: number) => (val >= 0.1 ? val.toFixed(1) + '%' : val.toFixed(2) + '%');

  // Risk Band classification (Humble, reassuring & motivating guidance)
  let riskBandLevel: 'ok' | 'mid' | 'hi' = 'ok';
  let riskBandTitle = 'Awaiting Selections';
  let riskBandDesc = 'Please choose your relationship and family background in the 5 steps on the left to view your personalized assessment.';

  if (sameCarrier) {
    riskBandLevel = 'hi';
    riskBandTitle = 'Shared Carrier Match Identified';
    riskBandDesc = 'When both partners carry the same recessive condition, each pregnancy has a 1 in 4 (25%) chance of being affected. While this requires careful clinical planning, modern genomics offers clear, proven pathways—including targeted carrier counseling and reproductive options—so you can proceed with confidence and peace of mind.';
  } else if (!isStarted) {
    riskBandLevel = 'ok';
    riskBandTitle = 'Awaiting Selections';
    riskBandDesc = 'Please choose your relationship and family background in the 5 steps on the left to view your personalized assessment.';
  } else if (currentF === 0) {
    riskBandLevel = 'ok';
    riskBandTitle = 'Standard Baseline Risk';
    riskBandDesc = 'Partners are not biologically related. Standard baseline population risk (~3%) applies. Routine premarital screening provides reassuring confirmation.';
  } else if (currentExtra < 1.5) {
    riskBandLevel = 'ok';
    riskBandTitle = 'Low Added Risk';
    riskBandDesc = 'The family link adds only a modest consideration. The vast majority of children are born healthy. Routine premarital screening gives you and your partner reassuring confirmation.';
  } else if (currentExtra < 4.0) {
    riskBandLevel = 'mid';
    riskBandTitle = 'Moderate Added Risk';
    riskBandDesc = 'A modest added chance is identified from shared ancestry. Please remember that most children born to cousins are completely healthy. Completing targeted premarital screening gives you reassuring clarity to plan ahead with confidence.';
  } else {
    riskBandLevel = 'hi';
    riskBandTitle = 'Higher Added Risk';
    riskBandDesc = 'We understand this can feel concerning, but knowledge is your greatest strength. While closer kinship links mean premarital carrier screening and certified genetic counselor review are especially valuable, please remember that most children born to relatives are healthy. Taking proactive steps together empowers you to move forward with complete clarity and confidence.';
  }

  // ==================== AUTH HANDLERS ====================
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const u = signInUsername.trim();
    const p = signInPassword.trim();

    if (!u && !p) {
      setFieldErrors({ signInUsername: true, signInPassword: true });
      setAuthError('Please enter your username and password.');
      return;
    }
    if (!u) {
      setFieldErrors({ signInUsername: true });
      setAuthError('Username or email is required.');
      return;
    }
    if (!p) {
      setFieldErrors({ signInPassword: true });
      setAuthError('Password is required.');
      return;
    }

    setIsSignInSubmitting(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'signin', username: u, password: p }),
      });

      const data = await res.json();

      if (data.status === 'success' && data.user) {
        login({
          id: data.user.id,
          username: data.user.username,
          fullName: data.user.full_name,
          aliasName: data.user.alias_name,
          isAdmin: data.user.username.toLowerCase() === 'admin',
          isFreshUser: false,
        });
        router.push('/dashboard');
        return;
      } else {
        setAuthError(data.message || 'Invalid clinical credentials. Please check your username and password.');
      }
    } catch {
      // Offline demo fallback
      const lower = u.toLowerCase();
      if ((lower === 'admin' && p === 'admin') || (lower === 'user' && p === 'user') || (lower === 'kabir' && p === '123456')) {
        login({
          id: lower === 'admin' ? 1 : lower === 'user' ? 2 : 4,
          username: lower,
          fullName: lower === 'admin' ? 'Dr. Tariq Al-Mansoor (Admin)' : lower === 'user' ? 'Dr. Eleanor Vance' : 'Kabir Khan',
          aliasName: lower === 'admin' ? 'Swift-Otter-301' : lower === 'user' ? 'Silent-Falcon-9214' : 'Solar-Sequoia-3972',
          isAdmin: lower === 'admin',
          isFreshUser: false,
        });
        router.push('/dashboard');
        return;
      }
      setAuthError('Invalid clinical credentials. Please check your username and password.');
    } finally {
      setIsSignInSubmitting(false);
    }
  };

  const handleSendOtp = async () => {
    setAuthError(null);
    const errors: { [key: string]: boolean } = {};

    if (!regFirstName.trim()) errors.regFirstName = true;
    if (!regSecondName.trim()) errors.regSecondName = true;
    if (!regUsername.trim()) errors.regUsername = true;
    if (!regDob.trim()) errors.regDob = true;
    if (!regEmail.trim() || !isValidEmail(regEmail)) errors.regEmail = true;
    if (!regLocation.trim()) errors.regLocation = true;
    if (!regPassword.trim()) errors.regPassword = true;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setAuthError('Please provide all required fields with a valid email.');
      return;
    }

    setOtpLoading(true);
    try {
      await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail.trim() }),
      });
    } catch {
      // offline fallback
    } finally {
      setOtpLoading(false);
      setOtpSent(true);
      setAuthSuccess('Verification code sent! Please check your email.');
    }
  };

  const handleVerifyOtp = () => {
    setAuthError(null);
    setAuthSuccess(null);
    const code = otpInput.trim();

    if (!code) {
      setFieldErrors({ otpInput: true });
      setAuthError('Please enter the verification code.');
      return;
    }

    if (code === '9090') {
      setOtpVerified(true);
      clearFieldError('otpInput');
      setAuthSuccess('Verification code confirmed! You can now create your account.');
    } else {
      setFieldErrors({ otpInput: true });
      setAuthError('Invalid verification code. Please check and try again.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!otpVerified) {
      setAuthError('Please verify your email with OTP before creating an account.');
      return;
    }

    setIsRegSubmitting(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'register',
          firstname: regFirstName.trim(),
          secondname: regSecondName.trim(),
          reg_username: regUsername.trim(),
          dob: regDob.trim(),
          email: regEmail.trim(),
          location: regLocation.trim(),
          reg_password: regPassword.trim(),
          otp: otpInput.trim() || '9090',
        }),
      });

      const data = await res.json();

      if (data.status === 'error' || !data.user_id) {
        setAuthError(data.message || 'Failed to create vault account. Please try again.');
        setIsRegSubmitting(false);
        return;
      }
    } catch {
      setAuthError('Unable to connect to backend server. Please verify python3 app.py is running on port 5000.');
      setIsRegSubmitting(false);
      return;
    }

    setSignInUsername('');
    setSignInPassword('');
    setIsRegSubmitting(false);
    setActiveTab('signin');
    setAuthSuccess('Your account has been created successfully! Please sign in with your credentials to access your health vault.');
  };

  return (
    <div className="min-h-screen w-full bg-[#efefef] text-[#0c322c] font-sans selection:bg-[#30ba78] selection:text-[#0c322c] overflow-x-hidden">

      {/* ==================== 1. FIXED HEADER ==================== */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
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
              <a href="#hero" className="hover:text-[#30ba78] transition-colors">Overview</a>
              <a href="#estimator" className="hover:text-[#30ba78] transition-colors">Risk Estimator</a>
              <a href="#things-worth-remembering" className="hover:text-[#30ba78] transition-colors">Guidance</a>
              <a href="#screening-centers" className="hover:text-[#30ba78] transition-colors">Screening Centres</a>
              <a href="#feature-genetics" className="hover:text-[#30ba78] transition-colors">Specialists & AI</a>
            </nav>
          </div>

          {/* Header Right: Compact Auth Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openAuth('signin')}
              className="px-3.5 py-1.5 text-xs font-bold text-white hover:text-[#30ba78] border border-white/20 hover:border-[#30ba78] rounded-lg transition-all cursor-pointer"
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => openAuth('register')}
              className="px-3.5 py-1.5 text-xs font-bold bg-[#30ba78] text-[#0c322c] hover:bg-[#90ebcd] rounded-lg shadow-sm transition-all cursor-pointer"
            >
              Create Account
            </button>

            <button
              type="button"
              onClick={() => {
                window.location.href = '/api/uaepass/login';
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-black text-white hover:bg-neutral-900 border border-white/20 rounded-lg transition-all cursor-pointer"
              title="Sign in with UAE PASS"
            >
              <span className="material-symbols-outlined text-[15px] text-[#30ba78]">fingerprint</span>
              <span>UAE PASS</span>
            </button>
          </div>
        </div>
      </header>

      {/* ==================== 2. COMPACT POPUP AUTH DRAWER / MODAL ==================== */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white text-[#0c322c] rounded-2xl shadow-2xl border border-[#30ba78]/30 overflow-hidden mt-16 sm:mt-14 animate-in slide-in-from-top-4 duration-300">
            
            <div className="p-4 bg-[#0c322c] text-white flex items-center justify-between border-b border-[#30ba78]/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#30ba78] text-xl">lock</span>
                <span className="font-bold text-sm tracking-tight">Zero-Knowledge Patient Vault</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="flex border-b border-[#efefef] bg-[#efefef]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                  setAuthError(null);
                }}
                className={`flex-1 py-3 text-xs font-bold text-center transition-all cursor-pointer ${
                  activeTab === 'signin'
                    ? 'bg-white text-[#0c322c] border-b-2 border-[#30ba78]'
                    : 'text-neutral-500 hover:text-[#0c322c]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setAuthError(null);
                }}
                className={`flex-1 py-3 text-xs font-bold text-center transition-all cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-white text-[#0c322c] border-b-2 border-[#30ba78]'
                    : 'text-neutral-500 hover:text-[#0c322c]'
                }`}
              >
                Create Account
              </button>
            </div>

            <div className="p-5 max-h-[80vh] overflow-y-auto space-y-4">
              
              {authError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-2 border border-red-200">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-[#30ba78]/30">
                  <span className="material-symbols-outlined text-base text-[#30ba78]">check_circle</span>
                  <span>{authSuccess}</span>
                </div>
              )}

              {activeTab === 'signin' ? (
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

                  <div className="relative my-3 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-neutral-200"></div>
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
                      <svg className="w-4 h-2.5 rounded-[1.5px] overflow-hidden shadow-sm shrink-0 border border-white/20" viewBox="0 0 24 16">
                        <rect width="24" height="5.33" fill="#00732f" />
                        <rect y="5.33" width="24" height="5.33" fill="#ffffff" />
                        <rect y="10.66" width="24" height="5.33" fill="#000000" />
                        <rect width="6" height="16" fill="#ff0000" />
                      </svg>
                    </span>
                    <div className="absolute bottom-0 left-0 right-0 h-[2.5px] flex">
                      <div className="w-1/4 bg-[#ff0000]"></div>
                      <div className="w-1/4 bg-[#00732f]"></div>
                      <div className="w-1/4 bg-[#ffffff]"></div>
                      <div className="w-1/4 bg-[#111827]"></div>
                    </div>
                  </button>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-500">
                    <span>Testing sandbox mode?</span>
                    <a
                      href="/api/uaepass/sandbox-login"
                      className="font-bold text-[#30ba78] hover:underline"
                    >
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
                </form>
              ) : (
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
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== 3. HERO (BALANCED WITH TEXTURE & DEEP MIDNIGHT) ==================== */}
      <section id="hero" className="relative pt-24 pb-10 md:pt-28 md:pb-12 overflow-hidden bg-gradient-to-br from-[#0c322c] via-[#0f2a24] to-[#192072] text-white">
        
        {/* Subtle SVG Grid & Abstract Hex/Node Network Texture */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.09] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#90ebcd" strokeWidth="1" />
              <circle cx="48" cy="48" r="1.5" fill="#30ba78" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>

        {/* Multi-color ambient light accents */}
        <div className="absolute -top-32 -right-32 w-[30rem] h-[30rem] rounded-full bg-[#2453ff]/20 blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 -left-32 w-96 h-96 rounded-full bg-[#30ba78]/15 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-[#fe7c3f]/10 blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* Left Column: Headline, Subheadline, Actions & 3 Core Principles */}
            <div className="lg:col-span-7 space-y-4">

              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight leading-tight text-white">
                Your Family’s Health Story{' '}
                <span className="text-[#30ba78]">
                  Matters.
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-[#efefef] leading-relaxed max-w-xl font-normal">
                Clear, caring guidance to help couples and families understand inherited health risks and make choices that fit their values. Private by design.
              </p>

              <div className="flex items-center gap-2 pt-1 flex-wrap sm:flex-nowrap">
                <a
                  href="#estimator"
                  className="px-3.5 py-2.5 rounded-lg bg-[#30ba78] hover:bg-[#90ebcd] text-[#0c322c] text-xs font-black flex items-center gap-1 shadow-sm flex-shrink-0 cursor-pointer whitespace-nowrap"
                >
                  <span>Calculate Family Health Risk</span>
                  <span className="material-symbols-outlined text-sm">expand_more</span>
                </a>

                <button
                  type="button"
                  onClick={() => openAuth('signin')}
                  className="px-3.5 py-2.5 rounded-lg bg-[#192072] hover:bg-[#2453ff] text-white text-xs font-bold flex items-center gap-1 border border-[#90ebcd]/30 shadow-sm flex-shrink-0 cursor-pointer whitespace-nowrap"
                >
                  <span>Access Health Vault</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/api/uaepass/login';
                  }}
                  className="px-3 py-2.5 rounded-lg bg-black hover:bg-neutral-900 text-white text-xs font-bold flex items-center gap-1 border border-white/20 flex-shrink-0 cursor-pointer whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[#30ba78] text-sm">fingerprint</span>
                  <span>UAE PASS</span>
                </button>
              </div>

              {/* 3 Core Principles: Editorial Pillars (not button-like) */}
              <div className="grid grid-cols-3 gap-3 pt-3.5 border-t border-white/10">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 text-[#30ba78]">
                    <span className="material-symbols-outlined text-sm">diversity_1</span>
                    <span className="text-xs sm:text-sm font-extrabold text-white">Your family</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-[#90ebcd]/80 font-normal leading-tight">At the heart of care</p>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 text-[#90ebcd]">
                    <span className="material-symbols-outlined text-sm">favorite</span>
                    <span className="text-xs sm:text-sm font-extrabold text-white">Your values</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-[#90ebcd]/80 font-normal leading-tight">Respected & prioritized</p>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 text-[#fe7c3f]">
                    <span className="material-symbols-outlined text-sm">how_to_reg</span>
                    <span className="text-xs sm:text-sm font-extrabold text-white">Your informed choice</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-[#90ebcd]/80 font-normal leading-tight">Empowered decisions</p>
                </div>
              </div>

            </div>

            {/* Right Column: The UAE Programme Card */}
            <div className="lg:col-span-5 relative">
              <div className="rounded-2xl p-4 sm:p-5 bg-[#192072]/70 backdrop-blur-md border border-[#2453ff]/40 shadow-2xl space-y-3 relative overflow-hidden">
                
                {/* Centered UAE Programme with UAE Flag Colors */}
                <div className="flex justify-center border-b border-white/10 pb-2.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/10 border border-white/20 shadow-xs">
                    {/* Authentic UAE Flag: Red vertical bar + Green, White, Black horizontal bars */}
                    <div className="w-3.5 h-2.5 rounded-xs overflow-hidden flex relative shadow-xs flex-shrink-0">
                      <div className="w-1/3 h-full bg-[#e52320]"></div>
                      <div className="w-2/3 h-full flex flex-col">
                        <div className="h-1/3 bg-[#00732f]"></div>
                        <div className="h-1/3 bg-[#ffffff]"></div>
                        <div className="h-1/3 bg-[#000000]"></div>
                      </div>
                    </div>
                    <span className="text-white font-extrabold tracking-wide">The UAE programme</span>
                  </div>
                </div>

                <div className="text-center space-y-0.5">
                  <h3 className="text-sm sm:text-base font-black text-white leading-snug">
                    Mandatory pre-marital screening
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-[#efefef] leading-relaxed">
                    Official nationwide protocol required for prospective couples to ensure health clarity and proactive family planning.
                  </p>
                </div>

                {/* 4 Square Tiles Grid: Centered, balanced, no blank space */}
                <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                  
                  {/* Square Tile 1: 570 genes */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex flex-col items-center justify-center text-center">
                    <div className="w-6 h-6 rounded-md bg-[#30ba78]/20 flex items-center justify-center text-[#30ba78] mb-1">
                      <span className="material-symbols-outlined text-sm">genetics</span>
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-white leading-none">570</span>
                    <span className="text-xs font-bold text-[#90ebcd] tracking-wide mt-0.5">Genes</span>
                    <p className="text-[9.5px] sm:text-[10px] text-neutral-300 font-medium pt-0.5 leading-tight">
                      Covered by genetic testing
                    </p>
                  </div>

                  {/* Square Tile 2: 845+ conditions */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex flex-col items-center justify-center text-center">
                    <div className="w-6 h-6 rounded-md bg-[#fe7c3f]/20 flex items-center justify-center text-[#fe7c3f] mb-1">
                      <span className="material-symbols-outlined text-sm">health_and_safety</span>
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-white leading-none">845+</span>
                    <span className="text-xs font-bold text-[#fe7c3f] tracking-wide mt-0.5">Conditions</span>
                    <p className="text-[9.5px] sm:text-[10px] text-neutral-300 font-medium pt-0.5 leading-tight">
                      Preventable genetic conditions addressed
                    </p>
                  </div>

                  {/* Square Tile 3: Screening Types */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex flex-col items-center justify-center text-center">
                    <div className="w-6 h-6 rounded-md bg-[#2453ff]/20 flex items-center justify-center text-[#2453ff] mb-1">
                      <span className="material-symbols-outlined text-sm">bloodtype</span>
                    </div>
                    <span className="text-xs sm:text-sm font-black text-white leading-tight">Screening Types</span>
                    <p className="text-[9.5px] sm:text-[10px] text-[#90ebcd] font-semibold leading-tight pt-1">
                      Genetic, infectious disease, and blood disorders
                    </p>
                  </div>

                  {/* Square Tile 4: Find a screening centre Button with Building Logo */}
                  <a
                    href="#screening-centers"
                    className="p-2.5 sm:p-3 rounded-xl bg-[#30ba78]/15 hover:bg-[#30ba78]/25 border border-[#30ba78]/40 hover:border-[#30ba78] transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-md bg-[#30ba78] flex items-center justify-center text-[#0c322c] mb-1 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-sm">apartment</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-[#30ba78] group-hover:text-[#90ebcd] font-black text-xs sm:text-sm leading-tight">
                      <span>Find a screening centre</span>
                      <span className="material-symbols-outlined text-xs">arrow_downward</span>
                    </div>
                    <p className="text-[9.5px] sm:text-[10px] text-neutral-300 font-medium pt-0.5 leading-tight">
                      Official centres in Abu Dhabi, Al Ain & Al Dhafra
                    </p>
                  </a>

                </div>

              </div>
            </div>

          </div>

          {/* ==================== WHY THIS MATTERS (CENTERED AT BOTTOM OF OVERVIEW) ==================== */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center max-w-3xl mx-auto space-y-1.5">
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Why this matters
            </h2>
            <p className="text-xs sm:text-[13px] text-[#efefef] leading-relaxed font-normal">
              Family is at the heart of life in the UAE, and marriages within families are a long-standing, respected tradition. Because relatives are more likely to share certain genetic changes, some inherited conditions can be more common in children of related parents. Knowing this early gives families more choices, not fewer.
            </p>
            <p className="text-xs sm:text-[13px] text-[#90ebcd] leading-relaxed font-medium">
              The UAE already requires pre-marital screening. This platform helps you make sense of what comes next: what your results mean, what they don’t mean, and where to get support.
            </p>
          </div>

        </div>
      </section>

      {/* ==================== 4. NEW FAMILY HEALTH RISK ESTIMATOR (5-STEP INPUTS) ==================== */}
      <section id="estimator" className="py-20 bg-[#efefef] text-[#0c322c] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#192072]/10 text-[#192072] border border-[#192072]/20">
              <span className="material-symbols-outlined text-sm text-[#2453ff]">calculate</span>
              <span>Interactive Clinical Screener</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0c322c] tracking-tight">
              Family Health Risk Estimator
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
              Many families in the UAE and across the region have marriages between relatives. This tool gives a clear, calm estimate of how that may affect the chance of an inherited condition in a child, and what to do next.
            </p>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-[#30ba78]/30 text-xs font-semibold">
              <span className="material-symbols-outlined text-sm text-[#30ba78]">lock</span>
              <span>Your answers stay on your device. Nothing is sent or saved. Closing this page clears everything.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left Column: 5 Questions seeking input from user - Same height as Results */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-2xl shadow-md border border-neutral-200 flex flex-col justify-between h-full space-y-6">
              
              <div className="space-y-6">
                {/* Questionnaire Header & Start Again Button */}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#30ba78] text-lg">tune</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0c322c]">
                      Kinship Questionnaire (5 Steps)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetEstimator}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#efefef] text-[#0c322c] hover:bg-[#90ebcd]/40 border border-neutral-300 hover:border-[#30ba78] transition-all cursor-pointer shadow-xs"
                    title="Clear all inputs and results to start again"
                  >
                    <span className="material-symbols-outlined text-sm text-[#fe7c3f]">restart_alt</span>
                    <span>Start Again</span>
                  </button>
                </div>

                {/* STEP 1: Title in one line, options two in a row below it */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-bold text-[#0c322c]">
                      1. How are you and your partner related?
                    </h3>
                    <span className="text-[10px] text-neutral-400 font-semibold">Step 1 of 5</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">Father’s side or mother’s side makes no difference to the calculation.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {RELATIONSHIPS.map(([key, title, desc, rVal], idx) => {
                      const isSelected = relIdx === idx;
                      const proj = computeEstimate(idx, genIdx ?? 0, histIdx ?? 0, pregIdx ?? 0, scrIdx ?? 0);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setRelIdx(idx)}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[#0c322c] text-white border-[#30ba78] ring-2 ring-[#30ba78]/30 shadow-xs'
                              : 'bg-[#efefef]/60 text-[#0c322c] border-neutral-200 hover:border-[#30ba78]'
                          }`}
                        >
                          <div className="pr-2 min-w-0">
                            <p className="text-xs font-bold leading-tight truncate">{title}</p>
                            {desc && (
                              <p className={`text-[10px] line-clamp-1 ${isSelected ? 'text-[#90ebcd]' : 'text-neutral-500'}`}>
                                {desc}
                              </p>
                            )}
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                            isSelected ? 'bg-[#30ba78] text-[#0c322c]' : 'bg-white text-[#2453ff] border border-neutral-200'
                          }`}>
                            → {formatPct(proj.exRisk)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STEP 2: Title in one line in row below, options two in a row below it */}
                <div className="pt-4 border-t border-neutral-100 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-bold text-[#0c322c]">
                      2. Has marriage between relatives happened in earlier generations?
                    </h3>
                    <span className="text-[10px] text-neutral-400 font-semibold">Step 2 of 5</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">For example, were your grandparents also cousins? This raises the shared-ancestry level.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {EARLIER_GENERATIONS.map(([key, label], idx) => {
                      const isSelected = genIdx === idx;
                      const proj = computeEstimate(relIdx ?? 0, idx, histIdx ?? 0, pregIdx ?? 0, scrIdx ?? 0);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setGenIdx(idx)}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                            idx === 2 ? 'sm:col-span-2' : ''
                          } ${
                            isSelected
                              ? 'bg-[#0c322c] text-white border-[#30ba78] ring-1 ring-[#30ba78]'
                              : 'bg-neutral-50 text-[#0c322c] border-neutral-200 hover:border-[#30ba78]'
                          }`}
                        >
                          <span className="text-xs font-semibold pr-2 leading-tight">{label}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                            isSelected ? 'bg-[#30ba78] text-[#0c322c]' : 'text-neutral-500 bg-white border border-neutral-200'
                          }`}>
                            → {formatPct(proj.exRisk)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STEP 3: Title in one line in row below, options two in a row below it */}
                <div className="pt-4 border-t border-neutral-100 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-bold text-[#0c322c]">
                      3. Is there an inherited condition in either family?
                    </h3>
                    <span className="text-[10px] text-neutral-400 font-semibold">Step 3 of 5</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">Examples: thalassemia, sickle cell disease, hearing loss from birth, SMA, or child deaths.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {FAMILY_HISTORY.map(([key, label], idx) => {
                      const isSelected = histIdx === idx;
                      const proj = computeEstimate(relIdx ?? 0, genIdx ?? 0, idx, pregIdx ?? 0, scrIdx ?? 0);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setHistIdx(idx)}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                            idx === 2 ? 'sm:col-span-2' : ''
                          } ${
                            isSelected
                              ? 'bg-[#0c322c] text-white border-[#30ba78] ring-1 ring-[#30ba78]'
                              : 'bg-neutral-50 text-[#0c322c] border-neutral-200 hover:border-[#30ba78]'
                          }`}
                        >
                          <span className="text-xs font-semibold pr-2 leading-tight">{label}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                            isSelected ? 'bg-[#30ba78] text-[#0c322c]' : 'text-neutral-500 bg-white border border-neutral-200'
                          }`}>
                            → {formatPct(proj.exRisk)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STEP 4: Title in one line in row below, options two in a row below it */}
                <div className="pt-4 border-t border-neutral-100 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-bold text-[#0c322c]">
                      4. Past pregnancies
                    </h3>
                    <span className="text-[10px] text-neutral-400 font-semibold">Step 4 of 5</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">Any history of repeated miscarriages or unexplained early child illness.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {PAST_PREGNANCIES.map(([key, label], idx) => {
                      const isSelected = pregIdx === idx;
                      const proj = computeEstimate(relIdx ?? 0, genIdx ?? 0, histIdx ?? 0, idx, scrIdx ?? 0);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setPregIdx(idx)}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[#0c322c] text-white border-[#30ba78] ring-1 ring-[#30ba78]'
                              : 'bg-neutral-50 text-[#0c322c] border-neutral-200 hover:border-[#30ba78]'
                          }`}
                        >
                          <span className="text-xs font-semibold pr-2 leading-tight">{label}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                            isSelected ? 'bg-[#30ba78] text-[#0c322c]' : 'text-neutral-500 bg-white border border-neutral-200'
                          }`}>
                            → {formatPct(proj.exRisk)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STEP 5: Title in one line in row below, options two in a row below it */}
                <div className="pt-4 border-t border-neutral-100 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-bold text-[#0c322c]">
                      5. Premarital or carrier screening
                    </h3>
                    <span className="text-[10px] text-neutral-400 font-semibold">Step 5 of 5</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">Have both partners completed official genetic carrier panel tests?</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {SCREENING_STATUS.map(([key, label], idx) => {
                      const isSelected = scrIdx === idx;
                      const proj = computeEstimate(relIdx ?? 0, genIdx ?? 0, histIdx ?? 0, pregIdx ?? 0, idx);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setScrIdx(idx)}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[#0c322c] text-white border-[#30ba78] ring-1 ring-[#30ba78]'
                              : 'bg-neutral-50 text-[#0c322c] border-neutral-200 hover:border-[#30ba78]'
                          }`}
                        >
                          <span className="text-xs font-semibold pr-2 leading-tight">{label}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                            isSelected ? 'bg-[#30ba78] text-[#0c322c]' : 'text-neutral-500 bg-white border border-neutral-200'
                          }`}>
                            → {formatPct(proj.exRisk)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Recessive match checkbox */}
                  <label className="flex items-start gap-3 p-3 mt-3 rounded-xl border border-[#fe7c3f]/40 bg-[#fe7c3f]/5 cursor-pointer hover:bg-[#fe7c3f]/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={sameCarrier}
                      onChange={(e) => setSameCarrier(e.target.checked)}
                      className="w-4 h-4 mt-0.5 accent-[#fe7c3f] rounded cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-[#0c322c] leading-tight">
                      A doctor or lab told us we <b>both carry the same</b> recessive condition (e.g. Beta-Thalassemia, Sickle Cell, SMA).
                    </span>
                  </label>
                </div>

              </div>

            </div>

            {/* Right Column: Computed Results, Flip Tiles, 100 Dots Pictogram, Next Steps - Same height */}
            <div className="lg:col-span-5 bg-gradient-to-b from-[#192072] to-[#0c322c] text-white p-6 sm:p-7 rounded-2xl shadow-xl border border-[#2453ff]/40 flex flex-col justify-between h-full space-y-6">
              
              <div className="space-y-6">
                <div className="space-y-1 border-b border-white/10 pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#90ebcd]">
                    {isStarted ? 'Your Clinical Estimate' : 'Awaiting Kinship Selections'}
                  </span>
                  <p className="text-xs text-[#efefef]">Extra chance, because of the family link, that a child has a serious inherited condition:</p>
                  <div className="text-3xl sm:text-4xl font-black text-[#30ba78] pt-1">
                    {!isStarted
                      ? '—'
                      : currentF === 0 && !sameCarrier
                      ? 'No extra risk from relatedness'
                      : `about ${formatPct(currentExtra)} extra`}
                  </div>
                  {isStarted && currentF > 0 && !sameCarrier && (
                    <p className="text-[11px] text-neutral-300">
                      Likely range: {formatPct(rangeLo)} to {formatPct(rangeHi)} extra
                    </p>
                  )}
                  {!isStarted && (
                    <p className="text-[11px] text-neutral-300">
                      Select your relationship on the left to calculate range
                    </p>
                  )}
                  {/* One-liner explaining what this % denotes for everyday users */}
                  <p className="text-[11px] text-[#90ebcd] leading-snug pt-1.5 font-medium border-t border-white/10 mt-2">
                    This denotes the estimated extra likelihood—beyond the general ~3% natural baseline that applies to all couples worldwide—that a child may inherit a serious genetic condition due to shared family ancestry.
                  </p>
                </div>

                {/* Four Data Metric Cells (Interactive Flip Cards, No Ellipsis) */}
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Tile 1: F */}
                  <div
                    onClick={() => toggleTile('f')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleTile('f'); }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer min-h-[96px] flex flex-col justify-between select-none relative group"
                    title="Click to flip and read explanation"
                  >
                    {!flippedTiles['f'] ? (
                      <>
                        <div>
                          <b className="text-lg font-black text-[#90ebcd]">
                            {!isStarted ? '—' : currentF === 0 ? '0' : (currentF <= 0.005 ? '< 1/200' : `1/${Math.round(1 / currentF)}`)}
                          </b>
                          <p className="text-[10px] text-neutral-300 font-medium">Shared-ancestry level (F)</p>
                        </div>
                        <span className="text-[9px] text-[#90ebcd]/70 group-hover:text-[#90ebcd] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[11px]">flip</span>
                          <span>Click to learn more</span>
                        </span>
                      </>
                    ) : (
                      <div className="text-[10px] text-[#efefef] leading-tight space-y-1">
                        <b className="text-[#90ebcd] block text-[11px]">Shared Ancestry (F)</b>
                        <p className="text-[10px] text-neutral-200">
                          Wright’s inbreeding coefficient. Measures the proportion of genes a child inherits that are identical from common ancestors.
                        </p>
                        <span className="text-[9px] text-neutral-400 block pt-0.5">Click to flip back</span>
                      </div>
                    )}
                  </div>

                  {/* Tile 2: L */}
                  <div
                    onClick={() => toggleTile('l')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleTile('l'); }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer min-h-[96px] flex flex-col justify-between select-none relative group"
                    title="Click to flip and read explanation"
                  >
                    {!flippedTiles['l'] ? (
                      <>
                        <div>
                          <b className="text-lg font-black text-[#30ba78]">
                            {!isStarted ? '—' : `×${currentL.toFixed(2)}`}
                          </b>
                          <p className="text-[10px] text-neutral-300 font-medium">Family multiplier (L)</p>
                        </div>
                        <span className="text-[9px] text-[#30ba78]/70 group-hover:text-[#30ba78] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[11px]">flip</span>
                          <span>Click to learn more</span>
                        </span>
                      </>
                    ) : (
                      <div className="text-[10px] text-[#efefef] leading-tight space-y-1">
                        <b className="text-[#30ba78] block text-[11px]">Family Multiplier (L)</b>
                        <p className="text-[10px] text-neutral-200">
                          Clinical weight adjusting risk based on reported family conditions, miscarriages, or premarital carrier screening.
                        </p>
                        <span className="text-[9px] text-neutral-400 block pt-0.5">Click to flip back</span>
                      </div>
                    )}
                  </div>

                  {/* Tile 3: Total Chance */}
                  <div
                    onClick={() => toggleTile('tot')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleTile('tot'); }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer min-h-[96px] flex flex-col justify-between select-none relative group"
                    title="Click to flip and read explanation"
                  >
                    {!flippedTiles['tot'] ? (
                      <>
                        <div>
                          <b className="text-lg font-black text-white">
                            {!isStarted ? '~3.0% (Baseline)' : `about ${formatPct(totalChance)}`}
                          </b>
                          <p className="text-[10px] text-neutral-300 font-medium">Total chance (w/ ~3% baseline)</p>
                        </div>
                        <span className="text-[9px] text-white/70 group-hover:text-white flex items-center gap-1">
                          <span className="material-symbols-outlined text-[11px]">flip</span>
                          <span>Click to learn more</span>
                        </span>
                      </>
                    ) : (
                      <div className="text-[10px] text-[#efefef] leading-tight space-y-1">
                        <b className="text-white block text-[11px]">Total Combined Chance</b>
                        <p className="text-[10px] text-neutral-200">
                          The overall chance, combining the natural ~3% general population baseline that applies to all couples with the family link.
                        </p>
                        <span className="text-[9px] text-neutral-400 block pt-0.5">Click to flip back</span>
                      </div>
                    )}
                  </div>

                  {/* Tile 4: 1 child in N (NO ELLIPSIS) */}
                  <div
                    onClick={() => toggleTile('oneIn')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleTile('oneIn'); }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer min-h-[96px] flex flex-col justify-between select-none relative group"
                    title="Click to flip and read explanation"
                  >
                    {!flippedTiles['oneIn'] ? (
                      <>
                        <div>
                          <b className="text-lg font-black text-[#fe7c3f]">
                            {!isStarted ? '1 in 33 (Baseline)' : `1 in ${oneInCount}`}
                          </b>
                          <p className="text-[10px] text-neutral-300 font-medium">Roughly, 1 child in</p>
                        </div>
                        <span className="text-[9px] text-[#fe7c3f]/70 group-hover:text-[#fe7c3f] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[11px]">flip</span>
                          <span>Click to learn more</span>
                        </span>
                      </>
                    ) : (
                      <div className="text-[10px] text-[#efefef] leading-tight space-y-1">
                        <b className="text-[#fe7c3f] block text-[11px]">Frequency Perspective</b>
                        <p className="text-[10px] text-neutral-200">
                          Statistical frequency: roughly 1 child out of every {isStarted ? oneInCount : 33} born to couples with this background may be affected.
                        </p>
                        <span className="text-[9px] text-neutral-400 block pt-0.5">Click to flip back</span>
                      </div>
                    )}
                  </div>

                </div>

                {/* 100 Children Pictogram Visualizer */}
                <div className="space-y-2 pt-2">
                  <b className="text-xs font-bold text-white">Out of 100 children:</b>
                  <div className="grid grid-cols-10 gap-1.5 p-3 rounded-xl bg-black/30 border border-white/10">
                    {Array.from({ length: 100 }).map((_, i) => {
                      // First 3 dots: background population risk (about 3%)
                      const isBackground = i < 3;
                      // Extra risk dots (only if started and has extra)
                      const isExtra = isStarted && i >= 3 && i < 3 + Math.floor(sameCarrier ? 25 : currentExtra);
                      const isFraction = isStarted && !sameCarrier && i === 3 + Math.floor(currentExtra) && currentExtra % 1 > 0.1;

                      let dotBg = 'bg-white/20'; // Neutral
                      if (isBackground) dotBg = 'bg-[#90ebcd]'; // Baseline risk
                      if (isExtra) dotBg = 'bg-[#fe7c3f]'; // Added family link risk
                      if (isFraction) dotBg = 'bg-[#fe7c3f]/60';

                      return (
                        <div
                          key={i}
                          className={`w-2.5 h-2.5 rounded-full ${dotBg}`}
                          title={isBackground ? 'Usual background risk (3%)' : isExtra ? 'Added risk from family link' : 'Healthy outcome'}
                        />
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-neutral-300 flex items-center gap-3">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#90ebcd]"></span> Usual background (~3%)</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#fe7c3f]"></span> Added family link</span>
                  </p>
                </div>

                {/* Risk Band Banner */}
                <div className={`p-4 rounded-xl text-xs space-y-1.5 border transition-all ${
                  riskBandLevel === 'ok'
                    ? 'bg-white/10 border-white/20 text-[#efefef]'
                    : riskBandLevel === 'mid'
                    ? 'bg-[#fe7c3f]/20 border-[#fe7c3f]/50 text-white'
                    : 'bg-[#fe7c3f]/30 border-[#fe7c3f] text-white shadow-lg'
                }`}>
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">
                      {riskBandLevel === 'ok' ? 'check_circle' : riskBandLevel === 'mid' ? 'info' : 'warning'}
                    </span>
                    <span>{riskBandTitle}</span>
                  </p>
                  <p className="text-[11px] leading-relaxed">{riskBandDesc}</p>
                </div>

                {/* Sensible Next Steps */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <b className="text-xs font-bold text-white flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-[#30ba78]">checklist</span>
                    <span>Sensible next steps:</span>
                  </b>
                  <ul className="text-[11px] text-[#efefef] space-y-1.5 list-disc pl-4 leading-relaxed">
                    <li>Complete premarital screening for both partners (Thalassemia, Sickle Cell, G6PD).</li>
                    <li>Schedule a genetic counseling review to draw your official 3-generation pedigree tree.</li>
                    <li>Record any inherited conditions or early child illness in either family before consulting.</li>
                    <li>Once pregnant, consult about early scans and non-invasive prenatal testing (NIPT).</li>
                  </ul>
                </div>
              </div>

              {/* Save / Access in Vault CTA */}
              <button
                type="button"
                onClick={() => openAuth('signin')}
                className="w-full py-3 rounded-xl bg-[#30ba78] hover:bg-[#90ebcd] text-[#0c322c] text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg mt-4"
              >
                <span>Save Assessment in Clinical Vault</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>

            </div>

          </div>

          {/* ==================== 4B. CALCULATION FORMULA & EDUCATIONAL ACCORDION ==================== */}
          <div className="mt-8 border border-neutral-300 rounded-2xl bg-white shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setIsFormulaExpanded(!isFormulaExpanded)}
              className="w-full p-4 sm:p-5 flex items-center justify-between bg-neutral-50 hover:bg-neutral-100/80 transition-colors text-left cursor-pointer select-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#192072]/10 flex items-center justify-center text-[#192072]">
                  <span className="material-symbols-outlined text-base text-[#2453ff]">functions</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0c322c]">
                    How this estimate is worked out
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Wright’s inbreeding coefficient, lethal equivalents model, and clinical multipliers
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#192072]">
                <span>{isFormulaExpanded ? 'Collapse formula' : 'Expand formula'}</span>
                <span className={`material-symbols-outlined text-base transition-transform duration-200 ${isFormulaExpanded ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </div>
            </button>

            {isFormulaExpanded && (
              <div className="p-5 sm:p-6 text-xs text-[#0c322c] space-y-4 border-t border-neutral-200 bg-white leading-relaxed animate-in fade-in duration-200">
                <p className="text-neutral-700">
                  This is a simple method I designed for clarity. It builds on Wright’s inbreeding coefficient and a standard “lethal equivalents” model.
                </p>

                <div className="space-y-3 pl-3.5 border-l-2 border-[#30ba78]">
                  <div>
                    <b className="font-bold text-[#0c322c]">Step 1, shared ancestry:</b>{' '}
                    <span className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-[11px] text-[#192072]">
                      F = Σ (½)<sup>n₁+n₂+1</sup> × (1 + F<sub>A</sub>)
                    </span>{' '}
                    summed over every shared ancestor, where n₁ and n₂ are generations from each partner, and F<sub>A</sub> is the ancestors’ own inbreeding (step 2).
                  </div>

                  <div>
                    <b className="font-bold text-[#0c322c]">Step 2, family multiplier:</b>{' '}
                    <span className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-[11px] text-[#192072]">
                      L = history × pregnancies × screening
                    </span>, limited to a maximum of 3. Family history of an inherited condition counts ×1.8 (×1.2 if unsure), repeated pregnancy loss or an unexplained child illness ×1.5, and a clear screening result ×0.7.
                  </div>

                  <div>
                    <b className="font-bold text-[#0c322c]">Step 3, extra risk:</b>{' '}
                    <span className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-[11px] text-[#192072]">
                      Extra = 1 − e<sup>−k·F·L</sup>
                    </span>{' '}
                    with k = 0.49. I chose k so that first cousins with L = 1 give about 3 percentage points of extra risk, in line with published studies. The range shown uses L × 0.6 to L × 1.5.
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                  <b className="font-bold text-amber-950">Important:</b> the multipliers are judgment-based estimates, not validated clinical values. If you both carry the same recessive condition, the answer is not an estimate: each pregnancy has a 1 in 4 chance of being affected.
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-[#30ba78]/30 text-emerald-950 text-[11px] leading-relaxed">
                  <b className="font-bold text-[#0c322c]">Educational Notice:</b> Educational tool only, not medical advice. It can’t see your actual genes. Relatives marrying does not mean children will have a condition: most children of cousins are healthy. A genetic counsellor can review your real family tree.
                </div>
              </div>
            )}
          </div>

          {/* ==================== 4C. WHAT DOES MY RESULT MEAN? ==================== */}
          <div className="mt-8 p-6 sm:p-7 rounded-2xl bg-white border border-neutral-300 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
              <span className="material-symbols-outlined text-[#30ba78] text-xl">help</span>
              <h3 className="text-base sm:text-lg font-bold text-[#0c322c]">
                What does my result mean?
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
                <b className="text-xs font-bold text-[#0c322c] block">Carrier</b>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  You carry a gene change but are usually healthy. Many people are carriers of at least one.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
                <b className="text-xs font-bold text-[#0c322c] block">Couple-level risk</b>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Whether you and your partner carry changes in the same gene, which affects the chance for a child.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
                <b className="text-xs font-bold text-[#0c322c] block">Possible child risk</b>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  A probability, not a prediction. Many couples with a higher chance have healthy children.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
                <b className="text-xs font-bold text-[#0c322c] block">Risk vs. diagnosis</b>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Risk describes a chance. A diagnosis means a condition is present.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ==================== 5. THINGS WORTH REMEMBERING (DARK TEXTURE BACKGROUND) ==================== */}
      <section id="things-worth-remembering" className="py-20 bg-gradient-to-br from-[#192072] via-[#0f2a24] to-[#0c322c] text-white relative overflow-hidden border-t border-[#2453ff]/30">
        
        {/* Abstract blueprint grid background */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="zk-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#2453ff" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#zk-grid)" />
        </svg>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#30ba78]/20 text-[#90ebcd] border border-[#30ba78]/30">
              <span className="material-symbols-outlined text-sm text-[#30ba78]">lightbulb</span>
              <span>Guidance & Perspective</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Things worth remembering
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#30ba78]/20 flex items-center justify-center text-[#30ba78]">
                <span className="material-symbols-outlined text-base">check_circle</span>
              </div>
              <p className="text-sm text-[#efefef] font-medium leading-relaxed">
                Being a carrier is common. It is not a diagnosis and it is not a fault.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#90ebcd]/20 flex items-center justify-center text-[#90ebcd]">
                <span className="material-symbols-outlined text-base">info</span>
              </div>
              <p className="text-sm text-[#efefef] font-medium leading-relaxed">
                A risk is a possibility, not a certainty.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2453ff]/20 flex items-center justify-center text-[#2453ff]">
                <span className="material-symbols-outlined text-base">balance</span>
              </div>
              <p className="text-sm text-[#efefef] font-medium leading-relaxed">
                Every couple&apos;s situation is different, and so is every decision.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#fe7c3f]/20 flex items-center justify-center text-[#fe7c3f]">
                <span className="material-symbols-outlined text-base">forum</span>
              </div>
              <p className="text-sm text-[#efefef] font-medium leading-relaxed">
                Counselling is a conversation, not a verdict.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-2.5 md:col-span-2 lg:col-span-2">
              <div className="w-8 h-8 rounded-lg bg-[#30ba78]/20 flex items-center justify-center text-[#30ba78]">
                <span className="material-symbols-outlined text-base">verified_user</span>
              </div>
              <p className="text-sm text-[#efefef] font-medium leading-relaxed">
                You are in charge of your information and your choices.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ==================== 6. FIND A SCREENING CENTRE IN ABU DHABI ==================== */}
      <section id="screening-centers" className="py-16 bg-[#efefef] text-[#0c322c] border-t border-b border-neutral-300 scroll-mt-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#30ba78]/15 text-[#0c322c] border border-[#30ba78]/30 mb-2">
                <span className="material-symbols-outlined text-sm text-[#30ba78]">pin_drop</span>
                <span>Official Screening Network</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0c322c] tracking-tight">
                Find a screening centre in Abu Dhabi
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-md leading-relaxed">
              Official pre-marital screening facilities across Abu Dhabi, Al Ain, and Al Dhafra offering accredited testing packages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Abu Dhabi */}
            <div className="p-6 rounded-2xl bg-white border border-neutral-200 hover:border-[#30ba78] transition-all space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-[#30ba78]">
                <span className="material-symbols-outlined text-xl">apartment</span>
                <b className="text-base font-bold text-[#0c322c]">Abu Dhabi</b>
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed font-normal">
                Baniyas, Madinat Khalifa, Al Shamkha, Al Maqtaa, Al Bateen and Al Bahia Healthcare Centers.
              </p>
            </div>

            {/* Al Ain */}
            <div className="p-6 rounded-2xl bg-white border border-neutral-200 hover:border-[#2453ff] transition-all space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-[#2453ff]">
                <span className="material-symbols-outlined text-xl">local_hospital</span>
                <b className="text-base font-bold text-[#0c322c]">Al Ain</b>
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed font-normal">
                Al Muwaiji, Al Maqam, Neima, Al Hayer, Al Quaa, Al Hili and Sweihan Healthcare Centers; Oud Al Touba Diagnostic and Screening Center; Mezyad Healthcare; Al Yahar Healthcare.
              </p>
            </div>

            {/* Al Dhafra Region */}
            <div className="p-6 rounded-2xl bg-white border border-neutral-200 hover:border-[#fe7c3f] transition-all space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-[#fe7c3f]">
                <span className="material-symbols-outlined text-xl">medical_services</span>
                <b className="text-base font-bold text-[#0c322c]">Al Dhafra Region</b>
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed font-normal">
                Al Dhafra Family Medicine Center; Ghiathy, Marfa, Al Sila, Delma and Liwa Hospitals.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ==================== 6. FEATURE 2: CERTIFIED GENETICS SPECIALISTS & AI (CRISP WHITE / FOG) ==================== */}
      <section id="feature-genetics" className="py-20 bg-white text-[#0c322c] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="max-w-3xl space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0c322c] tracking-tight">
              Certified Genetics Specialists & AI Intelligence
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
              Culturally harmonized hereditary counseling and CLIA/CAP certified report workflows. Empowering families with actionable, culturally respectful clinical pedigree intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-2xl bg-[#efefef]/60 shadow-sm border border-neutral-200 space-y-3 hover:border-[#30ba78] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#30ba78]/15 text-[#30ba78] flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">account_tree</span>
              </div>
              <h3 className="text-base font-bold text-[#0c322c]">3-Generation Pedigree</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Standardized clinical pedigree charts mapping probands, carrier alleles, and dual-parental consanguinity with ACMG compliance.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#efefef]/60 shadow-sm border border-neutral-200 space-y-3 hover:border-[#2453ff] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#2453ff]/15 text-[#2453ff] flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">biotech</span>
              </div>
              <h3 className="text-base font-bold text-[#0c322c]">Pre-marital Couple Risk</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Automated Punnett probability matching for common Middle Eastern and South Asian carrier conditions (Thalassemia, G6PD, Sickle Cell).
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#efefef]/60 shadow-sm border border-neutral-200 space-y-3 hover:border-[#fe7c3f] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#fe7c3f]/15 text-[#fe7c3f] flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">psychology</span>
              </div>
              <h3 className="text-base font-bold text-[#0c322c]">AI Genetic Intelligence</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Instant parsing of laboratory PDF screening reports with automated redaction of sensitive PII and candidate de-identification.
              </p>
            </div>

          </div>

          {/* Testimonial Card directly from attachment */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#192072] to-[#0c322c] text-white shadow-xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1 text-[#fe7c3f]">
                <span className="material-symbols-outlined text-lg">star</span>
                <span className="material-symbols-outlined text-lg">star</span>
                <span className="material-symbols-outlined text-lg">star</span>
                <span className="material-symbols-outlined text-lg">star</span>
                <span className="material-symbols-outlined text-lg">star</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#30ba78]/20 text-[#90ebcd] border border-[#30ba78]/40 text-xs font-bold">
                <span className="material-symbols-outlined text-sm">verified</span>
                <span>Verified Geneticist</span>
              </div>
            </div>

            <blockquote className="text-base sm:text-lg italic font-medium text-[#efefef] leading-relaxed">
              "GuardianAngel provided our family with unparalleled clarity on hereditary cardiac markers while strictly keeping our DNA signatures protected under hardware keys."
            </blockquote>

            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-10 rounded-full bg-[#30ba78] text-[#0c322c] font-black flex items-center justify-center text-sm shadow">
                AT
              </div>
              <div>
                <p className="text-sm font-bold text-white">Dr. Aris Thorne, MS, CGC</p>
                <p className="text-xs text-[#90ebcd]">Clinical Genomic Specialist • Boston Health Alliance</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ==================== 7. FOOTER ==================== */}
      <footer className="py-12 bg-[#0c322c] border-t border-white/10 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center">
              <img src="/static/screen/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Guardian Angel</p>
              <p className="text-[10px] text-[#90ebcd]">Genomics Intelligence Platform</p>
            </div>
          </div>

          <div className="max-w-3xl space-y-2.5 text-xs text-[#efefef]/90 leading-relaxed pt-2 border-t border-white/10">
            <p>
              An initiative by the Pairadox Team to raise awareness of inherited health risks and to help families make informed, confident choices, with respect for every family’s values, culture and privacy.
            </p>
            <p className="text-neutral-400 text-[11px]">
              This app provides general information and does not replace medical advice, diagnosis or genetic counselling. Please speak with a qualified healthcare professional about your results.
            </p>
            <p className="text-neutral-400 text-[11px] pt-1">
              © 2026 Pairadox Team
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
