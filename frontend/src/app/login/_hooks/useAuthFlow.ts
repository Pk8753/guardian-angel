'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { AuthMode, FieldErrors } from '../_types';
import { isValidEmail } from '../_utils';

export function useAuthFlow() {
  const router = useRouter();
  const { login } = useAuthStore();

  // Modal State
  const [isAuthOpen, setIsAuthOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<AuthMode>('signin');
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = React.useState<string | null>(null);

  // Sign In Form State
  const [signInUsername, setSignInUsername] = React.useState('');
  const [signInPassword, setSignInPassword] = React.useState('');
  const [showSignInPassword, setShowSignInPassword] = React.useState(false);
  const [isSignInSubmitting, setIsSignInSubmitting] = React.useState(false);

  // Register Form State
  const [regFirstName, setRegFirstName] = React.useState('');
  const [regSecondName, setRegSecondName] = React.useState('');
  const [regUsername, setRegUsername] = React.useState('');
  const [regDob, setRegDob] = React.useState('');
  const [regEmail, setRegEmail] = React.useState('');
  const [regLocation, setRegLocation] = React.useState('');
  const [regPassword, setRegPassword] = React.useState('');
  const [showRegPassword, setShowRegPassword] = React.useState(false);
  const [isRegSubmitting, setIsRegSubmitting] = React.useState(false);

  // OTP State
  const [otpSent, setOtpSent] = React.useState(false);
  const [otpVerified, setOtpVerified] = React.useState(false);
  const [otpInput, setOtpInput] = React.useState('');
  const [otpLoading, setOtpLoading] = React.useState(false);

  // Field validation error tracking
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});

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

  const clearFieldError = React.useCallback((key: string) => {
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    setAuthError(null);
  }, []);

  const openAuth = React.useCallback((mode: AuthMode = 'signin') => {
    setActiveTab(mode);
    setAuthError(null);
    setAuthSuccess(null);
    setIsAuthOpen(true);
  }, []);

  const closeAuth = React.useCallback(() => {
    setIsAuthOpen(false);
  }, []);

  const fillDemoCreds = React.useCallback((u: string, p: string) => {
    setSignInUsername(u);
    setSignInPassword(p);
    setFieldErrors({});
    setAuthError(null);
  }, []);

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

    let pendingQA: any = null;
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('ga_pending_guest_assessment');
        if (raw) pendingQA = JSON.parse(raw);
      } catch {}
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'signin',
          username: u,
          password: p,
          quick_assessment: pendingQA,
        }),
      });

      const data = await res.json();

      if (data.status === 'success' && data.user) {
        if (pendingQA && typeof window !== 'undefined') {
          try {
            await fetch('/api/patient/quick-assessment/persist', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(pendingQA),
            });
          } catch {}
          localStorage.removeItem('ga_pending_guest_assessment');
        }

        const userRole = data.user.role || (data.user.username.toLowerCase() === 'admin' ? 'admin' : 'patient');
        login({
          id: data.user.id,
          username: data.user.username,
          fullName: data.user.full_name,
          aliasName: data.user.alias_name,
          role: userRole,
          isAdmin: data.user.username.toLowerCase() === 'admin',
          isFreshUser: !pendingQA,
        });
        router.push('/dashboard');
        return;
      } else {
        setAuthError(
          data.message || 'Invalid clinical credentials. Please check your username and password.'
        );
      }
    } catch {
      // Offline demo fallback
      const lower = u.toLowerCase();
      if (
        (lower === 'patient' || lower === 'patient@guardianangel.ae') && p === 'Patient123!'
      ) {
        if (pendingQA && typeof window !== 'undefined') {
          localStorage.removeItem('ga_pending_guest_assessment');
        }
        login({
          id: 10,
          username: 'patient',
          fullName: 'Tariq Al-Mansoor',
          aliasName: 'Tariq Al-Mansoor',
          role: 'patient',
          isAdmin: false,
          isFreshUser: false,
        });
        router.push('/dashboard');
        return;
      } else if (
        (lower === 'provider' || lower === 'provider@guardianangel.ae') && p === 'Provider123!'
      ) {
        if (pendingQA && typeof window !== 'undefined') {
          localStorage.removeItem('ga_pending_guest_assessment');
        }
        login({
          id: 11,
          username: 'provider',
          fullName: 'Dr. Mariam Al Mansoori',
          aliasName: 'Dr. Mariam Al Mansoori',
          role: 'provider',
          isAdmin: false,
          isFreshUser: false,
        });
        router.push('/dashboard');
        return;
      } else if (
        (lower === 'admin' && p === 'admin') ||
        (lower === 'user' && p === 'user') ||
        (lower === 'kabir' && p === '123456')
      ) {
        if (pendingQA && typeof window !== 'undefined') {
          localStorage.removeItem('ga_pending_guest_assessment');
        }
        login({
          id: lower === 'admin' ? 1 : lower === 'user' ? 2 : 4,
          username: lower,
          fullName:
            lower === 'admin'
              ? 'Dr. Tariq Al-Mansoor (Admin)'
              : lower === 'user'
              ? 'Tariq Al-Mansoor'
              : 'Kabir Khan',
          aliasName:
            lower === 'admin'
              ? 'Swift-Otter-301'
              : lower === 'user'
              ? 'Silent-Falcon-9214'
              : 'Solar-Sequoia-3972',
          role: lower === 'admin' ? 'admin' : 'patient',
          isAdmin: lower === 'admin',
          isFreshUser: !pendingQA,
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
    const errors: FieldErrors = {};

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

    let pendingQA: any = null;
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('ga_pending_guest_assessment');
        if (raw) pendingQA = JSON.parse(raw);
      } catch {}
    }

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
          quick_assessment: pendingQA,
        }),
      });

      const data = await res.json();

      if (data.status === 'error' || (!data.user_id && data.status !== 'success')) {
        setAuthError(data.message || 'Failed to create vault account. Please try again.');
        setIsRegSubmitting(false);
        return;
      }

      // Auto sign-in with the new credentials
      try {
        const loginRes = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'signin',
            username: regUsername.trim(),
            password: regPassword.trim(),
            quick_assessment: pendingQA,
          }),
        });
        const loginData = await loginRes.json();
        if (loginData.status === 'success' && loginData.user) {
          if (pendingQA && typeof window !== 'undefined') {
            try {
              await fetch('/api/patient/quick-assessment/persist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pendingQA),
              });
            } catch {}
            localStorage.removeItem('ga_pending_guest_assessment');
          }
          login({
            id: loginData.user.id,
            username: loginData.user.username,
            fullName: loginData.user.full_name,
            aliasName: loginData.user.alias_name,
            role: loginData.user.role || 'patient',
            isAdmin: loginData.user.username.toLowerCase() === 'admin',
            isFreshUser: !pendingQA,
          });
          setIsRegSubmitting(false);
          router.push('/dashboard');
          return;
        }
      } catch (e) {
        console.error('Auto login after registration failed:', e);
      }

      setSignInUsername(regUsername.trim());
      setSignInPassword('');
      setIsRegSubmitting(false);
      setActiveTab('signin');
      setAuthSuccess(
        'Your account has been created successfully! Please sign in with your credentials to access your health vault.'
      );
    } catch {
      setAuthError(
        'Unable to connect to backend server. Please verify python3 app.py is running on port 5000.'
      );
      setIsRegSubmitting(false);
      return;
    }
  };

  return {
    isAuthOpen,
    setIsAuthOpen,
    activeTab,
    setActiveTab,
    authError,
    setAuthError,
    authSuccess,
    setAuthSuccess,
    signInUsername,
    setSignInUsername,
    signInPassword,
    setSignInPassword,
    showSignInPassword,
    setShowSignInPassword,
    isSignInSubmitting,
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
    fieldErrors,
    clearFieldError,
    openAuth,
    closeAuth,
    fillDemoCreds,
    handleSignIn,
    handleSendOtp,
    handleVerifyOtp,
    handleRegister,
  };
}

export type UseAuthFlowReturn = ReturnType<typeof useAuthFlow>;

