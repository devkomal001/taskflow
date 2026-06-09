import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useFirewall } from '../context/FirewallContext';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Lock, ShieldAlert, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { logAuditEvent, sanitizeInput } = useFirewall();
  const { session } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  // Password requirements state
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password && password === confirmPassword;

  // Simple password strength calculator
  const getPasswordStrength = () => {
    if (!password) return { label: 'Empty', color: 'bg-slate-800', percentage: 0 };
    let score = 0;
    if (hasMinLength) score += 1;
    if (hasLetter) score += 1;
    if (hasNumber) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1; // Special char

    if (score === 1) return { label: 'Weak', color: 'bg-rose-500', percentage: 25 };
    if (score === 2) return { label: 'Fair', color: 'bg-amber-500', percentage: 50 };
    if (score === 3) return { label: 'Good', color: 'bg-blue-500', percentage: 75 };
    return { label: 'Strong', color: 'bg-emerald-500', percentage: 100 };
  };

  const strength = getPasswordStrength();

  // Redirect if no session and not in mock mode
  useEffect(() => {
    // In a live Supabase environment, the user must have an active recovery session.
    // In mock mode, we bypass this check to allow developers to simulate the flow easily.
    const isMock = searchParams.get('mock') === 'true' || localStorage.getItem('taskflow_mock_session') !== null;
    
    if (!isMock && !session) {
      setErrorMsg('Invalid or expired password reset session. Please request a new recovery email.');
    }
  }, [session, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!hasMinLength || !hasLetter || !hasNumber) {
      setErrorMsg('Password does not meet the security requirements.');
      return;
    }

    if (!passwordsMatch) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // Use Supabase updateUser to update password
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      // Log success event in audit logs
      const userEmail = data.user?.email || session?.user?.email || 'unknown@user.com';
      await logAuditEvent('Password Reset Success', userEmail, data.user?.id);
      
      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset submit error:', err);
      setErrorMsg(err.message || 'Failed to update password. Try again.');
      await logAuditEvent('Failed Password Reset Save Attempt', session?.user?.email);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center bg-slate-950 px-4 py-12 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-brand-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-violet-600/10 blur-[120px] pointer-events-none"></div>

      <div className="z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-violet-500 text-white shadow-xl shadow-brand-500/20">
            <Briefcase size={26} className="stroke-[2.5]" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Choose New Password
          </h2>
          <p className="mt-2 text-sm text-slate-400">Secure your account with a strong, private password.</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-md">
          {errorMsg && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 text-xs font-semibold text-rose-400 leading-relaxed">
              <ShieldAlert size={18} className="shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">New Password</label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-3.5 text-slate-500" size={16} />
                  <input
                    id="reset-password-input"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:border-brand-500/80 focus:outline-none transition-colors"
                  />
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-slate-500">Security Strength:</span>
                      <span className={strength.percentage >= 75 ? 'text-emerald-400' : strength.percentage >= 50 ? 'text-amber-400' : 'text-rose-400'}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: `${strength.percentage}%` }}></div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Confirm Password</label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-3.5 text-slate-500" size={16} />
                  <input
                    id="reset-password-confirm"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:border-brand-500/80 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Password Requirements Checklist */}
              <div className="rounded-xl bg-slate-950/50 p-4 border border-slate-800/40 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Password Rules</p>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 size={14} className={hasMinLength ? 'text-emerald-400' : 'text-slate-600'} />
                  <span className={hasMinLength ? 'text-slate-300' : 'text-slate-500'}>Minimum 8 characters</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 size={14} className={hasLetter ? 'text-emerald-400' : 'text-slate-600'} />
                  <span className={hasLetter ? 'text-slate-300' : 'text-slate-500'}>Contains at least one letter</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 size={14} className={hasNumber ? 'text-emerald-400' : 'text-slate-600'} />
                  <span className={hasNumber ? 'text-slate-300' : 'text-slate-500'}>Contains at least one number</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 size={14} className={passwordsMatch ? 'text-emerald-400' : 'text-slate-600'} />
                  <span className={passwordsMatch ? 'text-slate-300' : 'text-slate-500'}>Passwords match</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !hasMinLength || !hasLetter || !hasNumber || !passwordsMatch}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-500 transition-colors shadow-lg shadow-brand-500/25 disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <span>Update Password</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200">Password Saved Successfully</h4>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                  Your identity has been re-verified and password updated. You can now log back into TaskFlow.
                </p>
              </div>
              <button
                id="reset-password-login-btn"
                onClick={() => navigate('/login')}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-500 transition-colors"
              >
                <span>Continue to login</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
