'use client';
import { useState, useEffect } from 'react';

export function applyTheme(theme: string) {
  if (typeof window === 'undefined') return;
  if (theme === 'auto') {
    const isLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    if (isLight) document.documentElement.setAttribute('data-theme', 'light');
    else document.documentElement.removeAttribute('data-theme');
  } else if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('pinny-theme') || 'dark';
    setTheme(savedTheme);
    applyTheme(savedTheme);

    const handleStorage = () => {
      const newTheme = localStorage.getItem('pinny-theme') || 'dark';
      setTheme(newTheme);
      applyTheme(newTheme);
    };

    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('pinny-theme') === 'auto') {
        applyTheme('auto');
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('theme-changed', handleStorage);
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    mediaQuery.addEventListener('change', handleSystemChange);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('theme-changed', handleStorage);
      mediaQuery.removeEventListener('change', handleSystemChange);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'auto' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('pinny-theme', nextTheme);
    applyTheme(nextTheme);
    window.dispatchEvent(new Event('theme-changed'));
  };

  return (
    <button 
      onClick={toggleTheme}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--text-primary)',
        transition: 'all 0.2s',
        marginLeft: '16px'
      }}
      aria-label="Toggle Theme"
      title={`Current Theme: ${theme}`}
      onMouseOver={e => {
        e.currentTarget.style.backgroundColor = 'var(--border)';
      }}
      onMouseOut={e => {
        e.currentTarget.style.backgroundColor = 'var(--surface)';
      }}
    >
      {theme === 'dark' ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06z"/>
        </svg>
      ) : theme === 'light' ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4C12.92 3.04 12.46 3 12 3z"/>
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18V4c4.42 0 8 3.58 8 8s-3.58 8-8 8z"/>
        </svg>
      )}
    </button>
  );
}
