'use client';

import { ScaleOrdinalQuestion } from '@/lib/questionnaireTypes';
import { useEffect } from 'react';

interface ScaleOrdinalProps {
  question: ScaleOrdinalQuestion;
  value: number | null;
  onChange: (value: number) => void;
}

export function ScaleOrdinal({ question, value, onChange }: ScaleOrdinalProps) {
  const { range, labels } = question;

  const steps = Array.from({ length: range.max - range.min + 1 }, (_, i) => range.min + i);

  const currentValue = value ?? range.min;

  // Initialise the answer to range.min when no value has been picked yet, so
  // the user can submit the starting position without first nudging the
  // slider. Uses == to catch both null (cleared) and undefined (never set).
  useEffect(() => {
    if (value == null) {
      onChange(range.min);
    }
  }, [value, onChange, range.min]);

  return (
    <div className="w-full">
      {/* Ordinal Scale */}
      <div className="relative flex items-center justify-between">
        <div className="absolute top-1/2 right-0 left-0 z-0 h-0.5 -translate-y-1/2 bg-gray-200" />

        {steps.map((stepValue) => {
          const isSelected = currentValue === stepValue;

          return (
            <button
              key={stepValue}
              type="button"
              onClick={() => onChange(stepValue)}
              className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white transition-colors duration-150 hover:border-gray-400"
              aria-label={`${question.text}: ${stepValue}`}
              aria-pressed={isSelected}
            >
              {isSelected && (
                <span className="animate-in fade-in zoom-in-75 h-5.5 w-5.5 rounded-full bg-purple-600 duration-100" />
              )}
            </button>
          );
        })}
      </div>

      {/* Labels */}
      <div className="mb-3 flex justify-between pt-3 text-sm font-medium text-gray-500">
        <span>{labels.min}</span>
        <span>{labels.max}</span>
      </div>
    </div>
  );
}
