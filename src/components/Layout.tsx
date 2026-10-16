import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import clsx from 'clsx';
import { Compass, UtensilsCrossed, Store, Search, User, ChevronRight, Globe, Mail, AtSign, MessageCircle } from 'lucide-react';
import { Header } from './Header';
import { Logo, Toaster, Img } from './ui';
import { AuthModal } from './AuthModal';
import { AddressModal } from './AddressModal';
import { CartDrawer } from './CartDrawer';
import { usePrefs } from '@/store/prefs';
import { useAuth } from '@/store/auth';
import { useOrders, orderProgress } from '@/store/orders';
import { imgUrl } from '@/lib/img';
import { toast } from '@/store/ui';
import type { OrderStatus } from '@/types';

function useThemeClass() {
  const theme = usePrefs((s) => s.theme);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#111015' : '#7B4DFF');
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

const STATUS_TEXT = {
  received: 'Order received',
  preparing: 'Being prepared',
  pickup: 'Courier picking up',
  delivering: 'On the way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
} as const;

function ActiveOrderBanner() {
  const orders = useOrders((s) => s.orders);
  const speed = usePrefs((s) => s.demoSpeed);
  const now = useNow(2000);
  const { pathname } = useLocation();
  const active = orders.find((o) => {
    const p = orderProgress(o, now);
    return p.status !== 'delivered' && p.status !== 'cancelled';
  });
  if (!active || /^\/(order|checkout|venue)\//.test(pathname)) return null;
  const p = orderProgress(active, now);
  const mins = Math.max(1, Math.ceil((p.remainingMs * speed) / 60000));
  return (
    <Link
      to={`/order/${active.id}`}
      className="fixed inset-x-3 bottom-[76px] z-[400] mx-auto flex max-w-md animate-slide-up items-center gap-3 rounded-2xl bg-[#1f1d26] p-2.5 pr-4 text-white shadow-pop md:bottom-5 dark:bg-[#2a2833]"
    >
      <Img src={imgUrl(active.venueImage, 120, 120)} alt="" className="size-11 shrink-0 rounded-xl" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-extrabold">{STATUS_TEXT[p.status]} · {active.venueName}</span>
        <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-white/15">
          <span className="block h-full rounded-full bg-brand-400 transition-[width] duration-1000" style={{ width: `${Math.max(4, p.t * 100)}%` }} />
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-lg leading-none font-black">{mins}</span>
        <span className="text-[11px] font-bold opacity-75">min</span>
      </span>
      <ChevronRight className="size-5 shrink-0 opacity-60" />
    </Link>
  );
}

/** Pops a toast whenever one of your orders moves to a new step. */
function OrderWatcher() {
  const orders = useOrders((s) => s.orders);
  const now = useNow(2000);
  const navigate = useNavigate();
  const last = useRef(new Map<string, OrderStatus>());
  useEffect(() => {
    for (const o of orders) {
      const st = orderProgress(o, now).status;
      const prev = last.current.get(o.id);
      last.current.set(o.id, st);
      if (!prev || prev === st || st === 'cancelled' || st === 'received') continue;
      const pickup = o.mode === 'pickup';
      const msg: Partial<Record<OrderStatus, string>> = {
        preparing: `👩‍🍳 ${o.venueName} is preparing your order`,
        pickup: pickup ? '🛍️ Your order is ready for pickup!' : `🛵 ${o.courierName} is picking up your order`,
        delivering: '🚀 Your order is on the way!',
        delivered: pickup ? '🎉 Order picked up. Enjoy!' : '🎉 Your order has arrived. Enjoy!',
      };
      if (msg[st])
        toast(msg[st]!, {
          tone: st === 'delivered' ? 'success' : 'default',
          action: { label: 'View', onClick: () => navigate(`/order/${o.id}`) },
        });
    }
  }, [orders, now, navigate]);
  return null;
}

function BottomNav() {
  const user = useAuth((s) => s.user);
  const items = [
    { to: '/discovery', label: 'Discovery', icon: Compass },
    { to: '/restaurants', label: 'Restaurants', icon: UtensilsCrossed },
    { to: '/stores', label: 'Stores', icon: Store },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/me', label: user ? 'Profile' : 'Account', icon: User },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[450] border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/me' ? false : undefined}
            className={({ isActive }) =>
              clsx('flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold transition-colors', isActive ? 'text-brand-500' : 'text-ink-3')
            }
          >
            <Icon className="size-[22px]" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

const FOOTER_LINKS: [string, [string, string][]][] = [
  ['Get to know us', [['About us', '/info/about'], ['Careers', '/info/careers'], ['Press', '/info/press'], ['Sustainability', '/info/sustainability']]],
  ['Let’s do business', [['Become a courier', '/info/couriers'], ['Nomly for merchants', '/info/merchants'], ['Nomly for Work', '/info/work'], ['Nomly+', '/plus']]],
  ['Useful links', [['Support', '/info/support'], ['Gift cards', '/info/gift-cards'], ['Cities', '/info/cities'], ['Promo codes', '/info/promo-codes']]],
];

function Footer() {
  return (
    <footer className="mt-20 bg-[#17142a] pb-24 text-white md:pb-0">
      <div className="container-app grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo onDark />
          <p className="mt-4 max-w-xs text-sm text-white/65">
            Food, groceries and more from the best places in your city, delivered in minutes.
          </p>
          <div className="mt-5 flex gap-2">
            {[Globe, AtSign, MessageCircle, Mail].map((Icon, i) => (
              <span key={i} className="grid size-10 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20">
                <Icon className="size-[18px]" />
              </span>
            ))}
          </div>
        </div>
        {FOOTER_LINKS.map(([title, links]) => (
          <div key={title}>
            <h3 className="mb-3 font-extrabold">{title}</h3>
            <ul className="space-y-2">
              {links.map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-white/65 transition-colors hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-app flex flex-col gap-2 py-6 text-xs text-white/50 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Nomly — a fictional delivery app built for a school project. Not affiliated with Wolt or any real company.</p>
          <p>
            Photos from{' '}
            <a className="underline hover:text-white" href="https://unsplash.com" target="_blank" rel="noreferrer">
              Unsplash
            </a>{' '}
            · Maps © OpenStreetMap contributors
          </p>
        </div>
      </div>
    </footer>
  );
}

export function Layout() {
  useThemeClass();
  const { pathname } = useLocation();
  const hideFooter = pathname.startsWith('/checkout') || pathname.startsWith('/order/');
  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollToTop />
      <Header />
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      {!hideFooter && <Footer />}
      <BottomNav />
      <ActiveOrderBanner />
      <OrderWatcher />
      <AuthModal />
      <AddressModal />
      <CartDrawer />
      <Toaster />
    </div>
  );
}

export { useNow };
