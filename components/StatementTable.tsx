'use client';

import type { AnnualReport, QuarterlyReport } from '@/lib/types';
import { calculateYoYGrowth } from '@/lib/calculations';
import { parseValue } from '@/lib/transformers';
import { formatCurrency, formatPercentage } from '@/lib/calculations';

interface StatementTableProps {
  reports: AnnualReport[] | QuarterlyReport[];
  fields: string[];
  showYoY?: boolean;
}

function formatFieldLabel(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export default function StatementTable({ reports, fields, showYoY = false }: StatementTableProps) {
  const sortedReports = [...reports].sort(
    (a, b) => new Date(b.fiscalDateEnding).getTime() - new Date(a.fiscalDateEnding).getTime()
  );

  if (sortedReports.length === 0) {
    return <div className="text-center text-gray-500">No data available</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Line Item
            </th>
            {sortedReports.map((report) => (
              <th
                key={report.fiscalDateEnding}
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                {new Date(report.fiscalDateEnding).getFullYear()}
                {showYoY && <div className="text-xs font-normal">(YoY)</div>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
          {fields.map((field) => {
            const values = sortedReports.map((report) => parseValue(report[field]));
            return (
              <tr key={field} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  {formatFieldLabel(field)}
                </td>
                {values.map((value, idx) => {
                  const previousValue = idx < values.length - 1 ? values[idx + 1] : null;
                  const yoyGrowth = showYoY && previousValue !== null ? calculateYoYGrowth(value, previousValue) : null;

                  return (
                    <td key={idx} className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                      <div>{formatCurrency(value)}</div>
                      {showYoY && yoyGrowth !== null && (
                        <div
                          className={`text-xs ${
                            yoyGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {yoyGrowth >= 0 ? '+' : ''}
                          {formatPercentage(yoyGrowth)}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

