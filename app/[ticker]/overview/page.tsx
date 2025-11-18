'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CompanyOverview, IncomeStatement, Earnings } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import MetricCard from '@/components/MetricCard';
import { formatCurrency, formatPercentage } from '@/lib/calculations';
import { getLatestIncomeStatementValue } from '@/lib/transformers';

async function fetchOverview(ticker: string): Promise<CompanyOverview> {
  const res = await fetch(`/api/ticker/${ticker}/overview`);
  if (!res.ok) throw new Error('Failed to fetch overview');
  return res.json();
}

async function fetchIncomeStatement(ticker: string): Promise<IncomeStatement> {
  const res = await fetch(`/api/ticker/${ticker}/income-statement`);
  if (!res.ok) throw new Error('Failed to fetch income statement');
  return res.json();
}

async function fetchEarnings(ticker: string): Promise<Earnings | null> {
  try {
    const res = await fetch(`/api/ticker/${ticker}/earnings`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default function OverviewPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = use(params);
  const upperTicker = ticker.toUpperCase();

  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: ['overview', upperTicker],
    queryFn: () => fetchOverview(upperTicker),
  });

  const { data: incomeStatement, isLoading: incomeLoading } = useQuery({
    queryKey: ['income-statement', upperTicker],
    queryFn: () => fetchIncomeStatement(upperTicker),
    enabled: !!overview,
  });

  const { data: earnings } = useQuery({
    queryKey: ['earnings', upperTicker],
    queryFn: () => fetchEarnings(upperTicker),
    enabled: !!overview,
  });

  if (overviewLoading) {
    return <LoadingSpinner />;
  }

  if (overviewError || !overview) {
    return <ErrorMessage message={overviewError?.message || 'Failed to load company overview'} />;
  }

  const latestRevenue = incomeStatement
    ? getLatestIncomeStatementValue(incomeStatement, 'totalRevenue')
    : overview.revenueTTM;
  const latestNetIncome = incomeStatement
    ? getLatestIncomeStatementValue(incomeStatement, 'netIncome')
    : null;
  const latestEPS = incomeStatement
    ? getLatestIncomeStatementValue(incomeStatement, 'eps')
    : null;

  const nextEarnings = earnings?.quarterlyEarnings?.[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {overview.name} ({upperTicker})
        </h1>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>{overview.sector}</span>
          {overview.industry && <span>• {overview.industry}</span>}
          {overview.marketCap && (
            <span>• Market Cap: {formatCurrency(overview.marketCap)}</span>
          )}
        </div>
      </div>

      {/* Business Description */}
      {overview.description && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
            Business Description
          </h2>
          <p className="text-gray-700 dark:text-gray-300">{overview.description}</p>
        </div>
      )}

      {/* Quick Stats */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Quick Stats</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {latestRevenue !== null && (
            <MetricCard label="Revenue (Latest)" value={formatCurrency(latestRevenue)} />
          )}
          {latestNetIncome !== null && (
            <MetricCard label="Net Income (Latest)" value={formatCurrency(latestNetIncome)} />
          )}
          {latestEPS !== null && (
            <MetricCard label="EPS (Latest)" value={`$${latestEPS.toFixed(2)}`} />
          )}
          {overview.marketCap !== null && (
            <MetricCard label="Market Cap" value={formatCurrency(overview.marketCap)} />
          )}
          {overview.peRatio !== null && (
            <MetricCard label="P/E Ratio" value={overview.peRatio.toFixed(2)} />
          )}
          {overview.priceToSales !== null && (
            <MetricCard label="P/S Ratio" value={overview.priceToSales.toFixed(2)} />
          )}
          {overview.priceToBook !== null && (
            <MetricCard label="P/B Ratio" value={overview.priceToBook.toFixed(2)} />
          )}
          {overview.dividendYield !== null && (
            <MetricCard
              label="Dividend Yield"
              value={formatPercentage(overview.dividendYield)}
            />
          )}
        </div>
      </div>

      {/* Key Dates */}
      {nextEarnings && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Key Dates</h2>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <p>
              <span className="font-medium">Next Earnings:</span>{' '}
              {new Date(nextEarnings.reportedDate).toLocaleDateString()}
            </p>
            {nextEarnings.estimatedEPS && (
              <p className="mt-1">
                <span className="font-medium">Estimated EPS:</span> ${nextEarnings.estimatedEPS}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

