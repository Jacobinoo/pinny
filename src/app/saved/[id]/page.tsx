'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Board, getBoard } from '@/lib/db';
import ImageGrid from '@/components/ImageGrid';

import ThemeToggle from '@/components/ThemeToggle';

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
      <header className="header" style={{ justifyContent: 'space-between' }}>
        <Link href="/saved" className="back-btn" style={{ textDecoration: 'none' }}>
           &larr; Boards
        </Link>
        <div style={{ fontWeight: 600, fontSize: '1.2rem' }}>{board.name}</div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ThemeToggle />
        </div>
      </header>
      
      <main className="main-content">
        {board.pins.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-secondary)' }}>
            <p>No pins in this board yet.</p>
          </div>
        ) : (
          <ImageGrid 
            key={`board_${board.id}_${board.pins.length}`}
            initialImages={board.pins}
            initialBookmark={null} // No infinite scroll for local boards
            query={`board_${board.id}`}
            cacheKeyOverride={`pinny_grid_board_${board.id}`}
            mode="search" // Doesn't matter because bookmark is null
            disableCache={true}
          />
        )}
      </main>
    </div>
  );
}
