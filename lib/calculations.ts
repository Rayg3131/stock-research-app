import type {
  IncomeStatement,
  BalanceSheet,
  CashFlow,
  AnnualReport,
  QuarterlyReport,
  GrowthMetrics,
  ProfitabilityMetrics,
  EfficiencyMetrics,
} from './types';
import { parseValue } from './transformers';

/**
 * Calculate Year-over-Year growth percentage
 */
export function calculateYoYGrowth(
  current: number | null,
  previous: number | null
): number | null {
  if (current === null || previous === null || previous === 0) {
    return null;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate margin percentage
 */
export function calculateMargin(
  numerator: number | null,
  revenue: number | null
): number | null {
  if (numerator === null || revenue === null || revenue === 0) {
    return null;
  }
  return (numerator / revenue) * 100;
}

/**
 * Calculate Compound Annual Growth Rate (CAGR)
 */
export function calculateCAGR(
  start: number | null,
  end: number | null,
  years: number
): number | null {
  if (start === null || end === null || start === 0 || years === 0) {
    return null;
  }
  const cagr = (Math.pow(end / start, 1 / years) - 1) * 100;
  return isNaN(cagr) || !isFinite(cagr) ? null : cagr;
}

/**
 * Extract EPS from income statement
 */
export function extractEPSFromIncomeStatement(
  incomeStatement: IncomeStatement,
  period: 'annual' | 'quarterly' = 'annual'
): number | null {
  const reports = period === 'annual' ? incomeStatement.annualReports : incomeStatement.quarterlyReports;
  if (reports.length === 0) return null;

  const latest = reports[0];
  return parseValue(latest.eps);
}

/**
 * Calculate EPS from net income and shares outstanding
 */
export function calculateEPS(
  netIncome: number | null,
  sharesOutstanding: number | null
): number | null {
  if (netIncome === null || sharesOutstanding === null || sharesOutstanding === 0) {
    return null;
  }
  return netIncome / sharesOutstanding;
}

/**
 * Calculate growth metrics from statements
 */
export function calculateGrowthMetricsFromStatements(
  incomeStatement: IncomeStatement,
  period: 'annual' | 'quarterly' = 'annual'
): GrowthMetrics {
  const reports = period === 'annual' ? incomeStatement.annualReports : incomeStatement.quarterlyReports;
  
  if (reports.length === 0) {
    return {
      revenueYoY: null,
      netIncomeYoY: null,
      epsYoY: null,
      revenueCAGR3Y: null,
      revenueCAGR5Y: null,
    };
  }

  const sortedReports = [...reports].sort(
    (a, b) => new Date(b.fiscalDateEnding).getTime() - new Date(a.fiscalDateEnding).getTime()
  );

  const latest = sortedReports[0];
  const previous = sortedReports[1];
  const threeYearsAgo = sortedReports[3];
  const fiveYearsAgo = sortedReports[5];

  const latestRevenue = parseValue(latest.totalRevenue);
  const previousRevenue = previous ? parseValue(previous.totalRevenue) : null;
  const threeYearsAgoRevenue = threeYearsAgo ? parseValue(threeYearsAgo.totalRevenue) : null;
  const fiveYearsAgoRevenue = fiveYearsAgo ? parseValue(fiveYearsAgo.totalRevenue) : null;

  const latestNetIncome = parseValue(latest.netIncome);
  const previousNetIncome = previous ? parseValue(previous.netIncome) : null;

  const latestEPS = parseValue(latest.eps);
  const previousEPS = previous ? parseValue(previous.eps) : null;

  return {
    revenueYoY: calculateYoYGrowth(latestRevenue, previousRevenue),
    netIncomeYoY: calculateYoYGrowth(latestNetIncome, previousNetIncome),
    epsYoY: calculateYoYGrowth(latestEPS, previousEPS),
    revenueCAGR3Y: threeYearsAgoRevenue ? calculateCAGR(threeYearsAgoRevenue, latestRevenue, 3) : null,
    revenueCAGR5Y: fiveYearsAgoRevenue ? calculateCAGR(fiveYearsAgoRevenue, latestRevenue, 5) : null,
  };
}

/**
 * Calculate profitability metrics
 */
export function calculateProfitabilityMetrics(
  incomeStatement: IncomeStatement,
  period: 'annual' | 'quarterly' = 'annual'
): ProfitabilityMetrics {
  const reports = period === 'annual' ? incomeStatement.annualReports : incomeStatement.quarterlyReports;
  
  if (reports.length === 0) {
    return {
      grossMargin: null,
      operatingMargin: null,
      netMargin: null,
      roe: null,
      roa: null,
    };
  }

  const latest = reports[0];
  const revenue = parseValue(latest.totalRevenue);
  const grossProfit = parseValue(latest.grossProfit);
  const operatingIncome = parseValue(latest.operatingIncome);
  const netIncome = parseValue(latest.netIncome);

  return {
    grossMargin: calculateMargin(grossProfit, revenue),
    operatingMargin: calculateMargin(operatingIncome, revenue),
    netMargin: calculateMargin(netIncome, revenue),
    roe: null, // Will be calculated from balance sheet if available
    roa: null, // Will be calculated from balance sheet if available
  };
}

/**
 * Calculate efficiency metrics
 */
export function calculateEfficiencyMetrics(
  incomeStatement: IncomeStatement,
  balanceSheet: BalanceSheet,
  period: 'annual' | 'quarterly' = 'annual'
): EfficiencyMetrics {
  const incomeReports = period === 'annual' ? incomeStatement.annualReports : incomeStatement.quarterlyReports;
  const balanceReports = period === 'annual' ? balanceSheet.annualReports : balanceSheet.quarterlyReports;

  if (incomeReports.length === 0 || balanceReports.length === 0) {
    return {
      assetTurnover: null,
      workingCapitalEfficiency: null,
    };
  }

  const latestIncome = incomeReports[0];
  const latestBalance = balanceReports[0];

  const revenue = parseValue(latestIncome.totalRevenue);
  const totalAssets = parseValue(latestBalance.totalAssets);
  const currentAssets = parseValue(latestBalance.totalCurrentAssets);
  const currentLiabilities = parseValue(latestBalance.totalCurrentLiabilities);

  const assetTurnover = totalAssets && totalAssets > 0 && revenue ? (revenue / totalAssets) : null;
  const workingCapital = currentAssets && currentLiabilities ? currentAssets - currentLiabilities : null;
  const workingCapitalEfficiency = workingCapital && workingCapital !== 0 && revenue ? (revenue / workingCapital) : null;

  return {
    assetTurnover,
    workingCapitalEfficiency,
  };
}

/**
 * Build trends series from statements
 */
export function buildTrendsSeriesFromStatements(
  reports: AnnualReport[] | QuarterlyReport[],
  field: string
): { date: string; value: number | null }[] {
  const sortedReports = [...reports].sort(
    (a, b) => new Date(a.fiscalDateEnding).getTime() - new Date(b.fiscalDateEnding).getTime()
  );

  return sortedReports.map((report) => ({
    date: report.fiscalDateEnding,
    value: parseValue(report[field]),
  }));
}

/**
 * Calculate free cash flow (Operating Cash Flow - Capital Expenditures)
 */
export function calculateFreeCashFlow(
  cashFlow: CashFlow,
  period: 'annual' | 'quarterly' = 'annual'
): { date: string; value: number | null }[] {
  const reports = period === 'annual' ? cashFlow.annualReports : cashFlow.quarterlyReports;
  
  const sortedReports = [...reports].sort(
    (a, b) => new Date(a.fiscalDateEnding).getTime() - new Date(b.fiscalDateEnding).getTime()
  );

  return sortedReports.map((report) => {
    const operatingCashflow = parseValue(report.operatingCashflow);
    const capitalExpenditures = parseValue(report.capitalExpenditures);
    
    if (operatingCashflow === null) return { date: report.fiscalDateEnding, value: null };
    if (capitalExpenditures === null) return { date: report.fiscalDateEnding, value: operatingCashflow };
    
    return {
      date: report.fiscalDateEnding,
      value: operatingCashflow - capitalExpenditures,
    };
  });
}

/**
 * Calculate ROE (Return on Equity)
 */
export function calculateROE(
  netIncome: number | null,
  shareholderEquity: number | null
): number | null {
  if (netIncome === null || shareholderEquity === null || shareholderEquity === 0) {
    return null;
  }
  return (netIncome / shareholderEquity) * 100;
}

/**
 * Calculate ROA (Return on Assets)
 */
export function calculateROA(
  netIncome: number | null,
  totalAssets: number | null
): number | null {
  if (netIncome === null || totalAssets === null || totalAssets === 0) {
    return null;
  }
  return (netIncome / totalAssets) * 100;
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number | null, decimals: number = 2): string {
  if (value === null) return 'N/A';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number | null, decimals: number = 0): string {
  if (value === null) return 'N/A';
  if (Math.abs(value) >= 1e9) {
    return `$${(value / 1e9).toFixed(decimals)}B`;
  }
  if (Math.abs(value) >= 1e6) {
    return `$${(value / 1e6).toFixed(decimals)}M`;
  }
  if (Math.abs(value) >= 1e3) {
    return `$${(value / 1e3).toFixed(decimals)}K`;
  }
  return `$${value.toFixed(decimals)}`;
}

/**
 * Calculate percentage of revenue for income statement items
 */
export function calculateAsPercentOfRevenue(
  value: number | null,
  revenue: number | null
): number | null {
  if (value === null || revenue === null || revenue === 0) {
    return null;
  }
  return (value / revenue) * 100;
}

/**
 * Calculate percentage of total assets for balance sheet items
 */
export function calculateAsPercentOfAssets(
  value: number | null,
  totalAssets: number | null
): number | null {
  if (value === null || totalAssets === null || totalAssets === 0) {
    return null;
  }
  return (value / totalAssets) * 100;
}

/**
 * Calculate percentage of operating cash flow for cash flow items
 */
export function calculateAsPercentOfOperatingCashFlow(
  value: number | null,
  operatingCashflow: number | null
): number | null {
  if (value === null || operatingCashflow === null || operatingCashflow === 0) {
    return null;
  }
  return (value / operatingCashflow) * 100;
}

