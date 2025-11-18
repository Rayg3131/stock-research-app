import { ALPHA_VANTAGE_BASE_URL } from './config';
import type {
  CompanyOverview,
  IncomeStatement,
  BalanceSheet,
  CashFlow,
  PricePoint,
  Earnings,
  AlphaVantageOverviewResponse,
  AlphaVantageIncomeStatementResponse,
  AlphaVantageBalanceSheetResponse,
  AlphaVantageCashFlowResponse,
  AlphaVantageTimeSeriesResponse,
  AlphaVantageEarningsResponse,
  AlphaVantageError,
} from './types';

const API_KEY = process.env.ALPHAVANTAGE_API_KEY;

if (!API_KEY) {
  console.warn('ALPHAVANTAGE_API_KEY is not set in environment variables');
}

/**
 * Validates ticker symbol format (basic check)
 */
export function validateTicker(ticker: string): boolean {
  return /^[A-Z]{1,5}$/.test(ticker.toUpperCase());
}

/**
 * Helper to parse numeric string from Alpha Vantage API
 */
function parseNumber(value: string | undefined | null): number | null {
  if (!value || value === 'None' || value === '') return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Helper to check for API errors
 */
function checkForError(data: any, context?: string): void {
  if (data['Error Message']) {
    console.error(`Alpha Vantage API Error${context ? ` (${context})` : ''}:`, data['Error Message']);
    throw new Error(data['Error Message']);
  }
  if (data['Note']) {
    console.error(`Alpha Vantage API Rate Limit${context ? ` (${context})` : ''}:`, data['Note']);
    throw new Error('API call frequency limit reached. Please try again later.');
  }
  if (data['Information']) {
    console.error(`Alpha Vantage API Information${context ? ` (${context})` : ''}:`, data['Information']);
    throw new Error('API call frequency limit reached. Please try again later.');
  }
}

/**
 * Get company overview
 */
export async function getCompanyOverview(ticker: string): Promise<CompanyOverview> {
  if (!API_KEY) {
    throw new Error('Alpha Vantage API key is not configured');
  }

  if (!validateTicker(ticker)) {
    throw new Error(`Invalid ticker symbol: ${ticker}`);
  }

  const url = new URL(ALPHA_VANTAGE_BASE_URL);
  url.searchParams.set('function', 'OVERVIEW');
  url.searchParams.set('symbol', ticker.toUpperCase());
  url.searchParams.set('apikey', API_KEY);

  const response = await fetch(url.toString(), {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch company overview: ${response.statusText}`);
  }

  const text = await response.text();
  let data: AlphaVantageOverviewResponse | AlphaVantageError;
  try {
    data = JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse JSON response for company overview:', text.substring(0, 500));
    throw new Error(`Invalid JSON response from Alpha Vantage API. Response may be CSV format or corrupted.`);
  }

  // Log the full response for debugging
  console.log(`Alpha Vantage OVERVIEW response for ${ticker}:`, JSON.stringify(data, null, 2).substring(0, 1000));

  checkForError(data, `getCompanyOverview(${ticker})`);

  const overview = data as AlphaVantageOverviewResponse;

  // Check if we got an empty response (no Symbol or Name)
  if (!overview.Symbol && !overview.Name && Object.keys(overview).length === 0) {
    console.error('Empty response from Alpha Vantage API for overview:', data);
    throw new Error(`No data returned from Alpha Vantage API for symbol ${ticker}. The symbol may be invalid or data may not be available.`);
  }

  return {
    symbol: overview.Symbol || ticker.toUpperCase(),
    name: overview.Name || '',
    description: overview.Description || '',
    sector: overview.Sector || '',
    industry: overview.Industry || '',
    marketCap: parseNumber(overview.MarketCapitalization),
    peRatio: parseNumber(overview.PERatio),
    priceToBook: parseNumber(overview.PriceToBookRatio),
    priceToSales: parseNumber(overview.PriceToSalesRatioTTM),
    dividendYield: parseNumber(overview.DividendYield),
    sharesOutstanding: parseNumber(overview.SharesOutstanding),
    roe: parseNumber(overview.ReturnOnEquityTTM),
    roa: parseNumber(overview.ReturnOnAssetsTTM),
    revenueTTM: parseNumber(overview.RevenueTTM),
    grossProfitTTM: parseNumber(overview.GrossProfitTTM),
    ebitda: parseNumber(overview.EBITDA),
    evToSales: parseNumber(overview.EVToSales) || parseNumber(overview.EVToRevenue),
    evToEbitda: parseNumber(overview.EVToRevenue), // Fallback if EVToEbitda not available
    forwardPE: parseNumber(overview.ForwardPE),
    trailingPE: parseNumber(overview.TrailingPE),
  };
}

/**
 * Get income statement (annual and quarterly)
 */
export async function getIncomeStatement(ticker: string): Promise<IncomeStatement> {
  if (!API_KEY) {
    throw new Error('Alpha Vantage API key is not configured');
  }

  if (!validateTicker(ticker)) {
    throw new Error(`Invalid ticker symbol: ${ticker}`);
  }

  const url = new URL(ALPHA_VANTAGE_BASE_URL);
  url.searchParams.set('function', 'INCOME_STATEMENT');
  url.searchParams.set('symbol', ticker.toUpperCase());
  url.searchParams.set('apikey', API_KEY);

  const response = await fetch(url.toString(), {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch income statement: ${response.statusText}`);
  }

  const text = await response.text();
  let data: AlphaVantageIncomeStatementResponse | AlphaVantageError;
  try {
    data = JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse JSON response for income statement:', text.substring(0, 500));
    throw new Error(`Invalid JSON response from Alpha Vantage API. Response may be CSV format or corrupted.`);
  }

  // Log the full response for debugging
  console.log(`Alpha Vantage INCOME_STATEMENT response for ${ticker}:`, JSON.stringify(data, null, 2).substring(0, 1000));

  checkForError(data, `getIncomeStatement(${ticker})`);

  const statement = data as AlphaVantageIncomeStatementResponse;

  // Check if we got an empty response
  if (!statement.symbol && (!statement.annualReports || statement.annualReports.length === 0) && (!statement.quarterlyReports || statement.quarterlyReports.length === 0)) {
    console.error('Empty response from Alpha Vantage API for income statement:', data);
    throw new Error(`No data returned from Alpha Vantage API for income statement of ${ticker}. The symbol may be invalid or data may not be available.`);
  }

  return {
    symbol: statement.symbol || ticker.toUpperCase(),
    annualReports: statement.annualReports || [],
    quarterlyReports: statement.quarterlyReports || [],
  };
}

/**
 * Get balance sheet (annual and quarterly)
 */
export async function getBalanceSheet(ticker: string): Promise<BalanceSheet> {
  if (!API_KEY) {
    throw new Error('Alpha Vantage API key is not configured');
  }

  if (!validateTicker(ticker)) {
    throw new Error(`Invalid ticker symbol: ${ticker}`);
  }

  const url = new URL(ALPHA_VANTAGE_BASE_URL);
  url.searchParams.set('function', 'BALANCE_SHEET');
  url.searchParams.set('symbol', ticker.toUpperCase());
  url.searchParams.set('apikey', API_KEY);

  const response = await fetch(url.toString(), {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch balance sheet: ${response.statusText}`);
  }

  const text = await response.text();
  let data: AlphaVantageBalanceSheetResponse | AlphaVantageError;
  try {
    data = JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse JSON response for balance sheet:', text.substring(0, 500));
    throw new Error(`Invalid JSON response from Alpha Vantage API. Response may be CSV format or corrupted.`);
  }

  // Log the full response for debugging
  console.log(`Alpha Vantage BALANCE_SHEET response for ${ticker}:`, JSON.stringify(data, null, 2).substring(0, 1000));

  checkForError(data, `getBalanceSheet(${ticker})`);

  const sheet = data as AlphaVantageBalanceSheetResponse;

  // Check if we got an empty response
  if (!sheet.symbol && (!sheet.annualReports || sheet.annualReports.length === 0) && (!sheet.quarterlyReports || sheet.quarterlyReports.length === 0)) {
    console.error('Empty response from Alpha Vantage API for balance sheet:', data);
    throw new Error(`No data returned from Alpha Vantage API for balance sheet of ${ticker}. The symbol may be invalid or data may not be available.`);
  }

  return {
    symbol: sheet.symbol || ticker.toUpperCase(),
    annualReports: sheet.annualReports || [],
    quarterlyReports: sheet.quarterlyReports || [],
  };
}

/**
 * Get cash flow statement (annual and quarterly)
 */
export async function getCashFlow(ticker: string): Promise<CashFlow> {
  if (!API_KEY) {
    throw new Error('Alpha Vantage API key is not configured');
  }

  if (!validateTicker(ticker)) {
    throw new Error(`Invalid ticker symbol: ${ticker}`);
  }

  const url = new URL(ALPHA_VANTAGE_BASE_URL);
  url.searchParams.set('function', 'CASH_FLOW');
  url.searchParams.set('symbol', ticker.toUpperCase());
  url.searchParams.set('apikey', API_KEY);

  const response = await fetch(url.toString(), {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch cash flow: ${response.statusText}`);
  }

  const text = await response.text();
  let data: AlphaVantageCashFlowResponse | AlphaVantageError;
  try {
    data = JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse JSON response for cash flow:', text.substring(0, 500));
    throw new Error(`Invalid JSON response from Alpha Vantage API. Response may be CSV format or corrupted.`);
  }

  checkForError(data, `getCashFlow(${ticker})`);

  const cashFlow = data as AlphaVantageCashFlowResponse;

  return {
    symbol: cashFlow.symbol || ticker.toUpperCase(),
    annualReports: cashFlow.annualReports || [],
    quarterlyReports: cashFlow.quarterlyReports || [],
  };
}

/**
 * Get daily adjusted prices
 */
export async function getDailyPrices(ticker: string): Promise<PricePoint[]> {
  if (!API_KEY) {
    throw new Error('Alpha Vantage API key is not configured');
  }

  if (!validateTicker(ticker)) {
    throw new Error(`Invalid ticker symbol: ${ticker}`);
  }

  const url = new URL(ALPHA_VANTAGE_BASE_URL);
  url.searchParams.set('function', 'TIME_SERIES_DAILY_ADJUSTED');
  url.searchParams.set('symbol', ticker.toUpperCase());
  url.searchParams.set('apikey', API_KEY);
  url.searchParams.set('outputsize', 'full'); // Get full history
  url.searchParams.set('datatype', 'json');

  const response = await fetch(url.toString(), {
    next: { revalidate: 900 }, // Cache for 15 minutes
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch daily prices: ${response.statusText}`);
  }

  const text = await response.text();
  let data: AlphaVantageTimeSeriesResponse | AlphaVantageError;
  try {
    data = JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse JSON response for daily prices:', text.substring(0, 500));
    throw new Error(`Invalid JSON response from Alpha Vantage API. Response may be CSV format or corrupted.`);
  }

  // Log the full response for debugging
  console.log(`Alpha Vantage TIME_SERIES_DAILY_ADJUSTED response for ${ticker}:`, JSON.stringify(data, null, 2).substring(0, 1000));

  checkForError(data, `getDailyPrices(${ticker})`);

  const timeSeries = data as AlphaVantageTimeSeriesResponse;
  const series = timeSeries['Time Series (Daily)'];

  if (!series) {
    console.error('No time series data in response:', data);
    throw new Error('No time series data available');
  }

  const prices: PricePoint[] = Object.entries(series)
    .map(([date, values]) => ({
      date,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      adjustedClose: parseFloat(values['5. adjusted close']),
      volume: parseInt(values['6. volume'], 10),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return prices;
}

/**
 * Get intraday prices (optional)
 */
export async function getIntradayPrices(
  ticker: string,
  interval: '1min' | '5min' | '15min' | '30min' | '60min' = '5min'
): Promise<PricePoint[]> {
  if (!API_KEY) {
    throw new Error('Alpha Vantage API key is not configured');
  }

  if (!validateTicker(ticker)) {
    throw new Error(`Invalid ticker symbol: ${ticker}`);
  }

  const url = new URL(ALPHA_VANTAGE_BASE_URL);
  url.searchParams.set('function', 'TIME_SERIES_INTRADAY');
  url.searchParams.set('symbol', ticker.toUpperCase());
  url.searchParams.set('interval', interval);
  url.searchParams.set('apikey', API_KEY);
  url.searchParams.set('datatype', 'json');

  const response = await fetch(url.toString(), {
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch intraday prices: ${response.statusText}`);
  }

  const text = await response.text();
  let data: AlphaVantageTimeSeriesResponse | AlphaVantageError;
  try {
    data = JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse JSON response for intraday prices:', text.substring(0, 500));
    throw new Error(`Invalid JSON response from Alpha Vantage API. Response may be CSV format or corrupted.`);
  }

  checkForError(data, `getIntradayPrices(${ticker})`);

  const timeSeries = data as AlphaVantageTimeSeriesResponse;
  const seriesKey = `Time Series (${interval})` as keyof typeof timeSeries;
  const series = timeSeries[seriesKey] as typeof timeSeries['Time Series (Daily)'];

  if (!series) {
    throw new Error('No intraday time series data available');
  }

  const prices: PricePoint[] = Object.entries(series)
    .map(([date, values]) => ({
      date,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      adjustedClose: parseFloat(values['5. adjusted close']),
      volume: parseInt(values['6. volume'], 10),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return prices;
}

/**
 * Get earnings data (optional)
 */
export async function getEarnings(ticker: string): Promise<Earnings> {
  if (!API_KEY) {
    throw new Error('Alpha Vantage API key is not configured');
  }

  if (!validateTicker(ticker)) {
    throw new Error(`Invalid ticker symbol: ${ticker}`);
  }

  const url = new URL(ALPHA_VANTAGE_BASE_URL);
  url.searchParams.set('function', 'EARNINGS');
  url.searchParams.set('symbol', ticker.toUpperCase());
  url.searchParams.set('apikey', API_KEY);

  const response = await fetch(url.toString(), {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch earnings: ${response.statusText}`);
  }

  const text = await response.text();
  let data: AlphaVantageEarningsResponse | AlphaVantageError;
  try {
    data = JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse JSON response for earnings:', text.substring(0, 500));
    throw new Error(`Invalid JSON response from Alpha Vantage API. Response may be CSV format or corrupted.`);
  }

  checkForError(data, `getEarnings(${ticker})`);

  const earnings = data as AlphaVantageEarningsResponse;

  return {
    symbol: earnings.symbol || ticker.toUpperCase(),
    annualEarnings: earnings.annualEarnings || [],
    quarterlyEarnings: earnings.quarterlyEarnings || [],
  };
}

