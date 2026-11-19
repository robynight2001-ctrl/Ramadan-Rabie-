import {useCallback, useEffect, useRef, useState} from 'react';
import {fetchPublicPortfolio} from './lib/api.ts';
import {PortfolioPage} from './pages/PortfolioPage.tsx';
import {SettingsPage} from './pages/SettingsPage.tsx';
import type {PortfolioData} from './types/portfolio.ts';

export default function App() {
  const [pathname, setPathname] = useState<string>(() => window.location.pathname);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [error, setError] = useState('');
  const currentVersionRef = useRef<number | undefined>(undefined);

  const loadPortfolio = useCallback(async () => {
    try {
      const data = await fetchPublicPortfolio();
      currentVersionRef.current = data.publishedVersion;
      setPortfolio(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load portfolio.');
    }
  }, []);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  // Real-time cross-device synchronization via SSE + window focus revalidation
  useEffect(() => {
    if (pathname.startsWith('/settings')) return;

    const es = new EventSource('/api/portfolio/events');
    const handleVersion = (ev: MessageEvent) => {
      try {
        const parsed = JSON.parse(ev.data) as {publishedVersion?: number};
        if (
          typeof parsed.publishedVersion === 'number' &&
          currentVersionRef.current !== undefined &&
          parsed.publishedVersion !== currentVersionRef.current
        ) {
          loadPortfolio();
        }
      } catch {
        // ignore parse error
      }
    };

    es.addEventListener('published', () => {
      loadPortfolio();
    });
    es.addEventListener('version', handleVersion);

    const onVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        loadPortfolio();
      }
    };

    window.addEventListener('focus', onVisibilityOrFocus);
    document.addEventListener('visibilitychange', onVisibilityOrFocus);

    return () => {
      es.close();
      window.removeEventListener('focus', onVisibilityOrFocus);
      document.removeEventListener('visibilitychange', onVisibilityOrFocus);
    };
  }, [pathname, loadPortfolio]);

  useEffect(() => {
    const onPopState = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Sync document title and meta description from published CMS General Settings
  useEffect(() => {
    if (!portfolio) return;
    if (pathname.startsWith('/settings')) {
      document.title = `Settings — ${portfolio.profile.name}`;
      return;
    }
    if (portfolio.general.siteTitle) {
      document.title = portfolio.general.siteTitle;
    }
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta && portfolio.general.siteDescription) {
      descMeta.setAttribute('content', portfolio.general.siteDescription);
    }
  }, [portfolio, pathname]);

  const navigate = useCallback(
    (targetPath: string) => {
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
        setPathname(targetPath);
        window.scrollTo({top: 0, behavior: 'auto'});
      }
      if (targetPath === '/') {
        loadPortfolio();
      }
    },
    [loadPortfolio]
  );

  if (pathname.startsWith('/settings')) {
    return (
      <SettingsPage
        onNavigateHome={() => navigate('/')}
        onPortfolioChanged={loadPortfolio}
      />
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#08090D] px-6 text-center text-[#F5F5F7]">
        <p className="font-display text-xl font-semibold">Failed to load portfolio</p>
        <p className="mt-2 text-sm text-[#9CA3AF]">{error}</p>
        <button
          type="button"
          onClick={loadPortfolio}
          className="mt-6 rounded-xl bg-[#8B5CF6] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08090D]">
        <div className="h-8 w-8 rounded-full border-2 border-[#8B5CF6] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <PortfolioPage
      data={portfolio}
      onNavigateSettings={() => navigate('/settings')}
    />
  );
}
