'use client';

import { useState } from 'react';

export default function SearchBar({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);

  return (
    <form className="search-container" action="/" method="GET">
      <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <input
        type="text"
        name="q"
        className="search-input"
        placeholder="Search for ideas..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </form>
  );
}
