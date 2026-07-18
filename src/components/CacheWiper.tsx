'use client';

// If this is the very first time this script is running (e.g. hard refresh or new tab)
// we wipe the homepage cache to guarantee a fresh feed.
// Because Next.js client-side routing does NOT reload the document, this will
// only ever run once per full page load, perfectly preserving the cache for the "Back" button!
if (typeof window !== 'undefined') {
  sessionStorage.removeItem('pinny_grid_homepage');
}

export default function CacheWiper() {
  return null;
}
