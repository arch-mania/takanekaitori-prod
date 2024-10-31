import { Outlet, useLoaderData, useParams, useNavigation } from '@remix-run/react';
import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { contentfulClient } from '~/lib/contentful.server';
import { Header } from '~/components/layouts/Header';
import { Footer } from '~/components/layouts/Footer';
import { useState, useEffect } from 'react';
import { ErrorPage } from '~/components/parts/ErrorPage';

interface Area {
  id: string;
  name: string;
  order: number;
  slug: string;
}

interface LoaderData {
  areas: Area[];
}

const useNavigationVisibility = () => {
  const navigation = useNavigation();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const isNavigating = navigation.state === 'submitting' || navigation.state === 'loading';

    if (isNavigating) {
      setIsVisible(false);
    } else {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [navigation.state]);

  return {
    isVisible,
    isNavigating: navigation.state === 'submitting' || navigation.state === 'loading',
  };
};

const useScrollHeader = () => {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      const isScrollingUp = currentScrollY < lastScrollY;

      if (currentScrollY < 50) {
        setIsHeaderVisible(true);
      } else if (isScrollingUp) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsHeaderVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return isHeaderVisible;
};

const LoadingSpinner = () => (
  <div className="fixed inset-0 top-[55px] z-50 flex items-center justify-center bg-white/80 md:top-[76px]">
    <div className="space-y-4 text-center">
      <div className="relative mx-auto size-12">
        <div className="absolute size-full animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
      <p className="text-lg text-muted-foreground">読み込み中...</p>
    </div>
  </div>
);

const fetchAreas = async (): Promise<Area[]> => {
  const entries = await contentfulClient.getEntries({
    content_type: 'area',
    order: ['fields.order'],
  });

  return entries.items.map((item) => ({
    id: item.sys.id,
    name: String(item.fields.name || ''),
    order: Number(item.fields.order) || 0,
    slug: String(item.fields.slug || ''),
  }));
};

export const loader: LoaderFunction = async () => {
  try {
    const areas = await fetchAreas();
    return json<LoaderData>({ areas });
  } catch (error) {
    console.error('Contentful fetch error:', error);
    throw error;
  }
};

export default function Layout() {
  const { areas } = useLoaderData<LoaderData>();
  const params = useParams();
  const { isVisible, isNavigating } = useNavigationVisibility();
  const isHeaderVisible = useScrollHeader();

  const currentArea = areas.find((area) => area.slug === params.areaSlug) || areas[0];

  return (
    <div className="relative min-h-screen">
      <div
        className={`fixed top-0 z-50 w-full transition-transform duration-300 ${
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <Header areas={areas} />
      </div>
      <div className="pt-[55px] md:pt-[76px]">
        {isNavigating && <LoadingSpinner />}
        <main
          className={`transition-opacity duration-300 ease-in-out ${
            isVisible ? 'opacity-100' : 'opacity-50'
          }`}
        >
          <Outlet context={{ selectedArea: currentArea.id }} />
        </main>
        <Footer currentAreaSlug={currentArea.slug} />
      </div>
    </div>
  );
}
