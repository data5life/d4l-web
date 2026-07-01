'use client';

import { StringQuestion } from '@/lib/questionnaireTypes';
import { useTranslations } from 'next-intl';

interface TextInputProps {
  question: StringQuestion;
  value: string;
  onChange: (value: string) => void;
}

export function TextInput({ question, value, onChange }: TextInputProps) {
  const { validation } = question;
  const t = useTranslations('questions');

  return (
    <div className="w-full">
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('textPlaceholder')}
        minLength={validation?.minLength}
        maxLength={validation?.maxLength}
        className="w-full rounded-xl border-2 border-gray-200 bg-white px-5 py-4 text-base text-gray-700 transition-all duration-200 outline-none placeholder:text-gray-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
      />
      {validation?.maxLength && (
        <p className="mt-3 text-right text-sm text-gray-400">
          <span
            className={`font-medium ${(value || '').length > validation.maxLength * 0.9 ? 'text-amber-500' : 'text-violet-600'}`}
          >
            {(value || '').length}
          </span>
          {' / '}
          {validation.maxLength}
        </p>
      )}
    </div>
  );
}
