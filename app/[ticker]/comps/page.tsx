'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CompanyOverview, IncomeStatement } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { formatCurrency, formatPercentage, calculateYoYGrowth } from '@/lib/calculations';
import { getLatestIncomeStatementValue } from '@/lib/transformers';

interface CompData {
  ticker: string;
  overview: CompanyOverview | null;
  incomeStatement: IncomeStatement | null;
  revenue: number | null;
  revenueGrowth: number | null;
  netMargin: number | null;
}

async function fetchCompData(ticker: string): Promise<CompData> {
  try {
    const [overviewRes, incomeRes] = await Promise.all([
      fetch(`/api/ticker/${ticker}/overview`),
      fetch(`/api/ticker/${ticker}/income-statement`),
    ]);

    const overview = overviewRes.ok ? await overviewRes.json() : null;
    const incomeStatement = incomeRes.ok ? await incomeRes.json() : null;

    const revenue = incomeStatement
      ? getLatestIncomeStatementValue(incomeStatement, 'totalRevenue')
      : overview?.revenueTTM || null;

    const previousRevenue = incomeStatement
      ? getLatestIncomeStatementValue(incomeStatement, 'totalRevenue', 'annual')
      : null;
    const revenueGrowth = revenue && previousRevenue ? calculateYoYGrowth(revenue, previousRevenue) : null;

    const netIncome = incomeStatement
      ? getLatestIncomeStatementValue(incomeStatement, 'netIncome')
      : null;
    const netMargin = revenue && netIncome ? (netIncome / revenue) * 100 : null;

    return {
      ticker: ticker.toUpperCase(),
      overview,
      incomeStatement,
      revenue,
      revenueGrowth,
      netMargin,
    };
  } catch {
    return {
      ticker: ticker.toUpperCase(),
      overview: null,
      incomeStatement: null,
      revenue: null,
      revenueGrowth: null,
      netMargin: null,
    };
  }
}

type SortField = 'ticker' | 'marketCap' | 'revenue' | 'revenueGrowth' | 'netMargin' | 'pe' | 'ps' | 'pb';
type SortDirection = 'asc' | 'desc';

export default function CompsPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = use(params);
  const upperTicker = ticker.toUpperCase();

  const [compTickers, setCompTickers] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sortField, setSortField] = useState<SortField>('ticker');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const compQueries = useQuery({
    queryKey: ['comps', compTickers],
    queryFn: async () => {
      const results = await Promise.all(compTickers.map((t) => fetchCompData(t)));
      return results.filter((r) => r.overview !== null);
    },
    enabled: compTickers.length > 0,
  });

  const handleAddComps = () => {
    const tickers = inputValue
      .split(',')
      .map((t) => t.trim().toUpperCase())
      .filter((t) => t && t !== upperTicker);
    if (tickers.length > 0) {
      setCompTickers([...new Set([...compTickers, ...tickers])]);
      setInputValue('');
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedComps = compQueries.data
    ? [...compQueries.data].sort((a, b) => {
        let aValue: number | string | null = null;
        let bValue: number | string | null = null;

        switch (sortField) {
          case 'ticker':
            aValue = a.ticker;
            bValue = b.ticker;
            break;
          case 'marketCap':
            aValue = a.overview?.marketCap ?? null;
            bValue = b.overview?.marketCap ?? null;
            break;
          case 'revenue':
            aValue = a.revenue;
            bValue = b.revenue;
            break;
          case 'revenueGrowth':
            aValue = a.revenueGrowth;
            bValue = b.revenueGrowth;
            break;
          case 'netMargin':
            aValue = a.netMargin;
            bValue = b.netMargin;
            break;
          case 'pe':
            aValue = a.overview?.peRatio ?? null;
            bValue = b.overview?.peRatio ?? null;
            break;
          case 'ps':
            aValue = a.overview?.priceToSales ?? null;
            bValue = b.overview?.priceToSales ?? null;
            break;
          case 'pb':
            aValue = a.overview?.priceToBook ?? null;
            bValue = b.overview?.priceToBook ?? null;
            break;
        }

        if (aValue === null && bValue === null) return 0;
        if (aValue === null) return 1;
        if (bValue === null) return -1;

        const comparison =
          typeof aValue === 'string' && typeof bValue === 'string'
            ? aValue.localeCompare(bValue)
            : (aValue as number) - (bValue as number);

        return sortDirection === 'asc' ? comparison : -comparison;
      })
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Comparable Companies</h1>

      {/* Input */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter tickers (comma-separated, e.g., AAPL, MSFT, GOOGL)"
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddComps();
              }
            }}
          />
          <button
            onClick={handleAddComps}
            className="rounded bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
          >
            Load Comps
          </button>
        </div>
      </div>

      {/* Table */}
      {compQueries.isLoading && <LoadingSpinner />}
      {compQueries.error && (
        <ErrorMessage message={compQueries.error.message || 'Failed to load comps data'} />
      )}

      {compQueries.data && compQueries.data.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {(['ticker', 'marketCap', 'revenue', 'revenueGrowth', 'netMargin', 'pe', 'ps', 'pb'] as SortField[]).map(
                  (field) => (
                    <th
                      key={field}
                      onClick={() => handleSort(field)}
                      className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                    >
                      {field === 'ticker'
                        ? 'Ticker'
                        : field === 'marketCap'
                          ? 'Market Cap'
                          : field === 'revenue'
                            ? 'Revenue'
                            : field === 'revenueGrowth'
                              ? 'Rev Growth'
                              : field === 'netMargin'
                                ? 'Net Margin'
                                : field === 'pe'
                                  ? 'P/E'
                                  : field === 'ps'
                                    ? 'P/S'
                                    : 'P/B'}
                      {sortField === field && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
              {sortedComps.map((comp) => (
                <tr key={comp.ticker} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {comp.ticker}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {comp.overview?.marketCap !== null && comp.overview?.marketCap !== undefined
                      ? formatCurrency(comp.overview.marketCap)
                      : 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {comp.revenue !== null ? formatCurrency(comp.revenue) : 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {comp.revenueGrowth !== null ? formatPercentage(comp.revenueGrowth) : 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {comp.netMargin !== null ? formatPercentage(comp.netMargin) : 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {comp.overview?.peRatio !== null && comp.overview?.peRatio !== undefined
                      ? comp.overview.peRatio.toFixed(2)
                      : 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {comp.overview?.priceToSales !== null && comp.overview?.priceToSales !== undefined
                      ? comp.overview.priceToSales.toFixed(2)
                      : 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {comp.overview?.priceToBook !== null && comp.overview?.priceToBook !== undefined
                      ? comp.overview.priceToBook.toFixed(2)
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {compQueries.data && compQueries.data.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">No comparable companies loaded. Add tickers above.</p>
        </div>
      )}
    </div>
  );
}

