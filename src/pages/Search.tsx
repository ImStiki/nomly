import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import clsx from 'clsx';
import { usePrefs } from '@/store/prefs';
import { search, POPULAR_SEARCHES } from '@/lib/search';
import { getCity } from '@/data/cities';
import { ALL_CATEGORIES } from '@/data/categories';
import { imgUrl } from '@/lib/img';
import { money } from '@/lib/format';
import { SearchBox } from '@/components/Header';
import { VenueGrid, CategoryTile } from '@/components/VenueCard';
import { EmptyState, Img, ItemTags, SectionTitle } from '@/components/ui';

type Tab = 'all' | 'venues' | 'items';

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const cityId = usePrefs((s) => s.cityId);
  const addRecent = usePrefs((s) => s.addRecentSearch);
  const [tab, setTab] = useState<Tab>('all');
  const res = useMemo(() => search(cityId, q, 60), [cityId, q]);
  const city = getCity(cityId);

  return (
    <div className="container-app pt-4 md:pt-8">
      <SearchBox className="mb-6 md:hidden" autoFocus={!q} />
      {!q ? (
        <>
          <h1 className="text-3xl font-black tracking-tight">Search</h1>
          <p className="mb-5 text-ink-2">Find restaurants, stores, dishes and products in {city.name}.</p>
          <SectionTitle title="Popular searches" />
          <div className="mb-10 flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map((p) => (
              <Link key={p} to={`/search?q=${encodeURIComponent(p)}`} onClick={() => addRecent(p)} className="chip">
                {p}
              </Link>
            ))}
          </div>
          <SectionTitle title="Browse categories" />
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-8">
            {ALL_CATEGORIES.map((c) => (
              <CategoryTile key={c.id} category={c} to={`${c.type === 'store' ? '/stores' : '/restaurants'}?category=${c.id}`} />
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="text-sm font-bold text-ink-2">Results in {city.name}</p>
          <h1 className="text-3xl font-black tracking-tight">“{q}”</h1>
          <div className="mt-4 mb-6 flex gap-2">
            {(
              [
                ['all', 'All'],
                ['venues', `Venues (${res.venues.length})`],
                ['items', `Dishes & products (${res.items.length})`],
              ] as [Tab, string][]
            ).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)} className={clsx('chip', tab === t && 'chip-active')}>
                {label}
              </button>
            ))}
          </div>

          {res.venues.length + res.items.length === 0 ? (
            <EmptyState
              emoji="🧐"
              title="No results"
              text={`We couldn’t find anything for “${q}” in ${city.name}. Try a different word or check the spelling.`}
              action={
                <Link to="/discovery" className="btn-primary">
                  Back to Discovery
                </Link>
              }
            />
          ) : (
            <>
              {tab !== 'items' && res.venues.length > 0 && (
                <section className="mb-10">
                  {tab === 'all' && <SectionTitle title="Venues" />}
                  <VenueGrid venues={tab === 'all' ? res.venues.slice(0, 8) : res.venues} />
                  {tab === 'all' && res.venues.length > 8 && (
                    <button onClick={() => setTab('venues')} className="btn-ghost mt-5">
                      Show all {res.venues.length} venues
                    </button>
                  )}
                </section>
              )}
              {tab !== 'venues' && res.items.length > 0 && (
                <section>
                  {tab === 'all' && <SectionTitle title="Dishes & products" />}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {(tab === 'all' ? res.items.slice(0, 12) : res.items).map(({ venue, item }) => (
                      <Link key={item.id} to={`/venue/${venue.slug}?item=${item.id}`} className="card flex gap-3 p-3 transition-transform hover:-translate-y-0.5">
                        <Img src={imgUrl(item.image ?? venue.image, 200, 200)} alt="" className="size-20 shrink-0 rounded-xl" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-extrabold">{item.name}</p>
                          <p className="truncate text-sm text-ink-2">{venue.name}</p>
                          <p className="mt-1 flex items-center gap-2 text-sm">
                            <span className="font-extrabold text-brand-600 dark:text-brand-300">{money(item.price)}</span>
                            <ItemTags tags={item.tags} />
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {tab === 'all' && res.items.length > 12 && (
                    <button onClick={() => setTab('items')} className="btn-ghost mt-5">
                      Show all {res.items.length} dishes & products
                    </button>
                  )}
                </section>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
