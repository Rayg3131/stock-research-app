# Stock Research App - Next.js

## Overview
A comprehensive stock research application built with Next.js that provides financial analysis tools, including company overview, financial statements, price trends, and forecasting capabilities. The app fetches real-time stock data from Alpha Vantage API.

## Recent Changes
**Date: November 19, 2024**
- **Migration from Vercel to Replit**: Successfully migrated the application to run on Replit infrastructure
  - Configured Next.js dev server to bind to 0.0.0.0:5000 for Replit compatibility
  - Set up production deployment configuration (autoscale)
  - Installed all npm dependencies
  - Configured Alpha Vantage API key via Replit Secrets
- **Financial Statements Percentage Toggle Feature**: Added per-line-item toggle between dollar amounts and percentages
  - Each line item now has a toggle button ($/%%) to switch views
  - Income statement: Shows values as % of revenue (e.g., Cost of Revenue → Cost %, Gross Profit → Gross Margin %)
  - Balance sheet: Shows values as % of total assets
  - Cash flow: Shows values as % of operating cash flow
  - YoY percentage changes remain visible in both dollar and percentage modes

## Project Architecture

### Tech Stack
- **Framework**: Next.js 16.0.3 with App Router
- **UI**: React 19.2.0 with Tailwind CSS 4
- **State Management**: TanStack Query (React Query) v5.62.0
- **Charts**: Recharts v2.12.7
- **Language**: TypeScript 5

### Project Structure
```
/app              - Next.js App Router pages and layouts
  /[ticker]       - Dynamic ticker routes (overview, statements, forecast, etc.)
  /api            - Server-side API routes for Alpha Vantage integration
  /watchlist      - Watchlist feature
/components       - Reusable React components (charts, tables, forms)
/lib              - Utility functions and API integrations
  alphaVantage.ts - Alpha Vantage API client (server-side only)
  calculations.ts - Financial calculations
  forecasting.ts  - Stock forecasting logic
  storage.ts      - Local storage utilities
  transformers.ts - Data transformation functions
```

### Security Architecture
- **API Key Management**: Alpha Vantage API key stored in Replit Secrets (ALPHAVANTAGE_API_KEY)
- **Server-Side Only**: All API calls to Alpha Vantage happen in Next.js API routes (`/app/api/ticker/[ticker]/*`)
- **Client/Server Separation**: Client-side code never accesses the API key directly
- **No Mock Data**: Application uses authentic data from Alpha Vantage API

## Environment Configuration

### Required Environment Variables
- `ALPHAVANTAGE_API_KEY` - API key for Alpha Vantage financial data service
  - Get your free API key at: https://www.alphavantage.co/support/#api-key

### Replit Configuration
- **Dev Server**: Runs on port 5000, binds to 0.0.0.0
- **Package Manager**: npm (detected from package-lock.json)
- **Workflow**: "Next.js Dev Server" - runs `npm run dev`
- **Deployment**: Autoscale (stateless) with `npm run build` and `npm run start`

## Running the Application

### Development
The app runs automatically via the configured workflow. If you need to restart manually:
```bash
npm run dev
```
Access at: http://localhost:5000 (or the Replit webview)

### Production Deployment
When you publish/deploy on Replit:
1. Build command: `npm run build`
2. Start command: `npm run start`
3. Port: 5000

## Features
- **Ticker Search**: Search for any stock ticker (e.g., AAPL, TSLA, MSFT)
- **Company Overview**: Key metrics, sector, industry, and financial ratios
- **Financial Statements**: Income statement, balance sheet, cash flow (annual & quarterly)
- **Price Charts**: Historical price data with custom date ranges
- **Price Metrics**: Detailed valuation and performance metrics
- **Forecasting**: Custom stock price forecasting tools
- **Watchlist**: Track multiple stocks in one place
- **Comparisons**: Compare multiple stocks side-by-side

## Known Warnings (Non-Critical)
- Cross-origin request warnings in Next.js 16 are informational only and don't affect functionality
- Client-side console shows "ALPHAVANTAGE_API_KEY is not set" warning, which is expected and correct (key should only be server-side)
- Hydration mismatch warnings may appear but don't affect app functionality

## User Preferences
- None documented yet

## Next Steps / Future Enhancements
- Monitor Next.js release notes for `allowedDevOrigins` configuration when it becomes stable
- Consider adding more stock tickers to the default watchlist
- Add user authentication for personalized watchlists
- Implement caching strategies for API rate limit optimization
