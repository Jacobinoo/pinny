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
        border: 'none',
        color: 'inherit',
        font: 'inherit',
        cursor: 'pointer',
        textDecoration: 'none'
      }}
    >
      &larr; Back
    </button>
  );
}
