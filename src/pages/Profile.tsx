import { useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import clsx from 'clsx';
import {
  Banknote,
  Briefcase,
  ChevronRight,
  Copy,
  CreditCard,
  Crown,
  Gift,
  Heart,
  House,
  LogOut,
  MapPin,
  Moon,
  Pencil,
  Receipt,
  RotateCcw,
  Settings as SettingsIcon,
  Smartphone,
  Sun,
  Trash2,
  User as UserIcon,
  Monitor,
  Gauge,
} from 'lucide-react';
import type { Address, Venue } from '@/types';
import { useAuth } from '@/store/auth';
import { usePrefs, type Theme } from '@/store/prefs';
import { useOrders, orderProgress } from '@/store/orders';
import { useCart } from '@/store/cart';
import { useUI, toast } from '@/store/ui';
import { getVenueById, ALL_VENUES } from '@/data/venues';
import { getCity } from '@/data/cities';
import { imgUrl } from '@/lib/img';
import { formatDateTime, money, plural } from '@/lib/format';
import { Avatar } from '@/components/Header';
import { AddressForm } from '@/components/AddressModal';
import { VenueGrid } from '@/components/VenueCard';
import { EmptyState, Img, Modal, Segmented } from '@/components/ui';
import { useNow } from '@/components/Layout';

const NAV = [
  { to: '/me', label: 'Account', icon: UserIcon, end: true },
  { to: '/me/orders', label: 'Order history', icon: Receipt },
  { to: '/me/favorites', label: 'Favourites', icon: Heart },
  { to: '/me/settings', label: 'Settings', icon: SettingsIcon },
];

export function ProfileLayout() {
  return (
    <div className="container-app max-w-6xl pt-4 md:pt-8">
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-col md:gap-1 md:px-0">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 font-extrabold transition-colors md:rounded-xl',
                  isActive ? 'bg-brand-soft text-brand-600 dark:text-brand-300' : 'text-ink-2 hover:bg-muted hover:text-ink',
                )
              }
            >
              <Icon className="size-[18px]" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="card mb-5 p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function LoginPrompt() {
  const openAuth = useUI((s) => s.openAuth);
  return (
    <EmptyState
      emoji="👤"
      title="Log in to see your account"
      text="Save addresses and payment methods, collect credits and get Nomly+."
      action={
        <div className="flex gap-2">
          <button onClick={() => openAuth('login')} className="btn-ghost">
            Log in
          </button>
          <button onClick={() => openAuth('signup')} className="btn-primary">
            Sign up
          </button>
        </div>
      }
    />
  );
}

const PAY_ICON = { card: CreditCard, wallet: Smartphone, cash: Banknote };
const LABEL_ICON = { Home: House, Work: Briefcase, Other: MapPin };

export function Account() {
  const user = useAuth((s) => s.user);
  const updateUser = useAuth((s) => s.updateUser);
  const signOut = useAuth((s) => s.signOut);
  const credits = useAuth((s) => s.credits);
  const plus = useAuth((s) => s.plus);
  const addresses = useAuth((s) => s.addresses);
  const saveAddress = useAuth((s) => s.saveAddress);
  const removeAddress = useAuth((s) => s.removeAddress);
  const methods = useAuth((s) => s.paymentMethods);
  const defaultPayment = useAuth((s) => s.defaultPayment);
  const setDefaultPayment = useAuth((s) => s.setDefaultPayment);
  const removePayment = useAuth((s) => s.removePayment);
  const orders = useOrders((s) => s.orders);
  const cityId = usePrefs((s) => s.cityId);
  const currentAddress = usePrefs((s) => s.address);
  const setAddress = usePrefs((s) => s.setAddress);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [addrEdit, setAddrEdit] = useState<(Partial<Address> & { cityId: string; lat: number; lng: number }) | null>(null);

  if (!user) return <LoginPrompt />;
  const code = `${user.name.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6) || 'FRIEND'}${user.id.slice(-3).toUpperCase()}`;
  const spent = orders.filter((o) => !o.cancelled).reduce((s, o) => s + o.totals.total, 0);

  return (
    <>
      <div className="card mb-5 flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
        <Avatar name={user.name} color={user.avatarColor} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-black">{user.name}</h1>
          <p className="truncate text-ink-2">{user.email}</p>
          {plus && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-sun/25 px-2.5 py-1 text-xs font-extrabold">
              <Crown className="size-3.5" /> Nomly+ member
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 text-center sm:w-80">
          {[
            [money(credits), 'Credits'],
            [String(orders.length), 'Orders'],
            [money(spent), 'Spent'],
          ].map(([v, l]) => (
            <div key={l} className="rounded-2xl bg-muted p-3">
              <p className="truncate text-lg font-black">{v}</p>
              <p className="text-xs font-bold text-ink-2">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {!plus && (
        <Link to="/plus" className="mb-5 flex items-center gap-4 rounded-3xl bg-gradient-to-r from-[#1f1d26] to-[#3d2f6e] p-5 text-white">
          <span className="grid size-12 place-items-center rounded-2xl bg-sun text-2xl">👑</span>
          <span className="flex-1">
            <span className="block font-black">Try Nomly+ free for 30 days</span>
            <span className="block text-sm opacity-80">€0 delivery fees on orders over €15</span>
          </span>
          <ChevronRight className="size-5" />
        </Link>
      )}

      <Panel
        title="Personal info"
        action={
          !editing && (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-sm font-bold text-brand-600 dark:text-brand-300">
              <Pencil className="size-4" /> Edit
            </button>
          )
        }
      >
        {editing ? (
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim().length < 2) return;
              updateUser({ name: name.trim(), phone: phone.trim() || undefined });
              setEditing(false);
              toast('Profile updated', { tone: 'success' });
            }}
          >
            <div>
              <label className="mb-1.5 block text-sm font-bold" htmlFor="p-name">
                Name
              </label>
              <input id="p-name" value={name} onChange={(e) => setName(e.target.value)} className="input" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold" htmlFor="p-phone">
                Phone
              </label>
              <input id="p-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+000 00 000 000" className="input" />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <button type="button" onClick={() => setEditing(false)} className="btn-ghost">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save
              </button>
            </div>
          </form>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-3">
            {[
              ['Name', user.name],
              ['Email', user.email],
              ['Phone', user.phone ?? 'Not added'],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-sm text-ink-2">{k}</dt>
                <dd className="truncate font-bold">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </Panel>

      <Panel
        title="Addresses"
        action={
          <button
            onClick={() => {
              const c = getCity(cityId);
              setAddrEdit({ cityId, lat: c.lat + 0.002, lng: c.lng - 0.003 });
            }}
            className="text-sm font-bold text-brand-600 dark:text-brand-300"
          >
            + Add
          </button>
        }
      >
        {addresses.length === 0 ? (
          <p className="text-ink-2">No saved addresses yet.</p>
        ) : (
          <ul className="space-y-2">
            {addresses.map((a) => {
              const Icon = LABEL_ICON[a.label];
              return (
                <li key={a.id} className="flex items-center gap-3 rounded-2xl bg-muted p-3">
                  <Icon className="size-5 shrink-0 text-ink-2" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">
                      {a.street} {currentAddress?.id === a.id && <span className="ml-1 rounded bg-brand-500 px-1.5 py-0.5 text-[10px] text-white">ACTIVE</span>}
                    </p>
                    <p className="truncate text-sm text-ink-2">
                      {a.label} · {getCity(a.cityId).name}
                      {a.details ? ` · ${a.details}` : ''}
                    </p>
                  </div>
                  <button onClick={() => setAddress(a)} className="hidden text-sm font-bold text-brand-600 sm:block dark:text-brand-300">
                    Use
                  </button>
                  <button onClick={() => setAddrEdit(a)} className="grid size-9 place-items-center rounded-full hover:bg-muted-2" aria-label="Edit">
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => {
                      removeAddress(a.id);
                      if (currentAddress?.id === a.id) setAddress(null);
                    }}
                    className="grid size-9 place-items-center rounded-full text-bad hover:bg-muted-2"
                    aria-label="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel title="Payment methods">
        <ul className="space-y-2">
          {methods.map((m) => {
            const Icon = PAY_ICON[m.kind];
            return (
              <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-muted p-3">
                <Icon className="size-5 shrink-0 text-ink-2" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{m.label}</p>
                  {m.detail && <p className="text-sm text-ink-2">{m.detail}</p>}
                </div>
                {defaultPayment === m.id ? (
                  <span className="rounded-full bg-brand-500 px-2.5 py-1 text-xs font-extrabold text-white">Default</span>
                ) : (
                  <button onClick={() => setDefaultPayment(m.id)} className="text-sm font-bold text-brand-600 dark:text-brand-300">
                    Make default
                  </button>
                )}
                {m.kind === 'card' && methods.length > 1 && (
                  <button onClick={() => removePayment(m.id)} className="grid size-9 place-items-center rounded-full text-bad hover:bg-muted-2" aria-label="Remove">
                    <Trash2 className="size-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-ink-3">Add new demo cards at checkout.</p>
      </Panel>

      <Panel title="Invite friends, get €5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Gift className="size-10 shrink-0 text-brand-500" />
          <p className="flex-1 text-ink-2">Share your code. When a friend places their first order you both get €5 in Nomly credits.</p>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(code);
              } catch {
                /* clipboard not available */
              }
              toast(`Code ${code} copied!`);
            }}
            className="btn-soft font-mono"
          >
            {code} <Copy className="size-4" />
          </button>
        </div>
      </Panel>

      <button
        onClick={() => {
          signOut();
          navigate('/discovery');
          toast('You’ve been logged out');
        }}
        className="btn-ghost text-bad"
      >
        <LogOut className="size-5" /> Log out
      </button>

      <Modal open={!!addrEdit} onClose={() => setAddrEdit(null)} label="Address">
        <div className="overflow-x-hidden overflow-y-auto p-6 sm:p-8">
          <h2 className="mb-5 pr-12 text-2xl font-black">{addrEdit?.id ? 'Edit address' : 'New address'}</h2>
          {addrEdit && (
            <AddressForm
              initial={addrEdit}
              onCancel={() => setAddrEdit(null)}
              onSave={(a) => {
                saveAddress(a);
                if (currentAddress?.id === a.id || !currentAddress) setAddress(a);
                setAddrEdit(null);
                toast('Address saved', { tone: 'success' });
              }}
            />
          )}
        </div>
      </Modal>
    </>
  );
}

const STATUS_BADGE: Record<string, [string, string]> = {
  received: ['Received', 'bg-brand-500 text-white'],
  preparing: ['Preparing', 'bg-brand-500 text-white'],
  pickup: ['Picking up', 'bg-brand-500 text-white'],
  delivering: ['On the way', 'bg-brand-500 text-white'],
  delivered: ['Delivered', 'bg-good/15 text-good'],
  cancelled: ['Cancelled', 'bg-bad/15 text-bad'],
};

export function OrderHistory() {
  const orders = useOrders((s) => s.orders);
  const replace = useCart((s) => s.replace);
  const openCart = useUI((s) => s.openCart);
  const now = useNow(5000);
  if (!orders.length)
    return (
      <EmptyState
        emoji="🧾"
        title="No orders yet"
        text="When you place an order it will show up here."
        action={
          <Link to="/discovery" className="btn-primary">
            Find something to eat
          </Link>
        }
      />
    );
  return (
    <>
      <h1 className="mb-5 text-3xl font-black tracking-tight">Order history</h1>
      <ul className="space-y-3">
        {orders.map((o) => {
          const p = orderProgress(o, now);
          const [label, cls] = STATUS_BADGE[p.status];
          const items = o.lines.reduce((s, l) => s + l.quantity, 0);
          return (
            <li key={o.id} className="card flex items-center gap-4 p-3 sm:p-4">
              <Link to={`/order/${o.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                <Img src={imgUrl(o.venueImage, 160, 160)} alt="" className="size-16 shrink-0 rounded-xl sm:size-20" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-extrabold">{o.venueName}</p>
                    <span className={clsx('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold', cls)}>{label}</span>
                  </div>
                  <p className="truncate text-sm text-ink-2">{o.lines.map((l) => `${l.quantity}× ${l.name}`).join(', ')}</p>
                  <p className="text-sm text-ink-3">
                    {formatDateTime(o.createdAt)} · {plural(items, 'item')} · <b className="text-ink">{money(o.totals.total)}</b>
                  </p>
                </div>
              </Link>
              <button
                onClick={() => {
                  replace(o.venueId, o.lines);
                  openCart(o.venueId);
                }}
                className="hidden shrink-0 sm:flex btn-soft px-3 py-2 text-sm"
                disabled={!getVenueById(o.venueId)}
              >
                <RotateCcw className="size-4" /> Reorder
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function Favorites() {
  const favorites = usePrefs((s) => s.favorites);
  const venues = favorites.map((id) => ALL_VENUES.find((v) => v.id === id)).filter(Boolean) as Venue[];
  return (
    <>
      <h1 className="mb-5 text-3xl font-black tracking-tight">Favourites</h1>
      {venues.length === 0 ? (
        <EmptyState
          emoji="❤️"
          title="No favourites yet"
          text="Tap the heart on any restaurant or store to save it here."
          action={
            <Link to="/discovery" className="btn-primary">
              Discover places
            </Link>
          }
        />
      ) : (
        <div className="[&_.grid]:xl:grid-cols-3">
          <VenueGrid venues={venues} />
        </div>
      )}
    </>
  );
}

export function Settings() {
  const theme = usePrefs((s) => s.theme);
  const setTheme = usePrefs((s) => s.setTheme);
  const speed = usePrefs((s) => s.demoSpeed);
  const setSpeed = usePrefs((s) => s.setDemoSpeed);
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <h1 className="mb-5 text-3xl font-black tracking-tight">Settings</h1>
      <Panel title="Appearance">
        <Segmented<Theme>
          value={theme}
          onChange={setTheme}
          className="w-full sm:w-auto"
          options={[
            { value: 'light', label: <span className="inline-flex items-center gap-1.5"><Sun className="size-4" />Light</span> },
            { value: 'dark', label: <span className="inline-flex items-center gap-1.5"><Moon className="size-4" />Dark</span> },
            { value: 'system', label: <span className="inline-flex items-center gap-1.5"><Monitor className="size-4" />System</span> },
          ]}
        />
      </Panel>
      <Panel title="Demo mode">
        <div className="flex items-start gap-3">
          <Gauge className="mt-0.5 size-5 shrink-0 text-ink-2" />
          <div className="flex-1">
            <p className="font-bold">Order tracking speed</p>
            <p className="text-sm text-ink-2">Speeds up the simulated kitchen and courier so you can watch a full delivery quickly.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[1, 5, 10, 30, 60].map((n) => (
                <button key={n} onClick={() => setSpeed(n)} className={clsx('chip', speed === n && 'chip-active')}>
                  {n === 1 ? 'Real time' : `${n}× faster`}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink-3">Applies to new orders.</p>
          </div>
        </div>
      </Panel>
      <Panel title="Data">
        <p className="text-ink-2">Everything (account, cart, orders) is stored only in this browser.</p>
        {confirm ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="font-bold text-bad">Delete all local data?</span>
            <button
              onClick={() => {
                ['nomly-prefs', 'nomly-auth', 'nomly-cart', 'nomly-orders'].forEach((k) => localStorage.removeItem(k));
                window.location.href = import.meta.env.BASE_URL;
              }}
              className="btn bg-bad px-4 py-2 text-white"
            >
              Yes, reset
            </button>
            <button onClick={() => setConfirm(false)} className="btn-ghost px-4 py-2">
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirm(true)} className="btn-ghost mt-3 text-bad">
            <Trash2 className="size-4" /> Reset app data
          </button>
        )}
      </Panel>
    </>
  );
}
