// Company Overview Types
export interface CompanyOverview {
  symbol: string;
  name: string;
  description: string;
  sector: string;
  industry: string;
  marketCap: number | null;
  peRatio: number | null;
  priceToBook: number | null;
  priceToSales: number | null;
  dividendYield: number | null;
  sharesOutstanding: number | null;
  roe: number | null;
  roa: number | null;
  revenueTTM: number | null;
  grossProfitTTM: number | null;
  ebitda: number | null;
  evToSales: number | null;
  evToEbitda: number | null;
  forwardPE: number | null;
  trailingPE: number | null;
}

// Financial Statement Types
export interface FinancialStatementRow {
  label: string;
  value: number | null;
  date: string;
}

export interface IncomeStatement {
  symbol: string;
  annualReports: AnnualReport[];
  quarterlyReports: QuarterlyReport[];
}

export interface BalanceSheet {
  symbol: string;
  annualReports: AnnualReport[];
  quarterlyReports: QuarterlyReport[];
}

export interface CashFlow {
  symbol: string;
  annualReports: AnnualReport[];
  quarterlyReports: QuarterlyReport[];
}

export interface AnnualReport {
  fiscalDateEnding: string;
  reportedCurrency: string;
  [key: string]: string | undefined;
}

export interface QuarterlyReport {
  fiscalDateEnding: string;
  reportedCurrency: string;
  [key: string]: string | undefined;
}

// Price Data Types
export interface PricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClose: number;
  volume: number;
}

export interface TimeSeriesData {
  [date: string]: {
    '1. open': string;
    '2. high': string;
    '3. low': string;
    '4. close': string;
    '5. adjusted close': string;
    '6. volume': string;
  };
}

// Earnings Types
export interface Earnings {
  symbol: string;
  annualEarnings: AnnualEarning[];
  quarterlyEarnings: QuarterlyEarning[];
}

export interface AnnualEarning {
  fiscalDateEnding: string;
  reportedEPS: string;
}

export interface QuarterlyEarning {
  fiscalDateEnding: string;
  reportedDate: string;
  reportedEPS: string;
  estimatedEPS: string;
  surprise: string;
  surprisePercentage: string;
}

// Forecast Types
export interface ForecastInputs {
  revenueGrowth: number; // percentage
  grossMargin: number; // percentage
  operatingMargin: number; // percentage
  netMargin: number; // percentage
  taxRate: number; // percentage
  peMultiple: number;
  sharesOutstanding: number;
  baseRevenue: number;
}

export interface ForecastOutputs {
  projectedRevenue: number;
  projectedCOGS: number;
  projectedGrossProfit: number;
  projectedOperatingIncome: number;
  projectedNetIncome: number;
  projectedEPS: number;
  impliedPrice: number;
}

// Metrics Types
export interface MetricSet {
  valuation: ValuationMetrics;
  profitability: ProfitabilityMetrics;
  growth: GrowthMetrics;
  efficiency: EfficiencyMetrics;
}

export interface ValuationMetrics {
  pe: number | null;
  forwardPE: number | null;
  priceToSales: number | null;
  priceToBook: number | null;
  evToSales: number | null;
  evToEbitda: number | null;
}

export interface ProfitabilityMetrics {
  grossMargin: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  roe: number | null;
  roa: number | null;
}

export interface GrowthMetrics {
  revenueYoY: number | null;
  netIncomeYoY: number | null;
  epsYoY: number | null;
  revenueCAGR3Y: number | null;
  revenueCAGR5Y: number | null;
}

export interface EfficiencyMetrics {
  assetTurnover: number | null;
  workingCapitalEfficiency: number | null;
}

// Watchlist & Notes Types
export interface WatchlistItem {
  ticker: string;
  addedAt: string;
}

export interface TickerNote {
  ticker: string;
  noteId: string;
  createdAt: string;
  updatedAt: string;
  text: string;
}

// Chart Time Range
export type TimeRange = '1D' | '5D' | '1M' | '6M' | '1Y' | '5Y' | 'Max';

// Statement Type
export type StatementType = 'income' | 'balance' | 'cashflow';

// Period Type
export type PeriodType = 'annual' | 'quarterly';

// Alpha Vantage API Response Types
export interface AlphaVantageOverviewResponse {
  Symbol: string;
  Name: string;
  Description: string;
  Sector: string;
  Industry: string;
  MarketCapitalization: string;
  PERatio: string;
  PriceToBookRatio: string;
  PriceToSalesRatioTTM: string;
  DividendYield: string;
  SharesOutstanding: string;
  ReturnOnEquityTTM: string;
  ReturnOnAssetsTTM: string;
  RevenueTTM: string;
  GrossProfitTTM: string;
  EBITDA: string;
  EVToSales: string;
  EVToRevenue: string;
  ForwardPE: string;
  TrailingPE: string;
  [key: string]: string | undefined;
}

export interface AlphaVantageIncomeStatementResponse {
  symbol: string;
  annualReports: AnnualReport[];
  quarterlyReports: QuarterlyReport[];
}

export interface AlphaVantageBalanceSheetResponse {
  symbol: string;
  annualReports: AnnualReport[];
  quarterlyReports: QuarterlyReport[];
}

export interface AlphaVantageCashFlowResponse {
  symbol: string;
  annualReports: AnnualReport[];
  quarterlyReports: QuarterlyReport[];
}

export interface AlphaVantageTimeSeriesResponse {
  'Meta Data': {
    '1. Information': string;
    '2. Symbol': string;
    '3. Last Refreshed': string;
    '4. Output Size': string;
    '5. Time Zone': string;
  };
  'Time Series (Daily)': TimeSeriesData;
  'Time Series (5min)'?: TimeSeriesData;
  'Time Series (15min)'?: TimeSeriesData;
  'Time Series (30min)'?: TimeSeriesData;
  'Time Series (60min)'?: TimeSeriesData;
}

export interface AlphaVantageEarningsResponse {
  symbol: string;
  annualEarnings: AnnualEarning[];
  quarterlyEarnings: QuarterlyEarning[];
}

// Error Types
export interface AlphaVantageError {
  'Error Message'?: string;
  'Note'?: string;
  'Information'?: string;
}

