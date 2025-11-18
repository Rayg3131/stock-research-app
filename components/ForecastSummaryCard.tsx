import type { ForecastOutputs } from '@/lib/types';
import { formatCurrency, formatPercentage } from '@/lib/calculations';

interface ForecastSummaryCardProps {
  outputs: ForecastOutputs;
  currentPrice: number | null;
}

export default function ForecastSummaryCard({ outputs, currentPrice }: ForecastSummaryCardProps) {
  const upside = currentPrice ? ((outputs.impliedPrice - currentPrice) / currentPrice) * 100 : null;

  return (
    <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6 dark:border-gray-700 dark:from-blue-900/20 dark:to-blue-800/20">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Forecast Summary</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Projected EPS</div>
          <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            ${outputs.projectedEPS.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Implied Price</div>
          <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(outputs.impliedPrice, 2)}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {upside !== null ? (upside >= 0 ? 'Upside' : 'Downside') : 'Current Price'}
          </div>
          <div
            className={`mt-1 text-2xl font-bold ${
              upside !== null
                ? upside >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            {upside !== null ? formatPercentage(upside) : formatCurrency(currentPrice, 2)}
          </div>
        </div>
      </div>
    </div>
  );
}

