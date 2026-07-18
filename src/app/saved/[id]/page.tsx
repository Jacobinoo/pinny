'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Board, getBoard } from '@/lib/db';
import ImageGrid from '@/components/ImageGrid';
import ThemeToggle from '@/components/ThemeToggle';
import BackButton from '@/components/BackButton';
import MixedFeedLoader from '@/components/MixedFeedLoader';

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBoard(id).then(b => {
      setBoard(b);
      setLoading(false);
    }).catch(console.error);
  }, [id]);

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-secondary)' }}>Loading board...</div>;
  }

  if (!board) {
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-secondary)' }}>
        <h2>Board not found</h2>
        <Link href="/saved" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Back to Saved Boards</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}>
      <header className="pin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <BackButton fallback="/saved" />
        <div style={{ fontWeight: 600, fontSize: '1.2rem' }}>{board.name}</div>
        <ThemeToggle />
      </header>
      
      <main className="main-content">
        {board.pins.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-secondary)' }}>
            <p>No pins in this board yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
            {/* The Saved Pins */}
            <section>
              <ImageGrid 
                key={`board_${board.id}_${board.pins.length}`}
                initialImages={board.pins}
                initialBookmark={null} // No infinite scroll for local boards
                query={`board_${board.id}`}
                cacheKeyOverride={`pinny_grid_board_${board.id}`}
                mode="search" // Doesn't matter because bookmark is null
                disableCache={true}
              />
            </section>

            {/* Recommendations Based on the Board */}
            <section style={{ paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 600 }}>More ideas for this board</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Inspired by your saved pins</p>
              </div>
              <MixedFeedLoader 
                historyIds={board.pins.map(p => p.id).filter(id => id).slice(0, 10)} 
                historyTitles={board.pins.map(p => p.title || '').filter(t => t.trim().length > 0).slice(0, 10)} 
                cacheKeyOverride={`pinny_grid_board_ideas_${board.id}_${board.pins.length}`} 
                loaderType="spinner"
                boardName={board.name}
              />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
