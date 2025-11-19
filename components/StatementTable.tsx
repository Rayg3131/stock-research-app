'use client';

import { useState } from 'react';
import type { AnnualReport, QuarterlyReport, StatementType } from '@/lib/types';
import { 
  calculateYoYGrowth, 
  calculateAsPercentOfRevenue,
  calculateAsPercentOfAssets,
  calculateAsPercentOfOperatingCashFlow
} from '@/lib/calculations';
import { parseValue } from '@/lib/transformers';
import { formatCurrency, formatPercentage } from '@/lib/calculations';

interface StatementTableProps {
  reports: AnnualReport[] | QuarterlyReport[];
  fields: string[];
  showYoY?: boolean;
  statementType: StatementType;
}

function formatFieldLabel(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export default function StatementTable({ reports, fields, showYoY = false, statementType }: StatementTableProps) {
  const [percentageFields, setPercentageFields] = useState<Set<string>>(new Set());

  const sortedReports = [...reports].sort(
    (a, b) => new Date(b.fiscalDateEnding).getTime() - new Date(a.fiscalDateEnding).getTime()
  );

  if (sortedReports.length === 0) {
    return <div className="text-center text-gray-500">No data available</div>;
  }

  const toggleFieldPercentage = (field: string) => {
    setPercentageFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(field)) {
        newSet.delete(field);
      } else {
        newSet.add(field);
      }
      return newSet;
    });
  };

  const calculatePercentage = (value: number | null, report: AnnualReport | QuarterlyReport): number | null => {
    if (statementType === 'income') {
      const revenue = parseValue(report.totalRevenue);
      return calculateAsPercentOfRevenue(value, revenue);
    } else if (statementType === 'balance') {
      const totalAssets = parseValue(report.totalAssets);
      return calculateAsPercentOfAssets(value, totalAssets);
    } else if (statementType === 'cashflow') {
      const operatingCashFlow = parseValue(report.operatingCashflow);
      return calculateAsPercentOfOperatingCashFlow(value, operatingCashFlow);
    }
    return null;
  };

  const getFieldLabel = (field: string, isPercentageMode: boolean): string => {
    const baseLabel = formatFieldLabel(field);
    // Change "Gross Profit" to "Gross Margin" when YoY is shown and percentage mode is active
    if (field === 'grossProfit' && showYoY && isPercentageMode) {
      return baseLabel.replace('Gross Profit', 'Gross Margin');
    }
    // Add "(EBIT)" to Operating Income
    if (field === 'operatingIncome') {
      return 'Operating Income (EBIT)';
    }
    return baseLabel;
  };

  const isShadedField = (field: string): boolean => {
    return field === 'grossProfit' || field === 'operatingIncome' || field === 'netIncome';
  };

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
            const isPercentageMode = percentageFields.has(field);
            const values = sortedReports.map((report) => parseValue(report[field]));
            const isShaded = isShadedField(field);
            
            return (
              <tr 
                key={field} 
                className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  isShaded ? 'bg-gray-100 dark:bg-gray-800' : ''
                }`}
              >
                <td className={`whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white ${
                  isShaded ? 'bg-gray-100 dark:bg-gray-800' : ''
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <span>{getFieldLabel(field, isPercentageMode)}</span>
                    <button
                      onClick={() => toggleFieldPercentage(field)}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        isPercentageMode
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                      title={isPercentageMode ? 'Switch to dollar amount' : 'Switch to percentage'}
                    >
                      {isPercentageMode ? '%' : '$'}
                    </button>
                  </div>
                </td>
                {values.map((value, idx) => {
                  const previousValue = idx < values.length - 1 ? values[idx + 1] : null;
                  const yoyGrowth = showYoY && previousValue !== null ? calculateYoYGrowth(value, previousValue) : null;
                  
                  const displayValue = isPercentageMode 
                    ? calculatePercentage(value, sortedReports[idx])
                    : value;

                  return (
                    <td 
                      key={idx} 
                      className={`whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 dark:text-white ${
                        isShaded ? 'bg-gray-100 dark:bg-gray-800' : ''
                      }`}
                    >
                      <div>
                        {isPercentageMode 
                          ? formatPercentage(displayValue) 
                          : formatCurrency(value)
                        }
                      </div>
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

