import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import clsx from 'clsx';
import { X, Leaf, Flame, Sparkles, WheatOff, Sprout, ShieldAlert } from 'lucide-react';
import type { ItemTag } from '@/types';
import { useUI } from '@/store/ui';

export function Logo({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <Link to="/discovery" aria-label="Nomly home" className={clsx('inline-flex items-center gap-1.5 select-none', className)}>
      <span className="relative grid size-8 place-items-center rounded-[10px] bg-brand-500 text-white shadow-sm">
        <svg viewBox="0 0 64 64" className="size-6" aria-hidden>
          <path
            d="M18 46V22.5c0-1.4 1.1-2.5 2.5-2.5h.6c.9 0 1.7.5 2.2 1.2L41 43V22.5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5V45.5c0 1.4-1.1 2.5-2.5 2.5h-.6c-.9 0-1.7-.5-2.2-1.2L23 25v21c0 1.4-1.1 2.5-2.5 2.5S18 47.4 18 46z"
            fill="currentColor"
          />
        </svg>
        <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-sun ring-2 ring-bg" />
      </span>
      <span className={clsx('text-[26px] leading-none font-black tracking-tight', onDark ? 'text-white' : 'text-ink')}>
        nomly
      </span>
    </Link>
  );
}

function useBodyLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}

function useEscape(active: boolean, onClose: () => void) {
  const ref = useRef(onClose);
  ref.current = onClose;
  useEffect(() => {
    if (!active) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && ref.current();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [active]);
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  label?: string;
  /** Hide the default close button (when the content provides its own). */
  bare?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/** Centered dialog on desktop, bottom sheet on mobile. */
export function Modal({ open, onClose, children, className, label, bare, size = 'md' }: ModalProps) {
  useBodyLock(open);
  useEscape(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal aria-label={label}>
      <div className="absolute inset-0 animate-fade-in bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={clsx(
          'relative flex max-h-[92dvh] w-full animate-slide-up flex-col overflow-hidden rounded-t-3xl bg-surface shadow-pop sm:rounded-3xl',
          size === 'sm' && 'sm:max-w-md',
          size === 'md' && 'sm:max-w-xl',
          size === 'lg' && 'sm:max-w-3xl',
          className,
        )}
      >
        {!bare && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 z-10 grid size-10 place-items-center rounded-full bg-muted text-ink transition-colors hover:bg-muted-2"
          >
            <X className="size-5" />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: ReactNode; label?: string }) {
  useBodyLock(open);
  useEscape(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[1000]" role="dialog" aria-modal aria-label={label}>
      <div className="absolute inset-0 animate-fade-in bg-black/50" onClick={onClose} />
      <aside className="absolute top-0 right-0 flex h-full w-full max-w-md animate-slide-left flex-col bg-surface shadow-pop">
        {children}
      </aside>
    </div>,
    document.body,
  );
}

export function CloseButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label="Close"
      className={clsx('grid size-10 place-items-center rounded-full bg-muted text-ink transition-colors hover:bg-muted-2', className)}
    >
      <X className="size-5" />
    </button>
  );
}

export function Toaster() {
  const toasts = useUI((s) => s.toasts);
  const dismiss = useUI((s) => s.dismissToast);
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[1100] flex flex-col items-center gap-2 px-4 sm:bottom-8">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={clsx(
            'pointer-events-auto flex animate-slide-up items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-pop',
            t.tone === 'error' ? 'bg-bad' : t.tone === 'success' ? 'bg-good' : 'bg-[#1f1d26] dark:bg-[#33313b]',
          )}
        >
          <span>{t.message}</span>
          {t.action && (
            <button
              className="rounded-lg bg-white/15 px-2.5 py-1 text-white hover:bg-white/25"
              onClick={() => {
                t.action!.onClick();
                dismiss(t.id);
              }}
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>,
    document.body,
  );
}

const TAG_META: Record<ItemTag, { label: string; icon: typeof Leaf; cls: string }> = {
  vegan: { label: 'Vegan', icon: Sprout, cls: 'text-good' },
  vegetarian: { label: 'Vegetarian', icon: Leaf, cls: 'text-good' },
  spicy: { label: 'Spicy', icon: Flame, cls: 'text-bad' },
  'gluten-free': { label: 'Gluten-free', icon: WheatOff, cls: 'text-warn' },
  new: { label: 'New', icon: Sparkles, cls: 'text-brand-500' },
  'age-18': { label: '18+', icon: ShieldAlert, cls: 'text-bad' },
};

export function ItemTags({ tags, withLabel = false }: { tags?: ItemTag[]; withLabel?: boolean }) {
  if (!tags?.length) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {tags.map((t) => {
        const m = TAG_META[t];
        const Icon = m.icon;
        return (
          <span key={t} title={m.label} className={clsx('inline-flex items-center gap-0.5 text-xs font-bold', m.cls)}>
            <Icon className="size-3.5" />
            {withLabel && m.label}
          </span>
        );
      })}
    </span>
  );
}

/** Rating on a 10-point scale with a face, like the original app. */
export function Rating({ value, count, className }: { value: number; count?: number; className?: string }) {
  const face = value >= 9 ? '😍' : value >= 8 ? '🙂' : value >= 7 ? '😐' : '🙁';
  return (
    <span className={clsx('inline-flex items-center gap-1', className)}>
      <span aria-hidden className="text-[0.95em] leading-none">{face}</span>
      <span className="font-bold">{value.toFixed(1)}</span>
      {count !== undefined && <span className="text-ink-3">({count > 999 ? `${(count / 1000).toFixed(1)}k` : count})</span>}
    </span>
  );
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  size = 'md',
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
}) {
  const btn = clsx(
    'grid place-items-center rounded-full bg-brand-soft text-brand-600 transition-colors hover:bg-brand-100 disabled:opacity-40 dark:text-brand-300 dark:hover:bg-brand-500/30',
    size === 'sm' ? 'size-8 text-lg' : 'size-11 text-xl',
  );
  return (
    <div className="inline-flex items-center gap-2">
      <button className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Decrease">
        −
      </button>
      <span className={clsx('min-w-6 text-center font-extrabold tabular-nums', size === 'sm' ? 'text-sm' : 'text-lg')}>{value}</span>
      <button className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase">
        +
      </button>
    </div>
  );
}

export function EmptyState({
  emoji,
  title,
  text,
  action,
}: {
  emoji: string;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-4 grid size-24 place-items-center rounded-full bg-brand-soft text-5xl">{emoji}</div>
      <h3 className="text-xl font-extrabold">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-ink-2">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Img({
  src,
  alt,
  className,
  eager,
}: {
  src?: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  return (
    <span className={clsx('block overflow-hidden bg-muted', className)}>
      {src && (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="size-full object-cover opacity-0 transition-opacity duration-500"
          onLoad={(e) => e.currentTarget.classList.remove('opacity-0')}
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      )}
    </span>
  );
}

export function SectionTitle({ title, action, subtitle }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-[22px] font-black tracking-tight sm:text-2xl">{title}</h2>
        {subtitle && <p className="text-sm text-ink-2">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={clsx('inline-flex rounded-full bg-muted p-1', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'flex-1 rounded-full px-4 py-2 text-sm font-bold transition-all',
            value === o.value ? 'bg-surface text-ink shadow-card' : 'text-ink-2 hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
