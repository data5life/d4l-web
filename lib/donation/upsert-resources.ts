import { ulid } from 'ulid';
import { Resource, ResourceConsent, ResourceResearchSubject } from '@/lib/types/resource';
import { ProgramConsent } from '@/lib/getProgramConsents';

export function updateOrCreateResearchSubject(
  resources: Resource[],
  programName: string,
  token: string = 'anonymous',
  newState: 'on-study' | 'off-study',
  now: string,
): ResourceResearchSubject {
  const researchSubject = resources.find((r) => r.type === 'ResearchSubject');

  if (researchSubject) {
    if (researchSubject.progress.at(-1)?.state === newState) {
      return researchSubject;
    }
    return {
      ...researchSubject,
      progress: [...researchSubject.progress, { state: newState, date: now }],
    };
  } else {
    return {
      id: ulid(),
      type: 'ResearchSubject',
      programName,
      subject: token,
      progress: [
        { state: 'candidate', date: now },
        { state: newState, date: now },
      ],
    };
  }
}

export function updateOrCreateResourceConsent(
  resources: Resource[],
  consent: ProgramConsent,
  programName: string,
  accepted: boolean,
  now: string,
): ResourceConsent {
  const foundConsent = resources.find(
    (r) => r.type === 'Consent' && r.name === consent.name,
  ) as ResourceConsent;
  if (foundConsent) {
    return {
      ...foundConsent,
      version: consent.version,
      accepted,
      date: now,
    };
  }
  return {
    type: 'Consent',
    id: ulid(),
    date: now,
    name: consent.name,
    title: consent.title,
    text: consent.text,
    version: consent.version,
    accepted,
    programName,
  };
}
