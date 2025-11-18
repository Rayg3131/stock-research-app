import { NextResponse } from 'next/server';
import { getBalanceSheet } from '@/lib/alphaVantage';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
    console.log(`Fetching balance sheet for ticker: ${ticker}`);
    const sheet = await getBalanceSheet(ticker);
    return NextResponse.json(sheet);
  } catch (error) {
    console.error('Error in balance sheet route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch balance sheet' },
      { status: 500 }
    );
  }
}

