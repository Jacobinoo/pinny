'use client';
import { useEffect } from 'react';

let hasWipedCacheForThisDocument = false;

export default function CacheWiper() {
  useEffect(() => {
    // If this is the very first time this script is running (e.g. hard refresh or new tab)
    // we wipe the homepage cache to guarantee a fresh feed.
    // Because Next.js client-side routing does NOT reload the document, this will
    // only ever run once per full page load, perfectly preserving the cache for the "Back" button!
    if (!hasWipedCacheForThisDocument) {
      hasWipedCacheForThisDocument = true;
      sessionStorage.removeItem('pinny_grid_homepage');
    }
  }, []);
  return null;
}
