import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFirewall } from '../context/FirewallContext';
import { Briefcase, Mail, Lock, ShieldAlert, Sparkles } from 'lucide-react';
import { TurnstileCaptcha } from '../components/shared/TurnstileCaptcha';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { checkAndIncrementRateLimit, logAuditEvent, sanitizeInput, validatePayload } = useFirewall();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // 1. CAPTCHA Check
    if (!captchaToken) {
      setErrorMsg('Please complete the security check to proceed.');
      return;
    }

    // 2. Request payload validation
    const validation = validatePayload({ email }, 'login');
    if (!validation.valid) {
      setErrorMsg(validation.errorMsg || 'Invalid payload parameters.');
      return;
    }

    setLoading(true);

    // 3. Application firewall rate limiting check
    const rateCheck = await checkAndIncrementRateLimit('login');
    if (!rateCheck.allowed) {
      setErrorMsg(rateCheck.errorMsg || 'Too many login attempts. Your IP has been blocked.');
      await logAuditEvent('Blocked Login Attempt', email);
      setLoading(false);
      return;
    }

    // 4. Sanitize input
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = password; // Do not filter password chars to support special characters, but we validate payload length

    // 5. Submit Auth
    const { error } = await login(sanitizedEmail, sanitizedPassword);
    
    if (error) {
      setLoading(false);
      setErrorMsg(error.message || 'Incorrect email or password.');
      // 6. Log Failed Login
      await logAuditEvent('Failed Login Attempt', sanitizedEmail);
    } else {
      // 6. Log Success Login
      await logAuditEvent('Login Success', sanitizedEmail);
      setLoading(false);
      navigate('/');
    }
  };

  // Quick dev login helper (bypasses CAPTCHA for developer speed, but logs standard audits)
  const handleQuickLogin = async (role: 'owner' | 'developer') => {
    setErrorMsg('');
    setLoading(true);
    const targetEmail = role === 'owner' ? 'owner@taskflow.com' : 'developer@taskflow.com';
    const targetPassword = 'password123';

    const { error } = await login(targetEmail, targetPassword);
    if (error) {
      setLoading(false);
      setErrorMsg(error.message || 'Incorrect email or password.');
      await logAuditEvent('Failed Login Attempt (Quick Login)', targetEmail);
    } else {
      await logAuditEvent('Login Success (Quick Login)', targetEmail);
      setLoading(false);
      navigate('/');
    }
  };

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center bg-slate-950 px-4 py-12 overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-brand-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-violet-600/10 blur-[120px] pointer-events-none"></div>

      <div className="z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-violet-500 text-white shadow-xl shadow-brand-500/20">
            <Briefcase size={26} className="stroke-[2.5]" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Welcome to TaskFlow
          </h2>
          <p className="mt-2 text-sm text-slate-400">Streamline projects and track team progress in real time.</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-md">
          {errorMsg && (
            <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 text-xs font-semibold text-rose-400 leading-relaxed">
              <ShieldAlert size={18} className="shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-3.5 text-slate-500" size={16} />
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:border-brand-500/80 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
                <Link to="/forgot-password" id="forgot-password-link" className="text-xs font-semibold text-brand-400 hover:text-brand-300">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-3.5 text-slate-500" size={16} />
                <input
                  id="login-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:border-brand-500/80 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Firewall Security Bot Protection CAPTCHA */}
            <div className="py-1">
              <TurnstileCaptcha 
                action="login" 
                onVerify={(token) => setCaptchaToken(token)} 
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-500 transition-colors shadow-lg shadow-brand-500/25 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Quick Demo Sign Ins */}
          <div className="mt-6 border-t border-slate-800/80 pt-5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              <Sparkles size={12} className="text-brand-400" />
              <span>Developer Quick Logins</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                id="quick-login-owner"
                onClick={() => handleQuickLogin('owner')}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-850 bg-slate-900/50 p-2.5 hover:bg-slate-900 hover:border-slate-800 text-left transition-colors"
              >
                <span className="text-[10px] font-bold text-slate-400">Workspace Owner</span>
                <span className="text-[9px] font-semibold text-brand-400 mt-0.5 truncate max-w-full">owner@taskflow.com</span>
              </button>
              <button
                id="quick-login-member"
                onClick={() => handleQuickLogin('developer')}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-850 bg-slate-900/50 p-2.5 hover:bg-slate-900 hover:border-slate-800 text-left transition-colors"
              >
                <span className="text-[10px] font-bold text-slate-400">Team Member</span>
                <span className="text-[9px] font-semibold text-brand-400 mt-0.5 truncate max-w-full">developer@taskflow.com</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <p className="mt-6 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" id="create-account-link" className="font-semibold text-brand-400 hover:text-brand-300">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
