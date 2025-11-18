'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWatchlist, addToWatchlist, removeFromWatchlist, getNotesForTicker } from '@/lib/storage';
import type { WatchlistItem, TickerNote } from '@/lib/types';
import WatchlistTable from '@/components/WatchlistTable';
import NotesEditor from '@/components/NotesEditor';
import TickerSearchBar from '@/components/TickerSearchBar';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatCurrency } from '@/lib/calculations';

async function fetchPrice(ticker: string) {
  try {
    const res = await fetch(`/api/ticker/${ticker}/prices`);
    if (!res.ok) return null;
    const prices = await res.json();
    if (prices.length < 2) return null;
    const current = prices[prices.length - 1].close;
    const previous = prices[prices.length - 2].close;
    return {
      current,
      change: current - previous,
      changePercent: ((current - previous) / previous) * 100,
    };
  } catch {
    return null;
  }
}

async function fetchMarketCap(ticker: string) {
  try {
    const res = await fetch(`/api/ticker/${ticker}/overview`);
    if (!res.ok) return null;
    const overview = await res.json();
    return overview.marketCap;
  } catch {
    return null;
  }
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [notes, setNotes] = useState<TickerNote[]>([]);
  const [inputTicker, setInputTicker] = useState('');

  useEffect(() => {
    setWatchlist(getWatchlist());
  }, []);

  const pricesQueries = useQuery({
    queryKey: ['watchlist-prices', watchlist.map((w) => w.ticker)],
    queryFn: async () => {
      const priceMap: Record<string, { current: number; change: number; changePercent: number }> = {};
      const marketCapMap: Record<string, number | null> = {};

      await Promise.all(
        watchlist.map(async (item) => {
          const [price, marketCap] = await Promise.all([
            fetchPrice(item.ticker),
            fetchMarketCap(item.ticker),
          ]);
          if (price) {
            priceMap[item.ticker] = price;
          }
          marketCapMap[item.ticker] = marketCap;
        })
      );

      return { prices: priceMap, marketCaps: marketCapMap };
    },
    enabled: watchlist.length > 0,
    refetchInterval: 60000, // Refetch every minute
  });

  useEffect(() => {
    if (selectedTicker) {
      setNotes(getNotesForTicker(selectedTicker));
    } else {
      setNotes([]);
    }
  }, [selectedTicker]);

  const handleAddTicker = () => {
    const ticker = inputTicker.toUpperCase().trim();
    if (ticker && !watchlist.some((w) => w.ticker === ticker)) {
      addToWatchlist(ticker);
      setWatchlist(getWatchlist());
      setInputTicker('');
    }
  };

  const handleRemoveTicker = (ticker: string) => {
    removeFromWatchlist(ticker);
    setWatchlist(getWatchlist());
    if (selectedTicker === ticker) {
      setSelectedTicker(null);
    }
  };

  const handleNotesChange = () => {
    if (selectedTicker) {
      setNotes(getNotesForTicker(selectedTicker));
    }
  };

  const prices = pricesQueries.data?.prices || {};
  const marketCaps = pricesQueries.data?.marketCaps || {};

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Watchlist</h1>

      {/* Add Ticker */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputTicker}
            onChange={(e) => setInputTicker(e.target.value.toUpperCase())}
            placeholder="Enter ticker symbol"
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddTicker();
              }
            }}
          />
          <button
            onClick={handleAddTicker}
            className="rounded bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </div>

      {/* Watchlist Table */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        {pricesQueries.isLoading && watchlist.length > 0 && <LoadingSpinner />}
        {watchlist.length > 0 ? (
          <WatchlistTable
            items={watchlist}
            prices={prices}
            marketCaps={marketCaps}
            onRemove={handleRemoveTicker}
            onSelectTicker={setSelectedTicker}
            selectedTicker={selectedTicker}
          />
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">Your watchlist is empty. Add tickers above.</p>
        )}
      </div>

      {/* Notes Section */}
      {selectedTicker && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Notes for {selectedTicker}
            </h2>
            <button
              onClick={() => setSelectedTicker(null)}
              className="rounded bg-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-400"
            >
              Close
            </button>
          </div>
          <NotesEditor ticker={selectedTicker} notes={notes} onNotesChange={handleNotesChange} />
        </div>
      )}
    </div>
  );
}

