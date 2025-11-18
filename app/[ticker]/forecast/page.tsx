'use client';

import { use, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { IncomeStatement, CompanyOverview, ForecastInputs, ForecastOutputs } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import ForecastInputPanel from '@/components/ForecastInputPanel';
import ForecastSummaryCard from '@/components/ForecastSummaryCard';
import { getDefaultForecastInputs, runForecast, calculateUpside } from '@/lib/forecasting';
import { formatCurrency } from '@/lib/calculations';

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

async function fetchPrices(ticker: string) {
  const res = await fetch(`/api/ticker/${ticker}/prices`);
  if (!res.ok) return null;
  const prices = await res.json();
  return prices.length > 0 ? prices[prices.length - 1].close : null;
}

export default function ForecastPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = use(params);
  const upperTicker = ticker.toUpperCase();

  const [forecastInputs, setForecastInputs] = useState<ForecastInputs | null>(null);
  const [forecastOutputs, setForecastOutputs] = useState<ForecastOutputs | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: ['overview', upperTicker],
    queryFn: () => fetchOverview(upperTicker),
  });

  const { data: incomeStatement, isLoading: incomeLoading, error: incomeError } = useQuery({
    queryKey: ['income-statement', upperTicker],
    queryFn: () => fetchIncomeStatement(upperTicker),
    enabled: !!overview,
  });

  const { data: price } = useQuery({
    queryKey: ['prices', upperTicker],
    queryFn: () => fetchPrices(upperTicker),
    enabled: !!overview,
  });

  useEffect(() => {
    if (price !== undefined) {
      setCurrentPrice(price);
    }
  }, [price]);

  // Initialize forecast inputs when data is loaded
  useEffect(() => {
    if (overview && incomeStatement && !forecastInputs) {
      const defaults = getDefaultForecastInputs({ incomeStatement, overview });
      setForecastInputs(defaults);
      setForecastOutputs(runForecast(defaults));
    }
  }, [overview, incomeStatement, forecastInputs]);

  // Recalculate forecast when inputs change
  useEffect(() => {
    if (forecastInputs) {
      setForecastOutputs(runForecast(forecastInputs));
    }
  }, [forecastInputs]);

  const handleReset = () => {
    if (overview && incomeStatement) {
      const defaults = getDefaultForecastInputs({ incomeStatement, overview });
      setForecastInputs(defaults);
      setForecastOutputs(runForecast(defaults));
    }
  };

  const isLoading = overviewLoading || incomeLoading;
  const error = overviewError || incomeError;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !overview || !incomeStatement) {
    return <ErrorMessage message={error?.message || 'Failed to load forecast data'} />;
  }

  if (!forecastInputs || !forecastOutputs) {
    return <LoadingSpinner />;
  }

  const latestRevenue = incomeStatement.annualReports[0]
    ? parseFloat(incomeStatement.annualReports[0].totalRevenue || '0')
    : 0;
  const latestNetIncome = incomeStatement.annualReports[0]
    ? parseFloat(incomeStatement.annualReports[0].netIncome || '0')
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Forecast</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input Panel */}
        <ForecastInputPanel
          inputs={forecastInputs}
          onChange={setForecastInputs}
          onReset={handleReset}
        />

        {/* Summary Card */}
        <ForecastSummaryCard outputs={forecastOutputs} currentPrice={currentPrice} />
      </div>

      {/* Details Table */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Forecast Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Line Item
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Current
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Projected
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Change
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
              <tr>
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  Revenue
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                  {formatCurrency(latestRevenue)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                  {formatCurrency(forecastOutputs.projectedRevenue)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-green-600 dark:text-green-400">
                  {((forecastOutputs.projectedRevenue - latestRevenue) / latestRevenue * 100).toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  Gross Profit
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                  {formatCurrency(latestRevenue * (forecastInputs.grossMargin / 100))}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                  {formatCurrency(forecastOutputs.projectedGrossProfit)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-green-600 dark:text-green-400">
                  {((forecastOutputs.projectedGrossProfit - latestRevenue * (forecastInputs.grossMargin / 100)) / (latestRevenue * (forecastInputs.grossMargin / 100)) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  Operating Income
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                  {formatCurrency(latestRevenue * (forecastInputs.operatingMargin / 100))}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                  {formatCurrency(forecastOutputs.projectedOperatingIncome)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-green-600 dark:text-green-400">
                  {((forecastOutputs.projectedOperatingIncome - latestRevenue * (forecastInputs.operatingMargin / 100)) / (latestRevenue * (forecastInputs.operatingMargin / 100)) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  Net Income
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                  {formatCurrency(latestNetIncome)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                  {formatCurrency(forecastOutputs.projectedNetIncome)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-green-600 dark:text-green-400">
                  {((forecastOutputs.projectedNetIncome - latestNetIncome) / latestNetIncome * 100).toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  EPS
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                  ${(latestNetIncome / (forecastInputs.sharesOutstanding || 1)).toFixed(2)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                  ${forecastOutputs.projectedEPS.toFixed(2)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-green-600 dark:text-green-400">
                  {((forecastOutputs.projectedEPS - latestNetIncome / (forecastInputs.sharesOutstanding || 1)) / (latestNetIncome / (forecastInputs.sharesOutstanding || 1)) * 100).toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

