'use client';

import { DateQuestion, YearQuestion } from '@/lib/questionnaireTypes';
import { useTranslations } from 'next-intl';

interface DatePickerProps {
  question: DateQuestion | YearQuestion;
  value: string;
  onChange: (value: string) => void;
}

function calculateRelativeDate(relative: {
  value: number;
  unit: 'days' | 'weeks' | 'months' | 'years';
}): string {
  const date = new Date();

  switch (relative.unit) {
    case 'days':
      date.setDate(date.getDate() + relative.value);
      break;
    case 'weeks':
      date.setDate(date.getDate() + relative.value * 7);
      break;
    case 'months':
      date.setMonth(date.getMonth() + relative.value);
      break;
    case 'years':
      date.setFullYear(date.getFullYear() + relative.value);
      break;
  }

  return date.toISOString().split('T')[0];
}

export function DatePicker({ question, value, onChange }: DatePickerProps) {
  const { validation, type } = question;
  const isYearOnly = type === 'year';
  const t = useTranslations('questions');

  // Calculate min/max dates
  let minDate = validation?.min;
  let maxDate = validation?.max;

  if (validation?.relativeMin) {
    const relMin = calculateRelativeDate(validation.relativeMin);
    minDate = minDate ? (relMin > minDate ? relMin : minDate) : relMin;
  }

  if (validation?.relativeMax) {
    const relMax = calculateRelativeDate(validation.relativeMax);
    maxDate = maxDate ? (relMax < maxDate ? relMax : maxDate) : relMax;
  }

  if (isYearOnly) {
    // Extract year from date bounds
    const minYear = minDate ? minDate.substring(0, 4) : undefined;
    const maxYear = maxDate ? maxDate.substring(0, 4) : undefined;

    // Generate year options
    const currentYear = new Date().getFullYear();
    const startYear = minYear ? parseInt(minYear) : currentYear - 100;
    const endYear = maxYear ? parseInt(maxYear) : currentYear;
    const years: number[] = [];

    for (let y = endYear; y >= startYear; y--) {
      years.push(y);
    }

    return (
      <div className="w-full">
        <div className="relative">
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full cursor-pointer appearance-none rounded-xl border-2 border-gray-200 bg-white px-5 py-4 text-base text-gray-700 transition-all duration-200 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
          >
            <option value="">{t('selectYear')}</option>
            {years.map((year) => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute top-1/2 right-5 -translate-y-1/2">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        min={minDate}
        max={maxDate}
        className="w-full cursor-pointer rounded-xl border-2 border-gray-200 bg-white px-5 py-4 text-base text-gray-700 transition-all duration-200 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
      />
    </div>
  );
}
