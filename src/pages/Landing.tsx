import { Link, useNavigate } from 'react-router';
import clsx from 'clsx';
import { ArrowRight, MapPin, Search, ShoppingBag, Bike, Store, UtensilsCrossed, Smartphone, Navigation } from 'lucide-react';
import { usePrefs } from '@/store/prefs';
import { useUI } from '@/store/ui';
import { CITIES } from '@/data/cities';
import { RESTAURANT_CATEGORIES } from '@/data/categories';
import { venuesForCity } from '@/data/venues';
import { imgUrl, poolImage } from '@/lib/img';
import { Img } from '@/components/ui';

const FLOATERS = [
  { tag: 'pizza', cls: 'top-[8%] left-[4%] size-28 -rotate-12 md:size-40' },
  { tag: 'sushi', cls: 'top-[14%] right-[6%] size-24 rotate-12 md:size-36' },
  { tag: 'burger', cls: 'bottom-[10%] left-[10%] size-24 rotate-6 md:size-32' },
  { tag: 'icecream', cls: 'bottom-[14%] right-[12%] size-20 -rotate-6 md:size-28' },
  { tag: 'flowers', cls: 'top-[46%] left-[-2%] hidden size-24 rotate-3 lg:block' },
  { tag: 'coffee', cls: 'top-[50%] right-[-1%] hidden size-24 -rotate-12 lg:block' },
] as const;

export default function Landing() {
  const cityId = usePrefs((s) => s.cityId);
  const setCity = usePrefs((s) => s.setCity);
  const setOnboarded = usePrefs((s) => s.setOnboarded);
  const openAddress = useUI((s) => s.openAddress);
  const navigate = useNavigate();
  const venueCount = venuesForCity(cityId).length;

  const go = () => {
    setOnboarded(true);
    navigate('/discovery');
  };

  return (
    <div className="-mb-20">
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-500 to-brand-700 text-white">
        {FLOATERS.map((f, i) => (
          <Img
            key={f.tag}
            src={imgUrl(poolImage(f.tag, i + 1), 320, 320)}
            alt=""
            eager
            className={clsx('pointer-events-none absolute rounded-[28px] opacity-90 shadow-2xl ring-4 ring-white/20', f.cls)}
          />
        ))}
        <div className="container-app relative z-10 flex min-h-[560px] flex-col items-center justify-center py-20 text-center md:min-h-[640px]">
          <span className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold backdrop-blur">🎓 A school project inspired by your favourite delivery app</span>
          <h1 className="mt-5 max-w-3xl text-[44px] leading-[1.02] font-black tracking-tight sm:text-7xl">
            Delivery for <span className="text-sun">everything</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg font-semibold text-white/85">
            Food, groceries, flowers and more from the best places in town — delivered to your door in minutes.
          </p>
          <div className="mt-8 w-full max-w-xl rounded-3xl bg-surface p-2 text-ink shadow-pop sm:flex sm:items-center sm:gap-2 sm:rounded-full">
            <button onClick={openAddress} className="flex w-full items-center gap-3 rounded-full px-4 py-3 text-left hover:bg-muted sm:flex-1">
              <MapPin className="size-5 shrink-0 text-brand-500" />
              <span className="truncate font-semibold text-ink-2">Enter your delivery address</span>
            </button>
            <button onClick={go} className="btn-primary mt-2 w-full rounded-full px-6 sm:mt-0 sm:w-auto">
              <Search className="size-5" /> Explore
            </button>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {CITIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCity(c.id)}
                className={clsx(
                  'rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors',
                  c.id === cityId ? 'bg-white text-brand-700' : 'bg-white/15 text-white hover:bg-white/25',
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <svg className="absolute -bottom-px left-0 w-full text-bg" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden>
          <path fill="currentColor" d="M0 60V30C240 0 480 0 720 20s480 40 720 10v30z" />
        </svg>
      </section>

      <section className="container-app py-16">
        <h2 className="text-center text-3xl font-black tracking-tight sm:text-4xl">How it works</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { icon: Search, title: 'Discover', text: `Browse ${venueCount} restaurants and stores near you, filter by cuisine, price or delivery time.` },
            { icon: ShoppingBag, title: 'Order', text: 'Customise your dishes, add a promo code and pay in a couple of taps.' },
            { icon: Bike, title: 'Track', text: 'Follow your courier live on the map until the doorbell rings.' },
          ].map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="card relative p-7">
              <span className="absolute top-6 right-6 text-5xl font-black text-muted-2">{i + 1}</span>
              <span className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand-600 dark:text-brand-300">
                <Icon className="size-7" />
              </span>
              <h3 className="mt-5 text-xl font-black">{title}</h3>
              <p className="mt-2 text-ink-2">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-app">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl font-black tracking-tight">Craving something?</h2>
          <Link to="/restaurants" onClick={() => setOnboarded(true)} className="hidden items-center gap-1 font-bold text-brand-600 sm:flex dark:text-brand-300">
            All restaurants <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {RESTAURANT_CATEGORIES.slice(0, 12).map((c) => (
            <Link key={c.id} to={`/restaurants?category=${c.id}`} onClick={() => setOnboarded(true)} className="group relative aspect-[4/3] overflow-hidden rounded-2xl">
              <Img src={imgUrl(c.image, 400, 300)} alt="" className="size-full transition-transform duration-500 group-hover:scale-110" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <span className="absolute bottom-3 left-3 text-lg font-black text-white">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-app grid items-center gap-10 py-20 md:grid-cols-2">
        <div className="relative mx-auto aspect-square w-full max-w-md">
          <div className="absolute inset-6 rotate-3 rounded-[40px] bg-brand-soft" />
          <div className="absolute inset-6 -rotate-3 overflow-hidden rounded-[40px] shadow-pop">
            <Img src={imgUrl(poolImage('delivery', 4), 700, 700)} alt="" className="size-full" />
          </div>
          <div className="absolute bottom-2 left-0 flex animate-slide-up items-center gap-3 rounded-2xl bg-surface p-3 pr-5 shadow-pop">
            <span className="grid size-11 place-items-center rounded-full bg-brand-500 text-xl">🛵</span>
            <div>
              <p className="text-sm font-extrabold">Arriving in 7 min</p>
              <p className="text-xs text-ink-2">Mika is on the way</p>
            </div>
          </div>
        </div>
        <div>
          <p className="font-extrabold text-brand-600 dark:text-brand-300">Live tracking</p>
          <h2 className="mt-1 text-4xl font-black tracking-tight">Watch your order come to you</h2>
          <p className="mt-4 text-lg text-ink-2">
            From the kitchen to your door, see every step. Chat with your courier, tip them, and rate your order when it arrives.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              [Navigation, 'Real-time courier location on the map'],
              [Smartphone, 'Works great on your phone — add it to your home screen'],
              [Store, 'Restaurants, groceries, pharmacy, flowers and more'],
              [UtensilsCrossed, 'Thousands of dishes with options and special requests'],
            ].map(([Icon, t]) => {
              const I = Icon as typeof Navigation;
              return (
                <li key={t as string} className="flex items-center gap-3 font-semibold">
                  <span className="grid size-9 place-items-center rounded-full bg-brand-soft text-brand-600 dark:text-brand-300">
                    <I className="size-[18px]" />
                  </span>
                  {t as string}
                </li>
              );
            })}
          </ul>
          <button onClick={go} className="btn-primary mt-8">
            Start ordering <ArrowRight className="size-5" />
          </button>
        </div>
      </section>

      <section className="container-app pb-24">
        <h2 className="text-3xl font-black tracking-tight">Find us in these cities</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CITIES.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCity(c.id);
                go();
              }}
              className="card flex items-center gap-4 p-4 text-left transition-transform hover:-translate-y-0.5"
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-lg font-black text-brand-600 dark:text-brand-300">{c.countryCode}</span>
              <span className="flex-1">
                <span className="block text-lg font-black">{c.name}</span>
                <span className="block text-sm text-ink-2">{c.country}</span>
              </span>
              <ArrowRight className="size-5 text-ink-3" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
