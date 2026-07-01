'use client';

import { SingleSelectQuestion } from '@/lib/questionnaireTypes';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface SingleSelectProps {
  question: SingleSelectQuestion;
  value: string;
  onChange: (value: string) => void;
}

export function SingleSelect({ question, value, onChange }: SingleSelectProps) {
  const { options } = question;

  return (
    <RadioGroup
      value={value}
      onValueChange={onChange}
      aria-label={question.text}
      className="w-full space-y-3"
    >
      {options.map((option) => {
        const isSelected = value === option.value;
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
            <RadioGroupItem id={optionId} value={option.value} />
            <span
              className={`text-base transition-colors duration-200 ${isSelected ? 'font-medium text-violet-700' : 'text-gray-700'}`}
            >
              {option.label}
            </span>
          </Label>
        );
      })}
    </RadioGroup>
  );
}
