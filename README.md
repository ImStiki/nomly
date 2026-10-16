# Nomly 🛵

**Nomly** is a food & grocery delivery web app inspired by [Wolt](https://wolt.com), built as a school project.
It recreates the full customer experience — discovering restaurants and stores, building an order, checking out and
following the courier live on a map — entirely in the browser.

> ⚠️ Nomly is a fictional demo. It is not affiliated with Wolt or any real company. No real orders are placed and no
> payments are made. Never enter real card details.

**Live demo:** https://imstiki.github.io/nomly/

## Features

- **Landing page** with city picker and address entry
- **Discovery** feed: promo banners, category carousels and curated rows (popular, fastest, top rated, deals, free
  delivery, new, open late, stores near you, order again, favourites)
- **Restaurants & Stores** listings with category filters, sorting (rating, delivery time, fee, distance…),
  quick filters (open now, free delivery, offers, rating 9+, price level) and a **map view**
- **6 cities** (Helsinki, Berlin, Prishtina, Tirana, Stockholm, Prague) × 50 venues each, with full menus
- **Venue pages**: hero, ratings, live delivery estimate & fee based on your address, opening hours, info modal with
  map, sticky menu navigation with scroll-spy, menu search, "most ordered" section
- **Item customisation**: required/optional option groups (sizes, extras, spice level…), special requests, quantity
- **Cart** with separate baskets per venue, small-order fee warning
- **Checkout**: delivery or pickup, saved addresses with draggable map pin, ASAP or scheduled delivery, courier tip,
  promo codes, Nomly credits, demo payment methods (with Luhn-validated test cards), full fee breakdown
- **Live order tracking**: status steps, ETA countdown, courier moving along a route on the map, courier chat,
  cancel window, rating and one-tap reorder
- **Accounts** (local, password-less): profile, addresses, payment methods, order history, favourites, referral code
- **Nomly+** subscription (free delivery over €15)
- **Global search** across venues, dishes and products with instant suggestions
- **Dark mode**, responsive mobile layout with bottom navigation, installable **PWA** with offline support

### Promo codes to try

| Code      | What it does                                   |
| --------- | ---------------------------------------------- |
| `WELCOME` | €5 off + free delivery on your first order     |
| `NOMLY10` | 10% off (max €10)                              |
| `FREEDEL` | Free delivery                                  |
| `STUDENT` | 15% off (max €8)                               |
| `PIZZA2X` | €3 off orders over €20                         |

Test card: `4242 4242 4242 4242`, any future expiry, any CVC.

## Tech stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org) + [Vite](https://vite.dev)
- [Tailwind CSS v4](https://tailwindcss.com) for styling (design tokens + dark mode)
- [React Router v7](https://reactrouter.com) for routing
- [Zustand](https://zustand.docs.pmnd.rs) for state (persisted to `localStorage`)
- [Leaflet](https://leafletjs.com) with OpenStreetMap tiles for maps
- [Lucide](https://lucide.dev) icons, Nunito font
- Food photos from [Unsplash](https://unsplash.com/license)

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

```bash
npm run build     # type-check + production build into dist/
npm run preview   # serve the production build
```

Every push to `main` is deployed to GitHub Pages by `.github/workflows/deploy.yml`.

## Project structure

```
src/
  components/   Layout, header, modals (auth, address, item, cart), cards, map
  data/         Cities, categories, venues and menu templates (generated deterministically)
  lib/          Formatting, geo maths, delivery estimates, search, promo codes
  pages/        Landing, Discovery, Listing, Venue, Checkout, OrderTracking, Search, Profile, Plus, Info
  store/        Zustand stores: prefs, auth, cart, orders, ui
```

## How the simulation works

- Venues and menus are generated from templates with a seeded random generator, so data is identical on every load.
- Delivery time and fee are calculated from the distance between the venue and your selected address.
- Orders move through _received → preparing → picked up → on the way → delivered_ based on elapsed time. The speed can
  be changed in **Settings → Demo mode** (default 10× so a full delivery takes a couple of minutes).
