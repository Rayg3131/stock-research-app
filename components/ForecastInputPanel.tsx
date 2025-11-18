'use client';

import type { ForecastInputs } from '@/lib/types';

interface ForecastInputPanelProps {
  inputs: ForecastInputs;
  onChange: (inputs: ForecastInputs) => void;
  onReset: () => void;
}

export default function ForecastInputPanel({ inputs, onChange, onReset }: ForecastInputPanelProps) {
  const updateInput = (key: keyof ForecastInputs, value: number) => {
    onChange({ ...inputs, [key]: value });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Forecast Assumptions</h3>
        <button
          onClick={onReset}
          className="rounded bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
        >
          Reset to Current
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Revenue Growth (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={inputs.revenueGrowth}
            onChange={(e) => updateInput('revenueGrowth', parseFloat(e.target.value) || 0)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Gross Margin (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={inputs.grossMargin}
            onChange={(e) => updateInput('grossMargin', parseFloat(e.target.value) || 0)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Operating Margin (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={inputs.operatingMargin}
            onChange={(e) => updateInput('operatingMargin', parseFloat(e.target.value) || 0)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Net Margin (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={inputs.netMargin}
            onChange={(e) => updateInput('netMargin', parseFloat(e.target.value) || 0)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tax Rate (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={inputs.taxRate}
            onChange={(e) => updateInput('taxRate', parseFloat(e.target.value) || 0)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            PE Multiple
          </label>
          <input
            type="number"
            step="0.1"
            value={inputs.peMultiple}
            onChange={(e) => updateInput('peMultiple', parseFloat(e.target.value) || 0)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>
    </div>
  );
}

