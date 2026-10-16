import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { Layout } from '@/components/Layout';
import Discovery from '@/pages/Discovery';

const Landing = lazy(() => import('@/pages/Landing'));
const Listing = lazy(() => import('@/pages/Listing'));
const Venue = lazy(() => import('@/pages/Venue'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const OrderTracking = lazy(() => import('@/pages/OrderTracking'));
const SearchPage = lazy(() => import('@/pages/Search'));
const Plus = lazy(() => import('@/pages/Plus'));
const Info = lazy(() => import('@/pages/Info'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const ProfileLayout = lazy(() => import('@/pages/Profile').then((m) => ({ default: m.ProfileLayout })));
const Account = lazy(() => import('@/pages/Profile').then((m) => ({ default: m.Account })));
const OrderHistory = lazy(() => import('@/pages/Profile').then((m) => ({ default: m.OrderHistory })));
const Favorites = lazy(() => import('@/pages/Profile').then((m) => ({ default: m.Favorites })));
const Settings = lazy(() => import('@/pages/Profile').then((m) => ({ default: m.Settings })));

function PageLoader() {
  return (
    <div className="container-app grid min-h-[50vh] place-items-center">
      <span className="size-10 animate-spin rounded-full border-4 border-brand-soft border-t-brand-500" aria-label="Loading" />
    </div>
  );
}

const S = ({ children }: { children: ReactNode }) => <Suspense fallback={<PageLoader />}>{children}</Suspense>;

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<S><Landing /></S>} />
          <Route path="discovery" element={<Discovery />} />
          <Route path="restaurants" element={<S><Listing key="r" type="restaurant" /></S>} />
          <Route path="stores" element={<S><Listing key="s" type="store" /></S>} />
          <Route path="venue/:slug" element={<S><Venue /></S>} />
          <Route path="checkout/:slug" element={<S><Checkout /></S>} />
          <Route path="order/:id" element={<S><OrderTracking /></S>} />
          <Route path="search" element={<S><SearchPage /></S>} />
          <Route path="plus" element={<S><Plus /></S>} />
          <Route path="info/:slug" element={<S><Info /></S>} />
          <Route path="me" element={<S><ProfileLayout /></S>}>
            <Route index element={<S><Account /></S>} />
            <Route path="orders" element={<S><OrderHistory /></S>} />
            <Route path="favorites" element={<S><Favorites /></S>} />
            <Route path="settings" element={<S><Settings /></S>} />
          </Route>
          <Route path="*" element={<S><NotFound /></S>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
