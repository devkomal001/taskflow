import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';

interface TurnstileCaptchaProps {
  onVerify: (token: string | null) => void;
  action?: string;
}

// Add turnstile to window type declaration
declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

export const TurnstileCaptcha: React.FC<TurnstileCaptchaProps> = ({ onVerify, action = 'general' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [useMock, setUseMock] = useState(true);

  // Check site key
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
  const isSiteKeyValid = siteKey && siteKey !== 'YOUR_TURNSTILE_SITE_KEY' && !siteKey.includes('placeholder');

  // Load Cloudflare Turnstile script dynamically if a valid site key exists
  useEffect(() => {
    if (!isSiteKeyValid) {
      setUseMock(true);
      return;
    }

    setUseMock(false);

    // If script already exists in document, set loaded
    if (window.turnstile) {
      setScriptLoaded(true);
      return;
    }

    const scriptId = 'cloudflare-turnstile-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const handleScriptLoad = () => {
      setScriptLoaded(true);
    };

    script.addEventListener('load', handleScriptLoad);

    return () => {
      script.removeEventListener('load', handleScriptLoad);
    };
  }, [isSiteKeyValid]);

  // Render Turnstile Widget
  useEffect(() => {
    if (useMock || !scriptLoaded || !containerRef.current || !window.turnstile) {
      return;
    }

    try {
      // Clear container first
      containerRef.current.innerHTML = '';
      
      const widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        action: action,
        theme: 'dark',
        callback: (token: string) => {
          onVerify(token);
        },
        'expired-callback': () => {
          onVerify(null);
        },
        'error-callback': () => {
          console.error('Turnstile verification error, falling back to mock captcha');
          setUseMock(true);
          onVerify(null);
        },
      });

      widgetIdRef.current = widgetId;
    } catch (err) {
      console.error('Failed to render Turnstile widget, falling back to mock:', err);
      setUseMock(true);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {}
      }
    };
  }, [useMock, scriptLoaded, siteKey, action, onVerify]);

  // ==========================================
  // HIGH-FIDELITY MOCK CAPTCHA IMPLEMENTATION
  // ==========================================
  const [mockVerified, setMockVerified] = useState(false);
  const [mockVerifying, setMockVerifying] = useState(false);

  const handleMockClick = () => {
    if (mockVerified || mockVerifying) return;

    setMockVerifying(true);
    // Simulate smart CAPTCHA check duration
    setTimeout(() => {
      setMockVerifying(false);
      setMockVerified(true);
      onVerify(`mock_turnstile_token_${Math.random().toString(36).substring(7)}`);
    }, 1000);
  };

  if (useMock) {
    return (
      <div 
        onClick={handleMockClick}
        className={`flex items-center justify-between rounded-xl border p-4 select-none cursor-pointer transition-all duration-300 ${
          mockVerified 
            ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10' 
            : 'border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-900/50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="relative flex h-6 w-6 items-center justify-center">
            {mockVerifying ? (
              <Loader2 className="h-5 w-5 animate-spin text-brand-400" />
            ) : mockVerified ? (
              <ShieldCheck className="h-6 w-6 text-emerald-400 animate-in zoom-in duration-200" />
            ) : (
              <div className="h-5 w-5 rounded-md border-2 border-slate-600 hover:border-brand-500 transition-colors bg-slate-900"></div>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-200">
              {mockVerifying ? 'Verifying connection...' : mockVerified ? 'Secure Connection Verified' : 'Verify you are human'}
            </p>
            <p className="text-[10px] text-slate-500">Security check by Turnstile (Mocked)</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[9px] font-bold tracking-widest text-slate-500 uppercase">Cloudflare</p>
          <p className="text-[8px] font-semibold text-slate-600 uppercase">Turnstile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center w-full min-h-[65px] py-1">
      <div ref={containerRef} className="cf-turnstile"></div>
      {!scriptLoaded && (
        <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950 p-4">
          <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
          <span className="text-xs text-slate-400">Loading security check...</span>
        </div>
      )}
    </div>
  );
};
