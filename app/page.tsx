'use client';

import { useRouter } from 'next/navigation';
import TickerSearchBar from '@/components/TickerSearchBar';
import { DEFAULT_EXAMPLE_TICKERS } from '@/lib/config';

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
            Stock Research App
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Comprehensive financial analysis and research tools
          </p>
        </div>

        <div className="mt-12">
          <TickerSearchBar placeholder="Enter ticker symbol (e.g., AAPL, MSFT, TSLA)..." />
        </div>

        <div className="mt-8">
          <p className="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Try these example tickers:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {DEFAULT_EXAMPLE_TICKERS.map((ticker) => (
              <button
                key={ticker}
                onClick={() => router.push(`/${ticker}/overview`)}
                className="rounded-lg border border-gray-300 bg-white px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {ticker}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
