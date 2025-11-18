interface MetricCardProps {
  label: string;
  value: string | number | null;
  subtext?: string;
  className?: string;
}

export default function MetricCard({ label, value, subtext, className = '' }: MetricCardProps) {
  const displayValue = value === null ? 'N/A' : value;

  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 ${className}`}>
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{displayValue}</div>
      {subtext && (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">{subtext}</div>
      )}
    </div>
  );
}

