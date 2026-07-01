'use client';

import { useTranslations } from 'next-intl';
import { useQuestionnaire } from './QuestionnaireProvider';
import { ProgressBar } from './ProgressBar';
import { QuestionCard } from './QuestionCard';
import { Summary } from './Summary';
import { QuestionRenderer } from '@/components/questions';
import { isQuestionAnswered, isAnswerValid, getValidationError } from '@/lib/evaluateConditions';
import { useProgramDashboard } from '../ProgramDashboardProvider';
import { useState, useEffect } from 'react';
import { Spinner } from '../ui/spinner';

export function QuestionnaireWizard() {
  const q = useTranslations('questionnaire');
  const {
    state,
    questionnaire,
    oldSubmission,
    currentQuestion,
    progress,
    setAnswer,
    nextQuestion,
    prevQuestion,
    goToQuestion,
    complete,
    reset,
    canGoPrev,
    isLastQuestion,
    hasCompletedOnce,
  } = useQuestionnaire();

  const {
    state: { lang, program },
  } = useProgramDashboard();

  const [isLocked, setIsLocked] = useState(false);
  const [lockLoaded, setLockLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkLock() {
      // If there is no existing submission, nothing to lock
      if (!oldSubmission) {
        if (!cancelled) {
          setIsLocked(false);
          setLockLoaded(true);
        }
        return;
      }
      const locked = oldSubmission.iteration.editEnd
        ? new Date() > oldSubmission.iteration.editEnd
        : false;
      if (!cancelled) {
        setIsLocked(locked);
        setLockLoaded(true);
      }
    }

    void checkLock();

    return () => {
      cancelled = true;
    };
  }, [program.name, questionnaire.name, oldSubmission]);

  if (!lockLoaded) {
    return <Spinner></Spinner>;
  }

  if (isLocked) {
    return (
      <Summary
        questionnaire={questionnaire}
        oldSubmission={oldSubmission}
        lang={lang}
        answers={state.answers}
        program={program}
        isReadOnly={true}
      />
    );
  }

  if (state.isComplete) {
    return (
      <Summary
        questionnaire={questionnaire}
        oldSubmission={oldSubmission}
        lang={lang}
        answers={state.answers}
        onEdit={goToQuestion}
        onReset={reset}
        program={program}
        isReadOnly={false}
      />
    );
  }

  if (!currentQuestion) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">{q('noQuestions')}</p>
      </div>
    );
  }

  const handleNext = () => (isLastQuestion ? complete() : nextQuestion());

  const handleSkip = () => {
    if (hasCompletedOnce) {
      setAnswer(currentQuestion.id, null);
      complete();
    } else {
      setAnswer(currentQuestion.id, null);
      handleNext();
    }
  };
  const currentAnswer = state.answers[currentQuestion.id];
  const isAnswered = isQuestionAnswered(currentQuestion, state.answers);
  const isValid = isAnswerValid(currentQuestion, state.answers);
  const error = getValidationError(currentQuestion, state.answers);
  const validationError = error ? q(`validation.${error.key}`, error.values) : null;

  return (
    <div className="w-full">
      <div className="mb-10">
        <ProgressBar
          percentage={progress.percentage}
          label={q.rich('questionProgress', {
            current: () => (
              <span className="font-semibold text-violet-600">{progress.current}</span>
            ),
            total: progress.total,
          })}
        />
      </div>
      <div key={currentQuestion.id} className="animate-fadeIn">
        <QuestionCard
          question={currentQuestion}
          onNext={handleNext}
          onPrev={prevQuestion}
          onSkip={handleSkip}
          canGoPrev={canGoPrev}
          isLastQuestion={isLastQuestion}
          isAnswered={isAnswered}
          isValid={isValid}
          validationError={validationError}
        >
          <QuestionRenderer
            question={currentQuestion}
            value={currentAnswer}
            onChange={(value) => setAnswer(currentQuestion.id, value)}
          />
        </QuestionCard>
      </div>
    </div>
  );
}
