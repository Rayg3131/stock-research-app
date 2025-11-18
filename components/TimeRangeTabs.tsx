'use client';

import type { TimeRange } from '@/lib/types';

interface TimeRangeTabsProps {
  selected: TimeRange;
  onChange: (range: TimeRange) => void;
  className?: string;
}

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '1D', label: '1D' },
  { value: '5D', label: '5D' },
  { value: '1M', label: '1M' },
  { value: '6M', label: '6M' },
  { value: '1Y', label: '1Y' },
  { value: '5Y', label: '5Y' },
  { value: 'Max', label: 'Max' },
];

export default function TimeRangeTabs({ selected, onChange, className = '' }: TimeRangeTabsProps) {
  return (
    <div className={`flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800 ${className}`}>
      {TIME_RANGES.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
            selected === range.value
              ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}

