import { Link, useNavigate } from 'react-router';
import { ArrowLeft, ChevronRight, ShoppingBag, Trash2 } from 'lucide-react';
import { Drawer, CloseButton, Img, Stepper, EmptyState } from './ui';
import { useUI } from '@/store/ui';
import { useCart, cartCount, cartSubtotal, linePrice } from '@/store/cart';
import { getVenueById } from '@/data/venues';
import { imgUrl } from '@/lib/img';
import { money, plural } from '@/lib/format';
import { smallOrderFee } from '@/lib/venue';
import type { CartLine, Venue } from '@/types';

export function CartLines({ venue, lines, compact = false }: { venue: Venue; lines: CartLine[]; compact?: boolean }) {
  const setQuantity = useCart((s) => s.setQuantity);
  return (
    <ul className="divide-y divide-line">
      {lines.map((l) => (
        <li key={l.key} className="flex gap-3 py-3.5">
          {!compact && <Img src={imgUrl(l.image, 160, 160)} alt="" className="size-16 shrink-0 rounded-xl" />}
          <div className="min-w-0 flex-1">
            <p className="font-bold">{l.name}</p>
            {l.options.length > 0 && <p className="text-sm text-ink-2">{l.options.map((o) => o.choiceName).join(', ')}</p>}
            {l.note && <p className="text-sm text-ink-3 italic">“{l.note}”</p>}
            <p className="mt-1 text-sm font-extrabold text-brand-600 dark:text-brand-300">{money(linePrice(l))}</p>
          </div>
          <div className="self-center">
            <Stepper size="sm" value={l.quantity} onChange={(n) => setQuantity(venue.id, l.key, n)} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CartDrawer() {
  const open = useUI((s) => s.cartOpen);
  const close = useUI((s) => s.closeCart);
  const focusId = useUI((s) => s.cartVenueId);
  const openCart = useUI((s) => s.openCart);
  const carts = useCart((s) => s.carts);
  const order = useCart((s) => s.order);
  const clear = useCart((s) => s.clear);
  const navigate = useNavigate();

  const venueIds = order.filter((id) => carts[id]?.length);
  const focus = focusId && carts[focusId]?.length ? focusId : venueIds.length === 1 ? venueIds[0] : null;
  const venue = focus ? getVenueById(focus) : undefined;
  const lines = focus ? (carts[focus] ?? []) : [];
  const subtotal = cartSubtotal(lines);

  return (
    <Drawer open={open} onClose={close} label="Shopping cart">
      <div className="flex items-center gap-3 border-b border-line p-4">
        {venue && venueIds.length > 1 ? (
          <button onClick={() => openCart()} className="grid size-10 place-items-center rounded-full bg-muted hover:bg-muted-2" aria-label="All carts">
            <ArrowLeft className="size-5" />
          </button>
        ) : null}
        <h2 className="flex-1 text-xl font-black">{venue ? 'Your order' : 'Shopping carts'}</h2>
        <CloseButton onClick={close} />
      </div>

      {venueIds.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            emoji="🛍️"
            title="Your cart is empty"
            text="Add items from a restaurant or store to start a new order."
            action={
              <button
                onClick={() => {
                  close();
                  navigate('/discovery');
                }}
                className="btn-primary"
              >
                Start browsing
              </button>
            }
          />
        </div>
      ) : venue ? (
        <>
          <div className="flex-1 overflow-y-auto px-4">
            <Link to={`/venue/${venue.slug}`} onClick={close} className="mt-4 flex items-center gap-3 rounded-2xl bg-muted p-3 hover:bg-muted-2">
              <Img src={imgUrl(venue.image, 120, 120)} alt="" className="size-12 shrink-0 rounded-xl" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-extrabold">{venue.name}</span>
                <span className="block text-sm text-ink-2">Add more items</span>
              </span>
              <ChevronRight className="size-5 text-ink-3" />
            </Link>
            <CartLines venue={venue} lines={lines} />
            <button onClick={() => clear(venue.id)} className="mb-4 flex items-center gap-2 text-sm font-bold text-bad hover:underline">
              <Trash2 className="size-4" /> Clear cart
            </button>
          </div>
          <div className="border-t border-line p-4">
            {smallOrderFee(venue, subtotal) > 0 && (
              <p className="mb-3 rounded-xl bg-warn/10 p-3 text-sm font-semibold text-warn">
                Add {money(venue.minOrder - subtotal)} more to avoid the small order fee (min. {money(venue.minOrder)}).
              </p>
            )}
            <div className="mb-3 flex justify-between text-sm">
              <span className="text-ink-2">Item subtotal</span>
              <span className="font-extrabold">{money(subtotal)}</span>
            </div>
            <button
              onClick={() => {
                close();
                navigate(`/checkout/${venue.slug}`);
              }}
              className="btn-primary w-full justify-between"
            >
              <span className="grid size-7 place-items-center rounded-lg bg-white/20 text-sm">{cartCount(lines)}</span>
              Go to checkout
              <span>{money(subtotal)}</span>
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <p className="text-sm text-ink-2">You have carts at {venueIds.length} places. Each one is checked out separately.</p>
          {venueIds.map((id) => {
            const v = getVenueById(id);
            if (!v) return null;
            const ls = carts[id];
            return (
              <button key={id} onClick={() => openCart(id)} className="card flex w-full items-center gap-3 p-3 text-left transition-transform hover:scale-[1.01]">
                <Img src={imgUrl(v.image, 140, 140)} alt="" className="size-14 shrink-0 rounded-xl" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-extrabold">{v.name}</span>
                  <span className="block text-sm text-ink-2">
                    {plural(cartCount(ls), 'item')} · {money(cartSubtotal(ls))}
                  </span>
                </span>
                <span className="grid size-9 place-items-center rounded-full bg-brand-soft text-brand-600 dark:text-brand-300">
                  <ShoppingBag className="size-4" />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Drawer>
  );
}
