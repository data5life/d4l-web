import { ReactNode } from 'react';

interface ProgressBarProps {
  percentage: number;
  label: ReactNode;
}

export function ProgressBar({ percentage, label }: ProgressBarProps) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Progress text */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <span className="text-sm font-semibold text-violet-600">{Math.round(percentage)}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-violet-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-600 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
