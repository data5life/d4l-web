'use client';

import { MultiSelectQuestion } from '@/lib/questionnaireTypes';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';

interface MultiSelectProps {
  question: MultiSelectQuestion;
  value: string[];
  onChange: (value: string[]) => void;
}

export function MultiSelect({ question, value, onChange }: MultiSelectProps) {
  const { options } = question;
  const selectedValues = value || [];
  const t = useTranslations('questions');

  const toggleOption = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter((v) => v !== optionValue));
    } else {
      onChange([...selectedValues, optionValue]);
    }
  };

  return (
    <div className="w-full space-y-3" role="group" aria-label={question.text}>
      <p className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <svg
          className="h-4 w-4 text-violet-500"
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
        {t('multiSelectHint')}
      </p>
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.value);
        const optionId = `${question.id}-${option.value}`;

        return (
          <Label
            key={option.value}
            htmlFor={optionId}
            className={`flex w-full cursor-pointer items-center gap-4 rounded-xl border-2 px-5 py-4 text-left transition-all duration-200 focus-within:ring-2 focus-within:ring-violet-500 focus-within:ring-offset-2 ${
              isSelected
                ? 'shadow-soft border-violet-500 bg-violet-50'
                : 'border-gray-200 bg-white hover:border-violet-200 hover:bg-violet-50/30'
            }`}
          >
            <Checkbox
              id={optionId}
              checked={isSelected}
              onCheckedChange={() => toggleOption(option.value)}
              aria-label={option.label}
            />
            <span
              className={`text-base transition-colors duration-200 ${isSelected ? 'font-medium text-violet-700' : 'text-gray-700'}`}
            >
              {option.label}
            </span>
          </Label>
        );
      })}
    </div>
  );
}
