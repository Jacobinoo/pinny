'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Board, getBoards } from '@/lib/db';

import ThemeToggle from '@/components/ThemeToggle';

export default function SavedPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBoards().then(b => {
      setBoards(b.sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    }).catch(console.error);
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}>
      <header className="header" style={{ justifyContent: 'space-between' }}>
        <Link href="/" className="logo" style={{ textDecoration: 'none' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13.88 16.5C13.59 15.65 13.5 14.85 13.78 14.1C13.97 13.58 14.2 13.1 14.47 12.63C14.84 11.96 15.17 11.3 15.34 10.5C15.54 9.53 15.36 8.56 14.83 7.85C14.1 6.86 12.86 6.46 11.66 6.85C10.52 7.23 9.77 8.24 9.61 9.42C9.52 10.05 9.68 10.66 10.05 11.16C10.32 11.53 10.73 11.75 11.15 11.83C11.53 11.9 11.87 11.7 11.99 11.35C12.11 11.02 11.97 10.68 11.66 10.53C11.23 10.33 11.04 9.87 11.15 9.45C11.31 8.81 11.87 8.35 12.52 8.33C13.15 8.32 13.71 8.74 13.89 9.35C14.04 9.85 13.91 10.46 13.53 10.97C13.12 11.5 12.72 12.11 12.37 12.76C11.97 13.5 11.73 14.33 11.77 15.15C11.78 15.52 11.91 15.89 12.13 16.2C12.35 16.48 12.65 16.66 12.98 16.71C13.41 16.77 13.82 16.59 14.07 16.27L13.88 16.5Z" fill="currentColor"/>
          </svg>
          Pinny
        </Link>
        <div style={{ fontWeight: 600, fontSize: '1.2rem' }}>Saved Boards</div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '28px' }}></div> {/* Spacer for centering */}
          <ThemeToggle />
        </div>
      </header>
      
      <main style={{ padding: '2rem 4rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-secondary)' }}>Loading boards...</div>
        ) : boards.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-secondary)' }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>No boards yet</h2>
            <p>Save pins to boards to see them here.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '2rem',
            marginTop: '2rem'
          }}>
            {boards.map(board => (
              <Link key={board.id} href={`/saved/${board.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  backgroundColor: 'var(--surface)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s',
                  cursor: 'pointer'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ height: '200px', display: 'flex', flexWrap: 'wrap', backgroundColor: 'var(--border)' }}>
                    {board.pins.slice(0, 3).map((pin, i) => (
                      <div key={pin.id} style={{ 
                        flex: i === 0 ? '1 0 100%' : '1 0 50%', 
                        height: i === 0 ? '60%' : '40%',
                        borderRight: i === 1 ? '2px solid var(--surface)' : 'none',
                        borderTop: i > 0 ? '2px solid var(--surface)' : 'none'
                      }}>
                        <img src={pin.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '16px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 600 }}>{board.name}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {board.pins.length} {board.pins.length === 1 ? 'Pin' : 'Pins'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
