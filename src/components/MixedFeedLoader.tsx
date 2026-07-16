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
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let gatheredImages: ImageObj[] = [];
    let gatheredBookmarks: (string | null)[] = [];
    let token: string | null = null;
    let finished = false;

    // 1. Check cache first to avoid re-fetching on back navigation
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.images && parsed.images.length > 0) {
          setImages(parsed.images);
          setBookmarks(parsed.bookmarks ? parsed.bookmarks.split(',') : []);
          setCsrfToken(parsed.csrfToken || null);
          setLoading(false);
          return;
        }
      }
      
      // Check fallback cache
      let fallbackTitles = historyTitles && historyTitles.length > 0 ? historyTitles.slice(0, 10) : ['aesthetic wallpapers'];
      const fallbackCacheKey = `pinny_fallback_${fallbackTitles.join(',')}`;
      const fallbackCached = sessionStorage.getItem(fallbackCacheKey);
      if (fallbackCached) {
        const parsed = JSON.parse(fallbackCached);
        if (parsed.images && parsed.images.length > 0) {
          setImages(parsed.images);
          setBookmarks(parsed.bookmarks ? parsed.bookmarks.split(',') : []);
          setCsrfToken(parsed.csrfToken || null);
          setIsFallbackMode(true);
          setLoading(false);
          return;
        }
      }
    } catch (e) {}

    const finalize = () => {
      if (finished || !isMounted) return;
      finished = true;

      // Shuffle images
      for (let i = gatheredImages.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gatheredImages[i], gatheredImages[j]] = [gatheredImages[j], gatheredImages[i]];
      }

      console.log(`%c[Pinny] Successfully blended ${gatheredImages.length} pins!`, 'color: #4CAF50; font-weight: bold;');

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
    let fallbackTitles = historyTitles && historyTitles.length > 0 ? historyTitles.slice(0, 10) : ['aesthetic wallpapers'];
    let relatedBlockedDetected = false;
    let activeFetches = historyIds.length;

    const startSearchFallback = () => {
      console.log("%c[Pinny] Shadowban detected. Switching to parallel search fallback!", "color: #ff4d4d; font-weight: bold;");
      setIsFallbackMode(true);
      gatheredImages = [];
      gatheredBookmarks = [];
      completed = 0;
      setProgress(0);
      
      activeFetches = fallbackTitles.length;
      fallbackTitles.forEach((title) => {
        const delay = Math.random() * 2500;
        setTimeout(async () => {
          if (!isMounted || finished) return;
          try {
            console.log(`%c[Pinny API] Client fetching search fallback: /api/search?q=${title}`, 'color: #3b82f6;');
            const res = await fetch(`/api/search?q=${encodeURIComponent(title)}`);
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
            setProgress(Math.round((completed / fallbackTitles.length) * 100));
            if (activeFetches === 0) {
              clearTimeout(timeoutId);
              finalize();
            }
          }
        }, delay);
      });
    };

    historyIds.forEach((id) => {
      const delay = Math.random() * 2500; // Stagger up to 2.5 seconds
      
      setTimeout(async () => {
        if (!isMounted || finished || relatedBlockedDetected) return;

        try {
          console.log(`%c[Pinny API] Client fetching: /api/related?id=${id}`, 'color: #3b82f6;');
          const res = await fetch(`/api/related?id=${id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.images && data.images.length > 0) {
              gatheredImages.push(...data.images);
              gatheredBookmarks.push(data.bookmark || null);
              if (data.csrftoken) token = data.csrftoken;
            } else {
              // Ban detected
              relatedBlockedDetected = true;
              startSearchFallback();
              return;
            }
          } else {
            relatedBlockedDetected = true;
            startSearchFallback();
            return;
          }
        } catch (e) {
          // Error, let's just trigger fallback to be safe
          if (!relatedBlockedDetected) {
            relatedBlockedDetected = true;
            startSearchFallback();
            return;
          }
        } finally {
          if (!relatedBlockedDetected) {
            activeFetches--;
            completed++;
            setProgress(Math.round((completed / historyIds.length) * 100));

            if (activeFetches === 0) {
              clearTimeout(timeoutId);
              finalize();
            }
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

  let finalMode = isFallbackMode ? "mixed_search" : "mixed";
  let finalQuery = isFallbackMode ? (historyTitles && historyTitles.length > 0 ? historyTitles.slice(0, 10).join(',') : 'aesthetic wallpapers') : query;

  return (
    <ImageGrid
      key={finalQuery}
      initialImages={images}
      initialBookmark={bookmarks.length > 0 ? bookmarks.join(',') : null}
      initialCsrfToken={csrfToken}
      query={finalQuery}
      mode={finalMode as any}
      cachePrefix={isFallbackMode ? "pinny_fallback" : cachePrefix}
      cacheKeyOverride={cacheKeyOverride}
    />
  );
}
