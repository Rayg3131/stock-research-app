import { NextResponse } from 'next/server';
import { getEarnings } from '@/lib/alphaVantage';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
    console.log(`Fetching earnings for ticker: ${ticker}`);
    const earnings = await getEarnings(ticker);
    return NextResponse.json(earnings);
  } catch (error) {
    console.error('Error in earnings route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch earnings' },
      { status: 500 }
    );
  }
}

