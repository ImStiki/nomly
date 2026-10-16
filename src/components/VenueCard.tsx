import { useRef, useState, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router';
import clsx from 'clsx';
import { Heart, Bike, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import type { Category, Venue } from '@/types';
import { imgUrl } from '@/lib/img';
import { estimate, openStatus } from '@/lib/venue';
import { money, priceLevel } from '@/lib/format';
import { usePrefs, useDeliveryPoint } from '@/store/prefs';
import { useAuth } from '@/store/auth';
import { toast } from '@/store/ui';
import { Img, Rating, SectionTitle } from './ui';

export function FavoriteButton({ venue, className }: { venue: Venue; className?: string }) {
  const fav = usePrefs((s) => s.favorites.includes(venue.id));
  const toggle = usePrefs((s) => s.toggleFavorite);
  return (
    <button
      aria-label={fav ? 'Remove from favourites' : 'Add to favourites'}
      aria-pressed={fav}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(venue.id);
        toast(fav ? `Removed ${venue.name} from favourites` : `Saved ${venue.name} to favourites ❤️`);
      }}
      className={clsx(
        'grid size-9 place-items-center rounded-full bg-white/90 text-[#1f1d26] shadow-sm backdrop-blur transition-transform hover:scale-110 active:scale-95',
        className,
      )}
    >
      <Heart className={clsx('size-[18px]', fav && 'animate-pop fill-bad text-bad')} />
    </button>
  );
}

export function VenueCard({ venue, className }: { venue: Venue; className?: string }) {
  const point = useDeliveryPoint();
  const plus = useAuth((s) => s.plus);
  const est = estimate(venue, point);
  const status = openStatus(venue);
  const freeDelivery = est.fee === 0 || plus;

  return (
    <Link to={`/venue/${venue.slug}`} className={clsx('group block min-w-0', className)}>
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
        <Img
          src={imgUrl(venue.image, 640, 360)}
          alt={venue.name}
          className={clsx('size-full transition-transform duration-500 group-hover:scale-[1.04]', !status.open && 'grayscale-[60%]')}
        />
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          {venue.promo && (
            <span className="rounded-lg bg-brand-500 px-2 py-1 text-xs font-extrabold text-white shadow-sm">{venue.promo.label}</span>
          )}
          {venue.isNew && <span className="rounded-lg bg-sun px-2 py-1 text-xs font-extrabold text-[#1f1d26] shadow-sm">New</span>}
        </div>
        <FavoriteButton venue={venue} className="absolute top-2.5 right-2.5" />
        {!status.open && (
          <div className="absolute inset-0 grid place-items-center bg-black/45 p-3 text-center text-white">
            <div>
              <p className="text-sm font-extrabold">Closed</p>
              <p className="text-xs font-semibold opacity-90">{status.label} · Schedule an order</p>
            </div>
          </div>
        )}
        {venue.sponsored && status.open && (
          <span className="absolute bottom-2.5 left-2.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
            Sponsored
          </span>
        )}
      </div>
      <div className="mt-2.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[17px] font-extrabold">{venue.name}</h3>
          <p className="truncate text-sm text-ink-2">{venue.tagline}</p>
        </div>
        <div className="flex shrink-0 flex-col items-center rounded-xl bg-brand-soft px-2.5 py-1 text-brand-600 dark:text-brand-300">
          <span className="text-[15px] leading-tight font-black">
            {est.min}–{est.max}
          </span>
          <span className="text-[11px] leading-tight font-bold">min</span>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5 border-t border-dashed border-line pt-2 text-[13px] text-ink-2">
        <Bike className="size-4" />
        <span className={clsx(freeDelivery && 'font-bold text-brand-600 dark:text-brand-300')}>
          {freeDelivery ? (plus && est.fee > 0 ? '€0 with Nomly+' : 'Free') : money(est.fee)}
        </span>
        <span aria-hidden>·</span>
        <span>{priceLevel(venue.priceLevel)}</span>
        <span aria-hidden>·</span>
        <Rating value={venue.rating} />
      </div>
    </Link>
  );
}

export function VenueCardSkeleton() {
  return (
    <div>
      <div className="skeleton aspect-[16/9] rounded-2xl" />
      <div className="skeleton mt-3 h-4 w-2/3" />
      <div className="skeleton mt-2 h-3 w-1/2" />
    </div>
  );
}

/** Horizontal scroller with arrow buttons on desktop. */
export function Carousel({ children, itemClass, gap = 'gap-4' }: { children: ReactNode[]; itemClass: string; gap?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  };
  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [children.length]);

  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: 'smooth' });

  return (
    <div className="group/car relative">
      <div ref={ref} onScroll={update} className={clsx('no-scrollbar -mx-4 flex snap-x snap-mandatory overflow-x-auto scroll-px-4 px-4 pb-1 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-10 lg:scroll-px-10 lg:px-10', gap)}>
        {children.map((c, i) => (
          <div key={i} className={clsx('shrink-0 snap-start', itemClass)}>
            {c}
          </div>
        ))}
      </div>
      {!edges.start && (
        <button
          aria-label="Scroll left"
          onClick={() => scroll(-1)}
          className="absolute top-[32%] -left-4 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-surface text-ink shadow-pop transition-transform hover:scale-105 md:grid"
        >
          <ChevronLeft className="size-5" />
        </button>
      )}
      {!edges.end && (
        <button
          aria-label="Scroll right"
          onClick={() => scroll(1)}
          className="absolute top-[32%] -right-4 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-surface text-ink shadow-pop transition-transform hover:scale-105 md:grid"
        >
          <ChevronRight className="size-5" />
        </button>
      )}
    </div>
  );
}

export function VenueRow({ title, subtitle, venues, seeAll }: { title: string; subtitle?: string; venues: Venue[]; seeAll?: string }) {
  if (!venues.length) return null;
  return (
    <section className="mt-10">
      <SectionTitle
        title={title}
        subtitle={subtitle}
        action={
          seeAll && (
            <Link to={seeAll} className="shrink-0 rounded-full bg-brand-soft px-3.5 py-1.5 text-sm font-bold text-brand-600 hover:bg-brand-100 dark:text-brand-300">
              See all
            </Link>
          )
        }
      />
      <Carousel itemClass="w-[78%] sm:w-[46%] md:w-[31.5%] xl:w-[23.5%]">
        {venues.map((v) => (
          <VenueCard key={v.id} venue={v} />
        ))}
      </Carousel>
    </section>
  );
}

export function VenueGrid({ venues }: { venues: Venue[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {venues.map((v) => (
        <VenueCard key={v.id} venue={v} />
      ))}
    </div>
  );
}

export function CategoryTile({ category, to, active }: { category: Category; to: string; active?: boolean }) {
  return (
    <Link to={to} className="group block text-center">
      <div
        className={clsx(
          'relative aspect-square overflow-hidden rounded-2xl ring-offset-2 ring-offset-bg transition-shadow',
          active && 'ring-3 ring-brand-500',
        )}
      >
        <Img src={imgUrl(category.image, 300, 300)} alt="" className="size-full transition-transform duration-500 group-hover:scale-110" />
      </div>
      <p className={clsx('mt-2 truncate text-sm font-bold', active && 'text-brand-600 dark:text-brand-300')}>{category.name}</p>
    </Link>
  );
}

export function CategoryRail({ categories, base, active }: { categories: Category[]; base: string; active?: string }) {
  return (
    <Carousel itemClass="w-[88px] sm:w-[104px]" gap="gap-3">
      {categories.map((c) => (
        <CategoryTile key={c.id} category={c} to={`${base}?category=${c.id}`} active={active === c.id} />
      ))}
    </Carousel>
  );
}

export function EtaPill({ min, max }: { min: number; max: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-bold">
      <Clock className="size-4" /> {min}–{max} min
    </span>
  );
}
