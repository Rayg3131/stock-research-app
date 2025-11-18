import { NextResponse } from 'next/server';
import { getCompanyOverview } from '@/lib/alphaVantage';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
    console.log(`Fetching overview for ticker: ${ticker}`);
    const overview = await getCompanyOverview(ticker);
    return NextResponse.json(overview);
  } catch (error) {
    console.error('Error in overview route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch company overview' },
      { status: 500 }
    );
  }
}

