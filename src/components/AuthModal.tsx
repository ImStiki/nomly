import { useEffect, useState } from 'react';
import { ArrowLeft, Mail, Sparkles, UserRound } from 'lucide-react';
import { Modal } from './ui';
import { useUI, toast } from '@/store/ui';
import { useAuth } from '@/store/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function AuthModal() {
  const open = useUI((s) => s.authOpen);
  const mode = useUI((s) => s.authMode);
  const close = useUI((s) => s.closeAuth);
  const signIn = useAuth((s) => s.signIn);
  const [step, setStep] = useState<'start' | 'details'>('start');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [agree, setAgree] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setStep('start');
      setTouched(false);
    }
  }, [open]);

  const emailOk = EMAIL_RE.test(email.trim());
  const finish = (n: string, e: string) => {
    const firstTime = !useAuth.getState().welcomeGiven;
    signIn(n, e);
    close();
    const hi = `Welcome, ${n.split(' ')[0] || 'friend'}!`;
    toast(firstTime ? `${hi} 🎉 You got €5 in Nomly credits.` : hi, { tone: 'success' });
  };

  return (
    <Modal open={open} onClose={close} size="sm" label={mode === 'signup' ? 'Sign up' : 'Log in'}>
      <div className="overflow-y-auto p-6 pt-14 sm:p-8 sm:pt-14">
        {step === 'start' ? (
          <>
            <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-brand-soft text-3xl">👋</div>
            <h2 className="text-[28px] leading-tight font-black tracking-tight">
              {mode === 'signup' ? 'Create an account' : 'Log in or create an account'}
            </h2>
            <p className="mt-2 text-ink-2">Save addresses, track orders and collect credits. This is a demo, so no password is needed.</p>
            <button onClick={() => finish('Demo User', 'demo@nomly.app')} className="btn-soft mt-6 w-full">
              <Sparkles className="size-5" /> Continue as demo user
            </button>
            <div className="my-5 flex items-center gap-3 text-xs font-bold text-ink-3 uppercase">
              <span className="h-px flex-1 bg-line" /> or with email <span className="h-px flex-1 bg-line" />
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setTouched(true);
                if (emailOk) setStep('details');
              }}
            >
              <label className="mb-1.5 block text-sm font-bold" htmlFor="auth-email">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-3" />
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input pl-12"
                />
              </div>
              {touched && !emailOk && <p className="mt-1.5 text-sm font-semibold text-bad">Please enter a valid email address.</p>}
              <button type="submit" className="btn-primary mt-4 w-full">
                Next
              </button>
            </form>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim().length < 2 || !agree) return;
              finish(name.trim(), email.trim());
            }}
          >
            <button type="button" onClick={() => setStep('start')} className="absolute top-3 left-3 grid size-10 place-items-center rounded-full bg-muted hover:bg-muted-2" aria-label="Back">
              <ArrowLeft className="size-5" />
            </button>
            <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-brand-soft text-3xl">✨</div>
            <h2 className="text-[28px] leading-tight font-black tracking-tight">Almost there!</h2>
            <p className="mt-2 text-ink-2">
              Signing in as <b className="text-ink">{email}</b>. What should couriers call you?
            </p>
            <label className="mt-6 mb-1.5 block text-sm font-bold" htmlFor="auth-name">
              Full name
            </label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-3" />
              <input id="auth-name" autoFocus autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Smith" className="input pl-12" />
            </div>
            <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-ink-2">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 size-5 accent-brand-500" />
              <span>I agree to the demo Terms of Service and understand that Nomly is a school project — no real orders are placed.</span>
            </label>
            <button type="submit" disabled={name.trim().length < 2 || !agree} className="btn-primary mt-6 w-full">
              Create account
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
}
