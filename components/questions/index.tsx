'use client';

import { Question, AnswerValue } from '@/lib/questionnaireTypes';
import { TextInput } from './TextInput';
import { TextArea } from './TextArea';
import { NumberInput } from './NumberInput';
import { DatePicker } from './DatePicker';
import { SingleSelect } from './SingleSelect';
import { MultiSelect } from './MultiSelect';
import { useTranslations } from 'next-intl';
import { ScaleOrdinal } from './ScaleOrdinal';
import { ScaleNumerical } from './ScaleNumerical';

interface QuestionRendererProps {
  question: Question;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
}

export function QuestionRenderer({ question, value, onChange }: QuestionRendererProps) {
  const common = useTranslations('common');
  switch (question.type) {
    case 'string':
      return <TextInput question={question} value={(value as string) || ''} onChange={onChange} />;

    case 'text':
      return <TextArea question={question} value={(value as string) || ''} onChange={onChange} />;

    case 'decimal':
      return <NumberInput question={question} value={value as number | null} onChange={onChange} />;

    case 'date':
    case 'year':
      return <DatePicker question={question} value={(value as string) || ''} onChange={onChange} />;

    case 'scale-ordinal':
      return (
        <ScaleOrdinal question={question} value={value as number | null} onChange={onChange} />
      );

    case 'scale-numeric':
      return (
        <ScaleNumerical question={question} value={value as number | null} onChange={onChange} />
      );

    case 'single-select':
      return (
        <SingleSelect question={question} value={(value as string) || ''} onChange={onChange} />
      );

    case 'multi-select':
      return (
        <MultiSelect question={question} value={(value as string[]) || []} onChange={onChange} />
      );

    default:
      return (
        <div className="w-full rounded-xl bg-gray-100 p-4 text-center text-gray-500">
          {common('unsupportedQuestionType', {
            type: (question as Question).type,
          })}
        </div>
      );
  }
}
