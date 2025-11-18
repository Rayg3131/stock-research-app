import { NextResponse } from 'next/server';
import { getDailyPrices } from '@/lib/alphaVantage';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
    console.log(`Fetching prices for ticker: ${ticker}`);
    const prices = await getDailyPrices(ticker);
    return NextResponse.json(prices);
  } catch (error) {
    console.error('Error in prices route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch prices' },
      { status: 500 }
    );
  }
}

