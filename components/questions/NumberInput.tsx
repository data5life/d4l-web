'use client';

import { DecimalQuestion } from '@/lib/questionnaireTypes';
import { useTranslations } from 'next-intl';

interface NumberInputProps {
  question: DecimalQuestion;
  value: number | null;
  onChange: (value: number | null) => void;
}

export function NumberInput({ question, value, onChange }: NumberInputProps) {
  const { validation, type } = question;
  const step = type === 'decimal' ? '0.01' : '1';
  const t = useTranslations('questions');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange(null);
    } else {
      const num = type === 'decimal' ? parseFloat(val) : parseInt(val, 10);
      if (!isNaN(num)) {
        onChange(num);
      }
    }
  };

  const minValue = validation?.min;
  const maxValue = validation?.max;

  return (
    <div className="w-full">
      <input
        type="number"
        value={value ?? ''}
        onChange={handleChange}
        placeholder={t('numberPlaceholder')}
        min={validation?.min}
        max={validation?.max}
        step={step}
        className="w-full [appearance:textfield] rounded-xl border-2 border-gray-200 bg-white px-5 py-4 text-base text-gray-700 transition-all duration-200 outline-none placeholder:text-gray-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {(minValue !== undefined || maxValue !== undefined) && (
        <p className="mt-3 flex items-center gap-2 text-sm text-gray-400">
          <svg
            className="h-4 w-4 text-violet-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {minValue !== undefined && maxValue !== undefined
            ? t('numberRange', { min: minValue, max: maxValue })
            : minValue !== undefined
              ? t('minValue', { min: minValue })
              : t('maxValue', { max: maxValue as number })}
        </p>
      )}
    </div>
  );
}
