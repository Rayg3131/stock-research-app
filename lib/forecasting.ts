import type {
  ForecastInputs,
  ForecastOutputs,
  IncomeStatement,
  CompanyOverview,
} from './types';
import { getLatestIncomeStatementValue } from './transformers';
import { calculateMargin, calculateEPS } from './calculations';

/**
 * Get default forecast inputs from latest income statement and overview
 */
export function getDefaultForecastInputs({
  incomeStatement,
  overview,
}: {
  incomeStatement: IncomeStatement;
  overview: CompanyOverview;
}): ForecastInputs {
  const latestRevenue = getLatestIncomeStatementValue(incomeStatement, 'totalRevenue') || 0;
  const latestGrossProfit = getLatestIncomeStatementValue(incomeStatement, 'grossProfit') || 0;
  const latestOperatingIncome = getLatestIncomeStatementValue(incomeStatement, 'operatingIncome') || 0;
  const latestNetIncome = getLatestIncomeStatementValue(incomeStatement, 'netIncome') || 0;

  const grossMargin = latestRevenue > 0 ? (latestGrossProfit / latestRevenue) * 100 : 0;
  const operatingMargin = latestRevenue > 0 ? (latestOperatingIncome / latestRevenue) * 100 : 0;
  const netMargin = latestRevenue > 0 ? (latestNetIncome / latestRevenue) * 100 : 0;

  // Estimate tax rate from income before tax and income tax expense
  const incomeBeforeTax = getLatestIncomeStatementValue(incomeStatement, 'incomeBeforeTax') || 0;
  const incomeTaxExpense = getLatestIncomeStatementValue(incomeStatement, 'incomeTaxExpense') || 0;
  const taxRate = incomeBeforeTax > 0 ? (incomeTaxExpense / incomeBeforeTax) * 100 : 25; // Default to 25% if can't calculate

  const peMultiple = overview.peRatio || overview.trailingPE || 20; // Default to 20 if not available
  const sharesOutstanding = overview.sharesOutstanding || 1e9; // Default to 1B if not available

  return {
    revenueGrowth: 0, // No growth by default (current snapshot)
    grossMargin,
    operatingMargin,
    netMargin,
    taxRate,
    peMultiple,
    sharesOutstanding,
    baseRevenue: latestRevenue,
  };
}

/**
 * Run forecast based on inputs
 */
export function runForecast(inputs: ForecastInputs): ForecastOutputs {
  // Calculate projected revenue
  const projectedRevenue = inputs.baseRevenue * (1 + inputs.revenueGrowth / 100);

  // Calculate projected gross profit
  const projectedGrossProfit = (projectedRevenue * inputs.grossMargin) / 100;
  const projectedCOGS = projectedRevenue - projectedGrossProfit;

  // Calculate projected operating income
  const projectedOperatingIncome = (projectedRevenue * inputs.operatingMargin) / 100;

  // Calculate projected income before tax (operating income, assuming no other income/expenses)
  const projectedIncomeBeforeTax = projectedOperatingIncome;

  // Calculate projected income tax
  const projectedIncomeTax = (projectedIncomeBeforeTax * inputs.taxRate) / 100;

  // Calculate projected net income
  const projectedNetIncome = projectedIncomeBeforeTax - projectedIncomeTax;

  // Calculate projected EPS
  const projectedEPS = calculateEPS(projectedNetIncome, inputs.sharesOutstanding) || 0;

  // Calculate implied price
  const impliedPrice = projectedEPS * inputs.peMultiple;

  return {
    projectedRevenue,
    projectedCOGS,
    projectedGrossProfit,
    projectedOperatingIncome,
    projectedNetIncome,
    projectedEPS,
    impliedPrice,
  };
}

/**
 * Calculate upside/downside percentage
 */
export function calculateUpside(
  impliedPrice: number,
  currentPrice: number | null
): number | null {
  if (currentPrice === null || currentPrice === 0) {
    return null;
  }
  return ((impliedPrice - currentPrice) / currentPrice) * 100;
}

