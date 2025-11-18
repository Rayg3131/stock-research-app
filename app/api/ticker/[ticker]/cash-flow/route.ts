import { NextResponse } from 'next/server';
import { getCashFlow } from '@/lib/alphaVantage';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
    console.log(`Fetching cash flow for ticker: ${ticker}`);
    const cashFlow = await getCashFlow(ticker);
    return NextResponse.json(cashFlow);
  } catch (error) {
    console.error('Error in cash flow route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch cash flow' },
      { status: 500 }
    );
  }
}

