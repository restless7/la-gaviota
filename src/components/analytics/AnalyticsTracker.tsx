'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function getOrGenerateUUID(storage: Storage, key: string): string {
  try {
    let val = storage.getItem(key);
    if (!val) {
      val = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'lg-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now();
      storage.setItem(key, val);
    }
    return val;
  } catch {
    return 'fallback-' + Date.now();
  }
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const startTimeRef = useRef<number>(0);
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (startTimeRef.current === 0) {
      startTimeRef.current = Date.now();
    }
  }, []);

  useEffect(() => {
    // Never track admin panel or internal API calls
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api')) {
      return;
    }

    const currentStartTime = startTimeRef.current || Date.now();
    const visitorId = getOrGenerateUUID(window.localStorage, 'lg_visitor_id');
    const sessionId = getOrGenerateUUID(window.sessionStorage, 'lg_session_id');

    // Send beacon for current page
    const payload = {
      pathname,
      referrer: document.referrer || '',
      visitorId,
      sessionId,
      duration: Math.round((Date.now() - currentStartTime) / 1000),
      utmSource: searchParams?.get('utm_source') || null,
      utmMedium: searchParams?.get('utm_medium') || null,
      utmCampaign: searchParams?.get('utm_campaign') || null,
    };

    try {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/collect', blob);
      } else {
        fetch('/api/analytics/collect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // safe fallback
    }

    prevPathRef.current = pathname;
    startTimeRef.current = Date.now();

    const handleBeforeUnload = () => {
      try {
        const exitStartTime = startTimeRef.current || Date.now();
        const exitPayload = {
          pathname,
          referrer: document.referrer || '',
          visitorId,
          sessionId,
          duration: Math.max(1, Math.round((Date.now() - exitStartTime) / 1000)),
        };
        const blob = new Blob([JSON.stringify(exitPayload)], { type: 'application/json' });
        navigator.sendBeacon('/api/analytics/collect', blob);
      } catch {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pathname, searchParams]);

  return null;
}
