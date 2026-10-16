import { useState } from 'react';
import { Link } from 'react-router';
import { Bike, Check, Crown, Gift, Percent, Sparkles, Zap } from 'lucide-react';
import { useAuth } from '@/store/auth';
import { useUI, toast } from '@/store/ui';
import { useOrders } from '@/store/orders';
import { money } from '@/lib/format';

const PERKS = [
  { icon: Bike, title: '€0 delivery fees', text: 'On every order over €15 from restaurants and stores.' },
  { icon: Percent, title: 'Member-only deals', text: 'Exclusive discounts every week at partner venues.' },
  { icon: Zap, title: 'Priority support', text: 'Skip the queue when you need help with an order.' },
  { icon: Gift, title: 'Surprise rewards', text: 'Free desserts, birthday credits and more.' },
];

const FAQ = [
  ['How does the free trial work?', 'You get 30 days of Nomly+ for free. You can cancel anytime before the trial ends — in this demo nothing is ever charged.'],
  ['Which orders get free delivery?', 'All delivery orders with an item subtotal of €15 or more, from any restaurant or store.'],
  ['Are there other fees?', 'The small service fee still applies, and small order fees apply below the venue minimum.'],
  ['Can I cancel?', 'Yes, with one tap on this page. Your benefits stop immediately in the demo.'],
];

export default function Plus() {
  const user = useAuth((s) => s.user);
  const plus = useAuth((s) => s.plus);
  const since = useAuth((s) => s.plusSince);
  const setPlus = useAuth((s) => s.setPlus);
  const openAuth = useUI((s) => s.openAuth);
  const orders = useOrders((s) => s.orders);
  const [plan, setPlan] = useState<'month' | 'year'>('month');
  const saved = orders.filter((o) => since && o.createdAt >= since).length * 2.4;

  const join = () => {
    if (!user) return openAuth('signup');
    setPlus(true);
    toast('Welcome to Nomly+ 👑 Enjoy free delivery!', { tone: 'success' });
  };

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-[#17142a] via-[#2c2160] to-[#5626cc] text-white">
        <div className="container-app relative z-10 py-16 md:py-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold">
            <Crown className="size-4 text-sun" /> Nomly+
          </span>
          <h1 className="mt-4 max-w-2xl text-4xl leading-[1.05] font-black tracking-tight sm:text-6xl">
            {plus ? 'You’re a member. Enjoy the perks!' : 'Free delivery. Every day.'}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">
            {plus
              ? `Member since ${new Date(since!).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}. You’ve saved about ${money(saved)} so far.`
              : 'Join Nomly+ and pay €0 delivery fees on orders over €15. Try it free for 30 days.'}
          </p>
          {plus ? (
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/discovery" className="btn bg-white text-[#1f1d26] hover:bg-white/90">
                Start ordering
              </Link>
              <button
                onClick={() => {
                  setPlus(false);
                  toast('Nomly+ cancelled');
                }}
                className="btn bg-white/10 text-white hover:bg-white/20"
              >
                Cancel membership
              </button>
            </div>
          ) : (
            <div className="mt-8 max-w-md">
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ['month', 'Monthly', '€6.99', 'per month'],
                    ['year', 'Yearly', '€59.99', '€5.00 / month · save 28%'],
                  ] as const
                ).map(([id, label, price, sub]) => (
                  <button
                    key={id}
                    onClick={() => setPlan(id)}
                    className={`rounded-2xl border-2 p-4 text-left transition-colors ${plan === id ? 'border-sun bg-white/10' : 'border-white/15 hover:bg-white/5'}`}
                  >
                    <span className="flex items-center justify-between text-sm font-bold text-white/80">
                      {label} {plan === id && <Check className="size-4 text-sun" />}
                    </span>
                    <span className="mt-1 block text-2xl font-black">{price}</span>
                    <span className="block text-xs text-white/70">{sub}</span>
                  </button>
                ))}
              </div>
              <button onClick={join} className="btn mt-4 w-full bg-sun py-4 text-base text-[#1f1d26] hover:bg-sun/90">
                <Sparkles className="size-5" /> Start 30-day free trial
              </button>
              <p className="mt-2 text-center text-xs text-white/60">Demo only — you will never be charged.</p>
            </div>
          )}
        </div>
        <span className="pointer-events-none absolute -right-10 -bottom-16 text-[260px] leading-none opacity-20 select-none md:right-10 md:opacity-100" aria-hidden>
          👑
        </span>
      </section>

      <section className="container-app py-14">
        <h2 className="mb-6 text-3xl font-black tracking-tight">What you get</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PERKS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-6">
              <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand-600 dark:text-brand-300">
                <Icon className="size-6" />
              </span>
              <h3 className="mt-4 text-lg font-black">{title}</h3>
              <p className="mt-1 text-ink-2">{text}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-16 mb-6 text-3xl font-black tracking-tight">Questions</h2>
        <div className="space-y-3">
          {FAQ.map(([q, a]) => (
            <details key={q} className="card group p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between font-extrabold">
                {q}
                <span className="text-2xl leading-none text-ink-3 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-ink-2">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
