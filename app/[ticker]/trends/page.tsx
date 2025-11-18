'use client';

import { use, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { IncomeStatement, BalanceSheet, CashFlow, PeriodType } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import LineChart from '@/components/LineChart';
import Toggle from '@/components/Toggle';
import {
  buildTrendsSeriesFromStatements,
  calculateFreeCashFlow,
  calculateYoYGrowth,
} from '@/lib/calculations';
import { parseValue } from '@/lib/transformers';

async function fetchIncomeStatement(ticker: string): Promise<IncomeStatement> {
  const res = await fetch(`/api/ticker/${ticker}/income-statement`);
  if (!res.ok) throw new Error('Failed to fetch income statement');
  return res.json();
}

async function fetchBalanceSheet(ticker: string): Promise<BalanceSheet> {
  const res = await fetch(`/api/ticker/${ticker}/balance-sheet`);
  if (!res.ok) throw new Error('Failed to fetch balance sheet');
  return res.json();
}

async function fetchCashFlow(ticker: string): Promise<CashFlow> {
  const res = await fetch(`/api/ticker/${ticker}/cash-flow`);
  if (!res.ok) throw new Error('Failed to fetch cash flow');
  return res.json();
}

export default function TrendsPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = use(params);
  const upperTicker = ticker.toUpperCase();

  const [periodType, setPeriodType] = useState<PeriodType>('annual');
  const [showYoY, setShowYoY] = useState<Record<string, boolean>>({});

  const { data: incomeStatement, isLoading: incomeLoading, error: incomeError } = useQuery({
    queryKey: ['income-statement', upperTicker],
    queryFn: () => fetchIncomeStatement(upperTicker),
  });

  const { data: balanceSheet, isLoading: balanceLoading, error: balanceError } = useQuery({
    queryKey: ['balance-sheet', upperTicker],
    queryFn: () => fetchBalanceSheet(upperTicker),
  });

  const { data: cashFlow, isLoading: cashLoading, error: cashError } = useQuery({
    queryKey: ['cash-flow', upperTicker],
    queryFn: () => fetchCashFlow(upperTicker),
  });

  const isLoading = incomeLoading || balanceLoading || cashLoading;
  const error = incomeError || balanceError || cashError;

  const reports = useMemo(() => {
    if (!incomeStatement) return [];
    return periodType === 'annual' ? incomeStatement.annualReports : incomeStatement.quarterlyReports;
  }, [incomeStatement, periodType]);

  const revenueData = useMemo(() => {
    if (!incomeStatement) return [];
    return buildTrendsSeriesFromStatements(reports, 'totalRevenue');
  }, [incomeStatement, reports]);

  const netIncomeData = useMemo(() => {
    if (!incomeStatement) return [];
    return buildTrendsSeriesFromStatements(reports, 'netIncome');
  }, [incomeStatement, reports]);

  const epsData = useMemo(() => {
    if (!incomeStatement) return [];
    return buildTrendsSeriesFromStatements(reports, 'eps');
  }, [incomeStatement, reports]);

  const fcfData = useMemo(() => {
    if (!cashFlow) return [];
    const reports = periodType === 'annual' ? cashFlow.annualReports : cashFlow.quarterlyReports;
    return calculateFreeCashFlow(cashFlow, periodType);
  }, [cashFlow, periodType]);

  const grossMarginData = useMemo(() => {
    if (!incomeStatement) return [];
    const sortedReports = [...reports].sort(
      (a, b) => new Date(a.fiscalDateEnding).getTime() - new Date(b.fiscalDateEnding).getTime()
    );
    return sortedReports.map((report) => {
      const revenue = parseValue(report.totalRevenue);
      const grossProfit = parseValue(report.grossProfit);
      const margin = revenue && grossProfit ? (grossProfit / revenue) * 100 : null;
      return { date: report.fiscalDateEnding, value: margin };
    });
  }, [incomeStatement, reports]);

  const operatingMarginData = useMemo(() => {
    if (!incomeStatement) return [];
    const sortedReports = [...reports].sort(
      (a, b) => new Date(a.fiscalDateEnding).getTime() - new Date(b.fiscalDateEnding).getTime()
    );
    return sortedReports.map((report) => {
      const revenue = parseValue(report.totalRevenue);
      const operatingIncome = parseValue(report.operatingIncome);
      const margin = revenue && operatingIncome ? (operatingIncome / revenue) * 100 : null;
      return { date: report.fiscalDateEnding, value: margin };
    });
  }, [incomeStatement, reports]);

  const sharesData = useMemo(() => {
    if (!incomeStatement) return [];
    return buildTrendsSeriesFromStatements(reports, 'sharesOutstanding');
  }, [incomeStatement, reports]);

  const debtCashData = useMemo(() => {
    if (!balanceSheet) return [];
    const reports = periodType === 'annual' ? balanceSheet.annualReports : balanceSheet.quarterlyReports;
    const sortedReports = [...reports].sort(
      (a, b) => new Date(a.fiscalDateEnding).getTime() - new Date(b.fiscalDateEnding).getTime()
    );
    return sortedReports.map((report) => ({
      date: report.fiscalDateEnding,
      debt: parseValue(report.totalDebt),
      cash: parseValue(report.cashAndCashEquivalentsAtCarryingValue),
    }));
  }, [balanceSheet, periodType]);

  const addYoYData = (data: { date: string; value: number | null }[], key: string) => {
    if (!showYoY[key]) return data;
    return data.map((point, idx) => {
      const previous = idx > 0 ? data[idx - 1].value : null;
      const yoy = point.value && previous ? calculateYoYGrowth(point.value, previous) : null;
      return {
        ...point,
        [`${key}YoY`]: yoy,
      };
    });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !incomeStatement || !balanceSheet || !cashFlow) {
    return <ErrorMessage message={error?.message || 'Failed to load trends data'} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trends</h1>
        <Toggle
          label="Annual"
          checked={periodType === 'annual'}
          onChange={(checked) => setPeriodType(checked ? 'annual' : 'quarterly')}
        />
      </div>

      {/* Revenue */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue</h2>
          <Toggle
            label="Show YoY Growth"
            checked={showYoY.revenue || false}
            onChange={(checked) => setShowYoY({ ...showYoY, revenue: checked })}
          />
        </div>
        <LineChart
          data={addYoYData(revenueData, 'revenue')}
          lines={[
            { key: 'value', name: 'Revenue', color: '#3b82f6' },
            ...(showYoY.revenue ? [{ key: 'revenueYoY', name: 'YoY Growth %', color: '#10b981' }] : []),
          ]}
          height={300}
        />
      </div>

      {/* Net Income */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Net Income</h2>
          <Toggle
            label="Show YoY Growth"
            checked={showYoY.netIncome || false}
            onChange={(checked) => setShowYoY({ ...showYoY, netIncome: checked })}
          />
        </div>
        <LineChart
          data={addYoYData(netIncomeData, 'netIncome')}
          lines={[
            { key: 'value', name: 'Net Income', color: '#3b82f6' },
            ...(showYoY.netIncome ? [{ key: 'netIncomeYoY', name: 'YoY Growth %', color: '#10b981' }] : []),
          ]}
          height={300}
        />
      </div>

      {/* EPS */}
      {epsData.some((d) => d.value !== null) && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">EPS</h2>
            <Toggle
              label="Show YoY Growth"
              checked={showYoY.eps || false}
              onChange={(checked) => setShowYoY({ ...showYoY, eps: checked })}
            />
          </div>
          <LineChart
            data={addYoYData(epsData, 'eps')}
            lines={[
              { key: 'value', name: 'EPS', color: '#3b82f6' },
              ...(showYoY.eps ? [{ key: 'epsYoY', name: 'YoY Growth %', color: '#10b981' }] : []),
            ]}
            height={300}
          />
        </div>
      )}

      {/* Free Cash Flow */}
      {fcfData.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Free Cash Flow</h2>
          <LineChart
            data={fcfData}
            lines={[{ key: 'value', name: 'Free Cash Flow', color: '#3b82f6' }]}
            height={300}
          />
        </div>
      )}

      {/* Operating Margin */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Operating Margin</h2>
        <LineChart
          data={operatingMarginData}
          lines={[{ key: 'value', name: 'Operating Margin %', color: '#3b82f6' }]}
          height={300}
        />
      </div>

      {/* Gross Margin */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Gross Margin</h2>
        <LineChart
          data={grossMarginData}
          lines={[{ key: 'value', name: 'Gross Margin %', color: '#3b82f6' }]}
          height={300}
        />
      </div>

      {/* Shares Outstanding */}
      {sharesData.some((d) => d.value !== null) && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Shares Outstanding</h2>
          <LineChart
            data={sharesData}
            lines={[{ key: 'value', name: 'Shares Outstanding', color: '#3b82f6' }]}
            height={300}
          />
        </div>
      )}

      {/* Debt vs Cash */}
      {debtCashData.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Debt vs Cash</h2>
          <LineChart
            data={debtCashData}
            lines={[
              { key: 'debt', name: 'Total Debt', color: '#ef4444' },
              { key: 'cash', name: 'Cash & Equivalents', color: '#10b981' },
            ]}
            height={300}
          />
        </div>
      )}
    </div>
  );
}

