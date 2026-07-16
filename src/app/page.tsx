import SearchBar from '@/components/SearchBar';
import ImageGrid from '@/components/ImageGrid';
import HorizontalBoards from '@/components/HorizontalBoards';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';

export interface ImageObj {
  id: string;
  url: string;
  origUrl?: string;
  width: number;
  height: number;
  title?: string;
  description?: string;
  pinner?: string;
  color?: string;
}

import { searchPinterest, getMixedPins } from '@/lib/pinterest';
import { cookies } from 'next/headers';
import MixedFeedLoader from '@/components/MixedFeedLoader';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const cookieStore = await cookies();
  const historyCookie = cookieStore.get('pinny_history');
  
  let historyItems: {id: string, title: string}[] = [];
  if (historyCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(historyCookie.value));
      historyItems = parsed.map((item: any) => typeof item === 'string' ? { id: item, title: '' } : item);
    } catch(e) {}
  }
  
  const historyIds = historyItems.map(item => item.id);
  const historyTitles = historyItems.map(item => item.title).filter(t => t.trim().length > 0);

  const hasExplicitQuery = !!q;

  // Render the complex background loader if history has more than 4 items and no search query
  if (!hasExplicitQuery && historyIds.length > 4) {
    return (
      <>
        <header className="header">
          <div className="logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13.88 16.5C13.59 15.65 13.5 14.85 13.78 14.1C13.97 13.58 14.2 13.1 14.47 12.63C14.84 11.96 15.17 11.3 15.34 10.5C15.54 9.53 15.36 8.56 14.83 7.85C14.1 6.86 12.86 6.46 11.66 6.85C10.52 7.23 9.77 8.24 9.61 9.42C9.52 10.05 9.68 10.66 10.05 11.16C10.32 11.53 10.73 11.75 11.15 11.83C11.53 11.9 11.87 11.7 11.99 11.35C12.11 11.02 11.97 10.68 11.66 10.53C11.23 10.33 11.04 9.87 11.15 9.45C11.31 8.81 11.87 8.35 12.52 8.33C13.15 8.32 13.71 8.74 13.89 9.35C14.04 9.85 13.91 10.46 13.53 10.97C13.12 11.5 12.72 12.11 12.37 12.76C11.97 13.5 11.73 14.33 11.77 15.15C11.78 15.52 11.91 15.89 12.13 16.2C12.35 16.48 12.65 16.66 12.98 16.71C13.41 16.77 13.82 16.59 14.07 16.27L13.88 16.5Z" fill="currentColor"/>
            </svg>
            Pinny
          </div>
        <SearchBar initialQuery="" />
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link href="/saved" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', textDecoration: 'none' }} title="Saved Boards">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 3H7C5.9 3 5.01 3.9 5.01 5L5 21L12 18L19 21V5C19 3.9 18.1 3 17 3Z" />
            </svg>
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <HorizontalBoards />
      <main className="main-content">
        <MixedFeedLoader historyIds={historyIds.slice(0, 10)} historyTitles={historyTitles.slice(0, 10)} cacheKeyOverride="pinny_grid_homepage" />
        </main>
      </>
    );
  }

  let query = q || 'aesthetic wallpapers';
  let mode: 'search' | 'related' | 'mixed' = 'search';

  let images: ImageObj[] = [];
  let initialBookmark: string | null = null;
  let initialCsrfToken: string | null = null;
  
  try {
    if (!hasExplicitQuery && historyIds.length > 0) {
      // Fast server-side mix for 1-4 pins
      const topIds = historyIds.slice(0, historyIds.length);
      query = topIds.join(','); // Use the joined IDs as the query
      mode = 'mixed';
      
      const data = await getMixedPins(topIds);
      if (data.images && data.images.length > 0) {
        images = data.images;
        if (data.bookmarks) initialBookmark = data.bookmarks.join(',');
        if (data.csrftoken) initialCsrfToken = data.csrftoken;
      }
    }
    
    // Fallback to text search if related pins failed or user explicitly searched
    if (images.length === 0) {
      if (!hasExplicitQuery && historyTitles.length > 0) {
        query = historyTitles.slice(0, 5).join(' '); // prevent massive query
      } else {
        query = q || 'aesthetic wallpapers';
      }
      mode = 'search';
      const data = await searchPinterest(query);
      if (data.images) images = data.images;
      if (data.bookmark) initialBookmark = data.bookmark;
      if (data.csrftoken) initialCsrfToken = data.csrftoken;
    }
  } catch (error) {
    console.error("Failed to fetch images from Pinterest:", error);
  }

  // If there's an explicit query, we don't use the homepage cache override, we let it cache by the query itself.
  const cacheKeyOverride = hasExplicitQuery ? undefined : "pinny_grid_homepage";

  return (
    <>
      <header className="header">
        <div className="logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13.88 16.5C13.59 15.65 13.5 14.85 13.78 14.1C13.97 13.58 14.2 13.1 14.47 12.63C14.84 11.96 15.17 11.3 15.34 10.5C15.54 9.53 15.36 8.56 14.83 7.85C14.1 6.86 12.86 6.46 11.66 6.85C10.52 7.23 9.77 8.24 9.61 9.42C9.52 10.05 9.68 10.66 10.05 11.16C10.32 11.53 10.73 11.75 11.15 11.83C11.53 11.9 11.87 11.7 11.99 11.35C12.11 11.02 11.97 10.68 11.66 10.53C11.23 10.33 11.04 9.87 11.15 9.45C11.31 8.81 11.87 8.35 12.52 8.33C13.15 8.32 13.71 8.74 13.89 9.35C14.04 9.85 13.91 10.46 13.53 10.97C13.12 11.5 12.72 12.11 12.37 12.76C11.97 13.5 11.73 14.33 11.77 15.15C11.78 15.52 11.91 15.89 12.13 16.2C12.35 16.48 12.65 16.66 12.98 16.71C13.41 16.77 13.82 16.59 14.07 16.27L13.88 16.5Z" fill="currentColor"/>
          </svg>
          Pinny
        </div>
        <SearchBar initialQuery={hasExplicitQuery ? query : ""} />
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link href="/saved" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', textDecoration: 'none' }} title="Saved Boards">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 3H7C5.9 3 5.01 3.9 5.01 5L5 21L12 18L19 21V5C19 3.9 18.1 3 17 3Z" />
            </svg>
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <HorizontalBoards />
      <main className="main-content">
        {images.length > 0 ? (
          <ImageGrid 
            key={hasExplicitQuery ? query : "homepage"}
            initialImages={images} 
            initialBookmark={initialBookmark} 
            initialCsrfToken={initialCsrfToken} 
            query={query}
            mode={mode}
            cacheKeyOverride={cacheKeyOverride}
          />
        ) : (
          <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-secondary)' }}>
            <h2>No results found for "{query}"</h2>
          </div>
        )}
      </main>
    </>
  );
}
