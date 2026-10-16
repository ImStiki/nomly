import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import clsx from 'clsx';
import { LayoutGrid, Map as MapIcon, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import type { Venue, VenueType } from '@/types';
import { usePrefs, useDeliveryPoint } from '@/store/prefs';
import { venuesForCity } from '@/data/venues';
import { RESTAURANT_CATEGORIES, STORE_CATEGORIES, getCategory } from '@/data/categories';
import { getCity } from '@/data/cities';
import { estimate, isOpen } from '@/lib/venue';
import { CategoryRail, VenueCard, VenueGrid } from '@/components/VenueCard';
import { EmptyState } from '@/components/ui';
import { MapView, pinHtml, dotHtml } from '@/components/MapView';

const SORTS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'popular', label: 'Most popular' },
  { id: 'rating', label: 'Rating' },
  { id: 'fastest', label: 'Delivery time' },
  { id: 'fee', label: 'Delivery fee' },
  { id: 'distance', label: 'Distance' },
  { id: 'open-late', label: 'Open late' },
] as const;

export default function Listing({ type }: { type: VenueType }) {
  const cityId = usePrefs((s) => s.cityId);
  const point = useDeliveryPoint();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<'grid' | 'map'>('grid');
  const [sortOpen, setSortOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const category = params.get('category');
  const sort = params.get('sort') ?? 'recommended';
  const free = params.get('free') === '1';
  const offers = params.get('offers') === '1';
  const openNow = params.get('open') === '1';
  const price = params.get('price');
  const top = params.get('top') === '1';

  const set = (key: string, value: string | null) => {
    const p = new URLSearchParams(params);
    if (value === null) p.delete(key);
    else p.set(key, value);
    setParams(p, { replace: true });
  };

  const city = getCity(cityId);
  const cats = type === 'restaurant' ? RESTAURANT_CATEGORIES : STORE_CATEGORIES;
  const cat = category ? getCategory(category) : undefined;

  const venues = useMemo(() => {
    let list = venuesForCity(cityId).filter((v) => v.type === type);
    if (category) list = list.filter((v) => v.categories.includes(category));
    if (free) list = list.filter((v) => v.baseDeliveryFee === 0);
    if (offers) list = list.filter((v) => v.promo);
    if (openNow) list = list.filter((v) => isOpen(v));
    if (price) list = list.filter((v) => v.priceLevel === Number(price));
    if (top) list = list.filter((v) => v.rating >= 9);
    const est = new Map(list.map((v) => [v.id, estimate(v, point)]));
    const key: Record<string, (v: Venue) => number> = {
      recommended: (v) => -(v.popularity * 0.5 + v.rating * 6 + (v.sponsored ? 20 : 0) - est.get(v.id)!.min),
      popular: (v) => -v.popularity,
      rating: (v) => -v.rating,
      fastest: (v) => est.get(v.id)!.min,
      fee: (v) => est.get(v.id)!.fee,
      distance: (v) => est.get(v.id)!.km,
      'open-late': (v) => -v.hours.close,
    };
    const k = key[sort] ?? key.recommended;
    return [...list].sort((a, b) => Number(isOpen(b)) - Number(isOpen(a)) || k(a) - k(b));
  }, [cityId, type, category, free, offers, openNow, price, top, sort, point]);

  const activeFilters = [free, offers, openNow, !!price, top].filter(Boolean).length;
  const title = cat ? cat.name : type === 'restaurant' ? 'Restaurants' : 'Stores';
  const sel = venues.find((v) => v.id === selected);

  const toggle = (label: string, on: boolean, key: string) => (
    <button onClick={() => set(key, on ? null : '1')} className={clsx('chip', on && 'chip-active')}>
      {label}
      {on && <X className="size-3.5" />}
    </button>
  );

  return (
    <div className="container-app pt-4 md:pt-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-ink-2">
            {type === 'restaurant' ? 'Restaurants' : 'Stores'} in {city.name}
          </p>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
        </div>
        <div className="inline-flex rounded-full bg-muted p-1">
          {(['grid', 'map'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={clsx('flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold', view === v ? 'bg-surface shadow-card' : 'text-ink-2')}
            >
              {v === 'grid' ? <LayoutGrid className="size-4" /> : <MapIcon className="size-4" />}
              {v === 'grid' ? 'List' : 'Map'}
            </button>
          ))}
        </div>
      </div>

      <CategoryRail categories={cats} base={type === 'restaurant' ? '/restaurants' : '/stores'} active={category ?? undefined} />

      <div className="no-scrollbar -mx-4 mt-5 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <div className="relative">
          <button onClick={() => setSortOpen((o) => !o)} className="chip">
            <SlidersHorizontal className="size-4" />
            {SORTS.find((s) => s.id === sort)?.label ?? 'Sort'}
            <ChevronDown className="size-4" />
          </button>
        </div>
        {category && (
          <button onClick={() => set('category', null)} className="chip chip-active">
            {cat?.name} <X className="size-3.5" />
          </button>
        )}
        {toggle('Open now', openNow, 'open')}
        {toggle('Free delivery', free, 'free')}
        {toggle('Offers', offers, 'offers')}
        {toggle('Rating 9+', top, 'top')}
        {[1, 2, 3].map((p) => (
          <button key={p} onClick={() => set('price', price === String(p) ? null : String(p))} className={clsx('chip', price === String(p) && 'chip-active')}>
            {'€'.repeat(p)}
          </button>
        ))}
        {activeFilters > 0 && (
          <button
            onClick={() => {
              const p = new URLSearchParams();
              if (category) p.set('category', category);
              setParams(p, { replace: true });
            }}
            className="px-2 text-sm font-bold text-brand-600 hover:underline dark:text-brand-300"
          >
            Clear filters
          </button>
        )}
      </div>
      {sortOpen && (
        <div className="relative z-30">
          <div className="fixed inset-0" onClick={() => setSortOpen(false)} />
          <div className="absolute top-2 left-0 w-60 animate-fade-in rounded-2xl bg-surface p-2 shadow-pop">
            {SORTS.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  set('sort', s.id === 'recommended' ? null : s.id);
                  setSortOpen(false);
                }}
                className={clsx('flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left font-semibold hover:bg-muted', sort === s.id && 'text-brand-600 dark:text-brand-300')}
              >
                {s.label}
                {sort === s.id && <span className="size-2 rounded-full bg-brand-500" />}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-5 mb-4 text-sm font-semibold text-ink-2">{venues.length} places</p>

      {venues.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title="Nothing matches those filters"
          text="Try removing a filter or picking another category."
          action={
            <Link to={type === 'restaurant' ? '/restaurants' : '/stores'} className="btn-primary">
              Show everything
            </Link>
          }
        />
      ) : view === 'grid' ? (
        <VenueGrid venues={venues} />
      ) : (
        <div className="relative">
          <MapView
            center={point}
            zoom={13}
            className="h-[65vh] rounded-3xl"
            markers={[
              { id: 'me', pos: point, html: dotHtml('#1f1d26'), size: [18, 18], title: 'You', z: 1000 },
              ...venues.map((v) => ({
                id: v.id,
                pos: v,
                html: pinHtml(v.logoEmoji, v.id === selected ? '#7B4DFF' : isOpen(v) ? v.logoColor : '#9a98a3'),
                title: v.name,
                onClick: () => setSelected(v.id),
                z: v.id === selected ? 500 : 0,
              })),
            ]}
          />
          {sel && (
            <div className="absolute right-3 bottom-3 left-3 z-[500] mx-auto max-w-sm animate-slide-up rounded-3xl bg-surface p-3 shadow-pop">
              <button onClick={() => setSelected(null)} className="absolute top-5 right-14 z-10 grid size-9 place-items-center rounded-full bg-white/90 text-[#1f1d26] shadow-sm" aria-label="Close">
                <X className="size-4" />
              </button>
              <VenueCard venue={sel} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
