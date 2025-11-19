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

// Parse API keys from environment variable (comma-separated)
const API_KEYS = process.env.ALPHAVANTAGE_API_KEY
  ? process.env.ALPHAVANTAGE_API_KEY.split(',').map(key => key.trim()).filter(key => key.length > 0)
  : [];

if (API_KEYS.length === 0) {
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
 * Returns:
 *   - true if it's a rate limit error (should retry with different token)
 *   - 'skip' if there's an Information/Note field that's not a rate limit (try next token)
 *   - false if no errors
 *   - throws error for other types of errors
 */
function checkForError(data: any, context?: string): boolean | 'skip' {
  if (data['Error Message']) {
    console.error(`Alpha Vantage API Error${context ? ` (${context})` : ''}:`, data['Error Message']);
    throw new Error(data['Error Message']);
  }
  
  // Check for rate limit - must contain rate limit keywords
  const note = data['Note'];
  if (note) {
    const noteLower = String(note).toLowerCase();
    // Only treat as rate limit if it mentions frequency, call limit, or API call
    if (noteLower.includes('frequency') || noteLower.includes('call limit') || noteLower.includes('api call')) {
      console.error(`Alpha Vantage API Rate Limit${context ? ` (${context})` : ''}:`, note);
      return true; // Rate limit - should try next token
    } else {
      // Note field exists but isn't a rate limit - try next token in case it's token-specific
      console.warn(`Alpha Vantage API Note${context ? ` (${context})` : ''}:`, note);
      return 'skip'; // Try next token
    }
  }
  
  const information = data['Information'];
  if (information) {
    const infoLower = String(information).toLowerCase();
    // Only treat as rate limit if it mentions frequency, call limit, or API call
    if (infoLower.includes('frequency') || infoLower.includes('call limit') || infoLower.includes('api call')) {
      console.error(`Alpha Vantage API Rate Limit${context ? ` (${context})` : ''}:`, information);
      return true; // Rate limit - should try next token
    } else {
      // Information field exists but isn't a rate limit - try next token in case it's token-specific
      console.warn(`Alpha Vantage API Information${context ? ` (${context})` : ''}:`, information);
      return 'skip'; // Try next token
    }
  }
  
  return false; // No error
}

/**
 * Makes an API call with automatic token rotation on rate limits
 */
async function makeApiCall<T>(
  buildUrl: (apiKey: string) => URL,
  parseResponse: (data: any) => T,
  context: string,
  cacheOptions?: { next: { revalidate: number } }
): Promise<T> {
  if (API_KEYS.length === 0) {
    throw new Error('Alpha Vantage API key is not configured');
  }

  let lastError: Error | null = null;
  let lastRateLimitError: Error | null = null;
  let lastSkipMessage: string | null = null;
  let skipCount = 0;

  // Try each API key in sequence
  for (let i = 0; i < API_KEYS.length; i++) {
    const apiKey = API_KEYS[i];
    const isLastKey = i === API_KEYS.length - 1;

    try {
      const url = buildUrl(apiKey);
      console.log(`[${context}] Attempting API call with token ${i + 1}/${API_KEYS.length}`);
      const response = await fetch(url.toString(), cacheOptions || {});

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch (error) {
        console.error(`Failed to parse JSON response ${context}:`, text.substring(0, 500));
        throw new Error(`Invalid JSON response from Alpha Vantage API. Response may be CSV format or corrupted.`);
      }

      // Log the raw response for debugging
      console.log(`[${context}] Response keys:`, Object.keys(data).join(', '));

      // Check for errors - if rate limit or skip, try next token
      try {
        const errorCheck = checkForError(data, context);
        if (errorCheck === true) {
          // Rate limit
          lastRateLimitError = new Error(`Rate limit reached for API key ${i + 1}/${API_KEYS.length}`);
          console.log(`[${context}] Rate limit hit for token ${i + 1}, trying next token...`);
          if (isLastKey) {
            continue;
          }
          continue; // Try next token
        } else if (errorCheck === 'skip') {
          // Information/Note field that's not a rate limit - try next token
          const skipMsg = data['Information'] || data['Note'] || 'Unknown issue';
          lastSkipMessage = String(skipMsg);
          skipCount++;
          console.log(`[${context}] Skipping token ${i + 1} due to: ${skipMsg.substring(0, 100)}...`);
          if (isLastKey) {
            // This is the last key - we'll throw after the loop
            continue;
          }
          continue; // Try next token
        }
      } catch (error) {
        // checkForError throws for non-rate-limit errors - these should be thrown immediately
        console.log(`[${context}] Non-rate-limit error detected, throwing immediately:`, error);
        throw error;
      }

      // Success - return parsed data
      console.log(`[${context}] Successfully got response, parsing...`);
      return parseResponse(data);
    } catch (error) {
      // If it's a rate limit error, try next token
      if (error instanceof Error && (error.message.includes('frequency limit') || error.message.includes('rate limit'))) {
        lastRateLimitError = error;
        console.log(`[${context}] Rate limit error caught for token ${i + 1}, trying next token...`);
        if (isLastKey) {
          continue;
        }
        continue;
      }

      // For other errors (non-rate-limit), throw immediately
      console.log(`[${context}] Non-rate-limit error, throwing immediately:`, error);
      throw error;
    }
  }

  // If we exhausted all tokens due to rate limits
  if (lastRateLimitError) {
    throw new Error(`All API keys have reached rate limits. Please try again later.`);
  }

  // If all tokens were skipped due to Information/Note fields
  if (skipCount === API_KEYS.length && lastSkipMessage) {
    throw new Error(`All API keys returned: ${lastSkipMessage}`);
  }

  // If we exhausted all tokens due to other errors
  throw lastError || new Error('Failed to fetch data from Alpha Vantage API');
}

/**
 * Get company overview
 */
export async function getCompanyOverview(ticker: string): Promise<CompanyOverview> {
  if (!validateTicker(ticker)) {
    throw new Error(`Invalid ticker symbol: ${ticker}`);
  }

  return makeApiCall<CompanyOverview>(
    (apiKey) => {
      const url = new URL(ALPHA_VANTAGE_BASE_URL);
      url.searchParams.set('function', 'OVERVIEW');
      url.searchParams.set('symbol', ticker.toUpperCase());
      url.searchParams.set('apikey', apiKey);
      return url;
    },
    (data: AlphaVantageOverviewResponse) => {
      // Log the full response for debugging
      console.log(`Alpha Vantage OVERVIEW response for ${ticker}:`, JSON.stringify(data, null, 2).substring(0, 1000));

      const overview = data;

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
    },
    `getCompanyOverview(${ticker})`,
    { next: { revalidate: 3600 } } // Cache for 1 hour
  );
}

/**
 * Get income statement (annual and quarterly)
 */
export async function getIncomeStatement(ticker: string): Promise<IncomeStatement> {
  if (!validateTicker(ticker)) {
    throw new Error(`Invalid ticker symbol: ${ticker}`);
  }

  return makeApiCall<IncomeStatement>(
    (apiKey) => {
      const url = new URL(ALPHA_VANTAGE_BASE_URL);
      url.searchParams.set('function', 'INCOME_STATEMENT');
      url.searchParams.set('symbol', ticker.toUpperCase());
      url.searchParams.set('apikey', apiKey);
      return url;
    },
    (data: AlphaVantageIncomeStatementResponse) => {
      // Log the full response for debugging
      console.log(`Alpha Vantage INCOME_STATEMENT response for ${ticker}:`, JSON.stringify(data, null, 2).substring(0, 1000));

      const statement = data;

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
    },
    `getIncomeStatement(${ticker})`,
    { next: { revalidate: 3600 } } // Cache for 1 hour
  );
}

/**
 * Get balance sheet (annual and quarterly)
 */
export async function getBalanceSheet(ticker: string): Promise<BalanceSheet> {
  if (!validateTicker(ticker)) {
    throw new Error(`Invalid ticker symbol: ${ticker}`);
  }

  return makeApiCall<BalanceSheet>(
    (apiKey) => {
      const url = new URL(ALPHA_VANTAGE_BASE_URL);
      url.searchParams.set('function', 'BALANCE_SHEET');
      url.searchParams.set('symbol', ticker.toUpperCase());
      url.searchParams.set('apikey', apiKey);
      return url;
    },
    (data: AlphaVantageBalanceSheetResponse) => {
      // Log the full response for debugging
      console.log(`Alpha Vantage BALANCE_SHEET response for ${ticker}:`, JSON.stringify(data, null, 2).substring(0, 1000));

      const sheet = data;

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
    },
    `getBalanceSheet(${ticker})`,
    { next: { revalidate: 3600 } } // Cache for 1 hour
  );
}

/**
 * Get cash flow statement (annual and quarterly)
 */
export async function getCashFlow(ticker: string): Promise<CashFlow> {
  if (!validateTicker(ticker)) {
    throw new Error(`Invalid ticker symbol: ${ticker}`);
  }

  return makeApiCall<CashFlow>(
    (apiKey) => {
      const url = new URL(ALPHA_VANTAGE_BASE_URL);
      url.searchParams.set('function', 'CASH_FLOW');
      url.searchParams.set('symbol', ticker.toUpperCase());
      url.searchParams.set('apikey', apiKey);
      return url;
    },
    (data: AlphaVantageCashFlowResponse) => {
      const cashFlow = data;
      return {
        symbol: cashFlow.symbol || ticker.toUpperCase(),
        annualReports: cashFlow.annualReports || [],
        quarterlyReports: cashFlow.quarterlyReports || [],
      };
    },
    `getCashFlow(${ticker})`,
    { next: { revalidate: 3600 } } // Cache for 1 hour
  );
}

/**
 * Get daily prices (using free TIME_SERIES_DAILY endpoint)
 * Note: Free endpoint doesn't provide adjusted close, so we use close price for adjustedClose
 */
export async function getDailyPrices(ticker: string): Promise<PricePoint[]> {
  if (!validateTicker(ticker)) {
    throw new Error(`Invalid ticker symbol: ${ticker}`);
  }

  return makeApiCall<PricePoint[]>(
    (apiKey) => {
      const url = new URL(ALPHA_VANTAGE_BASE_URL);
      url.searchParams.set('function', 'TIME_SERIES_DAILY'); // Free endpoint (not ADJUSTED)
      url.searchParams.set('symbol', ticker.toUpperCase());
      url.searchParams.set('apikey', apiKey);
      url.searchParams.set('outputsize', 'full'); // Get full history
      url.searchParams.set('datatype', 'json');
      return url;
    },
    (data: AlphaVantageTimeSeriesResponse) => {
      // Log the full response for debugging
      console.log(`Alpha Vantage TIME_SERIES_DAILY response for ${ticker}:`, JSON.stringify(data, null, 2).substring(0, 1000));

      const timeSeries = data;
      const series = timeSeries['Time Series (Daily)'];

      if (!series) {
        console.error('No time series data in response:', data);
        throw new Error('No time series data available');
      }

      const prices: PricePoint[] = Object.entries(series)
        .map(([date, values]) => {
          const close = parseFloat(values['4. close']);
          // Free endpoint has volume as '5. volume', adjusted endpoint has '6. volume'
          const volumeValue = (values as any)['5. volume'] || (values as any)['6. volume'] || '0';
          return {
            date,
            open: parseFloat(values['1. open']),
            high: parseFloat(values['2. high']),
            low: parseFloat(values['3. low']),
            close: close,
            adjustedClose: close, // Free endpoint doesn't have adjusted close, use close price
            volume: parseInt(volumeValue, 10),
          };
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return prices;
    },
    `getDailyPrices(${ticker})`,
    { next: { revalidate: 900 } } // Cache for 15 minutes
  );
}

/**
 * Get intraday prices (optional)
 */
export async function getIntradayPrices(
  ticker: string,
  interval: '1min' | '5min' | '15min' | '30min' | '60min' = '5min'
): Promise<PricePoint[]> {
  if (!validateTicker(ticker)) {
    throw new Error(`Invalid ticker symbol: ${ticker}`);
  }

  return makeApiCall<PricePoint[]>(
    (apiKey) => {
      const url = new URL(ALPHA_VANTAGE_BASE_URL);
      url.searchParams.set('function', 'TIME_SERIES_INTRADAY');
      url.searchParams.set('symbol', ticker.toUpperCase());
      url.searchParams.set('interval', interval);
      url.searchParams.set('apikey', apiKey);
      url.searchParams.set('datatype', 'json');
      return url;
    },
    (data: AlphaVantageTimeSeriesResponse) => {
      const timeSeries = data;
      const seriesKey = `Time Series (${interval})` as keyof typeof timeSeries;
      const series = timeSeries[seriesKey] as typeof timeSeries['Time Series (Daily)'];

      if (!series) {
        throw new Error('No intraday time series data available');
      }

      const prices: PricePoint[] = Object.entries(series)
        .map(([date, values]) => {
          const close = parseFloat(values['4. close']);
          // Intraday endpoint may or may not have adjusted close, use close if not available
          const adjustedClose = (values as any)['5. adjusted close'] 
            ? parseFloat((values as any)['5. adjusted close']) 
            : close;
          // Volume might be '5. volume' or '6. volume' depending on endpoint
          const volumeValue = (values as any)['5. volume'] || (values as any)['6. volume'] || '0';
          return {
            date,
            open: parseFloat(values['1. open']),
            high: parseFloat(values['2. high']),
            low: parseFloat(values['3. low']),
            close: close,
            adjustedClose: adjustedClose,
            volume: parseInt(volumeValue, 10),
          };
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return prices;
    },
    `getIntradayPrices(${ticker})`,
    { next: { revalidate: 300 } } // Cache for 5 minutes
  );
}

/**
 * Get earnings data (optional)
 */
export async function getEarnings(ticker: string): Promise<Earnings> {
  if (!validateTicker(ticker)) {
    throw new Error(`Invalid ticker symbol: ${ticker}`);
  }

  return makeApiCall<Earnings>(
    (apiKey) => {
      const url = new URL(ALPHA_VANTAGE_BASE_URL);
      url.searchParams.set('function', 'EARNINGS');
      url.searchParams.set('symbol', ticker.toUpperCase());
      url.searchParams.set('apikey', apiKey);
      return url;
    },
    (data: AlphaVantageEarningsResponse) => {
      const earnings = data;
      return {
        symbol: earnings.symbol || ticker.toUpperCase(),
        annualEarnings: earnings.annualEarnings || [],
        quarterlyEarnings: earnings.quarterlyEarnings || [],
      };
    },
    `getEarnings(${ticker})`,
    { next: { revalidate: 3600 } } // Cache for 1 hour
  );
}

