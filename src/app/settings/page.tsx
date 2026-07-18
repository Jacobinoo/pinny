'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle, { applyTheme } from '@/components/ThemeToggle';
import BackButton from '@/components/BackButton';

export default function SettingsPage() {
  const [history, setHistory] = useState<{title: string, id: string}[]>([]);
  const [theme, setTheme] = useState('dark');
  
  useEffect(() => {
    // Load history
    const cookieMatch = document.cookie.match(/(^|;)\s*pinny_history\s*=\s*([^;]+)/);
    if (cookieMatch) {
      try {
        setHistory(JSON.parse(decodeURIComponent(cookieMatch[2])));
      } catch (e) {
        console.error("Failed to parse history cookie", e);
      }
    }
    
    // Load theme
    const savedTheme = localStorage.getItem('pinny-theme') || 'dark';
    setTheme(savedTheme);

    const handleThemeChange = () => {
      setTheme(localStorage.getItem('pinny-theme') || 'dark');
    };
    window.addEventListener('theme-changed', handleThemeChange);
    return () => window.removeEventListener('theme-changed', handleThemeChange);
  }, []);

  const saveHistory = (newHistory: any[]) => {
    document.cookie = `pinny_history=${encodeURIComponent(JSON.stringify(newHistory))}; path=/; max-age=31536000`; // 1 year
    setHistory(newHistory);
  };

  const removeHistoryItem = (index: number) => {
    const newHistory = [...history];
    newHistory.splice(index, 1);
    saveHistory(newHistory);
  };

  const clearHistory = () => {
    saveHistory([]);
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('pinny-theme', newTheme);
    applyTheme(newTheme);
    window.dispatchEvent(new Event('theme-changed'));
  };

  return (
    <div className="pin-page-container">
      <header className="pin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <BackButton />
        <ThemeToggle />
      </header>
      
      <main className="pin-main">
        <div className="settings-container" style={{
          background: 'var(--card-bg)',
          width: '100%',
          maxWidth: '800px',
          borderRadius: '32px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          padding: '40px',
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Settings</h1>
          
          {/* Theme Settings */}
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent)' }}>Appearance</h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {['light', 'dark', 'auto'].map(t => (
                <button
                  key={t}
                  onClick={() => handleThemeChange(t)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '24px',
                    border: theme === t ? '2px solid var(--accent)' : '2px solid var(--border)',
                    background: theme === t ? 'rgba(58, 184, 168, 0.1)' : 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>

          {/* Recommendation History */}
          <section>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent)' }}>Recommendation History</h2>
            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Pinny collects your clicked pins locally to fuel your personal recommendations. You can view and delete them here to reset your algorithm.
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontWeight: 600 }}>{history.length} Interests Saved</span>
              <button 
                onClick={clearHistory}
                style={{
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '24px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  opacity: history.length === 0 ? 0.5 : 1
                }}
                disabled={history.length === 0}
              >
                Clear All
              </button>
            </div>

            {history.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {history.map((item, idx) => (
                  <li key={idx} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    background: 'var(--surface)',
                    padding: '12px 20px',
                    borderRadius: '16px',
                    border: '1px solid var(--border)'
                  }}>
                    <span style={{ 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      marginRight: '20px',
                      color: 'var(--text-primary)',
                      fontWeight: 500
                    }}>
                      {item.title && item.title.toLowerCase() !== 'untitled' ? item.title : `Pin ID: ${item.id}`}
                    </span>
                    <button 
                      onClick={() => removeHistoryItem(idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                      onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                      title="Remove from history"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                background: 'var(--surface)',
                borderRadius: '16px',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)'
              }}>
                No interests collected yet. Browse some pins to see them here!
              </div>
            )}
          </section>
          
          <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
            Pinny v{process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0-beta.0'}
          </div>
        </div>
      </main>
    </div>
  );
}
