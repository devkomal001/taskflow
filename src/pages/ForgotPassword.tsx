import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Mail, ArrowLeft, Send, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useFirewall } from '../context/FirewallContext';
import { supabase } from '../supabaseClient';
import { TurnstileCaptcha } from '../components/shared/TurnstileCaptcha';

const ForgotPassword: React.FC = () => {
  const { checkAndIncrementRateLimit, logAuditEvent, sanitizeInput, validatePayload } = useFirewall();
  
  const [email, setEmail] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // 1. CAPTCHA verification
    if (!captchaToken) {
      setErrorMsg('Please complete the security check to proceed.');
      return;
    }

    // 2. Request payload validation
    const validation = validatePayload({ email }, 'forgot-password');
    if (!validation.valid) {
      setErrorMsg(validation.errorMsg || 'Invalid request parameters.');
      return;
    }

    setLoading(true);

    // 3. Application firewall rate limiting check
    const rateCheck = await checkAndIncrementRateLimit('forgot-password');
    if (!rateCheck.allowed) {
      setErrorMsg(rateCheck.errorMsg || 'Too many password reset requests. Please try again later.');
      await logAuditEvent('Blocked Password Reset Attempt', email);
      setLoading(false);
      return;
    }

    // 4. Sanitize input
    const sanitizedEmail = sanitizeInput(email);

    try {
      // 5. Send password reset request using Supabase Auth
      // Redirects user back to /reset-password endpoint
      const { data, error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      // 6. Log Audit Log
      await logAuditEvent('Password Reset Request', sanitizedEmail);
      setIsSent(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setErrorMsg(err.message || 'Failed to send password recovery email. Please check the address and try again.');
      await logAuditEvent('Failed Password Reset Attempt', sanitizedEmail);
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
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-slate-400">We'll send you instructions to reset your password.</p>
        </div>

        {/* Forgot Password Card */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-md">
          {errorMsg && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 text-xs font-semibold text-rose-400 leading-relaxed">
              <ShieldAlert size={18} className="shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!isSent ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-3.5 text-slate-500" size={16} />
                  <input
                     id="email-input"
                     type="email"
                     required
                     placeholder="name@company.com"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:border-brand-500/80 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Firewall Security Bot Protection CAPTCHA */}
              <div className="py-1">
                <TurnstileCaptcha 
                  action="forgot_password" 
                  onVerify={(token) => setCaptchaToken(token)} 
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-500 transition-colors shadow-lg shadow-brand-500/25 disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Send Reset Link</span>
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
                <h4 className="text-sm font-bold text-slate-200">Recovery Email Dispatched</h4>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                  A secure password recovery link has been sent to <strong className="text-slate-300">{email}</strong>. Check your inbox and follow the instructions.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsSent(false);
                  setCaptchaToken(null);
                }}
                className="text-xs font-semibold text-brand-400 hover:text-brand-300"
              >
                Resend link
              </button>
            </div>
          )}

          <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors">
              <ArrowLeft size={14} />
              <span>Back to login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
