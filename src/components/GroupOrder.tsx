import { useEffect } from 'react';
import { Copy, Users, X } from 'lucide-react';
import type { GroupOrder, MenuItem, SelectedOption, Venue } from '@/types';
import { useCart } from '@/store/cart';
import { toast } from '@/store/ui';
import { getVenueById } from '@/data/venues';
import { getMenu } from '@/data/menus';
import { seeded } from '@/lib/random';

type GroupEvent = { at: number; guest: string } & ({ type: 'join' } | { type: 'add'; item: MenuItem; qty: number });

function defaultOptions(item: MenuItem): SelectedOption[] {
  return (item.options ?? [])
    .filter((g) => g.min > 0)
    .map((g) => ({ groupId: g.id, groupName: g.name, choiceId: g.choices[0].id, choiceName: g.choices[0].name, price: g.choices[0].price }));
}

/** Deterministic script of what the simulated friends do, in seconds after the group was created. */
function script(group: GroupOrder, venue: Venue): GroupEvent[] {
  const r = seeded(`${group.code}-${venue.id}`);
  const items = getMenu(venue)
    .filter((s) => !s.id.endsWith('-popular'))
    .flatMap((s) => s.items)
    .filter((i) => !i.tags?.includes('age-18'));
  const events: GroupEvent[] = [];
  group.guests.forEach((g, i) => {
    const join = 5 + i * 8 + r.int(0, 3);
    events.push({ at: join, guest: g.name, type: 'join' });
    const n = r.int(1, 2);
    for (let k = 0; k < n; k++) events.push({ at: join + 3 + k * 4, guest: g.name, type: 'add', item: r.pick(items), qty: r.chance(0.2) ? 2 : 1 });
  });
  return events.sort((a, b) => a.at - b.at);
}

/** Runs the friends' actions for every open group order (mounted once in the layout). */
export function GroupSimulator() {
  const groups = useCart((s) => s.groups);
  const active = Object.keys(groups).length > 0;
  useEffect(() => {
    if (!active) return;
    const tick = () => {
      const { groups: gs, add, patchGroup } = useCart.getState();
      for (const [venueId, g] of Object.entries(gs)) {
        const venue = getVenueById(venueId);
        if (!venue) continue;
        const events = script(g, venue);
        const elapsed = (Date.now() - g.createdAt) / 1000;
        let step = g.step;
        let joined = g.joined;
        while (step < events.length && events[step].at <= elapsed) {
          const e = events[step];
          if (e.type === 'join') {
            joined = [...joined, e.guest];
            toast(`👋 ${e.guest} joined your group order`);
          } else {
            add(venueId, {
              itemId: e.item.id,
              name: e.item.name,
              image: e.item.image,
              basePrice: e.item.price,
              options: defaultOptions(e.item),
              quantity: e.qty,
              by: e.guest,
            });
            toast(`${e.guest} added ${e.qty > 1 ? `${e.qty} × ` : ''}${e.item.name}`);
          }
          step++;
        }
        if (step !== g.step) patchGroup(venueId, { step, joined });
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [active]);
  return null;
}

export function GuestChip({ name }: { name: string }) {
  const groups = useCart((s) => s.groups);
  const color = Object.values(groups).flatMap((g) => g.guests).find((g) => g.name === name)?.color ?? '#7B4DFF';
  return (
    <span className="inline-flex items-center gap-1 rounded-full py-0.5 pr-2 pl-0.5 text-[11px] font-extrabold text-white" style={{ background: color }}>
      <span className="grid size-4 place-items-center rounded-full bg-white/25 text-[9px]">{name[0]}</span>
      {name}
    </span>
  );
}

export function GroupBanner({ venue }: { venue: Venue }) {
  const group = useCart((s) => s.groups[venue.id]);
  const startGroup = useCart((s) => s.startGroup);
  const endGroup = useCart((s) => s.endGroup);

  if (!group)
    return (
      <button
        onClick={() => {
          startGroup(venue.id);
          toast('Group order started — invite friends with the link 🔗');
        }}
        className="chip"
      >
        <Users className="size-4" /> Order together
      </button>
    );

  const link = `${window.location.origin}${import.meta.env.BASE_URL}venue/${venue.slug}?group=${group.code}`;
  const waiting = group.guests.filter((g) => !group.joined.includes(g.name));
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-soft p-4 sm:flex-row sm:items-center">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-500 text-white">
        <Users className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-extrabold">
          Group order <span className="ml-1 rounded-md bg-surface px-1.5 py-0.5 font-mono text-xs">{group.code}</span>
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-ink-2">
          <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-extrabold text-white">You (host)</span>
          {group.joined.map((n) => (
            <GuestChip key={n} name={n} />
          ))}
          {waiting.length > 0 && <span className="animate-pulse">Waiting for friends to join…</span>}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link);
            } catch {
              /* clipboard unavailable */
            }
            toast('Invite link copied');
          }}
          className="btn-primary px-3.5 py-2 text-sm"
        >
          <Copy className="size-4" /> Invite link
        </button>
        <button
          onClick={() => {
            endGroup(venue.id);
            toast('Group order ended');
          }}
          className="btn-ghost px-3 py-2 text-sm"
          aria-label="End group order"
        >
          <X className="size-4" /> End
        </button>
      </div>
    </div>
  );
}
