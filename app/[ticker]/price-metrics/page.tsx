'use client';

import { use, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PricePoint, CompanyOverview, IncomeStatement, TimeRange } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import LineChart from '@/components/LineChart';
import BarChart from '@/components/BarChart';
import TimeRangeTabs from '@/components/TimeRangeTabs';
import Toggle from '@/components/Toggle';
import MetricCard from '@/components/MetricCard';
import { formatCurrency, formatPercentage } from '@/lib/calculations';
import { calculateGrowthMetricsFromStatements, calculateProfitabilityMetrics } from '@/lib/calculations';
import { DEFAULT_SPY_TICKER } from '@/lib/config';

async function fetchPrices(ticker: string): Promise<PricePoint[]> {
  const res = await fetch(`/api/ticker/${ticker}/prices`);
  if (!res.ok) throw new Error('Failed to fetch prices');
  return res.json();
}

async function fetchOverview(ticker: string): Promise<CompanyOverview> {
  const res = await fetch(`/api/ticker/${ticker}/overview`);
  if (!res.ok) throw new Error('Failed to fetch overview');
  return res.json();
}

async function fetchIncomeStatement(ticker: string) {
  const res = await fetch(`/api/ticker/${ticker}/income-statement`);
  if (!res.ok) return null;
  return res.json();
}

export default function PriceMetricsPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = use(params);
  const upperTicker = ticker.toUpperCase();

  const [timeRange, setTimeRange] = useState<TimeRange>('1Y');
  const [showSPY, setShowSPY] = useState(false);

  const { data: prices, isLoading: pricesLoading, error: pricesError } = useQuery({
    queryKey: ['prices', upperTicker],
    queryFn: () => fetchPrices(upperTicker),
  });

  const { data: spyPrices } = useQuery({
    queryKey: ['prices', DEFAULT_SPY_TICKER],
    queryFn: () => fetchPrices(DEFAULT_SPY_TICKER),
    enabled: showSPY,
  });

  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: ['overview', upperTicker],
    queryFn: () => fetchOverview(upperTicker),
  });

  const { data: incomeStatement } = useQuery({
    queryKey: ['income-statement', upperTicker],
    queryFn: () => fetchIncomeStatement(upperTicker),
    enabled: !!overview,
  });

  const filteredPrices = useMemo(() => {
    if (!prices) return [];
    const now = new Date();
    const ranges: Record<TimeRange, number> = {
      '1D': 1,
      '5D': 5,
      '1M': 30,
      '6M': 180,
      '1Y': 365,
      '5Y': 1825,
      'Max': Infinity,
    };
    const days = ranges[timeRange];
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return prices.filter((p) => new Date(p.date) >= cutoff);
  }, [prices, timeRange]);

  const chartData = useMemo(() => {
    if (!filteredPrices.length) return [];
    const basePrice = filteredPrices[0].close;
    const spyBasePrice = showSPY && spyPrices && spyPrices.length > 0 ? spyPrices[0].close : null;

    return filteredPrices.map((p) => {
      const data: any = {
        date: p.date,
        price: p.close,
        volume: p.volume,
      };
      if (showSPY && spyBasePrice) {
        const spyPrice = spyPrices?.find((sp) => sp.date === p.date);
        if (spyPrice) {
          // Normalize SPY to start at same relative point
          data.spy = (spyPrice.close / spyBasePrice) * basePrice;
        }
      }
      return data;
    });
  }, [filteredPrices, spyPrices, showSPY]);

  const volumeData = useMemo(() => {
    return filteredPrices.map((p) => ({
      date: p.date,
      volume: p.volume,
    }));
  }, [filteredPrices]);

  const growthMetrics = incomeStatement
    ? calculateGrowthMetricsFromStatements(incomeStatement)
    : null;
  const profitabilityMetrics = incomeStatement
    ? calculateProfitabilityMetrics(incomeStatement)
    : null;

  const isLoading = pricesLoading || overviewLoading;
  const error = pricesError || overviewError;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !prices || !overview) {
    return <ErrorMessage message={error?.message || 'Failed to load price and metrics data'} />;
  }

  const currentPrice = prices.length > 0 ? prices[prices.length - 1].close : null;
  const previousPrice = prices.length > 1 ? prices[prices.length - 2].close : null;
  const priceChange = currentPrice && previousPrice ? currentPrice - previousPrice : null;
  const priceChangePercent =
    currentPrice && previousPrice ? ((currentPrice - previousPrice) / previousPrice) * 100 : null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Price & Metrics</h1>

      {/* Price Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {currentPrice ? formatCurrency(currentPrice, 2) : 'N/A'}
            </div>
            {priceChange !== null && priceChangePercent !== null && (
              <div
                className={`mt-1 text-lg ${
                  priceChange >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {priceChange >= 0 ? '+' : ''}
                {formatCurrency(priceChange, 2)} ({priceChangePercent >= 0 ? '+' : ''}
                {priceChangePercent.toFixed(2)}%)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TimeRangeTabs selected={timeRange} onChange={setTimeRange} />
        <Toggle label="Overlay SPY (S&P 500)" checked={showSPY} onChange={setShowSPY} />
      </div>

      {/* Price Chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Price Chart</h2>
        <LineChart
          data={chartData}
          lines={[
            { key: 'price', name: upperTicker, color: '#3b82f6' },
            ...(showSPY ? [{ key: 'spy', name: 'SPY', color: '#ef4444' }] : []),
          ]}
          height={400}
        />
      </div>

      {/* Volume Chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Volume</h2>
        <BarChart data={volumeData} dataKey="volume" name="Volume" height={200} />
      </div>

      {/* Metrics */}
      <div className="space-y-6">
        {/* Valuation Metrics */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Valuation Metrics</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {overview.peRatio !== null && (
              <MetricCard label="P/E Ratio" value={overview.peRatio.toFixed(2)} />
            )}
            {overview.forwardPE !== null && (
              <MetricCard label="Forward P/E" value={overview.forwardPE.toFixed(2)} />
            )}
            {overview.priceToSales !== null && (
              <MetricCard label="P/S Ratio" value={overview.priceToSales.toFixed(2)} />
            )}
            {overview.priceToBook !== null && (
              <MetricCard label="P/B Ratio" value={overview.priceToBook.toFixed(2)} />
            )}
            {overview.evToSales !== null && (
              <MetricCard label="EV/Sales" value={overview.evToSales.toFixed(2)} />
            )}
            {overview.evToEbitda !== null && (
              <MetricCard label="EV/EBITDA" value={overview.evToEbitda.toFixed(2)} />
            )}
          </div>
        </div>

        {/* Profitability Metrics */}
        {profitabilityMetrics && (
          <div>
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Profitability Metrics
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profitabilityMetrics.grossMargin !== null && (
                <MetricCard
                  label="Gross Margin"
                  value={formatPercentage(profitabilityMetrics.grossMargin)}
                />
              )}
              {profitabilityMetrics.operatingMargin !== null && (
                <MetricCard
                  label="Operating Margin"
                  value={formatPercentage(profitabilityMetrics.operatingMargin)}
                />
              )}
              {profitabilityMetrics.netMargin !== null && (
                <MetricCard
                  label="Net Margin"
                  value={formatPercentage(profitabilityMetrics.netMargin)}
                />
              )}
              {overview.roe !== null && (
                <MetricCard label="ROE" value={formatPercentage(overview.roe)} />
              )}
              {overview.roa !== null && (
                <MetricCard label="ROA" value={formatPercentage(overview.roa)} />
              )}
            </div>
          </div>
        )}

        {/* Growth Metrics */}
        {growthMetrics && (
          <div>
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Growth Metrics</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {growthMetrics.revenueYoY !== null && (
                <MetricCard label="Revenue YoY" value={formatPercentage(growthMetrics.revenueYoY)} />
              )}
              {growthMetrics.netIncomeYoY !== null && (
                <MetricCard
                  label="Net Income YoY"
                  value={formatPercentage(growthMetrics.netIncomeYoY)}
                />
              )}
              {growthMetrics.epsYoY !== null && (
                <MetricCard label="EPS YoY" value={formatPercentage(growthMetrics.epsYoY)} />
              )}
              {growthMetrics.revenueCAGR3Y !== null && (
                <MetricCard label="Revenue CAGR (3Y)" value={formatPercentage(growthMetrics.revenueCAGR3Y)} />
              )}
              {growthMetrics.revenueCAGR5Y !== null && (
                <MetricCard label="Revenue CAGR (5Y)" value={formatPercentage(growthMetrics.revenueCAGR5Y)} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

