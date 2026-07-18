'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import type { ImageObj } from '../app/page';

export interface ImageGridProps {
  initialImages: ImageObj[];
  initialBookmark?: string | null;
  initialCsrfToken?: string | null;
  query: string;
  cachePrefix?: string;
  cacheKeyOverride?: string;
  mode?: 'search' | 'related' | 'mixed' | 'mixed_search';
  disableCache?: boolean;
}

import Link from 'next/link';

export default function ImageGrid({ initialImages, initialBookmark, initialCsrfToken, query, cachePrefix = 'pinny_grid', cacheKeyOverride, mode = 'search', disableCache = false }: ImageGridProps) {
  const CACHE_KEY = cacheKeyOverride || `${cachePrefix}_${query}`;

  const [activeQuery, setActiveQuery] = useState(query);
  const [activeMode, setActiveMode] = useState(mode);

  const [images, setImages] = useState<ImageObj[]>(() => {
    if (!disableCache && typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.images && parsed.images.length > 0) {
            if (parsed.query) setActiveQuery(parsed.query);
            if (parsed.mode) setActiveMode(parsed.mode);
            return parsed.images;
          }
        } catch (e) {}
      }
    }
    return initialImages;
  });

  const [bookmark, setBookmark] = useState<string | null>(() => {
    if (!disableCache && typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.images && parsed.images.length > 0) {
            return parsed.bookmark || null;
          }
        } catch (e) {}
      }
    }
    return initialBookmark || null;
  });

  const [csrfToken, setCsrfToken] = useState<string | null>(() => {
    if (!disableCache && typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.images && parsed.images.length > 0) {
            return parsed.csrfToken || null;
          }
        } catch (e) {}
      }
    }
    return initialCsrfToken || null;
  });

  // Reset state if query changes! (Only if we are not overriding the cache key)
  useEffect(() => {
    console.log(`%c[Pinny] Initializing ImageGrid. Mode: ${mode}, Query: "${query}"`, 'color: #8b5cf6; font-weight: bold;');
    if (cacheKeyOverride) return;
    
    if (!disableCache && typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
         try {
           const parsed = JSON.parse(cached);
           if (parsed.images && parsed.images.length > 0) {
             setImages(parsed.images);
             setBookmark(parsed.bookmark);
             setCsrfToken(parsed.csrfToken || initialCsrfToken);
             if (parsed.query) setActiveQuery(parsed.query);
             if (parsed.mode) setActiveMode(parsed.mode);
             return;
           }
         } catch(e) {}
      }
    }
    setImages(initialImages);
    setBookmark(initialBookmark || null);
    setCsrfToken(initialCsrfToken || null);
    setActiveQuery(query);
    setActiveMode(mode);
    setHasRestoredScroll(false); 
  }, [query, CACHE_KEY, initialImages, initialBookmark, initialCsrfToken, mode, cacheKeyOverride]);

  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !bookmark || bookmark === 'null') return;
    setIsLoadingMore(true);

    try {
      let baseUrl = `/api/search?q=${encodeURIComponent(activeQuery)}`;
      let fetchUrl = '';
      
      if (activeMode === 'related') {
        baseUrl = `/api/related?id=${encodeURIComponent(activeQuery)}`;
        fetchUrl = `${baseUrl}&bookmark=${encodeURIComponent(bookmark)}`;
      } else if (activeMode === 'mixed') {
        baseUrl = `/api/mixed?ids=${encodeURIComponent(activeQuery)}`;
        fetchUrl = `${baseUrl}&bookmarks=${encodeURIComponent(bookmark)}`;
      } else if (activeMode === 'mixed_search') {
        baseUrl = `/api/mixed_search?queries=${encodeURIComponent(activeQuery)}`;
        fetchUrl = `${baseUrl}&bookmarks=${encodeURIComponent(bookmark)}`;
      } else {
        fetchUrl = `${baseUrl}&bookmark=${encodeURIComponent(bookmark)}`;
      }
      
      if (csrfToken) {
        fetchUrl += `&csrftoken=${encodeURIComponent(csrfToken)}`;
      }
      
      console.log(`%c[Pinny API] Client fetching infinite scroll [Mode: ${activeMode}]: ${fetchUrl}`, 'color: #3b82f6;');
      const res = await fetch(fetchUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.images && data.images.length > 0) {
          setImages(prev => {
            const existingUrls = new Set(prev.map(img => img.url));
            const newImages = data.images.filter((img: ImageObj) => !existingUrls.has(img.url));
            return [...prev, ...newImages];
          });
        }
        setBookmark(data.bookmark || null);
        if (data.csrftoken) {
          setCsrfToken(data.csrftoken);
        }
      }
    } catch (err) {
      console.error("Failed to load more images:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, bookmark, csrfToken, query, mode]);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && bookmark) {
        loadMore();
      }
    }, {
      rootMargin: '400px', // start loading before the user actually hits the bottom
    });
    
    if (node) observer.current.observe(node);
  }, [isLoadingMore, bookmark, loadMore]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<{ height: number, positions: { x: number, y: number, width: number, height: number }[] }>({ height: 0, positions: [] });
  const [scrollY, setScrollY] = useState(0);
  const [windowHeight, setWindowHeight] = useState(1000);

  // Scroll tracker for Virtualization
  useEffect(() => {
    setWindowHeight(window.innerHeight);
    let rafId: number;
    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initialize
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Recalculate layout on resize or images change
  useEffect(() => {
    const updateLayout = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      
      // Target a column width of approximately 236px (Pinterest standard)
      // Force at least 2 columns on mobile devices
      const colCount = Math.max(2, Math.floor(containerWidth / 236));
      const gap = 24; // 1.5rem = 24px
      const colWidth = (containerWidth - (gap * (colCount - 1))) / colCount;
      
      const columnHeights = Array(colCount).fill(0);
      const positions: { x: number, y: number, width: number, height: number }[] = [];

      images.forEach((imgObj) => {
        let minHeight = columnHeights[0];
        let minCol = 0;
        for (let i = 1; i < colCount; i++) {
          if (columnHeights[i] < minHeight) {
            minHeight = columnHeights[i];
            minCol = i;
          }
        }

        const itemHeight = (colWidth * (imgObj.height || 1)) / (imgObj.width || 1);
        
        const x = minCol * (colWidth + gap);
        const y = minHeight;
        positions.push({ x, y, width: colWidth, height: itemHeight });

        columnHeights[minCol] += itemHeight + gap;
      });

      const maxHeight = Math.max(...columnHeights);
      setLayout({ height: maxHeight, positions });
      setWindowHeight(window.innerHeight);
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [images]);

  // Scroll Restoration
  const [hasRestoredScroll, setHasRestoredScroll] = useState(false);
  const [containerTop, setContainerTop] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setContainerTop(containerRef.current.getBoundingClientRect().top + window.scrollY);
    }
  }, [layout]);
  
  useEffect(() => {
    if (disableCache) return;
    if (!hasRestoredScroll && layout.positions.length > 0) {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.scrollY) {
            // Delay by 50ms to ensure the browser has fully painted the new height
            setTimeout(() => {
              window.scrollTo({ top: parsed.scrollY, behavior: 'instant' });
            }, 50);
          }
        } catch (e) {}
      }
      setHasRestoredScroll(true);
    }
  }, [layout, hasRestoredScroll, CACHE_KEY]);

  // Persist State on unmount
  useEffect(() => {
    if (disableCache) return;

    const saveState = () => {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        images,
        bookmark,
        csrfToken,
        scrollY: window.scrollY
      }));
    };

    window.addEventListener('beforeunload', saveState);
    return () => {
      window.removeEventListener('beforeunload', saveState);
      // Only save on unmount if we aren't at the very top (to avoid Next.js navigation resets overriding it)
      if (window.scrollY > 0 || !sessionStorage.getItem(CACHE_KEY)) {
        saveState();
      }
    };
  }, [images, bookmark, csrfToken, CACHE_KEY]);

  if (images.length === 0) {
    const skeletonHeights = [250, 320, 280, 350, 290, 260, 310, 340, 270, 300, 330, 240, 280, 310, 260, 330];
    return (
      <div className="masonry-grid" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {skeletonHeights.map((h, i) => (
          <div key={i} className="pin-card skeleton" style={{ height: `${h}px`, flex: '1 1 200px' }} />
        ))}
      </div>
    );
  }

  // Virtualization bounds
  const BUFFER = windowHeight * 2; // Load 2 screens worth of content above and below
  const viewportTop = scrollY - BUFFER - containerTop;
  const viewportBottom = scrollY + windowHeight + BUFFER - containerTop;

  return (
    <>
      <div className="masonry-grid" ref={containerRef} style={{ position: 'relative', height: `${layout.height}px`, width: '100%', display: 'block' }}>
        {images.map((imgObj, index) => {
          const pos = layout.positions[index];
          if (!pos) return null; // Avoid render before calculation
          
          // Virtualization Check
          const isVisible = pos.y + pos.height > scrollY - windowHeight * 4.0 && pos.y < scrollY + windowHeight * 5.0;
          if (!isVisible) {
            return null; // Skip rendering DOM nodes outside of viewport
          }

          let finalUrl = imgObj.url;
          if (imgObj.url.startsWith('http')) {
            finalUrl = `/api/image_proxy?url=${encodeURIComponent(imgObj.url)}`;
          } else if (imgObj.url.startsWith('/api/image_proxy')) {
             finalUrl = imgObj.url;
          }

          return (
            <Link 
              href={`/pin?id=${encodeURIComponent(imgObj.id || '')}&url=${encodeURIComponent(imgObj.url)}&origUrl=${encodeURIComponent(imgObj.origUrl || imgObj.url)}&title=${encodeURIComponent(imgObj.title || '')}&description=${encodeURIComponent(imgObj.description || '')}&pinner=${encodeURIComponent(imgObj.pinner || '')}&color=${encodeURIComponent(imgObj.color || '')}&width=${imgObj.width || ''}&height=${imgObj.height || ''}`}
              onClick={() => {
                console.log("Pin Clicked! Info:", imgObj);
                if (!disableCache) {
                  // Guarantee the exact scroll position is saved right before Next.js navigation starts!
                  sessionStorage.setItem(CACHE_KEY, JSON.stringify({
                    images,
                    bookmark,
                    csrfToken,
                    scrollY: window.scrollY,
                    query: activeQuery,
                    mode: activeMode
                  }));
                }

                // Update local history cookie for home feed recommendations
                if (imgObj.id) {
                  try {
                    const cookieMatch = document.cookie.match(/(^|;)\s*pinny_history\s*=\s*([^;]+)/);
                    let history: any[] = [];
                    if (cookieMatch) {
                      const parsed = JSON.parse(decodeURIComponent(cookieMatch[2]));
                      // Migrate old string arrays to object arrays
                      history = parsed.map((item: any) => typeof item === 'string' ? { id: item, title: '' } : item);
                    }
                    
                    let pinTitle = imgObj.title || '';
                    if (pinTitle.toLowerCase() === 'untitled') pinTitle = '';
                    
                    history = [{ id: imgObj.id, title: pinTitle }, ...history.filter((item: any) => item.id !== imgObj.id)].slice(0, 10);
                    
                    console.log('%c[Pinny] History Updated:', 'color: #f59e0b; font-weight: bold;', history);
                    
                    document.cookie = `pinny_history=${encodeURIComponent(JSON.stringify(history))}; path=/; max-age=31536000`; // 1 year
                  } catch(e) {}
                }
              }}
              key={`${imgObj.id || imgObj.url}-${index}`} 
              className="pin-card" 
              style={{  
                position: 'absolute', 
                top: `${pos.y}px`, 
                left: `${pos.x}px`, 
                width: `${pos.width}px`,
                height: `${pos.height}px`,
                margin: 0,
                display: 'block',
              }}
            >
              <img 
                src={finalUrl} 
                alt={imgObj.title || `Pin`} 
                loading={index < 8 ? "eager" : "lazy"}
                fetchPriority={index < 4 ? "high" : "auto"}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                }}
              />
            </Link>
          );
        })}
      </div>
      
      {/* Infinite Scroll trigger point */}
      {bookmark && (
        <div ref={lastElementRef} style={{ width: '100%', height: '50px', marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
          {isLoadingMore && <div className="spinner"></div>}
        </div>
      )}
    </>
  );
}
