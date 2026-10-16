import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import clsx from 'clsx';
import { ArrowLeft, Bike, Clock, Info, MapPin, Search, Share2, ShoppingBag, Star, Store, Wallet, X, Gift, Percent } from 'lucide-react';
import type { MenuItem, MenuSection, Venue as VenueT } from '@/types';
import { getVenueBySlug } from '@/data/venues';
import { getMenu, findMenuItem } from '@/data/menus';
import { getCategory } from '@/data/categories';
import { getCity } from '@/data/cities';
import { useDeliveryPoint } from '@/store/prefs';
import { useAuth } from '@/store/auth';
import { useVenueCart, cartCount, cartSubtotal } from '@/store/cart';
import { useUI, toast } from '@/store/ui';
import { estimate, hoursLabel, openStatus } from '@/lib/venue';
import { imgUrl } from '@/lib/img';
import { money, priceLevel } from '@/lib/format';
import { Img, ItemTags, Modal, Rating, EmptyState } from '@/components/ui';
import { FavoriteButton } from '@/components/VenueCard';
import { ItemModal } from '@/components/ItemModal';
import { MapView, pinHtml } from '@/components/MapView';
import NotFound from './NotFound';

function QtyBadge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="absolute top-2 left-2 z-10 grid h-7 min-w-7 animate-pop place-items-center rounded-full bg-brand-500 px-2 text-sm font-black text-white shadow">
      {n}
    </span>
  );
}

function MenuItemRow({ item, qty, onOpen }: { item: MenuItem; qty: number; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className={clsx(
        'group relative flex w-full gap-4 rounded-2xl p-3 text-left transition-colors hover:bg-muted sm:p-4',
        qty > 0 && 'ring-2 ring-brand-500 ring-inset',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-extrabold">
          {qty > 0 && <span className="text-brand-600 dark:text-brand-300">{qty} ×</span>}
          {item.name}
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-ink-2">{item.description}</p>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className={clsx('font-extrabold', item.originalPrice ? 'text-bad' : 'text-brand-600 dark:text-brand-300')}>{money(item.price)}</span>
          {item.originalPrice && <span className="text-ink-3 line-through">{money(item.originalPrice)}</span>}
          {item.popular && <span className="rounded-md bg-sun/30 px-1.5 py-0.5 text-[11px] font-extrabold text-[#8a6500] dark:text-sun">Popular</span>}
          <ItemTags tags={item.tags} />
        </p>
      </div>
      {item.image && <Img src={imgUrl(item.image, 260, 200)} alt="" className="h-[92px] w-[120px] shrink-0 rounded-xl sm:h-[104px] sm:w-[136px]" />}
    </button>
  );
}

function MenuItemCard({ item, qty, onOpen, store }: { item: MenuItem; qty: number; onOpen: () => void; store?: boolean }) {
  return (
    <button onClick={onOpen} className="group relative block w-full text-left">
      <QtyBadge n={qty} />
      <div className={clsx('relative overflow-hidden rounded-2xl bg-muted', store ? 'aspect-square' : 'aspect-[4/3]', qty > 0 && 'ring-3 ring-brand-500')}>
        {item.image ? (
          <Img src={imgUrl(item.image, 400, store ? 400 : 300)} alt="" className="size-full transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="grid size-full place-items-center text-4xl">🍽️</div>
        )}
        <span className="absolute right-2 bottom-2 grid size-9 place-items-center rounded-full bg-surface text-xl font-bold text-brand-600 shadow-card transition-transform group-hover:scale-110 dark:text-brand-300">
          +
        </span>
      </div>
      <p className="mt-2 flex items-baseline gap-1.5 text-[15px] font-extrabold">
        <span className={item.originalPrice ? 'text-bad' : 'text-brand-600 dark:text-brand-300'}>{money(item.price)}</span>
        {item.originalPrice && <span className="text-xs font-semibold text-ink-3 line-through">{money(item.originalPrice)}</span>}
      </p>
      <p className="line-clamp-2 text-sm leading-snug font-bold">{item.name}</p>
      {item.unit && <p className="text-xs text-ink-3">{item.unit}</p>}
    </button>
  );
}

function InfoModal({ venue, open, onClose }: { venue: VenueT; open: boolean; onClose: () => void }) {
  const city = getCity(venue.id.split('-')[0]);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const today = (new Date().getDay() + 6) % 7;
  return (
    <Modal open={open} onClose={onClose} label={`About ${venue.name}`}>
      <div className="overflow-x-hidden overflow-y-auto p-6 sm:p-8">
        <h2 className="pr-12 text-2xl font-black">{venue.name}</h2>
        <p className="mt-2 text-ink-2">{venue.description}</p>
        <MapView
          center={venue}
          zoom={15}
          interactive={false}
          markers={[{ id: venue.id, pos: venue, html: pinHtml(venue.logoEmoji, venue.logoColor) }]}
          className="mt-5 h-44 rounded-2xl"
        />
        <div className="mt-5 space-y-4">
          <div className="flex gap-3">
            <MapPin className="mt-0.5 size-5 shrink-0 text-ink-2" />
            <div>
              <p className="font-bold">Address</p>
              <p className="text-ink-2">
                {venue.address}, {city.name}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Clock className="mt-0.5 size-5 shrink-0 text-ink-2" />
            <div className="flex-1">
              <p className="font-bold">Opening hours</p>
              <ul className="mt-1 text-sm">
                {days.map((d, i) => (
                  <li key={d} className={clsx('flex justify-between py-0.5', i === today ? 'font-extrabold' : 'text-ink-2')}>
                    <span>{d}</span>
                    <span>{hoursLabel(venue)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex gap-3">
            <Info className="mt-0.5 size-5 shrink-0 text-ink-2" />
            <div>
              <p className="font-bold">Allergies & food info</p>
              <p className="text-sm text-ink-2">
                If you have allergies, add a note to your items or contact the venue before ordering. Dietary icons: 🌱 vegan, 🍃 vegetarian, 🌶️ spicy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

const PROMO_ICON = { discount: Percent, 'free-delivery': Bike, bogo: Gift, gift: Gift };

export default function Venue() {
  const { slug = '' } = useParams();
  const venue = getVenueBySlug(slug);
  if (!venue) return <NotFound />;
  return <VenueView key={venue.id} venue={venue} />;
}

function VenueView({ venue }: { venue: VenueT }) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const point = useDeliveryPoint();
  const plus = useAuth((s) => s.plus);
  const lines = useVenueCart(venue.id);
  const openCart = useUI((s) => s.openCart);
  const [infoOpen, setInfoOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<string>('');
  const navRef = useRef<HTMLDivElement>(null);

  const menu = getMenu(venue);
  const est = estimate(venue, point);
  const status = openStatus(venue);
  const isStore = venue.type === 'store';
  const fee = plus && est.fee > 0 ? 0 : est.fee;

  const itemId = params.get('item');
  const openItem = itemId ? (findMenuItem(venue, itemId) ?? null) : null;
  const setItem = (id: string | null) => {
    const p = new URLSearchParams(params);
    if (id) p.set('item', id);
    else p.delete('item');
    setParams(p, { replace: !id, preventScrollReset: true });
  };

  const qtyById = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of lines) m.set(l.itemId, (m.get(l.itemId) ?? 0) + l.quantity);
    return m;
  }, [lines]);

  const filtered: MenuSection[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return menu;
    return menu
      .filter((s) => !s.id.endsWith('-popular'))
      .map((s) => ({ ...s, items: s.items.filter((i) => `${i.name} ${i.description}`.toLowerCase().includes(q)) }))
      .filter((s) => s.items.length);
  }, [menu, query]);

  // scrollspy
  useEffect(() => {
    const els = filtered.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: '-160px 0px -60% 0px' },
    );
    els.forEach((e) => obs.observe(e));
    return () => obs.disconnect();
  }, [filtered]);

  // keep active tab visible in the nav
  useEffect(() => {
    const btn = navRef.current?.querySelector<HTMLElement>(`[data-sec="${active}"]`);
    btn?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [active]);

  const jump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - (window.innerWidth >= 768 ? 150 : 128);
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  const share = async () => {
    const url = window.location.href.split('?')[0];
    try {
      if (navigator.share) await navigator.share({ title: venue.name, text: venue.tagline, url });
      else {
        await navigator.clipboard.writeText(url);
        toast('Link copied to clipboard');
      }
    } catch {
      /* user cancelled */
    }
  };

  const count = cartCount(lines);
  const subtotal = cartSubtotal(lines);
  const PromoIcon = venue.promo ? PROMO_ICON[venue.promo.kind] : Gift;

  return (
    <div className="pb-28">
      {/* Hero */}
      <div className="relative h-56 overflow-hidden sm:h-72 md:mx-6 md:mt-2 md:h-[340px] md:rounded-3xl lg:mx-10">
        <Img src={imgUrl(venue.image, 1600, 700)} alt={venue.name} className="size-full" eager />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />
        <div className="absolute inset-x-0 top-0 flex justify-between p-3 sm:p-4">
          <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/discovery'))} className="grid size-10 place-items-center rounded-full bg-white/90 text-[#1f1d26] shadow-sm" aria-label="Back">
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex gap-2">
            <button onClick={share} className="grid size-10 place-items-center rounded-full bg-white/90 text-[#1f1d26] shadow-sm" aria-label="Share">
              <Share2 className="size-[18px]" />
            </button>
            <FavoriteButton venue={venue} className="size-10" />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-6 md:p-8">
          <div className="flex items-end gap-4">
            <span className="hidden size-20 shrink-0 place-items-center rounded-2xl text-4xl shadow-lg ring-4 ring-white/90 sm:grid" style={{ background: venue.logoColor }}>
              {venue.logoEmoji}
            </span>
            <div className="min-w-0">
              <h1 className="text-[32px] leading-none font-black tracking-tight drop-shadow sm:text-5xl">{venue.name}</h1>
              <p className="mt-2 line-clamp-1 font-semibold opacity-95 drop-shadow">{venue.tagline}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-app">
        {/* Info strip */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="flex items-center gap-1">
            <Rating value={venue.rating} count={venue.ratingCount} />
          </span>
          <span className="flex items-center gap-1.5 font-semibold">
            <Clock className="size-4 text-ink-2" /> {est.min}–{est.max} min
          </span>
          <span className="flex items-center gap-1.5 font-semibold">
            <Bike className="size-4 text-ink-2" />
            {fee === 0 ? <span className="text-brand-600 dark:text-brand-300">Free delivery</span> : `${money(fee)} delivery`}
          </span>
          <span className="flex items-center gap-1.5 font-semibold">
            <Wallet className="size-4 text-ink-2" /> Min. {money(venue.minOrder)}
          </span>
          <span className="flex items-center gap-1.5 font-semibold">
            <MapPin className="size-4 text-ink-2" /> {est.km.toFixed(1)} km
          </span>
          <span className="font-semibold text-ink-2">
            {priceLevel(venue.priceLevel)} · {venue.categories.map((c) => getCategory(c)?.name).filter(Boolean).join(', ')}
          </span>
          <span className={clsx('rounded-full px-2.5 py-1 text-xs font-extrabold', status.open ? 'bg-good/15 text-good' : 'bg-bad/15 text-bad')}>{status.label}</span>
          <button onClick={() => setInfoOpen(true)} className="flex items-center gap-1 font-bold text-brand-600 hover:underline dark:text-brand-300">
            <Info className="size-4" /> More info
          </button>
        </div>

        {!status.open && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-warn/12 p-4 text-sm">
            <Clock className="size-5 shrink-0 text-warn" />
            <p>
              <b>{venue.name} is closed right now.</b> {status.label}. You can still add items and schedule your order for later at checkout.
            </p>
          </div>
        )}
        {venue.promo && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-brand-soft p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-500 text-white">
              <PromoIcon className="size-5" />
            </span>
            <div>
              <p className="font-extrabold">{venue.promo.label}</p>
              <p className="text-sm text-ink-2">
                {venue.promo.kind === 'discount'
                  ? 'Discounted prices are already shown on the menu.'
                  : venue.promo.kind === 'free-delivery'
                    ? 'No delivery fee on any order. Enjoy!'
                    : venue.promo.kind === 'bogo'
                      ? 'Applies automatically to items marked Popular.'
                      : 'Added automatically to qualifying orders.'}
              </p>
            </div>
          </div>
        )}
        {venue.ageRestricted && (
          <p className="mt-4 rounded-2xl bg-bad/10 p-4 text-sm font-semibold text-bad">
            🔞 This store sells age-restricted products. You must be 18+ and show ID to the courier.
          </p>
        )}
      </div>

      {/* Sticky section nav */}
      <div className="sticky top-[68px] z-[300] mt-6 border-b border-line bg-bg/95 backdrop-blur-xl md:top-[118px] xl:top-[76px]">
        <div className="container-app flex items-center gap-3">
          <div ref={navRef} className="no-scrollbar flex flex-1 gap-1 overflow-x-auto py-2.5">
            {filtered.map((s) => (
              <button
                key={s.id}
                data-sec={s.id}
                onClick={() => jump(s.id)}
                className={clsx(
                  'shrink-0 rounded-full px-3.5 py-2 text-sm font-extrabold whitespace-nowrap transition-colors',
                  active === s.id ? 'bg-ink text-bg' : 'text-ink-2 hover:bg-muted hover:text-ink',
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
          <label className="hidden items-center gap-2 rounded-full bg-muted px-3.5 py-2 focus-within:ring-2 focus-within:ring-brand-500 sm:flex">
            <Search className="size-4 text-ink-2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${venue.name}`}
              className="w-40 bg-transparent text-sm outline-none placeholder:text-ink-3 lg:w-56"
            />
            {query && (
              <button onClick={() => setQuery('')} aria-label="Clear">
                <X className="size-4 text-ink-3" />
              </button>
            )}
          </label>
        </div>
      </div>

      <div className="container-app">
        <label className="mt-4 flex items-center gap-2 rounded-full bg-muted px-4 py-2.5 sm:hidden">
          <Search className="size-4 text-ink-2" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the menu" className="w-full bg-transparent text-sm outline-none" />
        </label>

        {filtered.length === 0 && <EmptyState emoji="🤔" title="No items found" text={`Nothing on the menu matches “${query}”.`} />}

        {filtered.map((section, si) => {
          const grid = isStore || (si === 0 && section.id.endsWith('-popular'));
          return (
            <section key={section.id} id={section.id} className="scroll-mt-40 pt-8">
              <h2 className="text-2xl font-black tracking-tight">{section.name}</h2>
              {section.description && <p className="mt-1 text-sm text-ink-2">{section.description}</p>}
              {grid ? (
                <div className={clsx('mt-4 grid gap-x-4 gap-y-6', isStore ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-6')}>
                  {section.items.map((it) => (
                    <MenuItemCard key={`${section.id}-${it.id}`} item={it} qty={qtyById.get(it.id) ?? 0} onOpen={() => setItem(it.id)} store={isStore} />
                  ))}
                </div>
              ) : (
                <div className="mt-3 grid gap-x-6 gap-y-1 lg:grid-cols-2">
                  {section.items.map((it) => (
                    <MenuItemRow key={it.id} item={it} qty={qtyById.get(it.id) ?? 0} onOpen={() => setItem(it.id)} />
                  ))}
                </div>
              )}
            </section>
          );
        })}

        <div className="mt-14 flex flex-col items-center gap-2 rounded-3xl bg-muted p-8 text-center">
          {isStore ? <Store className="size-8 text-ink-3" /> : <Star className="size-8 text-ink-3" />}
          <p className="font-extrabold">That’s the whole {isStore ? 'catalogue' : 'menu'}!</p>
          <p className="max-w-md text-sm text-ink-2">Prices may differ slightly from the venue. Couriers are independent partners — tipping is always appreciated.</p>
          <Link to="/discovery" className="mt-2 text-sm font-bold text-brand-600 hover:underline dark:text-brand-300">
            Discover more places
          </Link>
        </div>
      </div>

      {count > 0 && (
        <div className="fixed inset-x-0 bottom-[68px] z-[420] px-3 pb-3 md:bottom-0 md:pb-6">
          <button
            onClick={() => openCart(venue.id)}
            className="mx-auto flex w-full max-w-md animate-slide-up items-center justify-between gap-3 rounded-2xl bg-brand-500 px-4 py-3.5 font-extrabold text-white shadow-pop transition-colors hover:bg-brand-600"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-white/20">{count}</span>
            <span className="flex items-center gap-2">
              <ShoppingBag className="size-5" /> View order
            </span>
            <span>{money(subtotal)}</span>
          </button>
        </div>
      )}

      <ItemModal venue={venue} item={openItem} onClose={() => setItem(null)} />
      <InfoModal venue={venue} open={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  );
}
