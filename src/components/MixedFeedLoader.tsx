'use client';

import { useState, useEffect } from 'react';
import ImageGrid from './ImageGrid';
import { ImageObj } from '@/app/page';

interface MixedFeedLoaderProps {
  historyIds: string[];
  historyTitles?: string[];
  cacheKeyOverride?: string;
}

export default function MixedFeedLoader({ historyIds, historyTitles, cacheKeyOverride }: MixedFeedLoaderProps) {
  const query = historyIds.join(',');
  const cachePrefix = 'pinny_grid';
  const CACHE_KEY = cacheKeyOverride || `${cachePrefix}_${query}`;

  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<ImageObj[]>([]);
  const [bookmarks, setBookmarks] = useState<(string | null)[]>([]);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [fallbackQuery, setFallbackQuery] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let gatheredImages: ImageObj[] = [];
    let gatheredBookmarks: (string | null)[] = [];
    let token: string | null = null;
    let activeFetches = historyIds.length;
    let finished = false;

    // 1. Check cache first to avoid re-fetching on back navigation
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.images && parsed.images.length > 0) {
          // Instantly restore!
          setImages(parsed.images);
          setBookmarks(parsed.bookmarks ? parsed.bookmarks.split(',') : []);
          setCsrfToken(parsed.csrfToken || null);
          setLoading(false);
          return;
        }
      }
      
      // Check fallback cache
      let fallback = 'aesthetic wallpapers';
      if (historyTitles && historyTitles.length > 0) {
        fallback = historyTitles.slice(0, 5).join(' ');
      }
      const fallbackCacheKey = `pinny_fallback_${fallback}`;
      const fallbackCached = sessionStorage.getItem(fallbackCacheKey);
      if (fallbackCached) {
        const parsed = JSON.parse(fallbackCached);
        if (parsed.images && parsed.images.length > 0) {
          // Instantly switch to fallback grid, which will restore from its own cache!
          setFallbackQuery(fallback);
          setLoading(false);
          return;
        }
      }
    } catch (e) {}

    // 2. Fetch in the background with staggered delays
    const finalize = () => {
      if (finished || !isMounted) return;
      finished = true;

      // Shuffle images
      for (let i = gatheredImages.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gatheredImages[i], gatheredImages[j]] = [gatheredImages[j], gatheredImages[i]];
      }

      // Detect if Pinterest blocked the API (returned empty data on all requests)
      if (gatheredImages.length === 0) {
        let fallback = 'aesthetic wallpapers';
        if (historyTitles && historyTitles.length > 0) {
          fallback = historyTitles.slice(0, 5).join(' '); // prevent massive query
        }
        console.log(`%c[Pinny] Related API blocked (Data: []). Falling back to search mode with query: "${fallback}"`, 'color: #ff4d4d; font-weight: bold;');
        setFallbackQuery(fallback);
        setLoading(false);
        return;
      }

      console.log(`%c[Pinny] Successfully blended ${gatheredImages.length} related pins!`, 'color: #4CAF50; font-weight: bold;');

      setImages(gatheredImages);
      setBookmarks(gatheredBookmarks);
      setCsrfToken(token);
      setLoading(false);
    };

    const timeoutId = setTimeout(() => {
      console.log("MixedFeedLoader: 10 second timeout reached, finalizing early.");
      finalize();
    }, 10000);

    let completed = 0;

    historyIds.forEach((id) => {
      const delay = Math.random() * 2500; // Stagger up to 2.5 seconds
      
      setTimeout(async () => {
        if (!isMounted || finished) return;

        try {
          console.log(`%c[Pinny API] Client fetching: /api/related?id=${id}`, 'color: #3b82f6;');
          const res = await fetch(`/api/related?id=${id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.images) gatheredImages.push(...data.images);
            gatheredBookmarks.push(data.bookmark || null);
            if (data.csrftoken) token = data.csrftoken;
          } else {
            gatheredBookmarks.push(null);
          }
        } catch (e) {
          gatheredBookmarks.push(null);
        } finally {
          activeFetches--;
          completed++;
          setProgress(Math.round((completed / historyIds.length) * 100));

          if (activeFetches === 0) {
            clearTimeout(timeoutId);
            finalize();
          }
        }
      }, delay);
    });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [historyIds, CACHE_KEY]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid var(--border)',
          borderTop: '4px solid var(--pinterest-red)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '2rem'
        }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Refining recommendations...
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Blending your core interests into a personalized feed.
        </p>
        <div style={{ width: '200px', height: '4px', backgroundColor: 'var(--border)', borderRadius: '2px', marginTop: '2rem', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--pinterest-red)', transition: 'width 0.3s ease' }} />
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  if (fallbackQuery) {
    return (
      <ImageGrid
        key={`fallback_${fallbackQuery}`}
        initialImages={[]}
        initialBookmark={null}
        query={fallbackQuery}
        mode="search"
        cachePrefix="pinny_fallback"
      />
    );
  }

  return (
    <ImageGrid
      key={query}
      initialImages={images}
      initialBookmark={bookmarks.length > 0 ? bookmarks.join(',') : null}
      initialCsrfToken={csrfToken}
      query={query}
      mode="mixed"
      cachePrefix={cachePrefix}
      cacheKeyOverride={cacheKeyOverride}
    />
  );
}
