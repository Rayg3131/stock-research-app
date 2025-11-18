import type {
  AnnualReport,
  QuarterlyReport,
  IncomeStatement,
  BalanceSheet,
  CashFlow,
  FinancialStatementRow,
} from './types';

/**
 * Parse numeric value from string, handling 'None' and empty strings
 */
export function parseValue(value: string | undefined): number | null {
  if (!value || value === 'None' || value === '') return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Transform annual or quarterly report to FinancialStatementRow array
 */
export function transformReportToRows(
  report: AnnualReport | QuarterlyReport,
  fields: string[]
): FinancialStatementRow[] {
  return fields.map((field) => ({
    label: formatFieldLabel(field),
    value: parseValue(report[field]),
    date: report.fiscalDateEnding,
  }));
}

/**
 * Format field label for display
 */
function formatFieldLabel(field: string): string {
  // Convert camelCase or snake_case to Title Case
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Get common income statement fields
 */
export const INCOME_STATEMENT_FIELDS = [
  'totalRevenue',
  'costOfRevenue',
  'grossProfit',
  'operatingExpenses',
  'operatingIncome',
  'incomeBeforeTax',
  'incomeTaxExpense',
  'netIncome',
  'ebitda',
  'eps',
  'sharesOutstanding',
] as const;

/**
 * Get common balance sheet fields
 */
export const BALANCE_SHEET_FIELDS = [
  'totalAssets',
  'totalCurrentAssets',
  'totalNonCurrentAssets',
  'totalLiabilities',
  'totalCurrentLiabilities',
  'totalNonCurrentLiabilities',
  'totalShareholderEquity',
  'commonStockSharesOutstanding',
  'cashAndCashEquivalentsAtCarryingValue',
  'shortTermInvestments',
  'longTermInvestments',
  'totalDebt',
] as const;

/**
 * Get common cash flow fields
 */
export const CASH_FLOW_FIELDS = [
  'operatingCashflow',
  'capitalExpenditures',
  'freeCashFlow',
  'cashflowFromInvestment',
  'cashflowFromFinancing',
  'netCashflow',
  'changeInCashAndCashEquivalents',
] as const;

/**
 * Extract latest value from income statement
 */
export function getLatestIncomeStatementValue(
  incomeStatement: IncomeStatement,
  field: string,
  period: 'annual' | 'quarterly' = 'annual'
): number | null {
  const reports = period === 'annual' ? incomeStatement.annualReports : incomeStatement.quarterlyReports;
  if (reports.length === 0) return null;

  const latest = reports[0];
  return parseValue(latest[field]);
}

/**
 * Extract latest value from balance sheet
 */
export function getLatestBalanceSheetValue(
  balanceSheet: BalanceSheet,
  field: string,
  period: 'annual' | 'quarterly' = 'annual'
): number | null {
  const reports = period === 'annual' ? balanceSheet.annualReports : balanceSheet.quarterlyReports;
  if (reports.length === 0) return null;

  const latest = reports[0];
  return parseValue(latest[field]);
}

/**
 * Extract latest value from cash flow
 */
export function getLatestCashFlowValue(
  cashFlow: CashFlow,
  field: string,
  period: 'annual' | 'quarterly' = 'annual'
): number | null {
  const reports = period === 'annual' ? cashFlow.annualReports : cashFlow.quarterlyReports;
  if (reports.length === 0) return null;

  const latest = reports[0];
  return parseValue(latest[field]);
}

/**
 * Get all years/periods from reports
 */
export function getReportDates(
  reports: AnnualReport[] | QuarterlyReport[],
  limit?: number
): string[] {
  const dates = reports.map((r) => r.fiscalDateEnding).slice(0, limit);
  return dates;
}

/**
 * Get value for a specific field across all reports
 */
export function getFieldValuesOverTime(
  reports: AnnualReport[] | QuarterlyReport[],
  field: string
): { date: string; value: number | null }[] {
  return reports.map((report) => ({
    date: report.fiscalDateEnding,
    value: parseValue(report[field]),
  }));
}

/**
 * Normalize date format (Alpha Vantage uses YYYY-MM-DD)
 */
export function normalizeDate(dateString: string): string {
  return dateString;
}

/**
 * Sort reports by date (newest first)
 */
export function sortReportsByDate<T extends { fiscalDateEnding: string }>(
  reports: T[]
): T[] {
  return [...reports].sort(
    (a, b) =>
      new Date(b.fiscalDateEnding).getTime() - new Date(a.fiscalDateEnding).getTime()
  );
}

