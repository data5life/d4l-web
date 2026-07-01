'use client';

import { ScaleNumericalQuestion } from '@/lib/questionnaireTypes';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Slider as UiSlider } from '@/components/ui/slider';

interface ScaleNumericalProps {
  question: ScaleNumericalQuestion;
  value: number | null;
  onChange: (value: number) => void;
}

// TODO: Split ScaleOrdinal and ScaleNumerical into two different components
// ScaleOrdinal has labels, and always step 1, it also doesnt have a value input field
// ScaleNumerical never has labels
export function ScaleNumerical({ question, value, onChange }: ScaleNumericalProps) {
  const { range, step } = question;
  const currentValue = value ?? range.min;
  const [typedValue, setTypedValue] = useState(String(currentValue));

  // Sync the editable input to upstream value changes (slider drag, reset, etc.)
  // without an effect — see https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [lastSyncedValue, setLastSyncedValue] = useState(currentValue);
  if (lastSyncedValue !== currentValue) {
    setLastSyncedValue(currentValue);
    setTypedValue(String(currentValue));
  }

  const clamp = (nextValue: number) => Math.min(range.max, Math.max(range.min, nextValue));
  const roundToStep = (nextValue: number) => {
    const decimals = (String(step).split('.')[1] || '').length;
    const stepped = Math.round((nextValue - range.min) / step) * step + range.min;
    return Number(clamp(stepped).toFixed(decimals));
  };

  const updateValue = (nextValue: number) => {
    onChange(roundToStep(nextValue));
  };

  // Initialise the answer to range.min when no value has been picked yet, so
  // the user can submit the starting position without first nudging the
  // slider. Uses == to catch both null (cleared) and undefined (never set).
  useEffect(() => {
    if (value == null) {
      onChange(range.min);
    }
  }, [value, onChange, range.min]);

  const handleTypedValueChange = (nextValue: string) => {
    setTypedValue(nextValue);

    if (nextValue === '') return;

    const parsedValue = Number(nextValue);
    if (Number.isFinite(parsedValue)) {
      updateValue(parsedValue);
    }
  };

  const handleTypedValueBlur = () => {
    const parsedValue = Number(typedValue);

    if (typedValue === '' || !Number.isFinite(parsedValue)) {
      setTypedValue(String(currentValue));
      return;
    }

    const normalizedValue = roundToStep(parsedValue);
    onChange(normalizedValue);
    setTypedValue(String(normalizedValue));
  };

  return (
    <div className="w-full">
      {/* Slider container */}
      <div className="relative py-4">
        <UiSlider
          min={range.min}
          max={range.max}
          step={step}
          value={[currentValue]}
          onValueChange={(values) => {
            const [nextValue] = values;
            if (typeof nextValue === 'number') {
              updateValue(nextValue);
            }
          }}
          aria-label={question.text}
          className="w-full"
        />
      </div>

      {/* Range indicators */}
      <div className="mt-4 flex justify-between text-xs font-medium text-gray-400">
        <span>{range.min}</span>
        <Input
          type="number"
          min={range.min}
          max={range.max}
          step={step}
          value={typedValue}
          onChange={(e) => handleTypedValueChange(e.target.value)}
          onBlur={handleTypedValueBlur}
          aria-label={`${question.text} value`}
          className="h-auto w-28 [appearance:textfield] rounded-xl border-0 bg-violet-100 px-6 py-3 text-center text-2xl font-bold text-violet-700 focus-visible:border-violet-500 focus-visible:ring-violet-100 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span>{range.max}</span>
      </div>
    </div>
  );
}
