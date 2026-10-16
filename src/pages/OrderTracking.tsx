import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import clsx from 'clsx';
import { ArrowLeft, Check, ChefHat, MessageCircle, Package, Phone, Receipt, RotateCcw, Send, Star, Bike, House, CalendarClock, LifeBuoy } from 'lucide-react';
import type { Order } from '@/types';
import { useOrders, orderProgress } from '@/store/orders';
import { useCart } from '@/store/cart';
import { usePrefs } from '@/store/prefs';
import { useUI, toast } from '@/store/ui';
import { getVenueById } from '@/data/venues';
import { getCity } from '@/data/cities';
import { routeBetween, pointAlong } from '@/lib/geo';
import { money, formatTime, formatDateTime, relativeDay } from '@/lib/format';
import { linePrice } from '@/store/cart';
import { useNow } from '@/components/Layout';
import { MapView, pinHtml } from '@/components/MapView';
import { Modal, EmptyState } from '@/components/ui';

const VEHICLE = { bike: '🚲', scooter: '🛵', car: '🚗' } as const;

const DELIVERY_STEPS = [
  { label: 'Order received', icon: Receipt, at: 0 },
  { label: 'Preparing', icon: ChefHat, at: 1 },
  { label: 'Picked up', icon: Package, at: 2 },
  { label: 'On the way', icon: Bike, at: 3 },
  { label: 'Delivered', icon: House, at: 4 },
];
const PICKUP_STEPS = [
  { label: 'Order received', icon: Receipt, at: 0 },
  { label: 'Preparing', icon: ChefHat, at: 1 },
  { label: 'Ready for pickup', icon: Package, at: 2 },
  { label: 'Picked up', icon: Check, at: 4 },
];

const HEADLINES = {
  received: ['Order received', 'The venue is confirming your order'],
  preparing: ['Preparing your order', 'The kitchen is working its magic'],
  pickup: ['Courier is picking up', 'Your order is almost ready to go'],
  delivering: ['On the way!', 'Your courier is heading to you'],
  delivered: ['Delivered 🎉', 'Enjoy your meal!'],
  cancelled: ['Order cancelled', 'You haven’t been charged'],
} as const;

const AUTO_REPLIES = [
  'On my way! 🚀',
  'Got it, thanks!',
  'I’ll be there in a few minutes.',
  'No problem 👍',
  'Traffic is light, should be quick!',
];

function CourierChat({ order, open, onClose }: { order: Order; open: boolean; onClose: () => void }) {
  const [msgs, setMsgs] = useState<{ me: boolean; text: string }[]>([
    { me: false, text: `Hi! I’m ${order.courierName}, I’ll be delivering your order from ${order.venueName}.` },
  ]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: 'smooth' }), [msgs, typing]);
  const send = () => {
    const t = text.trim();
    if (!t) return;
    setMsgs((m) => [...m, { me: true, text: t }]);
    setText('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { me: false, text: AUTO_REPLIES[m.length % AUTO_REPLIES.length] }]);
    }, 1400);
  };
  return (
    <Modal open={open} onClose={onClose} size="sm" label="Chat with courier">
      <div className="flex items-center gap-3 border-b border-line p-4 pr-16">
        <span className="grid size-11 place-items-center rounded-full bg-brand-soft text-2xl">{VEHICLE[order.courierVehicle]}</span>
        <div>
          <p className="font-extrabold">{order.courierName}</p>
          <p className="text-xs text-good">● Online</p>
        </div>
      </div>
      <div className="h-80 space-y-2 overflow-y-auto p-4">
        {msgs.map((m, i) => (
          <div key={i} className={clsx('flex', m.me && 'justify-end')}>
            <p className={clsx('max-w-[80%] rounded-2xl px-3.5 py-2 text-sm', m.me ? 'rounded-br-md bg-brand-500 text-white' : 'rounded-bl-md bg-muted')}>{m.text}</p>
          </div>
        ))}
        {typing && <p className="w-fit animate-pulse rounded-2xl rounded-bl-md bg-muted px-3.5 py-2 text-sm text-ink-2">typing…</p>}
        <div ref={end} />
      </div>
      <form
        className="flex gap-2 border-t border-line p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message your courier" className="input py-2.5" autoFocus />
        <button type="submit" className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-500 text-white" aria-label="Send">
          <Send className="size-5" />
        </button>
      </form>
    </Modal>
  );
}

function RateOrder({ order }: { order: Order }) {
  const rate = useOrders((s) => s.rate);
  const [hover, setHover] = useState(0);
  if (order.rated)
    return (
      <p className="flex items-center gap-2 font-bold text-good">
        <Check className="size-5" /> Thanks for rating {order.rated}/5!
      </p>
    );
  return (
    <div>
      <p className="font-extrabold">How was your order?</p>
      <div className="mt-2 flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onMouseEnter={() => setHover(n)}
            onClick={() => {
              rate(order.id, n);
              toast(n >= 4 ? 'Thanks! We’ll tell the team 💜' : 'Thanks for the feedback — we’ll do better.');
            }}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            className="transition-transform hover:scale-110"
          >
            <Star className={clsx('size-9', n <= hover ? 'fill-sun text-sun' : 'text-ink-3')} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function OrderTracking() {
  const { id = '' } = useParams();
  const order = useOrders((s) => s.orders.find((o) => o.id === id));
  if (!order)
    return (
      <div className="container-app">
        <EmptyState
          emoji="🧾"
          title="Order not found"
          text="This order doesn’t exist on this device."
          action={
            <Link to="/me/orders" className="btn-primary">
              View your orders
            </Link>
          }
        />
      </div>
    );
  return <TrackingView order={order} />;
}

function TrackingView({ order }: { order: Order }) {
  const navigate = useNavigate();
  const now = useNow(1000);
  const speed = usePrefs((s) => s.demoSpeed);
  const cancel = useOrders((s) => s.cancel);
  const replace = useCart((s) => s.replace);
  const openCart = useUI((s) => s.openCart);
  const [chat, setChat] = useState(false);
  const venue = getVenueById(order.venueId);
  const city = getCity(order.cityId);
  const p = orderProgress(order, now);
  const scheduledWaiting = !!order.scheduledFor && now < order.scheduledFor - order.durationMs && !order.cancelled;

  const home = order.address ?? { lat: city.lat, lng: city.lng };
  const route = useMemo(() => (venue ? routeBetween(venue, home, 60) : []), [venue, home.lat, home.lng]); // eslint-disable-line react-hooks/exhaustive-deps
  const courier = order.mode === 'delivery' && (p.status === 'delivering' || p.status === 'delivered') ? pointAlong(route, p.courierT) : venue;

  const minsLeft = Math.max(1, Math.ceil((p.remainingMs * speed) / 60000));
  const arrival = (order.scheduledFor ?? order.createdAt + order.durationMs * speed) as number;
  const steps = order.mode === 'delivery' ? DELIVERY_STEPS : PICKUP_STEPS;
  const [headline, sub] =
    order.mode === 'pickup' && p.status === 'pickup'
      ? ['Ready for pickup! 🛍️', `Head to ${venue?.address ?? 'the venue'}`]
      : order.mode === 'pickup' && p.status === 'delivered'
        ? ['Picked up 🎉', 'Enjoy!']
        : HEADLINES[p.status];
  const done = p.status === 'delivered' || p.status === 'cancelled';

  const reorder = () => {
    if (!venue) return;
    replace(venue.id, order.lines);
    openCart(venue.id);
    toast('Items added to your cart');
  };

  const markers = venue
    ? [
        { id: 'venue', pos: venue, html: pinHtml(venue.logoEmoji, venue.logoColor), title: venue.name },
        ...(order.mode === 'delivery' ? [{ id: 'home', pos: home, html: pinHtml('🏠', '#1f1d26'), title: 'You' }] : []),
        ...(order.mode === 'delivery' && courier && (p.status === 'delivering' || p.status === 'pickup')
          ? [{ id: 'courier', pos: courier, html: pinHtml(VEHICLE[order.courierVehicle], '#7B4DFF'), title: order.courierName, z: 1000 }]
          : []),
      ]
    : [];

  return (
    <div className="pb-10">
      <div className="relative">
        {venue && (
          <MapView
            center={venue}
            fitTo={order.mode === 'delivery' ? [venue, home] : [venue]}
            markers={markers}
            route={order.mode === 'delivery' ? route : undefined}
            routeDone={p.status === 'delivering' ? p.courierT : p.status === 'delivered' ? 1 : 0}
            zoom={15}
            className="h-[42vh] min-h-[280px] md:mx-6 md:mt-2 md:rounded-3xl lg:mx-10"
          />
        )}
        <button onClick={() => navigate('/me/orders')} className="absolute top-3 left-3 z-[400] grid size-10 place-items-center rounded-full bg-white/95 text-[#1f1d26] shadow-card md:left-9 lg:left-13" aria-label="Back">
          <ArrowLeft className="size-5" />
        </button>
      </div>

      <div className="container-app relative z-10 -mt-8 max-w-3xl">
        <div className="card p-5 sm:p-6">
          {scheduledWaiting ? (
            <div className="flex items-center gap-4">
              <span className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand-500">
                <CalendarClock className="size-7" />
              </span>
              <div>
                <p className="text-sm font-bold text-ink-2">Scheduled order</p>
                <h1 className="text-2xl font-black">
                  {relativeDay(order.scheduledFor!)} at {formatTime(order.scheduledFor!)}
                </h1>
                <p className="text-ink-2">We’ll send your order to {order.venueName} at the right time.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{headline}</h1>
                  <p className="text-ink-2">{sub}</p>
                </div>
                {!done && (
                  <div className="shrink-0 rounded-2xl bg-brand-soft px-4 py-2 text-center text-brand-600 dark:text-brand-300">
                    <p className="text-3xl leading-none font-black">{minsLeft}</p>
                    <p className="text-xs font-bold">min</p>
                  </div>
                )}
              </div>
              {p.status !== 'cancelled' && (
                <>
                  <div className="mt-5 flex items-center">
                    {steps.map((s, i) => {
                      const reached = p.step >= s.at;
                      const current = p.step === s.at && !done;
                      const next = steps[i + 1];
                      return (
                        <div key={s.label} className="flex flex-1 items-center last:flex-none">
                          <span
                            className={clsx(
                              'relative grid size-9 shrink-0 place-items-center rounded-full transition-colors duration-500',
                              reached ? 'bg-brand-500 text-white' : 'bg-muted text-ink-3',
                            )}
                            title={s.label}
                          >
                            {current && <span className="absolute inset-0 animate-ping rounded-full bg-brand-500/40" />}
                            <s.icon className="relative size-[18px]" />
                          </span>
                          {next && (
                            <span className="mx-1 h-1 flex-1 overflow-hidden rounded-full bg-muted">
                              <span className={clsx('block h-full bg-brand-500 transition-all duration-700', p.step >= next.at ? 'w-full' : 'w-0')} />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-sm text-ink-2">
                    {done ? 'Completed' : `Estimated ${order.mode === 'delivery' ? 'arrival' : 'ready'}`} ~{formatTime(arrival)} ·{' '}
                    {[...steps].reverse().find((s) => p.step >= s.at)?.label}
                  </p>
                </>
              )}
            </>
          )}

          {order.mode === 'delivery' && (p.status === 'pickup' || p.status === 'delivering') && (
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-muted p-3">
              <span className="grid size-12 place-items-center rounded-full bg-surface text-2xl shadow-card">{VEHICLE[order.courierVehicle]}</span>
              <div className="flex-1">
                <p className="font-extrabold">{order.courierName}</p>
                <p className="text-sm text-ink-2">Your courier · ⭐ 4.9</p>
              </div>
              <button onClick={() => setChat(true)} className="grid size-11 place-items-center rounded-full bg-surface shadow-card hover:bg-muted-2" aria-label="Message courier">
                <MessageCircle className="size-5" />
              </button>
              <button onClick={() => toast('Calling is disabled in the demo 📞')} className="grid size-11 place-items-center rounded-full bg-surface shadow-card hover:bg-muted-2" aria-label="Call courier">
                <Phone className="size-5" />
              </button>
            </div>
          )}

          {p.status === 'received' && !scheduledWaiting && (
            <button
              onClick={() => {
                cancel(order.id);
                toast('Order cancelled. You won’t be charged.');
              }}
              className="mt-4 text-sm font-bold text-bad hover:underline"
            >
              Cancel order
            </button>
          )}
          {scheduledWaiting && (
            <button onClick={() => cancel(order.id)} className="mt-4 text-sm font-bold text-bad hover:underline">
              Cancel scheduled order
            </button>
          )}

          {p.status === 'delivered' && (
            <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-5">
              <RateOrder order={order} />
              <button onClick={reorder} className="btn-soft">
                <RotateCcw className="size-4" /> Order again
              </button>
            </div>
          )}
        </div>

        <div className="card mt-5 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">Order details</h2>
            <span className="rounded-lg bg-muted px-2 py-1 font-mono text-xs font-bold">#{order.id}</span>
          </div>
          <Link to={`/venue/${order.venueSlug}`} className="mt-1 text-sm font-bold text-brand-600 hover:underline dark:text-brand-300">
            {order.venueName}
          </Link>
          <p className="text-sm text-ink-2">Placed {formatDateTime(order.createdAt)}</p>
          <ul className="mt-4 divide-y divide-line">
            {order.lines.map((l) => (
              <li key={l.key} className="flex justify-between gap-3 py-2.5 text-sm">
                <span>
                  <b>{l.quantity}×</b> {l.name}
                  {l.options.length > 0 && <span className="block text-ink-2">{l.options.map((o) => o.choiceName).join(', ')}</span>}
                </span>
                <span className="font-bold">{money(linePrice(l))}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 space-y-1 border-t border-line pt-3 text-sm">
            {(
              [
                ['Subtotal', order.totals.subtotal],
                ['Discount', -order.totals.discount],
                ['Delivery', order.totals.deliveryFee],
                ['Service fee', order.totals.serviceFee],
                ['Small order fee', order.totals.smallOrderFee],
                ['Courier tip', order.totals.tip],
              ] as const
            )
              .filter(([k, v]) => v !== 0 || k === 'Delivery')
              .map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-ink-2">{k}</span>
                  <span className="font-semibold">{v < 0 ? `−${money(-v)}` : v === 0 ? 'Free' : money(v)}</span>
                </div>
              ))}
            <div className="flex justify-between pt-1 text-base font-black">
              <span>Total</span>
              <span>{money(order.totals.total)}</span>
            </div>
          </div>
          <div className="mt-4 grid gap-3 border-t border-line pt-4 text-sm sm:grid-cols-2">
            <div>
              <p className="font-bold">{order.mode === 'delivery' ? 'Delivery address' : 'Pickup from'}</p>
              <p className="text-ink-2">{order.mode === 'delivery' ? `${order.address?.street ?? ''}${order.address?.details ? `, ${order.address.details}` : ''}` : venue?.address}</p>
            </div>
            <div>
              <p className="font-bold">Payment</p>
              <p className="text-ink-2">{order.paymentMethod}</p>
            </div>
            {order.promoCode && (
              <div>
                <p className="font-bold">Promo code</p>
                <p className="text-ink-2">{order.promoCode}</p>
              </div>
            )}
            {order.note && (
              <div>
                <p className="font-bold">Note</p>
                <p className="text-ink-2">{order.note}</p>
              </div>
            )}
          </div>
          <Link to="/info/support" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:underline dark:text-brand-300">
            <LifeBuoy className="size-4" /> Get help with this order
          </Link>
        </div>
      </div>
      <CourierChat order={order} open={chat} onClose={() => setChat(false)} />
    </div>
  );
}
