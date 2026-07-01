# FHIR and Questionnaire Wizard

> IMPORTANT: This readme is outdated

This document describes how questionnaire data moves from SensorHub's FHIR format into the app's questionnaire UI and back into persisted submissions.

For the full frontend questionnaire JSON shape, see [questionareJSON.md](questionareJSON.md).

## Architecture Overview

```text
SensorHub Backend (FHIR Questionnaire)
            |
            v
API Proxy (/api/sensorhub/[...slug])
            |
            v
Parser (lib/fhir-parser/questionnaire.ts)
  - FHIR -> frontend questionnaire model
  - enableWhen -> showWhen
  - answerOption/answerValueSet -> options
            |
            v
QuestionnaireShell
  - selects mode and initial answers
  - sets initialComplete for submission review
            |
            v
QuestionnaireProvider (React Context + useReducer)
            |
            v
QuestionnaireWizard UI
  - ProgressBar
  - QuestionCard
  - QuestionRenderer (type-specific inputs)
  - Summary
            |
            v
D4L Dispatcher
```

## Runtime Flow

1. The server loads the program/questionnaire data and passes a parsed questionnaire into `QuestionnaireShell`.
2. `QuestionnaireShell` configures the provider with `mode`, `initialAnswers`, and whether the wizard should start on the summary view.
3. `QuestionnaireProvider` computes the visible question list from the current answers and `showWhen` rules.
4. `QuestionnaireWizard` renders the current question, validation state, and progress.
5. If the user was redirected to log in, the provider restores a pending submission from `sessionStorage` when the questionnaire matches.
6. On submit, answers are sent with `programId`, `questionnaireId`, and `responses`; the backend updates an existing row or creates a new one.

## Provider Responsibilities

`components/questionnaire/QuestionnaireProvider.tsx` owns the reducer-backed wizard state and exposes the navigation helpers used by the UI.

State shape:

```ts
interface QuestionnaireState {
  questionnaire: ParsedQuestionnaire | null;
  answers: Record<string, AnswerValue>;
  currentIndex: number;
  isComplete: boolean;
  hasCompletedOnce: boolean;
}
```

Context values provided by `useQuestionnaire()`:

- `state`
- `mode`
- `visibleQuestions`
- `currentQuestion`
- `progress`
- `setAnswer`
- `nextQuestion`
- `prevQuestion`
- `goToQuestion`
- `complete`
- `reset`
- `canGoNext`
- `canGoPrev`
- `isLastQuestion`
- `hasCompletedOnce`

Reducer actions:

- `SET_ANSWER`
- `NEXT_QUESTION`
- `PREV_QUESTION`
- `GO_TO_QUESTION`
- `COMPLETE`
- `RESET`
- `RESTORE_ANSWERS`

## FHIR -> Frontend Mapping Rules

Core mapping behavior in `lib/parser.ts`:

- Extract questionnaire metadata: `id`, `title`, `version`
- Convert FHIR item types to app question types (`single-choice`, `multi-choice`, `text`, `date`, and others)
- Convert conditional visibility from FHIR `enableWhen` to app `showWhen`
- Resolve choice options from `answerOption` and referenced value sets
- Transform validation constraints into frontend `validation` fields

## Conditional Logic

The frontend uses `showWhen` with:

- `behavior`: `all` or `any`
- `conditions`: comparison rules against previous answers

Supported operators include:

- `equals`, `not-equals`
- `includes`, `not-includes`
- `less-than`, `less-than-or-equal`
- `greater-than`, `greater-than-or-equal`
- `exists`

## Validation Model

Validation is question-type dependent and includes:

- text length (`minLength`, `maxLength`)
- numeric range (`min`, `max`)
- date/year absolute constraints (`min`, `max`)
- required question handling in the UI flow

Details and examples are documented in [questionareJSON.md](questionareJSON.md).

## Submission Flow

The submit route at `app/api/questionnaire/submit/route.ts` validates that the request contains `programId`, `questionnaireId`, and `responses`, then uses the current user and the questionnaire frequency to decide whether to update an existing response or create a new iteration.

For recurring questionnaires, the route calculates the active iteration window and updates a matching submission within that window. For non-recurring or fallback cases, it searches for an existing response for the same user, program, and questionnaire.

## Key Files

- `lib/parser.ts`
- `lib/questionnaireTypes.ts`
- `lib/evaluateConditions.ts`
- `components/questionnaire/QuestionnaireShell.tsx`
- `components/questionnaire/QuestionnaireProvider.tsx`
- `components/questionnaire/QuestionnaireWizard.tsx`
- `components/questionnaire/QuestionCard.tsx`
- `components/questions/index.tsx`
- `app/api/questionnaire/submit/route.ts`
