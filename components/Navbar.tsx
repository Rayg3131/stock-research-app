'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import TickerSearchBar from './TickerSearchBar';

export default function Navbar() {
  const pathname = usePathname();
  const isTickerPage = pathname?.match(/^\/([A-Z]+)\//);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/watchlist', label: 'Watchlist' },
  ];

  const tickerNavLinks = isTickerPage
    ? [
        { href: `/${isTickerPage[1]}/overview`, label: 'Overview' },
        { href: `/${isTickerPage[1]}/statements`, label: 'Statements' },
        { href: `/${isTickerPage[1]}/price-metrics`, label: 'Price & Metrics' },
        { href: `/${isTickerPage[1]}/forecast`, label: 'Forecast' },
        { href: `/${isTickerPage[1]}/comps`, label: 'Comps' },
        { href: `/${isTickerPage[1]}/trends`, label: 'Trends' },
      ]
    : [];

  return (
    <nav className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
              Stock Research
            </Link>
            <div className="hidden gap-4 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            {tickerNavLinks.length > 0 && (
              <div className="hidden gap-4 lg:flex">
                {tickerNavLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium transition-colors ${
                      pathname === link.href
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 max-w-md ml-8">
            <TickerSearchBar placeholder="Search ticker..." />
          </div>
        </div>
      </div>
    </nav>
  );
}

