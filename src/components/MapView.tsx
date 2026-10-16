import { useEffect, useRef } from 'react';
import L from 'leaflet';
import clsx from 'clsx';
import type { LatLng } from '@/lib/geo';

export interface MapMarker {
  id: string;
  pos: LatLng;
  /** HTML for a custom pin. */
  html: string;
  size?: [number, number];
  onClick?: () => void;
  title?: string;
  z?: number;
}

interface Props {
  center: LatLng;
  zoom?: number;
  markers?: MapMarker[];
  route?: LatLng[];
  routeDone?: number;
  className?: string;
  /** Show a draggable pin in the centre and report its position. */
  pin?: LatLng;
  onPinMove?: (p: LatLng) => void;
  fitTo?: LatLng[];
  interactive?: boolean;
}

// Standard OpenStreetMap tiles; dark mode is done with a CSS filter (see index.css).
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const pinHtml = (emoji: string, bg = '#7B4DFF') =>
  `<div style="display:grid;place-items:center;width:40px;height:40px;border-radius:999px;background:${bg};border:3px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.25);font-size:19px">${emoji}</div>`;

export const dotHtml = (bg = '#7B4DFF') =>
  `<div style="width:18px;height:18px;border-radius:999px;background:${bg};border:3px solid #fff;box-shadow:0 0 0 6px ${bg}33,0 2px 8px rgba(0,0,0,.3)"></div>`;

export function MapView({ center, zoom = 14, markers = [], route, routeDone, className, pin, onPinMove, fitTo, interactive = true }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const pinRef = useRef<L.Marker | null>(null);
  const onPinMoveRef = useRef(onPinMove);
  onPinMoveRef.current = onPinMove;
  const fitRef = useRef(fitTo);
  fitRef.current = fitTo;

  const fit = () => {
    const m = map.current;
    const pts = fitRef.current;
    if (!m || !pts?.length || !el.current?.clientWidth) return;
    if (pts.length === 1) m.setView([pts[0].lat, pts[0].lng], 15);
    else m.fitBounds(L.latLngBounds(pts.map((p) => [p.lat, p.lng])), { padding: [56, 56], maxZoom: 16 });
  };

  // init
  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, {
      center: [center.lat, center.lng],
      zoom,
      zoomControl: false,
      attributionControl: true,
      dragging: interactive,
      scrollWheelZoom: false,
      doubleClickZoom: interactive,
      touchZoom: interactive,
      keyboard: interactive,
    });
    L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(m);
    if (interactive) L.control.zoom({ position: 'bottomright' }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    // The container may have no size yet (lazy pages, modals): re-fit once it does.
    let lastW = 0;
    const ro = new ResizeObserver(() => {
      m.invalidateSize();
      const w = el.current?.clientWidth ?? 0;
      if (w && !lastW) fit();
      lastW = w;
    });
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
      layer.current = null;
      pinRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // recenter
  useEffect(() => {
    if (!map.current || fitTo?.length) return;
    map.current.setView([center.lat, center.lng], map.current.getZoom() || zoom, { animate: true });
  }, [center.lat, center.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  // fit bounds
  const fitKey = fitTo?.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join('|');
  useEffect(() => {
    fit();
  }, [fitKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // markers + route
  useEffect(() => {
    const lg = layer.current;
    if (!lg) return;
    lg.clearLayers();
    if (route && route.length > 1) {
      const all = route.map((p) => [p.lat, p.lng] as [number, number]);
      L.polyline(all, { color: '#7B4DFF', weight: 5, opacity: 0.25, lineCap: 'round' }).addTo(lg);
      if (routeDone !== undefined && routeDone > 0) {
        const n = Math.max(2, Math.round(routeDone * (all.length - 1)) + 1);
        L.polyline(all.slice(0, n), { color: '#7B4DFF', weight: 5, opacity: 0.9, lineCap: 'round' }).addTo(lg);
      }
    }
    for (const mk of markers) {
      const [w, h] = mk.size ?? [40, 40];
      const marker = L.marker([mk.pos.lat, mk.pos.lng], {
        icon: L.divIcon({ html: mk.html, className: 'nomly-pin', iconSize: [w, h], iconAnchor: [w / 2, h / 2] }),
        title: mk.title,
        zIndexOffset: mk.z ?? 0,
        keyboard: !!mk.onClick,
      });
      if (mk.onClick) marker.on('click', mk.onClick);
      if (mk.title) marker.bindTooltip(mk.title, { direction: 'top', offset: [0, -h / 2] });
      marker.addTo(lg);
    }
  }, [markers, route, routeDone]);

  // draggable pin
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (!pin) {
      pinRef.current?.remove();
      pinRef.current = null;
      return;
    }
    if (!pinRef.current) {
      const icon = L.divIcon({
        className: 'nomly-pin',
        html: `<svg width="40" height="52" viewBox="0 0 40 52"><path d="M20 0C9 0 0 9 0 20c0 15 20 32 20 32s20-17 20-32C40 9 31 0 20 0z" fill="#7B4DFF"/><circle cx="20" cy="20" r="8" fill="#fff"/></svg>`,
        iconSize: [40, 52],
        iconAnchor: [20, 52],
      });
      pinRef.current = L.marker([pin.lat, pin.lng], { icon, draggable: true, autoPan: true }).addTo(m);
      pinRef.current.on('dragend', () => {
        const p = pinRef.current!.getLatLng();
        onPinMoveRef.current?.({ lat: p.lat, lng: p.lng });
      });
      m.on('click', (e: L.LeafletMouseEvent) => {
        pinRef.current?.setLatLng(e.latlng);
        onPinMoveRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    } else {
      const cur = pinRef.current.getLatLng();
      if (Math.abs(cur.lat - pin.lat) > 1e-6 || Math.abs(cur.lng - pin.lng) > 1e-6) {
        pinRef.current.setLatLng([pin.lat, pin.lng]);
        m.panTo([pin.lat, pin.lng]);
      }
    }
  }, [pin?.lat, pin?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={el} className={clsx('isolate z-0 overflow-hidden', className)} />;
}
