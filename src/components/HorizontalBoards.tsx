'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Board, getBoards } from '@/lib/db';

export default function HorizontalBoards() {
  const [boards, setBoards] = useState<Board[]>([]);

  useEffect(() => {
    getBoards().then(b => setBoards(b.sort((a, b) => b.createdAt - a.createdAt))).catch(console.error);
  }, []);

  if (boards.length === 0) return null;

  return (
    <div style={{
      maxWidth: '1600px',
      margin: '0 auto',
      padding: '16px 2rem 0',
    }}>
      <div
        className="horizontal-boards-scroll"
        style={{
          overflowX: 'auto',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          scrollbarWidth: 'none',
        }}
      >
        <style>{`
          .horizontal-boards-scroll::-webkit-scrollbar { display: none; }
        `}</style>

        {boards.map(board => (
          <Link
            key={board.id}
            href={`/saved/${board.id}`}
            style={{ textDecoration: 'none', flexShrink: 0 }}
          >
            <div
              className="board-chip"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 18px',
                height: '38px',
                backgroundColor: 'var(--surface)',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                whiteSpace: 'nowrap',
                transition: 'all 0.18s ease',
                cursor: 'pointer',
              }}
              onMouseOver={e => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.backgroundColor = 'var(--surface)';
              }}
            >
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.01em' }}>
                {board.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
