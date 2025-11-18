import { NextResponse } from 'next/server';
import { getIncomeStatement } from '@/lib/alphaVantage';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
    console.log(`Fetching income statement for ticker: ${ticker}`);
    const statement = await getIncomeStatement(ticker);
    return NextResponse.json(statement);
  } catch (error) {
    console.error('Error in income statement route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch income statement' },
      { status: 500 }
    );
  }
}

