import { Link, useParams } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { CITIES } from '@/data/cities';
import { PROMO_CODES } from '@/lib/promo';
import { usePrefs } from '@/store/prefs';
import NotFound from './NotFound';

interface Page {
  emoji: string;
  kicker: string;
  title: string;
  intro: string;
  sections: [string, string][];
  cta?: [string, string];
}

const PAGES: Record<string, Page> = {
  about: {
    emoji: '💜',
    kicker: 'About us',
    title: 'Making cities a little more delicious',
    intro: 'Nomly connects hungry people with the best local restaurants, stores and couriers. This version is a school project that recreates how a modern delivery platform works.',
    sections: [
      ['What we do', 'Customers browse venues, order food and groceries, and follow their delivery live on a map. Venues get new customers, couriers earn on their own schedule.'],
      ['How this demo works', 'Everything runs in your browser: restaurants and menus are generated data, orders are simulated with a fake kitchen and courier, and your account is stored locally.'],
      ['Built with', 'React, TypeScript, Vite, Tailwind CSS, Zustand and Leaflet maps. Photos come from Unsplash and maps from OpenStreetMap.'],
    ],
    cta: ['Start exploring', '/discovery'],
  },
  careers: {
    emoji: '🚀',
    kicker: 'Careers',
    title: 'Build the future of local commerce',
    intro: 'We’re a (fictional) team of engineers, designers and operators across Europe.',
    sections: [
      ['Engineering', 'Work on real-time logistics, maps and payments at scale.'],
      ['Design', 'Craft experiences used by millions every day.'],
      ['Operations', 'Launch new cities and keep deliveries running smoothly.'],
    ],
  },
  press: {
    emoji: '📰',
    kicker: 'Press',
    title: 'Nomly in the news',
    intro: 'For press enquiries, please note Nomly is a student project and not a real company.',
    sections: [['Press kit', 'Logo and brand colours: Nomly Violet #7B4DFF and Sunshine #FFD84D.']],
  },
  sustainability: {
    emoji: '🌱',
    kicker: 'Sustainability',
    title: 'Delivering with care',
    intro: 'Most Nomly couriers ride bikes and e-scooters. Cutlery is opt-in to reduce waste.',
    sections: [
      ['Greener deliveries', 'Short routes and bike couriers keep emissions low.'],
      ['Less packaging', 'We encourage partners to use recyclable packaging.'],
    ],
  },
  couriers: {
    emoji: '🛵',
    kicker: 'Couriers',
    title: 'Earn on your own schedule',
    intro: 'Deliver by bike, scooter or car whenever it suits you. Keep 100% of your tips.',
    sections: [
      ['Flexible hours', 'Log in when you want, log out when you’re done.'],
      ['Weekly payouts', 'Get paid every week, with a clear breakdown of every delivery.'],
      ['Requirements', 'Be 18+, have a smartphone and a vehicle. That’s it!'],
    ],
    cta: ['Browse the app', '/discovery'],
  },
  merchants: {
    emoji: '🏪',
    kicker: 'Merchants',
    title: 'Grow your business with Nomly',
    intro: 'Reach thousands of new customers. We handle delivery so you can focus on what you do best.',
    sections: [
      ['More orders', 'Get discovered by hungry customers nearby.'],
      ['Easy tools', 'Manage your menu, opening hours and promotions in one place.'],
      ['Fast payouts', 'Transparent fees and regular payouts.'],
    ],
  },
  work: {
    emoji: '💼',
    kicker: 'Nomly for Work',
    title: 'Lunch for your team, sorted',
    intro: 'Give employees a monthly meal budget and let them order from any venue.',
    sections: [['Simple billing', 'One monthly invoice for the whole company.']],
  },
  support: {
    emoji: '🛟',
    kicker: 'Support',
    title: 'How can we help?',
    intro: 'Answers to the most common questions.',
    sections: [
      ['Where is my order?', 'Open the order from the banner at the bottom of the screen or from Order history to follow it live.'],
      ['Can I cancel?', 'Yes, as long as the venue hasn’t started preparing it (the “Order received” step).'],
      ['Something was missing', 'In the real world we’d refund you. In this demo, have a virtual hug 🤗.'],
      ['Is my payment real?', 'No. Nomly is a demo and never charges anything. Never enter real card details.'],
    ],
  },
  'gift-cards': {
    emoji: '🎁',
    kicker: 'Gift cards',
    title: 'Give the gift of good food',
    intro: 'Digital gift cards are coming soon to Nomly (well, if this were real).',
    sections: [['How it works', 'Choose an amount, add a message and send it by email.']],
  },
  'promo-codes': {
    emoji: '🏷️',
    kicker: 'Promo codes',
    title: 'Codes you can try at checkout',
    intro: 'Enter these codes on the checkout page.',
    sections: PROMO_CODES.map((p) => [p.code, `${p.description}${p.minSubtotal ? ` · min. €${p.minSubtotal}` : ''}`]),
    cta: ['Find a restaurant', '/restaurants'],
  },
  cities: {
    emoji: '🗺️',
    kicker: 'Cities',
    title: `Nomly is in ${CITIES.length} cities`,
    intro: 'Pick a city from the address menu at the top of the page to see its restaurants and stores.',
    sections: CITIES.map((c) => [c.name, `${c.country} · 50 restaurants and stores`]),
  },
};

export default function Info() {
  const { slug = '' } = useParams();
  const setCity = usePrefs((s) => s.setCity);
  const page = PAGES[slug];
  if (!page) return <NotFound />;
  return (
    <div className="container-app max-w-3xl py-10 md:py-16">
      <div className="mb-4 grid size-16 place-items-center rounded-2xl bg-brand-soft text-4xl">{page.emoji}</div>
      <p className="font-extrabold text-brand-600 dark:text-brand-300">{page.kicker}</p>
      <h1 className="mt-1 text-4xl leading-tight font-black tracking-tight sm:text-5xl">{page.title}</h1>
      <p className="mt-4 text-lg text-ink-2">{page.intro}</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {page.sections.map(([h, t]) => {
          const city = slug === 'cities' ? CITIES.find((c) => c.name === h) : undefined;
          const body = (
            <>
              <h2 className="text-lg font-black">{h}</h2>
              <p className="mt-1 text-ink-2">{t}</p>
            </>
          );
          return city ? (
            <Link key={h} to="/discovery" onClick={() => setCity(city.id)} className="card p-5 transition-transform hover:-translate-y-0.5">
              {body}
            </Link>
          ) : (
            <div key={h} className="card p-5">
              {body}
            </div>
          );
        })}
      </div>
      {page.cta && (
        <Link to={page.cta[1]} className="btn-primary mt-10">
          {page.cta[0]} <ArrowRight className="size-5" />
        </Link>
      )}
    </div>
  );
}
