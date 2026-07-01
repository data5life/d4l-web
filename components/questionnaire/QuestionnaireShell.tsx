'use client';

import { useTranslations } from 'next-intl';
import { AnswerValue } from '@/lib/questionnaireTypes';
import {
  QuestionnaireProvider,
  QuestionnaireMode,
  useQuestionnaire,
} from './QuestionnaireProvider';
import { QuestionnaireWizard } from './QuestionnaireWizard';
import { useProgramDashboard } from '../ProgramDashboardProvider';
import { Spinner } from '../ui/spinner';
import { useRouter } from '@/i18n/navigation';
import { useEffect } from 'react';
import { ResourceQuestionnaire } from '@/lib/types/resource';

type Props =
  | {
      questionnaireName: string;
      mode: 'new';
    }
  | {
      submissionId: string;
      mode: 'submission';
    };

export function QuestionnaireShell(props: Props) {
  const { state, allTasks } = useProgramDashboard();
  const router = useRouter();
  const data = state.data;

  let isInvalid = false;
  let questionnaire = null;
  let submission: ResourceQuestionnaire | null = null;

  if (data.status === 'success') {
    const programQuestionnaires = data.programQuestionnaires;

    if (props.mode === 'new') {
      const questionnaireTask = allTasks?.find(
        (task) => task.type === 'survey' && task.questionnaireName === props.questionnaireName,
      );
      questionnaire = programQuestionnaires.get(props.questionnaireName);
      if (
        !questionnaire ||
        !questionnaireTask ||
        questionnaireTask.taskAccess.status !== 'accessible'
      ) {
        isInvalid = true;
      }
    } else if (props.mode === 'submission') {
      const resource = data.resources.find((r) => r.id === props.submissionId);
      if (!resource || resource.type !== 'Questionnaire') {
        isInvalid = true;
      } else {
        submission = resource;
        questionnaire = programQuestionnaires.get(submission.questionnaire.name);
        if (!questionnaire) {
          isInvalid = true;
        }
      }
    }
  }

  useEffect(() => {
    if (isInvalid) router.replace(`/dashboard/program/${state.program.name}`);
  }, [isInvalid, state.program.name, router]);

  if (data.status === 'loading' || data.status === 'error') {
    return <Spinner />;
  }

  if (isInvalid) return null;

  if (props.mode === 'new' && questionnaire) {
    return (
      <QuestionnaireProvider questionnaire={questionnaire} mode="new">
        <ShellContent mode="new" />
      </QuestionnaireProvider>
    );
  }
  if (props.mode === 'submission' && questionnaire && submission) {
    const initialAnswers: Record<string, AnswerValue> = {};

    submission!.answers.forEach((answer) => {
      if (!answer.response) {
        initialAnswers[answer.id] = null;
        return;
      }

      if (answer.type === 'multi-select') {
        initialAnswers[answer.id] = answer.response.map((r) => r.value);
      } else if (
        answer.type === 'scale-ordinal' ||
        answer.type === 'scale-numeric' ||
        answer.type === 'decimal'
      ) {
        initialAnswers[answer.id] = Number(answer.response.value);
      } else {
        initialAnswers[answer.id] = answer.response.value;
      }
    });

    return (
      <QuestionnaireProvider
        questionnaire={questionnaire}
        mode="submission"
        submission={submission}
        initialAnswers={initialAnswers}
      >
        <ShellContent mode="submission" />
      </QuestionnaireProvider>
    );
  }
  return null;
}

function ShellContent({ mode }: { mode: QuestionnaireMode }) {
  const t = useTranslations('submission');
  const q = useTranslations('questionnaire');
  const { state, questionnaire } = useQuestionnaire();

  return (
    <div className="animate-slideUp py-16">
      <div className="mb-10 text-center">
        {mode === 'submission' && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-sm font-medium text-violet-700">
            {t('editingSubmission')}
          </div>
        )}
        <h1 className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">
          {questionnaire.title ?? q('fallbackTitle')}
        </h1>
        <p className="text-lg text-gray-500">
          {mode === 'submission'
            ? t('reviewUpdate')
            : state.isComplete
              ? q('reviewAnswers')
              : q('headerSubtitle')}
        </p>
      </div>
      <QuestionnaireWizard />
    </div>
  );
}
