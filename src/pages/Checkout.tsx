import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import clsx from 'clsx';
import {
  ArrowLeft,
  Banknote,
  Bike,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  CreditCard,
  Footprints,
  Info,
  MapPin,
  Plus,
  Smartphone,
  Tag,
  Utensils,
  X,
  Crown,
  Gift,
} from 'lucide-react';
import type { Order, PromoKind } from '@/types';
import { getVenueBySlug } from '@/data/venues';
import { findMenuItem } from '@/data/menus';
import { getCity } from '@/data/cities';
import { useVenueCart, useCart, cartSubtotal, unitPrice } from '@/store/cart';
import { usePrefs } from '@/store/prefs';
import { useAuth } from '@/store/auth';
import { useOrders } from '@/store/orders';
import { useUI, toast } from '@/store/ui';
import { estimate, isOpen, serviceFee, smallOrderFee, SERVICE_FEE_RATE } from '@/lib/venue';
import { checkPromo, promoDiscount, type PromoCode } from '@/lib/promo';
import { money, minutesToClock } from '@/lib/format';
import { imgUrl } from '@/lib/img';
import { seeded } from '@/lib/random';
import { CartLines } from '@/components/CartDrawer';
import { Img, Segmented, EmptyState, Modal } from '@/components/ui';
import NotFound from './NotFound';

const TIPS = [0, 1, 2, 3, 5];
const COURIERS = ['Arben', 'Mika', 'Lena', 'Jonas', 'Sara', 'Elira', 'Noah', 'Aino', 'Leon', 'Drita'];

function Card({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function luhn(num: string) {
  const d = num.replace(/\D/g, '');
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

function AddCardModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addCard = useAuth((s) => s.addCard);
  const [num, setNum] = useState('');
  const [exp, setExp] = useState('');
  const [cvc, setCvc] = useState('');
  const [err, setErr] = useState('');
  const brand = /^4/.test(num) ? 'Visa' : /^5[1-5]/.test(num) ? 'Mastercard' : /^3[47]/.test(num) ? 'Amex' : 'Card';
  return (
    <Modal open={open} onClose={onClose} size="sm" label="Add card">
      <form
        className="p-6 sm:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          const digits = num.replace(/\D/g, '');
          if (!luhn(digits)) return setErr('That card number doesn’t look right. Try the test number 4242 4242 4242 4242.');
          if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp)) return setErr('Expiry must look like MM/YY.');
          if (!/^\d{3,4}$/.test(cvc)) return setErr('CVC must be 3 or 4 digits.');
          addCard(digits.slice(-4), brand, exp);
          toast(`${brand} •••• ${digits.slice(-4)} added`, { tone: 'success' });
          setNum('');
          setExp('');
          setCvc('');
          setErr('');
          onClose();
        }}
      >
        <h2 className="text-2xl font-black">Add a card</h2>
        <p className="mt-1 rounded-xl bg-warn/12 p-3 text-sm font-semibold text-warn">
          Demo only — never enter real card details. Use 4242 4242 4242 4242 with any future date.
        </p>
        <label className="mt-5 mb-1.5 block text-sm font-bold" htmlFor="cc-num">
          Card number
        </label>
        <input
          id="cc-num"
          inputMode="numeric"
          value={num}
          onChange={(e) => setNum(e.target.value.replace(/[^\d ]/g, '').slice(0, 23))}
          placeholder="4242 4242 4242 4242"
          className="input"
          autoComplete="off"
        />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-bold" htmlFor="cc-exp">
              Expiry
            </label>
            <input
              id="cc-exp"
              value={exp}
              onChange={(e) => {
                let v = e.target.value.replace(/[^\d]/g, '').slice(0, 4);
                if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2)}`;
                setExp(v);
              }}
              placeholder="MM/YY"
              className="input"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold" htmlFor="cc-cvc">
              CVC
            </label>
            <input id="cc-cvc" value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="123" className="input" autoComplete="off" />
          </div>
        </div>
        {err && <p className="mt-3 text-sm font-semibold text-bad">{err}</p>}
        <button type="submit" className="btn-primary mt-6 w-full">
          Save card
        </button>
      </form>
    </Modal>
  );
}

const PAY_ICON = { card: CreditCard, wallet: Smartphone, cash: Banknote };

/** Venue-level promos that change the total. */
function venuePromoDiscount(kind: PromoKind | undefined, venue: Parameters<typeof findMenuItem>[0], lines: ReturnType<typeof useVenueCart>) {
  if (kind !== 'bogo') return 0;
  let d = 0;
  for (const l of lines) {
    const item = findMenuItem(venue, l.itemId);
    if (item?.popular) d += Math.floor(l.quantity / 2) * unitPrice(l);
  }
  return Math.round(d * 100) / 100;
}

export default function Checkout() {
  const { slug = '' } = useParams();
  const venue = getVenueBySlug(slug);
  if (!venue) return <NotFound />;
  return <CheckoutView venueSlug={slug} />;
}

function CheckoutView({ venueSlug }: { venueSlug: string }) {
  const venue = getVenueBySlug(venueSlug)!;
  const navigate = useNavigate();
  const lines = useVenueCart(venue.id);
  const clearCart = useCart((s) => s.clear);
  const address = usePrefs((s) => s.address);
  const demoSpeed = usePrefs((s) => s.demoSpeed);
  const user = useAuth((s) => s.user);
  const plus = useAuth((s) => s.plus);
  const credits = useAuth((s) => s.credits);
  const addCredits = useAuth((s) => s.addCredits);
  const methods = useAuth((s) => s.paymentMethods);
  const defaultPayment = useAuth((s) => s.defaultPayment);
  const setDefaultPayment = useAuth((s) => s.setDefaultPayment);
  const orders = useOrders((s) => s.orders);
  const place = useOrders((s) => s.place);
  const openAuth = useUI((s) => s.openAuth);
  const openAddress = useUI((s) => s.openAddress);

  const open = isOpen(venue);
  const [mode, setMode] = useState<'delivery' | 'pickup'>('delivery');
  const [when, setWhen] = useState<'now' | 'later'>(open ? 'now' : 'later');
  const [day, setDay] = useState<0 | 1>(0);
  const [slot, setSlot] = useState<number | null>(null);
  const [tip, setTip] = useState(1);
  const [customTip, setCustomTip] = useState('');
  const [cutlery, setCutlery] = useState(false);
  const [useCredits, setUseCredits] = useState(true);
  const [codeInput, setCodeInput] = useState('');
  const [promo, setPromo] = useState<PromoCode | null>(null);
  const [promoErr, setPromoErr] = useState('');
  const [cardOpen, setCardOpen] = useState(false);
  const [venueNote, setVenueNote] = useState('');
  const [placing, setPlacing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const city = getCity(venue.id.split('-')[0]);
  const point = address && address.cityId === city.id ? address : { lat: city.lat, lng: city.lng };
  const est = estimate(venue, point);
  const payment = methods.find((m) => m.id === defaultPayment) ?? methods[0];

  // time slots every 15 min within opening hours, at least 30 min from now
  const slots = useMemo(() => {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const { open: o, close: c } = venue.hours;
    const res: number[] = [];
    const start = Math.ceil(o / 15) * 15 + 30;
    const end = Math.min(c, 24 * 60 - 15);
    for (let m = start; m <= end; m += 15) if (day === 1 || m >= nowMin + 30) res.push(m);
    return res;
  }, [venue.hours, day]);

  const subtotal = cartSubtotal(lines);
  const bogo = venuePromoDiscount(venue.promo?.kind, venue, lines);
  const codeDiscount = promoDiscount(promo, subtotal - bogo);
  const discount = Math.round((bogo + codeDiscount) * 100) / 100;
  const freeByPlus = plus && subtotal >= 15;
  const deliveryFee = mode === 'pickup' || promo?.freeDelivery || freeByPlus ? 0 : est.fee;
  const sFee = serviceFee(subtotal);
  const small = mode === 'delivery' ? smallOrderFee(venue, subtotal) : 0;
  const tipAmount = mode === 'delivery' ? (tip === -1 ? Math.max(0, Number(customTip.replace(',', '.')) || 0) : tip) : 0;
  const beforeCredits = Math.max(0, subtotal - discount + deliveryFee + sFee + small + tipAmount);
  const creditsUsed = user && useCredits ? Math.min(credits, beforeCredits) : 0;
  const total = Math.round((beforeCredits - creditsUsed) * 100) / 100;

  if (!lines.length) {
    return (
      <div className="container-app">
        <EmptyState
          emoji="🛒"
          title="Your cart is empty"
          text={`Add something tasty from ${venue.name} first.`}
          action={
            <Link to={`/venue/${venue.slug}`} className="btn-primary">
              Back to {venue.name}
            </Link>
          }
        />
      </div>
    );
  }

  const applyCode = () => {
    const r = checkPromo(codeInput, subtotal, orders.length);
    if (r.ok) {
      setPromo(r.promo);
      setPromoErr('');
      toast(`Code ${r.promo.code} applied 🎉`, { tone: 'success' });
    } else {
      setPromo(null);
      setPromoErr(r.error);
    }
  };

  const placeOrder = async () => {
    const errs: string[] = [];
    if (!user) {
      openAuth('login');
      toast('Log in to place your order');
      return;
    }
    if (mode === 'delivery' && (!address || address.cityId !== city.id)) errs.push(`Add a delivery address in ${city.name}.`);
    if (when === 'later' && slot === null) errs.push('Pick a time for your scheduled order.');
    if (!payment) errs.push('Choose a payment method.');
    setErrors(errs);
    if (errs.length) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setPlacing(true);
    await new Promise((r) => setTimeout(r, 1200)); // pretend to talk to a payment provider
    const r = seeded(`${Date.now()}`);
    const etaMin = mode === 'delivery' ? est.max : venue.prepTime + 5;
    let scheduledFor: number | undefined;
    if (when === 'later' && slot !== null) {
      const d = new Date();
      d.setDate(d.getDate() + day);
      d.setHours(Math.floor(slot / 60), slot % 60, 0, 0);
      scheduledFor = d.getTime();
    }
    const id = `${Date.now().toString(36).toUpperCase()}${r.int(10, 99)}`;
    const order: Order = {
      id,
      venueId: venue.id,
      venueSlug: venue.slug,
      venueName: venue.name,
      venueImage: venue.image,
      cityId: city.id,
      lines,
      totals: {
        subtotal,
        discount,
        deliveryFee,
        serviceFee: sFee,
        smallOrderFee: small,
        tip: tipAmount,
        total,
      },
      mode,
      address: mode === 'delivery' ? (address ?? undefined) : undefined,
      paymentMethod: payment!.label + (creditsUsed > 0 ? ` + ${money(creditsUsed)} credits` : ''),
      promoCode: promo?.code,
      createdAt: Date.now(),
      scheduledFor,
      durationMs: Math.round((etaMin * 60000) / Math.max(1, demoSpeed)),
      courierName: r.pick(COURIERS),
      courierVehicle: r.pick(['bike', 'scooter', 'car'] as const),
      note: [venueNote.trim(), cutlery ? 'Please include cutlery' : ''].filter(Boolean).join(' · ') || undefined,
    };
    place(order);
    if (creditsUsed > 0) addCredits(-creditsUsed);
    // 1% back in credits on every order
    addCredits(Math.round(subtotal) / 100);
    clearCart(venue.id);
    setPlacing(false);
    navigate(`/order/${id}`, { replace: true });
    toast('Order placed! 🎉', { tone: 'success' });
  };

  const row = (label: ReactNode, value: ReactNode, cls?: string) => (
    <div className={clsx('flex items-center justify-between py-1 text-[15px]', cls)}>
      <span className="text-ink-2">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );

  return (
    <div className="container-app max-w-6xl pt-4 pb-10">
      <div className="mb-5 flex items-center gap-3">
        <Link to={`/venue/${venue.slug}`} className="grid size-10 place-items-center rounded-full bg-muted hover:bg-muted-2" aria-label="Back to venue">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink-2">Checkout</p>
          <h1 className="truncate text-2xl font-black tracking-tight sm:text-3xl">{venue.name}</h1>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mb-4 rounded-2xl bg-bad/10 p-4 text-sm font-semibold text-bad">
          {errors.map((e) => (
            <p key={e}>• {e}</p>
          ))}
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <Segmented
            value={mode}
            onChange={setMode}
            className="w-full"
            options={[
              { value: 'delivery', label: <span className="inline-flex items-center gap-2"><Bike className="size-4" />Delivery · {est.min}–{est.max} min</span> },
              { value: 'pickup', label: <span className="inline-flex items-center gap-2"><Footprints className="size-4" />Pickup · {venue.prepTime + 5} min</span> },
            ]}
          />

          {mode === 'delivery' ? (
            <Card title="Delivery address">
              {address && address.cityId === city.id ? (
                <button onClick={openAddress} className="flex w-full items-center gap-3 rounded-2xl bg-muted p-3 text-left hover:bg-muted-2">
                  <span className="grid size-11 place-items-center rounded-full bg-brand-soft text-brand-600 dark:text-brand-300">
                    <MapPin className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-extrabold">{address.street}</span>
                    <span className="block truncate text-sm text-ink-2">
                      {[address.details, city.name, address.instructions].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="text-sm font-bold text-brand-600 dark:text-brand-300">Change</span>
                </button>
              ) : (
                <button onClick={openAddress} className="btn-soft w-full">
                  <Plus className="size-5" /> Add delivery address in {city.name}
                </button>
              )}
            </Card>
          ) : (
            <Card title="Pickup location">
              <div className="flex items-center gap-3 rounded-2xl bg-muted p-3">
                <span className="grid size-11 place-items-center rounded-full text-xl" style={{ background: venue.logoColor }}>
                  {venue.logoEmoji}
                </span>
                <div>
                  <p className="font-extrabold">{venue.address}</p>
                  <p className="text-sm text-ink-2">
                    {city.name} · {est.km.toFixed(1)} km from you
                  </p>
                </div>
              </div>
            </Card>
          )}

          <Card title="When?">
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                disabled={!open}
                onClick={() => setWhen('now')}
                className={clsx('flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition-colors', when === 'now' ? 'border-brand-500 bg-brand-soft' : 'border-line hover:bg-muted', !open && 'opacity-50')}
              >
                <Clock className="size-5 text-brand-500" />
                <span>
                  <span className="block font-extrabold">Standard</span>
                  <span className="block text-sm text-ink-2">{open ? (mode === 'delivery' ? `${est.min}–${est.max} min` : `Ready in ${venue.prepTime + 5} min`) : 'Venue is closed'}</span>
                </span>
              </button>
              <button
                onClick={() => setWhen('later')}
                className={clsx('flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition-colors', when === 'later' ? 'border-brand-500 bg-brand-soft' : 'border-line hover:bg-muted')}
              >
                <Calendar className="size-5 text-brand-500" />
                <span>
                  <span className="block font-extrabold">Schedule</span>
                  <span className="block text-sm text-ink-2">{slot !== null ? `${day ? 'Tomorrow' : 'Today'} at ${minutesToClock(slot)}` : 'Choose a time'}</span>
                </span>
              </button>
            </div>
            {when === 'later' && (
              <div className="mt-4">
                <Segmented
                  value={String(day) as '0' | '1'}
                  onChange={(v) => {
                    setDay(Number(v) as 0 | 1);
                    setSlot(null);
                  }}
                  options={[
                    { value: '0', label: 'Today' },
                    { value: '1', label: 'Tomorrow' },
                  ]}
                />
                {slots.length === 0 ? (
                  <p className="mt-3 text-sm text-ink-2">No more slots today — try tomorrow.</p>
                ) : (
                  <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
                    {slots.map((m) => (
                      <button key={m} onClick={() => setSlot(m)} className={clsx('chip', slot === m && 'chip-active')}>
                        {minutesToClock(m)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card
            title="Your items"
            action={
              <Link to={`/venue/${venue.slug}`} className="text-sm font-bold text-brand-600 hover:underline dark:text-brand-300">
                + Add more
              </Link>
            }
          >
            <CartLines venue={venue} lines={lines} />
            {venue.promo?.kind === 'gift' && subtotal >= 25 && (
              <p className="mt-2 flex items-center gap-2 rounded-xl bg-good/10 p-3 text-sm font-bold text-good">
                <Gift className="size-4" /> A free dessert will be added to your order!
              </p>
            )}
            {bogo > 0 && (
              <p className="mt-2 flex items-center gap-2 rounded-xl bg-good/10 p-3 text-sm font-bold text-good">
                <Gift className="size-4" /> 2 for 1 applied — you save {money(bogo)}
              </p>
            )}
            {venue.type === 'restaurant' && (
              <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl bg-muted p-3">
                <Utensils className="size-5 text-ink-2" />
                <span className="flex-1 text-sm font-bold">Include cutlery</span>
                <input type="checkbox" checked={cutlery} onChange={(e) => setCutlery(e.target.checked)} className="size-5 accent-brand-500" />
              </label>
            )}
            <textarea
              value={venueNote}
              onChange={(e) => setVenueNote(e.target.value.slice(0, 200))}
              rows={2}
              placeholder={`Add a note for ${venue.name} (optional)`}
              className="input mt-3 resize-none text-sm"
            />
          </Card>

          <Card
            title="Payment"
            action={
              <button onClick={() => setCardOpen(true)} className="text-sm font-bold text-brand-600 hover:underline dark:text-brand-300">
                + Add card
              </button>
            }
          >
            <div className="space-y-2">
              {methods.map((m) => {
                const Icon = PAY_ICON[m.kind];
                const on = payment?.id === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setDefaultPayment(m.id)}
                    className={clsx('flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-colors', on ? 'border-brand-500 bg-brand-soft' : 'border-line hover:bg-muted')}
                  >
                    <span className="grid size-10 place-items-center rounded-xl bg-surface shadow-card">
                      <Icon className="size-5" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-extrabold">{m.label}</span>
                      {m.detail && <span className="block text-sm text-ink-2">{m.detail}</span>}
                    </span>
                    {on && <Check className="size-5 text-brand-500" />}
                  </button>
                );
              })}
            </div>
            {user && credits > 0 && (
              <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl bg-good/10 p-3">
                <span className="text-xl">💜</span>
                <span className="flex-1 text-sm">
                  <b>Use Nomly credits</b>
                  <span className="block text-ink-2">{money(credits)} available</span>
                </span>
                <input type="checkbox" checked={useCredits} onChange={(e) => setUseCredits(e.target.checked)} className="size-5 accent-brand-500" />
              </label>
            )}
          </Card>

          {mode === 'delivery' && (
            <Card title="Tip your courier">
              <p className="mb-3 text-sm text-ink-2">100% of the tip goes to your courier. Thank you! 💜</p>
              <div className="flex flex-wrap gap-2">
                {TIPS.map((t) => (
                  <button key={t} onClick={() => setTip(t)} className={clsx('chip min-w-16 justify-center', tip === t && 'chip-active')}>
                    {t === 0 ? 'No tip' : `€${t}`}
                  </button>
                ))}
                <button onClick={() => setTip(-1)} className={clsx('chip', tip === -1 && 'chip-active')}>
                  Other
                </button>
              </div>
              {tip === -1 && (
                <input
                  inputMode="decimal"
                  value={customTip}
                  onChange={(e) => setCustomTip(e.target.value.replace(/[^\d.,]/g, '').slice(0, 5))}
                  placeholder="Amount in €"
                  className="input mt-3 max-w-40"
                  autoFocus
                />
              )}
            </Card>
          )}
        </div>

        {/* Summary */}
        <aside className="card p-5 lg:sticky lg:top-24">
          <div className="flex items-center gap-3 border-b border-line pb-4">
            <Img src={imgUrl(venue.image, 120, 120)} alt="" className="size-12 rounded-xl" />
            <div className="min-w-0">
              <p className="truncate font-extrabold">{venue.name}</p>
              <p className="text-sm text-ink-2">{mode === 'delivery' ? `Delivery to ${address?.street ?? '…'}` : 'Pickup'}</p>
            </div>
          </div>

          <div className="border-b border-line py-4">
            {promo ? (
              <div className="flex items-center gap-2 rounded-xl bg-good/10 p-3">
                <Tag className="size-4 text-good" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-good">{promo.code}</p>
                  <p className="truncate text-xs text-ink-2">{promo.description}</p>
                </div>
                <button onClick={() => setPromo(null)} aria-label="Remove code" className="text-ink-3 hover:text-ink">
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  applyCode();
                }}
              >
                <input value={codeInput} onChange={(e) => setCodeInput(e.target.value.toUpperCase())} placeholder="Promo code" className="input py-2.5 text-sm uppercase" />
                <button type="submit" disabled={!codeInput.trim()} className="btn-soft px-4 py-2.5 text-sm">
                  Apply
                </button>
              </form>
            )}
            {promoErr && <p className="mt-2 text-sm font-semibold text-bad">{promoErr}</p>}
            {!promo && <p className="mt-2 text-xs text-ink-3">Try NOMLY10, FREEDEL or STUDENT</p>}
          </div>

          <div className="py-4">
            {row('Item subtotal', money(subtotal))}
            {discount > 0 && row('Discount', `−${money(discount)}`, '[&>span:last-child]:text-good')}
            {mode === 'delivery' &&
              row(
                <span className="inline-flex items-center gap-1">
                  Delivery {freeByPlus && <Crown className="size-3.5 text-warn" />}
                </span>,
                deliveryFee === 0 ? <span className="text-good">Free</span> : money(deliveryFee),
              )}
            {row(
              <span className="inline-flex items-center gap-1" title={`${SERVICE_FEE_RATE * 100}% of the item subtotal, max €2.50`}>
                Service fee <Info className="size-3.5" />
              </span>,
              money(sFee),
            )}
            {small > 0 && row('Small order fee', money(small))}
            {tipAmount > 0 && row('Courier tip', money(tipAmount))}
            {creditsUsed > 0 && row('Nomly credits', `−${money(creditsUsed)}`, '[&>span:last-child]:text-good')}
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <span className="text-lg font-black">Total</span>
              <span className="text-2xl font-black">{money(total)}</span>
            </div>
            {!plus && mode === 'delivery' && deliveryFee > 0 && (
              <Link to="/plus" className="mt-3 flex items-center gap-2 rounded-xl bg-sun/20 p-3 text-sm font-bold">
                <Crown className="size-4 text-warn" /> Save {money(deliveryFee)} with Nomly+
                <ChevronRight className="ml-auto size-4" />
              </Link>
            )}
          </div>

          <button onClick={placeOrder} disabled={placing} className="btn-primary w-full py-4 text-base">
            {placing ? (
              <>
                <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Placing order…
              </>
            ) : user ? (
              <>Place order · {money(total)}</>
            ) : (
              'Log in to order'
            )}
          </button>
          <p className="mt-3 text-center text-xs text-ink-3">This is a demo — no real payment is made and no food will arrive. 😉</p>
        </aside>
      </div>
      <AddCardModal open={cardOpen} onClose={() => setCardOpen(false)} />
    </div>
  );
}
