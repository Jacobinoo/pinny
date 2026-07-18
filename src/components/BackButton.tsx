'use client';

import { useRouter } from 'next/navigation';

export default function BackButton({ fallback = '/' }: { fallback?: string }) {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <button
      onClick={handleBack}
      className="back-btn"
      style={{
        background: 'none',
        border: 'none',
        color: 'inherit',
        font: 'inherit',
        cursor: 'pointer',
        padding: 0,
        textDecoration: 'none',
        display: 'inline-block'
      }}
    >
      &larr; Back
    </button>
  );
}
