import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { ArrowLeft, Briefcase, Check, House, LocateFixed, MapPin, Plus, Trash2 } from 'lucide-react';
import type { Address } from '@/types';
import { Modal, Segmented } from './ui';
import { MapView } from './MapView';
import { useUI, toast } from '@/store/ui';
import { usePrefs } from '@/store/prefs';
import { useAuth } from '@/store/auth';
import { CITIES, getCity } from '@/data/cities';
import { distanceKm, type LatLng } from '@/lib/geo';
import { uid } from '@/lib/random';

const LABEL_ICON = { Home: House, Work: Briefcase, Other: MapPin };

export function AddressForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Partial<Address> & { cityId: string; lat: number; lng: number };
  onSave: (a: Address) => void;
  onCancel?: () => void;
}) {
  const [street, setStreet] = useState(initial.street ?? '');
  const [details, setDetails] = useState(initial.details ?? '');
  const [label, setLabel] = useState<Address['label']>(initial.label ?? 'Home');
  const [instructions, setInstructions] = useState(initial.instructions ?? '');
  const [pos, setPos] = useState<LatLng>({ lat: initial.lat, lng: initial.lng });
  const [touched, setTouched] = useState(false);
  const city = getCity(initial.cityId);
  const far = distanceKm(pos, city) > 12;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (street.trim().length < 3 || far) return;
        onSave({
          id: initial.id ?? uid('a_'),
          label,
          street: street.trim(),
          details: details.trim() || undefined,
          instructions: instructions.trim() || undefined,
          cityId: initial.cityId,
          lat: pos.lat,
          lng: pos.lng,
        });
      }}
      className="space-y-4"
    >
      <div className="relative">
        <MapView center={pos} pin={pos} onPinMove={setPos} zoom={15} className="h-52 rounded-2xl sm:h-60" />
        <p className="pointer-events-none absolute top-2 left-1/2 z-[400] -translate-x-1/2 rounded-full bg-surface/95 px-3 py-1 text-xs font-bold shadow-card">
          Drag the pin or tap the map
        </p>
      </div>
      {far && <p className="text-sm font-semibold text-bad">That spot is outside our {city.name} delivery area. Move the pin closer to the city.</p>}
      <div>
        <label className="mb-1.5 block text-sm font-bold" htmlFor="addr-street">
          Street and number
        </label>
        <input
          id="addr-street"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          placeholder={`${city.streets[0]} 12`}
          className="input"
          autoComplete="street-address"
        />
        {touched && street.trim().length < 3 && <p className="mt-1 text-sm font-semibold text-bad">Please enter your street address.</p>}
      </div>
      <div className="grid gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-bold" htmlFor="addr-details">
            Apartment, floor, door code
          </label>
          <input id="addr-details" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Apt 4B, 3rd floor" className="input" />
        </div>
        <div>
          <span className="mb-1.5 block text-sm font-bold">Label</span>
          <Segmented
            value={label}
            onChange={setLabel}
            className="w-full"
            options={(['Home', 'Work', 'Other'] as const).map((l) => {
              const Icon = LABEL_ICON[l];
              return { value: l, label: <span className="inline-flex items-center gap-1.5"><Icon className="size-4" />{l}</span> };
            })}
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-bold" htmlFor="addr-instr">
          Instructions for the courier
        </label>
        <textarea
          id="addr-instr"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={2}
          placeholder="e.g. Ring the doorbell twice, leave at the door"
          className="input resize-none"
        />
      </div>
      <div className="flex gap-3 pt-1">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost flex-1">
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary flex-[2]">
          Save address
        </button>
      </div>
    </form>
  );
}

export function AddressModal() {
  const open = useUI((s) => s.addressOpen);
  const close = useUI((s) => s.closeAddress);
  const cityId = usePrefs((s) => s.cityId);
  const current = usePrefs((s) => s.address);
  const setCity = usePrefs((s) => s.setCity);
  const setAddress = usePrefs((s) => s.setAddress);
  const user = useAuth((s) => s.user);
  const saved = useAuth((s) => s.addresses);
  const saveAddress = useAuth((s) => s.saveAddress);
  const removeAddress = useAuth((s) => s.removeAddress);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [draft, setDraft] = useState<(Partial<Address> & { cityId: string; lat: number; lng: number }) | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (open) setView('list');
  }, [open]);

  const city = getCity(cityId);
  const list = user ? saved : current ? [current] : [];

  const startNew = (p?: LatLng, cid = cityId) => {
    const c = getCity(cid);
    setDraft({ cityId: cid, lat: p?.lat ?? c.lat + 0.002, lng: p?.lng ?? c.lng - 0.003 });
    setView('form');
  };

  const locate = () => {
    if (!navigator.geolocation) return toast('Location is not available in this browser', { tone: 'error' });
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const nearest = [...CITIES].sort((a, b) => distanceKm(here, a) - distanceKm(here, b))[0];
        if (distanceKm(here, nearest) > 30) {
          toast(`Nomly isn’t in your area yet. Pick one of our ${CITIES.length} cities.`, { tone: 'error' });
          return;
        }
        startNew(here, nearest.id);
      },
      () => {
        setLocating(false);
        toast('Couldn’t get your location', { tone: 'error' });
      },
      { timeout: 8000 },
    );
  };

  const choose = (a: Address) => {
    setAddress(a);
    toast(`Delivering to ${a.street}`);
    close();
  };

  return (
    <Modal open={open} onClose={close} label="Delivery address" size="md">
      <div className="overflow-x-hidden overflow-y-auto p-6 pt-5 sm:p-8 sm:pt-6">
        {view === 'list' ? (
          <>
            <h2 className="pr-12 text-[26px] font-black tracking-tight">Where should we deliver?</h2>
            <p className="mt-1 text-ink-2">Choose a city and an address to see what’s available near you.</p>

            <p className="mt-6 mb-2 text-sm font-extrabold">City</p>
            <div className="flex flex-wrap gap-2">
              {CITIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCity(c.id)}
                  className={clsx('chip', c.id === cityId && 'chip-active')}
                >
                  {c.name}
                  <span className="text-xs opacity-60">{c.countryCode}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-2">
              <button onClick={locate} disabled={locating} className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-muted">
                <span className="grid size-11 place-items-center rounded-full bg-brand-soft text-brand-600 dark:text-brand-300">
                  <LocateFixed className={clsx('size-5', locating && 'animate-spin')} />
                </span>
                <span>
                  <span className="block font-bold">{locating ? 'Locating…' : 'Use my current location'}</span>
                  <span className="block text-sm text-ink-2">Uses your browser’s location</span>
                </span>
              </button>

              <button
                onClick={() => {
                  setAddress(null);
                  close();
                }}
                className={clsx('flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-muted', !current && 'bg-brand-soft')}
              >
                <span className="grid size-11 place-items-center rounded-full bg-muted text-ink">
                  <MapPin className="size-5" />
                </span>
                <span className="flex-1">
                  <span className="block font-bold">{city.name} city centre</span>
                  <span className="block text-sm text-ink-2">Browse without a specific address</span>
                </span>
                {!current && <Check className="size-5 text-brand-500" />}
              </button>

              {list.map((a) => {
                const Icon = LABEL_ICON[a.label];
                const selected = current?.id === a.id;
                return (
                  <div key={a.id} className={clsx('flex items-center gap-1 rounded-2xl transition-colors hover:bg-muted', selected && 'bg-brand-soft hover:bg-brand-soft')}>
                    <button onClick={() => choose(a)} className="flex flex-1 items-center gap-3 p-3 text-left">
                      <span className="grid size-11 place-items-center rounded-full bg-muted text-ink">
                        <Icon className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold">{a.street}</span>
                        <span className="block truncate text-sm text-ink-2">
                          {a.label} · {getCity(a.cityId).name}
                          {a.details ? ` · ${a.details}` : ''}
                        </span>
                      </span>
                      {selected && <Check className="size-5 text-brand-500" />}
                    </button>
                    {user && (
                      <button
                        onClick={() => {
                          removeAddress(a.id);
                          if (selected) setAddress(null);
                        }}
                        aria-label={`Delete ${a.street}`}
                        className="mr-2 grid size-9 place-items-center rounded-full text-ink-3 hover:bg-muted-2 hover:text-bad"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <button onClick={() => startNew()} className="btn-soft mt-5 w-full">
              <Plus className="size-5" /> Add new address
            </button>
            {!user && <p className="mt-3 text-center text-xs text-ink-3">Log in to save multiple addresses.</p>}
          </>
        ) : (
          draft && (
            <>
              <div className="mb-5 flex items-center gap-3 pr-12">
                <button onClick={() => setView('list')} className="grid size-10 place-items-center rounded-full bg-muted hover:bg-muted-2" aria-label="Back">
                  <ArrowLeft className="size-5" />
                </button>
                <h2 className="text-2xl font-black tracking-tight">New address in {getCity(draft.cityId).name}</h2>
              </div>
              <AddressForm
                initial={draft}
                onCancel={() => setView('list')}
                onSave={(a) => {
                  if (user) saveAddress(a);
                  choose(a);
                }}
              />
            </>
          )
        )}
      </div>
    </Modal>
  );
}
