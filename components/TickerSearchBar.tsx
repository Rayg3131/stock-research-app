'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateTicker } from '@/lib/alphaVantage';

interface TickerSearchBarProps {
  className?: string;
  placeholder?: string;
}

export default function TickerSearchBar({ className = '', placeholder = 'Enter ticker symbol...' }: TickerSearchBarProps) {
  const [ticker, setTicker] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const upperTicker = ticker.toUpperCase().trim();

    if (!upperTicker) {
      setError('Please enter a ticker symbol');
      return;
    }

    if (!validateTicker(upperTicker)) {
      setError('Invalid ticker symbol format');
      return;
    }

    setError('');
    router.push(`/${upperTicker}/overview`);
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex gap-2">
        <input
          type="text"
          value={ticker}
          onChange={(e) => {
            setTicker(e.target.value.toUpperCase());
            setError('');
          }}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Search
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </form>
  );
}

