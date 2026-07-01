/**
 * Pure iteration calculator for recurring surveys.
 *
 * Given a TaskFrequency config and current time, returns iteration info
 * including current iteration number, window boundaries, and edit status.
 */

import { Temporal } from 'temporal-polyfill';
import { TaskFrequency } from './surveyTypes';

export type IterationInfo = {
  currentIteration: number | undefined;
  iterationStart: Date;
  iterationEnd: Date | undefined;
  editEnd: Date | undefined;
  isLastIteration: boolean;
};

type IterationResult =
  | { status: 'not_started'; start: Date }
  | { status: 'ended'; end: Date }
  | {
      status: 'active';
      info: IterationInfo;
    };

function addFrequencyZDT(
  zdt: Temporal.ZonedDateTime,
  type: string,
  factor: number,
): Temporal.ZonedDateTime {
  if (type === 'monthly') {
    return zdt.add({ months: factor });
  } else if (type === 'weekly') {
    return zdt.add({ weeks: factor });
  } else {
    return zdt.add({ days: factor });
  }
}

/* Interprets the local date and time from an ISO 8601 string in the given time zone,
 * ignoring any offset in the string.
 */
function toZDT(dateInput: string, timeZone: string): Temporal.ZonedDateTime {
  const withoutOffset = dateInput.replace(/([+-]\d{2}:?\d{2}|Z)$/, '');
  const plain = Temporal.PlainDateTime.from(withoutOffset);
  return plain.toZonedDateTime(timeZone);
}

function zdtToDate(zdt: Temporal.ZonedDateTime): Date {
  return new Date(zdt.epochMilliseconds);
}

/**
 * Calculate iteration info for a recurring survey.
 *
 * For 'single' and 'onDemand' frequency types, always returns currentIteration undefined.
 */
export function calculateIteration(
  frequency: TaskFrequency,
  timeZone: string,
  now: Date = new Date(),
): IterationResult {
  // now is either submission date for submitted questionnaires or current time for future questionnaires
  const nowZDT = Temporal.Instant.fromEpochMilliseconds(now.getTime()).toZonedDateTimeISO(timeZone);

  const startZDT = toZDT(frequency.start, timeZone);
  const endZDT = frequency.end ? toZDT(frequency.end, timeZone) : undefined;

  if (Temporal.ZonedDateTime.compare(nowZDT, startZDT) < 0)
    return { status: 'not_started', start: zdtToDate(startZDT) };
  if (endZDT !== undefined && Temporal.ZonedDateTime.compare(nowZDT, endZDT) > 0)
    return { status: 'ended', end: zdtToDate(endZDT) };

  const editEnd = frequency.editDuration ? nowZDT.add(frequency.editDuration) : undefined;

  if (frequency.type === 'single' || frequency.type === 'onDemand') {
    return {
      status: 'active',
      info: {
        currentIteration: undefined,
        iterationStart: zdtToDate(startZDT),
        iterationEnd: endZDT && zdtToDate(endZDT),
        editEnd: editEnd && zdtToDate(editEnd),
        isLastIteration: false,
      },
    };
  }

  const factor = frequency.factor || 1;

  let n = 0;
  let iterEndZDT = startZDT;

  while (Temporal.ZonedDateTime.compare(iterEndZDT, nowZDT) <= 0) {
    iterEndZDT = addFrequencyZDT(iterEndZDT, frequency.type, factor);
    n++;
  }

  const iterStartZDT = addFrequencyZDT(startZDT, frequency.type, (n - 1) * factor);

  const nextIterStart = iterEndZDT;
  const isLastIteration = endZDT
    ? Temporal.ZonedDateTime.compare(nextIterStart, endZDT) >= 0
    : false;

  return {
    status: 'active',
    info: {
      currentIteration: n,
      iterationStart: zdtToDate(iterStartZDT),
      iterationEnd: zdtToDate(iterEndZDT),
      editEnd: editEnd && zdtToDate(editEnd),
      isLastIteration,
    },
  };
}
