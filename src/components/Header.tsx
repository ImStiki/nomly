import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import clsx from 'clsx';
import {
  MapPin,
  ChevronDown,
  Search,
  ShoppingBag,
  User as UserIcon,
  Receipt,
  Heart,
  Crown,
  Settings,
  LogOut,
  Moon,
  Sun,
  Clock,
  X,
  Compass,
  UtensilsCrossed,
  Store,
} from 'lucide-react';
import { Logo, Img } from './ui';
import { usePrefs } from '@/store/prefs';
import { useAuth } from '@/store/auth';
import { useUI } from '@/store/ui';
import { useCart, cartCount } from '@/store/cart';
import { getCity } from '@/data/cities';
import { search, POPULAR_SEARCHES } from '@/lib/search';
import { imgUrl } from '@/lib/img';
import { initials, money } from '@/lib/format';

export function useScrolled(threshold = 4) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > threshold);
    h();
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, [threshold]);
  return scrolled;
}

export function AddressButton({ compact = false }: { compact?: boolean }) {
  const cityId = usePrefs((s) => s.cityId);
  const address = usePrefs((s) => s.address);
  const openAddress = useUI((s) => s.openAddress);
  const city = getCity(cityId);
  return (
    <button
      onClick={openAddress}
      className="flex min-w-0 items-center gap-2 rounded-full bg-muted py-2 pr-3 pl-2.5 text-left transition-colors hover:bg-muted-2"
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-600 dark:text-brand-300">
        <MapPin className="size-4" />
      </span>
      <span className="min-w-0">
        <span className={clsx('block truncate text-sm leading-tight font-extrabold', compact ? 'max-w-[110px]' : 'max-w-[180px]')}>
          {address ? address.street : city.name}
        </span>
        {!compact && <span className="block truncate text-xs leading-tight text-ink-2">{address ? city.name : 'Set delivery address'}</span>}
      </span>
      <ChevronDown className="size-4 shrink-0 text-ink-2" />
    </button>
  );
}

export function SearchBox({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const cityId = usePrefs((s) => s.cityId);
  const recent = usePrefs((s) => s.recentSearches);
  const addRecent = usePrefs((s) => s.addRecentSearch);
  const clearRecent = usePrefs((s) => s.clearRecentSearches);
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const results = useMemo(() => search(cityId, q, 5), [cityId, q]);

  useEffect(() => setOpen(false), [location.pathname, location.search]);
  useEffect(() => {
    const h = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const go = (term: string) => {
    const t = term.trim();
    if (!t) return;
    addRecent(t);
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(t)}`);
  };

  const hasResults = results.venues.length + results.items.length > 0;

  return (
    <div ref={wrap} className={clsx('relative', className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
      >
        <label className="flex items-center gap-2 rounded-full border-2 border-transparent bg-muted px-4 py-2.5 transition-colors focus-within:border-brand-500 focus-within:bg-surface">
          <Search className="size-5 shrink-0 text-ink-2" />
          <input
            value={q}
            autoFocus={autoFocus}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search Nomly…"
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-ink-3"
            aria-label="Search restaurants, stores and dishes"
          />
          {q && (
            <button type="button" onClick={() => setQ('')} aria-label="Clear search" className="text-ink-3 hover:text-ink">
              <X className="size-4" />
            </button>
          )}
        </label>
      </form>
      {open && (
        <div className="absolute top-[calc(100%+8px)] right-0 left-0 z-50 max-h-[70vh] animate-fade-in overflow-y-auto rounded-2xl bg-surface p-2 shadow-pop">
          {!q.trim() ? (
            <div className="p-2">
              {recent.length > 0 && (
                <>
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-xs font-extrabold tracking-wide text-ink-3 uppercase">Recent</p>
                    <button onClick={clearRecent} className="text-xs font-bold text-brand-600 dark:text-brand-300">
                      Clear
                    </button>
                  </div>
                  {recent.map((r) => (
                    <button key={r} onClick={() => go(r)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-muted">
                      <Clock className="size-4 text-ink-3" /> {r}
                    </button>
                  ))}
                </>
              )}
              <p className="mt-2 mb-2 text-xs font-extrabold tracking-wide text-ink-3 uppercase">Popular searches</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((p) => (
                  <button key={p} onClick={() => go(p)} className="chip">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : !hasResults ? (
            <p className="p-4 text-center text-sm text-ink-2">No matches for “{q}”. Press Enter to search anyway.</p>
          ) : (
            <>
              {results.venues.length > 0 && (
                <p className="px-2 pt-2 pb-1 text-xs font-extrabold tracking-wide text-ink-3 uppercase">Venues</p>
              )}
              {results.venues.map((v) => (
                <Link key={v.id} to={`/venue/${v.slug}`} onClick={() => addRecent(q.trim())} className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted">
                  <Img src={imgUrl(v.image, 120, 120)} alt="" className="size-11 shrink-0 rounded-xl" />
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{v.name}</span>
                    <span className="block truncate text-sm text-ink-2">{v.cuisine}</span>
                  </span>
                </Link>
              ))}
              {results.items.length > 0 && (
                <p className="px-2 pt-3 pb-1 text-xs font-extrabold tracking-wide text-ink-3 uppercase">Dishes & products</p>
              )}
              {results.items.map(({ venue, item }) => (
                <Link
                  key={item.id}
                  to={`/venue/${venue.slug}?item=${item.id}`}
                  onClick={() => addRecent(q.trim())}
                  className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted"
                >
                  <Img src={imgUrl(item.image, 120, 120)} alt="" className="size-11 shrink-0 rounded-xl" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{item.name}</span>
                    <span className="block truncate text-sm text-ink-2">{venue.name}</span>
                  </span>
                  <span className="text-sm font-bold">{money(item.price)}</span>
                </Link>
              ))}
              <button onClick={() => go(q)} className="mt-1 w-full rounded-xl p-2.5 text-center text-sm font-bold text-brand-600 hover:bg-muted dark:text-brand-300">
                See all results for “{q.trim()}”
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CartButton() {
  const carts = useCart((s) => s.carts);
  const openCart = useUI((s) => s.openCart);
  const count = Object.values(carts).reduce((s, l) => s + cartCount(l), 0);
  return (
    <button
      onClick={() => openCart()}
      aria-label={`Shopping cart, ${count} items`}
      className="relative grid size-11 shrink-0 place-items-center rounded-full bg-muted text-ink transition-colors hover:bg-muted-2"
    >
      <ShoppingBag className="size-5" />
      {count > 0 && (
        <span key={count} className="absolute -top-1 -right-1 grid h-5 min-w-5 animate-pop place-items-center rounded-full bg-brand-500 px-1 text-[11px] font-black text-white ring-2 ring-bg">
          {count}
        </span>
      )}
    </button>
  );
}

export function Avatar({ name, color, size = 'md' }: { name: string; color: string; size?: 'md' | 'lg' }) {
  return (
    <span
      className={clsx('grid shrink-0 place-items-center rounded-full font-black text-white', size === 'lg' ? 'size-20 text-2xl' : 'size-11 text-sm')}
      style={{ background: color }}
    >
      {initials(name)}
    </span>
  );
}

function UserMenu() {
  const user = useAuth((s) => s.user)!;
  const plus = useAuth((s) => s.plus);
  const signOut = useAuth((s) => s.signOut);
  const theme = usePrefs((s) => s.theme);
  const setTheme = usePrefs((s) => s.setTheme);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const isDark = document.documentElement.classList.contains('dark');
  const items = [
    { to: '/me', label: 'Profile', icon: UserIcon },
    { to: '/me/orders', label: 'Order history', icon: Receipt },
    { to: '/me/favorites', label: 'Favourites', icon: Heart },
    { to: '/plus', label: plus ? 'Nomly+ member' : 'Get Nomly+', icon: Crown },
    { to: '/me/settings', label: 'Settings', icon: Settings },
  ];
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label="Account menu" aria-expanded={open} className="relative rounded-full transition-transform active:scale-95">
        <Avatar name={user.name} color={user.avatarColor} />
        {plus && (
          <span className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full bg-sun text-[10px] ring-2 ring-bg">👑</span>
        )}
      </button>
      {open && (
        <div className="absolute top-[calc(100%+10px)] right-0 z-50 w-64 animate-fade-in rounded-2xl bg-surface p-2 shadow-pop">
          <div className="border-b border-line px-3 pt-2 pb-3">
            <p className="truncate font-extrabold">{user.name}</p>
            <p className="truncate text-sm text-ink-2">{user.email}</p>
          </div>
          <div className="py-1">
            {items.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold hover:bg-muted">
                <Icon className="size-[18px] text-ink-2" /> {label}
              </Link>
            ))}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-semibold hover:bg-muted"
            >
              {isDark ? <Sun className="size-[18px] text-ink-2" /> : <Moon className="size-[18px] text-ink-2" />}
              {isDark ? 'Light mode' : 'Dark mode'}
              <span className="ml-auto text-xs text-ink-3">{theme === 'system' ? 'auto' : ''}</span>
            </button>
          </div>
          <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl border-t border-line px-3 py-2.5 text-left font-semibold text-bad hover:bg-muted">
            <LogOut className="size-[18px]" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

const TABS = [
  { to: '/discovery', label: 'Discovery', icon: Compass },
  { to: '/restaurants', label: 'Restaurants', icon: UtensilsCrossed },
  { to: '/stores', label: 'Stores', icon: Store },
];

export function Header() {
  const scrolled = useScrolled();
  const user = useAuth((s) => s.user);
  const openAuth = useUI((s) => s.openAuth);
  return (
    <header className={clsx('sticky top-0 z-[500] bg-bg/90 backdrop-blur-xl transition-shadow', scrolled && 'shadow-[0_1px_0_var(--line)]')}>
      <div className="container-app flex h-[68px] items-center gap-2 sm:gap-3 md:h-[76px]">
        <Logo className="shrink-0 [&>span:last-child]:hidden sm:[&>span:last-child]:inline" />
        <div className="hidden sm:block">
          <AddressButton />
        </div>
        <div className="sm:hidden">
          <AddressButton compact />
        </div>
        <nav className="ml-2 hidden items-center gap-1 xl:flex">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2 rounded-full px-4 py-2.5 text-[15px] font-extrabold transition-colors',
                  isActive ? 'bg-brand-soft text-brand-600 dark:text-brand-300' : 'text-ink-2 hover:bg-muted hover:text-ink',
                )
              }
            >
              <t.icon className="size-[18px]" /> {t.label}
            </NavLink>
          ))}
        </nav>
        <SearchBox className="ml-auto hidden w-full max-w-sm md:block lg:max-w-md" />
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <CartButton />
          {user ? (
            <UserMenu />
          ) : (
            <>
              <button onClick={() => openAuth('login')} className="hidden rounded-full px-4 py-2.5 font-extrabold whitespace-nowrap text-ink hover:bg-muted sm:block">
                Log in
              </button>
              <button onClick={() => openAuth('signup')} className="rounded-full bg-brand-500 px-4 py-2.5 font-extrabold whitespace-nowrap text-white hover:bg-brand-600">
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
      <nav className="container-app hidden gap-1 pb-2 md:flex xl:hidden">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold transition-colors',
                isActive ? 'bg-brand-soft text-brand-600 dark:text-brand-300' : 'text-ink-2 hover:bg-muted hover:text-ink',
              )
            }
          >
            <t.icon className="size-4" /> {t.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
