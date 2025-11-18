'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { IncomeStatement, BalanceSheet, CashFlow, StatementType, PeriodType } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import StatementTable from '@/components/StatementTable';
import Toggle from '@/components/Toggle';
import {
  INCOME_STATEMENT_FIELDS,
  BALANCE_SHEET_FIELDS,
  CASH_FLOW_FIELDS,
} from '@/lib/transformers';

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

export default function StatementsPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = use(params);
  const upperTicker = ticker.toUpperCase();

  const [statementType, setStatementType] = useState<StatementType>('income');
  const [periodType, setPeriodType] = useState<PeriodType>('annual');
  const [showYoY, setShowYoY] = useState(false);

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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !incomeStatement || !balanceSheet || !cashFlow) {
    return <ErrorMessage message={error?.message || 'Failed to load financial statements'} />;
  }

  const getCurrentStatement = () => {
    switch (statementType) {
      case 'income':
        return incomeStatement;
      case 'balance':
        return balanceSheet;
      case 'cashflow':
        return cashFlow;
    }
  };

  const getCurrentFields = () => {
    switch (statementType) {
      case 'income':
        return INCOME_STATEMENT_FIELDS as readonly string[];
      case 'balance':
        return BALANCE_SHEET_FIELDS as readonly string[];
      case 'cashflow':
        return CASH_FLOW_FIELDS as readonly string[];
    }
  };

  const currentStatement = getCurrentStatement();
  const currentFields = getCurrentFields();
  const reports = periodType === 'annual' ? currentStatement.annualReports : currentStatement.quarterlyReports;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Statements</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {(['income', 'balance', 'cashflow'] as StatementType[]).map((type) => (
          <button
            key={type}
            onClick={() => setStatementType(type)}
            className={`px-4 py-2 font-medium transition-colors ${
              statementType === type
                ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {type === 'income' ? 'Income Statement' : type === 'balance' ? 'Balance Sheet' : 'Cash Flow'}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        <Toggle
          label="Annual"
          checked={periodType === 'annual'}
          onChange={(checked) => setPeriodType(checked ? 'annual' : 'quarterly')}
        />
        <Toggle label="Show YoY % Change" checked={showYoY} onChange={setShowYoY} />
      </div>

      {/* Statement Table */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <StatementTable reports={reports} fields={currentFields} showYoY={showYoY} />
      </div>
    </div>
  );
}

