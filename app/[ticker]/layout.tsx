import { notFound } from 'next/navigation';
import { validateTicker } from '@/lib/alphaVantage';

export default async function TickerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const upperTicker = ticker?.toUpperCase();

  if (!upperTicker || !validateTicker(upperTicker)) {
    notFound();
  }

  return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>;
}

