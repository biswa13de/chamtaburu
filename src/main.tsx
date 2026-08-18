import { ViteReactSSG } from 'vite-react-ssg';
import type { RouteRecord } from 'vite-react-ssg';
import Layout from './Layout';
import { Home } from './components/pages/Home';
import { Cottages } from './components/pages/Cottages';
import { CottageDetail } from './components/pages/CottageDetail';
import { Experiences } from './components/pages/Experiences';
import { GalleryPage } from './components/pages/GalleryPage';
import { Accommodation } from './components/pages/Accommodation';
import { Contact } from './components/pages/Contact';
import { Legal } from './components/pages/Legal';
import { NotFound } from './components/pages/NotFound';
import { cottages } from './content/village';
import './index.css';

/**
 * Route tree is site-specific (docs/01-strategy.md §5): Village and Resort
 * are two different sites built from the same codebase, selected at build
 * time via VITE_SITE (see vite.config.ts's `define: { __SITE__ }` and
 * src/content/site.ts). Each build only ever registers ONE of these trees —
 * the Resort build never gets /cottages/* routes, since the Resort has no
 * cottages.
 */
const VILLAGE_ROUTES: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'cottages', element: <Cottages /> },
      {
        path: 'cottages/:slug',
        element: <CottageDetail />,
        // vite-react-ssg only prerenders dynamic routes it's told about —
        // without this, `cottages/:slug` would be skipped entirely and
        // /cottages/shal-shanti etc. would 404 as static files. All seven
        // frozen slugs (docs/03-content-model.md §3.1) are prerendered,
        // including `available: false` ones — they're "opening soon" pages,
        // not hidden.
        getStaticPaths: () => cottages.map((cottage) => `cottages/${cottage.slug}`),
      },
      { path: 'experiences', element: <Experiences /> },
      { path: 'gallery', element: <GalleryPage /> },
      { path: 'contact', element: <Contact /> },
      { path: 'legal', element: <Legal /> },
      { path: '404', element: <NotFound /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];

const RESORT_ROUTES: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'accommodation', element: <Accommodation /> },
      { path: 'contact', element: <Contact /> },
      { path: 'legal', element: <Legal /> },
      { path: '404', element: <NotFound /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];

export const routes: RouteRecord[] = __SITE__ === 'resort' ? RESORT_ROUTES : VILLAGE_ROUTES;

export const createRoot = ViteReactSSG({ routes });
