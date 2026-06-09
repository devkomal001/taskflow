import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFirewall } from '../context/FirewallContext';
import { Briefcase, User, Mail, Lock, ShieldAlert } from 'lucide-react';
import { TurnstileCaptcha } from '../components/shared/TurnstileCaptcha';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { checkAndIncrementRateLimit, logAuditEvent, sanitizeInput, validatePayload } = useFirewall();

  const [fullName, setFullName] = useState('');
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
    const validation = validatePayload({ fullName, email, password }, 'signup');
    if (!validation.valid) {
      setErrorMsg(validation.errorMsg || 'Invalid registration form parameters.');
      return;
    }

    setLoading(true);

    // 3. Application firewall rate limiting check (5 attempts per hour per IP)
    const rateCheck = await checkAndIncrementRateLimit('signup');
    if (!rateCheck.allowed) {
      setErrorMsg(rateCheck.errorMsg || 'Too many signup attempts. Try again later.');
      await logAuditEvent('Blocked Signup Attempt', email);
      setLoading(false);
      return;
    }

    // 4. Sanitize inputs
    const sanitizedName = sanitizeInput(fullName);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = password; // Validate complexity, preserve special symbols

    // 5. Submit Auth
    const { error } = await register(sanitizedEmail, sanitizedPassword, sanitizedName);
    
    if (error) {
      setLoading(false);
      setErrorMsg(error.message || 'Failed to create account.');
      // 6. Log Failed Signup
      await logAuditEvent('Failed Signup Attempt', sanitizedEmail);
    } else {
      // 6. Log Success Signup
      await logAuditEvent('Signup Success', sanitizedEmail);
      setLoading(false);
      navigate('/');
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
            Create Account
          </h2>
          <p className="mt-2 text-sm text-slate-400">Join TaskFlow and collaborate with your teammates.</p>
        </div>

        {/* Register Card */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-md">
          {errorMsg && (
            <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 text-xs font-semibold text-rose-400 leading-relaxed">
              <ShieldAlert size={18} className="shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Full Name</label>
              <div className="relative mt-1.5">
                <User className="absolute left-3 top-3.5 text-slate-500" size={16} />
                <input
                  id="register-name"
                  type="text"
                  required
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:border-brand-500/80 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-3.5 text-slate-500" size={16} />
                <input
                  id="register-email"
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-3.5 text-slate-500" size={16} />
                <input
                  id="register-password"
                  type="password"
                  required
                  placeholder="Min. 8 characters with letter & number"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:border-brand-500/80 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Firewall Security Bot Protection CAPTCHA */}
            <div className="py-1">
              <TurnstileCaptcha 
                action="signup" 
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
                'Sign Up'
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" id="login-link" className="font-semibold text-brand-400 hover:text-brand-300">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
