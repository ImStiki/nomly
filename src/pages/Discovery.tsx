import { useMemo } from 'react';
import { Link } from 'react-router';
import { ArrowRight, MapPin } from 'lucide-react';
import { usePrefs, useDeliveryPoint } from '@/store/prefs';
import { useOrders } from '@/store/orders';
import { useAuth } from '@/store/auth';
import { useUI } from '@/store/ui';
import { venuesForCity } from '@/data/venues';
import { RESTAURANT_CATEGORIES, STORE_CATEGORIES } from '@/data/categories';
import { getCity } from '@/data/cities';
import { estimate, isOpen } from '@/lib/venue';
import { imgUrl, poolImage } from '@/lib/img';
import { Carousel, CategoryRail, VenueRow } from '@/components/VenueCard';
import { Img, SectionTitle } from '@/components/ui';
import type { Venue } from '@/types';

interface Banner {
  title: string;
  text: string;
  cta: string;
  to: string;
  image: string;
  bg: string;
}

function PromoBanner({ b }: { b: Banner }) {
  return (
    <Link
      to={b.to}
      className="group relative flex h-[190px] overflow-hidden rounded-3xl p-5 text-white sm:h-[220px] sm:p-7"
      style={{ background: b.bg }}
    >
      <div className="relative z-10 flex max-w-[64%] flex-col sm:max-w-[56%]">
        <h3 className="text-[22px] leading-[1.1] font-black tracking-tight sm:text-[28px]">{b.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] font-semibold opacity-90 sm:mt-2 sm:line-clamp-3 sm:text-sm">{b.text}</p>
        <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[13px] font-extrabold whitespace-nowrap text-[#1f1d26] transition-transform group-hover:translate-x-1 sm:px-4 sm:text-sm">
          {b.cta} <ArrowRight className="size-4" />
        </span>
      </div>
      <Img
        src={imgUrl(b.image, 500, 500)}
        alt=""
        className="absolute top-1/2 -right-10 size-[150px] -translate-y-1/2 rotate-6 rounded-[32px] shadow-2xl transition-transform duration-500 group-hover:rotate-3 sm:-right-12 sm:size-[230px] sm:rounded-[36px]"
      />
    </Link>
  );
}

export default function Discovery() {
  const cityId = usePrefs((s) => s.cityId);
  const favorites = usePrefs((s) => s.favorites);
  const orders = useOrders((s) => s.orders);
  const user = useAuth((s) => s.user);
  const plus = useAuth((s) => s.plus);
  const address = usePrefs((s) => s.address);
  const openAddress = useUI((s) => s.openAddress);
  const point = useDeliveryPoint();
  const city = getCity(cityId);

  const all = venuesForCity(cityId);
  const rows = useMemo(() => {
    const restaurants = all.filter((v) => v.type === 'restaurant');
    const stores = all.filter((v) => v.type === 'store');
    const openFirst = (a: Venue, b: Venue) => Number(isOpen(b)) - Number(isOpen(a));
    const by = (list: Venue[], f: (v: Venue) => number) => [...list].sort((a, b) => openFirst(a, b) || f(b) - f(a));
    return {
      popular: by(restaurants, (v) => v.popularity + (v.sponsored ? 30 : 0)).slice(0, 12),
      fastest: by(restaurants, (v) => -estimate(v, point).min).slice(0, 12),
      topRated: by(restaurants, (v) => v.rating).slice(0, 12),
      free: by(all, (v) => (v.baseDeliveryFee === 0 ? 1 : 0) + v.popularity / 1000).filter((v) => v.baseDeliveryFee === 0),
      deals: all.filter((v) => v.promo && v.promo.kind !== 'free-delivery'),
      fresh: by(all, (v) => (v.isNew ? 1 : 0)).filter((v) => v.isNew),
      stores: by(stores, (v) => v.popularity),
      comfort: by(restaurants.filter((v) => v.categories.some((c) => ['pizza', 'burgers', 'chicken'].includes(c))), (v) => v.rating),
      asian: by(restaurants.filter((v) => v.categories.includes('asian')), (v) => v.popularity),
      sweet: by(all.filter((v) => v.categories.some((c) => ['dessert', 'coffee', 'bakery', 'drinks'].includes(c))), (v) => v.rating),
      late: by(restaurants.filter((v) => v.hours.close >= 25 * 60), (v) => v.hours.close),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, point.lat, point.lng]);

  const favVenues = favorites.map((id) => all.find((v) => v.id === id)).filter(Boolean) as Venue[];
  const againIds = [...new Set(orders.filter((o) => o.cityId === cityId).map((o) => o.venueId))];
  const again = againIds.map((id) => all.find((v) => v.id === id)).filter(Boolean) as Venue[];

  const banners: Banner[] = [
    {
      title: user ? `Hungry, ${user.name.split(' ')[0]}?` : 'Free delivery on your first order',
      text: user ? 'Use code NOMLY10 for 10% off your next order — today only.' : 'Sign up and use code WELCOME at checkout. Valid for new users.',
      cta: 'Order now',
      to: '/restaurants',
      image: poolImage('burger', 3),
      bg: 'linear-gradient(135deg,#7B4DFF,#5626CC)',
    },
    {
      title: plus ? 'You’re a Nomly+ member 👑' : 'Nomly+ · €0 delivery fees',
      text: plus ? 'Enjoy free delivery on every order over €15.' : 'Unlimited free deliveries on orders over €15. Try 30 days for free.',
      cta: plus ? 'See benefits' : 'Try for free',
      to: '/plus',
      image: poolImage('delivery', 1),
      bg: 'linear-gradient(135deg,#1f1d26,#3d2f6e)',
    },
    {
      title: 'Groceries in 20 minutes',
      text: 'Fresh produce, snacks and household essentials from Nomly Market.',
      cta: 'Shop now',
      to: `/venue/nomly-market-${cityId}`,
      image: poolImage('produce', 0),
      bg: 'linear-gradient(135deg,#1FA463,#0f7a49)',
    },
    {
      title: 'Late-night cravings?',
      text: 'Burgers, kebabs and pizza until the early hours.',
      cta: 'Open late',
      to: '/restaurants?sort=open-late',
      image: poolImage('pizza', 4),
      bg: 'linear-gradient(135deg,#E85D3F,#b8361c)',
    },
  ];

  return (
    <div className="container-app pt-4 md:pt-6">
      <h1 className="sr-only">Discover restaurants and stores in {city.name}</h1>
      {!address && (
        <button onClick={openAddress} className="mb-4 flex w-full items-center gap-3 rounded-2xl bg-brand-soft p-3 text-left transition-colors hover:bg-brand-100 sm:p-4 dark:hover:bg-brand-500/25">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-500 text-white">
            <MapPin className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-extrabold">Where should we deliver?</span>
            <span className="block truncate text-sm text-ink-2">Add your address to see exact delivery times and fees in {city.name}.</span>
          </span>
          <span className="hidden shrink-0 rounded-full bg-brand-500 px-4 py-2 text-sm font-extrabold text-white sm:block">Set address</span>
        </button>
      )}
      <Carousel itemClass="w-[88%] sm:w-[60%] lg:w-[42%] xl:w-[32.5%]">
        {banners.map((b) => (
          <PromoBanner key={b.title} b={b} />
        ))}
      </Carousel>

      <section className="mt-9">
        <SectionTitle title="Categories" />
        <CategoryRail categories={RESTAURANT_CATEGORIES} base="/restaurants" />
      </section>

      <VenueRow title="Order again" venues={again} />
      <VenueRow title="Your favourites" venues={favVenues} seeAll="/me/favorites" />
      <VenueRow title="Popular right now" subtitle={`Most ordered in ${city.name} this week`} venues={rows.popular} seeAll="/restaurants?sort=popular" />
      <VenueRow title="Deals of the day" subtitle="Discounts and freebies" venues={rows.deals} seeAll="/restaurants?offers=1" />
      <VenueRow title="Fastest delivery" subtitle="At your door in no time" venues={rows.fastest} seeAll="/restaurants?sort=fastest" />

      <section className="mt-10">
        <SectionTitle
          title="Shop stores"
          subtitle="Groceries, flowers, pharmacy and more"
          action={
            <Link to="/stores" className="shrink-0 rounded-full bg-brand-soft px-3.5 py-1.5 text-sm font-bold text-brand-600 hover:bg-brand-100 dark:text-brand-300">
              See all
            </Link>
          }
        />
        <CategoryRail categories={STORE_CATEGORIES} base="/stores" />
      </section>
      <VenueRow title="Stores near you" venues={rows.stores} seeAll="/stores" />

      <VenueRow title="Top rated" subtitle="Highest rated by Nomly customers" venues={rows.topRated} seeAll="/restaurants?sort=rating" />
      <VenueRow title="Free delivery" venues={rows.free} seeAll="/restaurants?free=1" />
      <VenueRow title="Comfort food classics" venues={rows.comfort} />
      <VenueRow title="Taste of Asia" venues={rows.asian} seeAll="/restaurants?category=asian" />
      <VenueRow title="New on Nomly" venues={rows.fresh} />
      <VenueRow title="Something sweet" venues={rows.sweet} />
      <VenueRow title="Open late" subtitle="For midnight snacks" venues={rows.late} seeAll="/restaurants?sort=open-late" />

      <section className="mt-14 grid gap-4 md:grid-cols-2">
        <Link to="/info/couriers" className="group relative overflow-hidden rounded-3xl bg-sun p-7 text-[#1f1d26]">
          <p className="text-sm font-extrabold tracking-wide uppercase opacity-70">Earn on your schedule</p>
          <h3 className="mt-1 text-3xl font-black tracking-tight">Become a courier</h3>
          <p className="mt-2 max-w-xs font-semibold opacity-80">Ride with Nomly by bike, scooter or car whenever it suits you.</p>
          <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#1f1d26] px-4 py-2 text-sm font-extrabold text-white">
            Apply now <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
          <span className="absolute -right-4 -bottom-6 text-[120px] leading-none transition-transform group-hover:-translate-x-2" aria-hidden>
            🛵
          </span>
        </Link>
        <Link to="/info/merchants" className="group relative overflow-hidden rounded-3xl bg-brand-soft p-7">
          <p className="text-sm font-extrabold tracking-wide text-brand-600 uppercase dark:text-brand-300">Grow your business</p>
          <h3 className="mt-1 text-3xl font-black tracking-tight">Become a partner</h3>
          <p className="mt-2 max-w-xs font-semibold text-ink-2">Reach new customers and let us handle the delivery.</p>
          <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-sm font-extrabold text-white">
            Learn more <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
          <span className="absolute -right-2 -bottom-6 text-[120px] leading-none transition-transform group-hover:-translate-x-2" aria-hidden>
            🏪
          </span>
        </Link>
      </section>
    </div>
  );
}
