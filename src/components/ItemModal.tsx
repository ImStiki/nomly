import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Check, ShieldAlert } from 'lucide-react';
import type { MenuItem, SelectedOption, Venue } from '@/types';
import { Modal, Img, ItemTags, Stepper } from './ui';
import { useCart } from '@/store/cart';
import { toast, useUI } from '@/store/ui';
import { imgUrl } from '@/lib/img';
import { money } from '@/lib/format';

export function ItemModal({ venue, item, onClose }: { venue: Venue; item: MenuItem | null; onClose: () => void }) {
  const add = useCart((s) => s.add);
  const openCart = useUI((s) => s.openCart);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (!item) return;
    setQty(1);
    setNote('');
    setTried(false);
    // preselect the first choice of required single-choice groups
    const init: Record<string, string[]> = {};
    for (const g of item.options ?? []) init[g.id] = g.min === 1 && g.max === 1 ? [g.choices[0].id] : [];
    setPicked(init);
  }, [item]);

  const selected: SelectedOption[] = useMemo(() => {
    if (!item?.options) return [];
    return item.options.flatMap((g) =>
      (picked[g.id] ?? []).map((cid) => {
        const c = g.choices.find((x) => x.id === cid)!;
        return { groupId: g.id, groupName: g.name, choiceId: c.id, choiceName: c.name, price: c.price };
      }),
    );
  }, [item, picked]);

  if (!item) return null;

  const missing = (item.options ?? []).filter((g) => (picked[g.id]?.length ?? 0) < g.min);
  const unit = item.price + selected.reduce((s, o) => s + o.price, 0);
  const total = unit * qty;

  const toggle = (gid: string, cid: string, max: number) =>
    setPicked((p) => {
      const cur = p[gid] ?? [];
      if (max === 1) return { ...p, [gid]: [cid] };
      if (cur.includes(cid)) return { ...p, [gid]: cur.filter((x) => x !== cid) };
      if (cur.length >= max) return p;
      return { ...p, [gid]: [...cur, cid] };
    });

  const submit = () => {
    setTried(true);
    if (missing.length) return;
    add(venue.id, {
      itemId: item.id,
      name: item.name,
      image: item.image,
      basePrice: item.price,
      options: selected,
      quantity: qty,
      note: note.trim() || undefined,
    });
    toast(`Added ${qty} × ${item.name}`, { action: { label: 'View', onClick: () => openCart(venue.id) } });
    onClose();
  };

  return (
    <Modal open onClose={onClose} label={item.name} size="md">
      <div className="overflow-y-auto">
        {item.image ? (
          <Img src={imgUrl(item.image, 900, 560)} alt={item.name} className="aspect-[16/10] w-full" eager />
        ) : (
          <div className="h-16" />
        )}
        <div className="p-6 pb-4">
          <h2 className="text-[26px] leading-tight font-black tracking-tight">{item.name}</h2>
          <p className="mt-1 flex items-baseline gap-2 text-lg font-extrabold text-brand-600 dark:text-brand-300">
            {money(item.price)}
            {item.originalPrice && <span className="text-base font-semibold text-ink-3 line-through">{money(item.originalPrice)}</span>}
            {item.unit && <span className="text-sm font-semibold text-ink-2">· {item.unit}</span>}
          </p>
          <p className="mt-3 text-ink-2">{item.description}</p>
          {item.tags && (
            <div className="mt-3">
              <ItemTags tags={item.tags} withLabel />
            </div>
          )}
          {item.tags?.includes('age-18') && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-bad/10 p-3 text-sm font-semibold text-bad">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" /> Age-restricted product. The courier will check your ID on delivery.
            </p>
          )}
        </div>

        {(item.options ?? []).map((g) => {
          const chosen = picked[g.id] ?? [];
          const bad = tried && chosen.length < g.min;
          const single = g.max === 1;
          return (
            <fieldset key={g.id} className="border-t-8 border-muted px-6 py-4">
              <legend className="sr-only">{g.name}</legend>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-lg font-extrabold">{g.name}</p>
                  <p className={clsx('text-sm', bad ? 'font-bold text-bad' : 'text-ink-2')}>
                    {g.min > 0 ? (single ? 'Choose 1' : `Choose ${g.min}–${g.max}`) : single ? 'Optional' : `Optional · up to ${g.max}`}
                  </p>
                </div>
                {g.min > 0 && (
                  <span className={clsx('rounded-full px-2.5 py-1 text-xs font-extrabold', bad ? 'bg-bad text-white' : 'bg-muted text-ink-2')}>Required</span>
                )}
              </div>
              {g.choices.map((c) => {
                const on = chosen.includes(c.id);
                const disabled = !on && !single && chosen.length >= g.max;
                return (
                  <label
                    key={c.id}
                    className={clsx('flex cursor-pointer items-center gap-3 border-b border-line py-3 last:border-0', disabled && 'cursor-not-allowed opacity-50')}
                  >
                    <input
                      type={single ? 'radio' : 'checkbox'}
                      name={g.id}
                      checked={on}
                      disabled={disabled}
                      onChange={() => toggle(g.id, c.id, g.max)}
                      className="sr-only"
                    />
                    <span
                      className={clsx(
                        'grid size-6 shrink-0 place-items-center border-2 transition-colors',
                        single ? 'rounded-full' : 'rounded-md',
                        on ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-3',
                      )}
                    >
                      {on && (single ? <span className="size-2.5 rounded-full bg-white" /> : <Check className="size-4" strokeWidth={3} />)}
                    </span>
                    <span className="flex-1 font-semibold">{c.name}</span>
                    {c.price > 0 && <span className="text-sm text-ink-2">+{money(c.price)}</span>}
                  </label>
                );
              })}
            </fieldset>
          );
        })}

        {venue.type === 'restaurant' && (
          <div className="border-t-8 border-muted px-6 py-4">
            <label htmlFor="item-note" className="text-lg font-extrabold">
              Special requests
            </label>
            <textarea
              id="item-note"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 140))}
              rows={2}
              placeholder="Allergies, no onions, extra sauce…"
              className="input mt-2 resize-none"
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 border-t border-line bg-surface p-4">
        <Stepper value={qty} onChange={setQty} min={1} />
        <button onClick={submit} className="btn-primary flex-1 justify-between">
          <span>Add to order</span>
          <span>{money(total)}</span>
        </button>
      </div>
    </Modal>
  );
}
