'use client';

import { useRouter } from 'next/navigation';
import type { WatchlistItem } from '@/lib/types';
import { formatCurrency, formatPercentage } from '@/lib/calculations';

interface WatchlistTableProps {
  items: WatchlistItem[];
  prices: Record<string, { current: number; change: number; changePercent: number }>;
  marketCaps: Record<string, number | null>;
  onRemove: (ticker: string) => void;
  onSelectTicker?: (ticker: string | null) => void;
  selectedTicker?: string | null;
}

export default function WatchlistTable({ items, prices, marketCaps, onRemove, onSelectTicker, selectedTicker }: WatchlistTableProps) {
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">Your watchlist is empty. Add tickers to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Ticker
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Price
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Change
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Market Cap
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
          {items.map((item) => {
            const price = prices[item.ticker];
            const marketCap = marketCaps[item.ticker];

            return (
              <tr key={item.ticker} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  {item.ticker}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                  {price ? formatCurrency(price.current, 2) : 'Loading...'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                  {price ? (
                    <span
                      className={
                        price.changePercent >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }
                    >
                      {price.changePercent >= 0 ? '+' : ''}
                      {formatPercentage(price.changePercent, 2)}
                    </span>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                  {marketCap !== undefined ? formatCurrency(marketCap) : 'Loading...'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => router.push(`/${item.ticker}/overview`)}
                      className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                    >
                      View
                    </button>
                    {onSelectTicker && (
                      <button
                        onClick={() => onSelectTicker(selectedTicker === item.ticker ? null : item.ticker)}
                        className={`rounded px-3 py-1 text-white ${
                          selectedTicker === item.ticker
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-gray-600 hover:bg-gray-700'
                        }`}
                      >
                        {selectedTicker === item.ticker ? 'Notes ✓' : 'Notes'}
                      </button>
                    )}
                    <button
                      onClick={() => onRemove(item.ticker)}
                      className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

