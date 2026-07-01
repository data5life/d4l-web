import { resourcesToFHIR } from '@/lib/fhir-parser/resource';
import { calculateIteration } from '@/lib/iterationCalculator';
import { Resource, ResourceQuestionnaire } from '@/lib/types/resource';
import {
  DonationRecord,
  DonationSDK,
  DonorIdentity,
  Program,
  RecordState,
  ULIDtoUUID,
} from '@d4l/collect-lib';
import { Resource as FhirResource } from 'fhir/r5';
import { ulid } from 'ulid';

function createSubmission(
  programName: string,
  questionnaireName: string,
  createdAt: Date,
): ResourceQuestionnaire {
  const iteration = calculateIteration(
    {
      type: 'daily',
      start: '2025-04-10T09:00:00.000+02:00',
      factor: 1,
      editDuration: 'P2D',
    },
    'UTC',
    createdAt,
  );
  if (iteration.status !== 'active') throw new Error('Unexpected iteration result');
  return {
    type: 'Questionnaire',
    id: ulid(),
    createdAt: createdAt.toISOString(),
    status: 'completed',
    language: 'en',
    questionnaire: {
      url: `http://www.sensorhub.hpi.de/r5/Questionnaire/test_suite1/${questionnaireName}`,
      version: '1.0.0',
      name: questionnaireName,
    },
    programName: programName,
    iteration: iteration.info,
    answers: [],
  };
}

interface resourceObj {
  document: FhirResource;
  id: string;
  status: RecordState;
}
const state: Record<string, resourceObj[]> = { test_suite2: [] };

export class MockClient implements Pick<DonationSDK, 'donate' | 'revoke' | 'restore' | 'register'> {
  async register(
    _recoveryKey: unknown,
    program: Program,
    _participationCode: unknown,
  ): Promise<{
    donorIdentity: DonorIdentity;
    subjectId: string;
  }> {
    return {
      donorIdentity: {
        t: 'data-donation',
        scope: program.name,
        keys: { priv: '', pub: '', rec: '' },
        v: 1,
      },
      subjectId: 'subjectId',
    };
  }
  async donate(_did: unknown, program: Program, records: resourceObj[]) {
    if (program.name === 'test_suite2') {
      records.forEach(({ id, document, status }) => {
        const index = state.test_suite2.findIndex((r) => r.id === id);
        if (index === -1) {
          state.test_suite2.push({ id, document, status });
        } else {
          state.test_suite2[index] = { id, document, status };
        }
      });
    }

    return true;
  }
  async revoke(_did: unknown, program: Program, _records: unknown) {
    if (program.name === 'test_suite2') {
      state.test_suite2 = [];
    }
    return true;
  }
  async restore(_did: unknown, programName: string): Promise<resourceObj[]> {
    const now = new Date().toISOString();
    if (programName === 'test_suite1') {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const submissionPast = createSubmission(programName, 'recurring_past', twoDaysAgo);
      const submissionToday = createSubmission(programName, 'recurring_today', new Date());
      const resources: Resource[] = [
        {
          id: ulid(),
          type: 'ResearchSubject',
          programName,
          subject: 'anonymous',
          progress: [
            { state: 'candidate', date: now },
            { state: 'on-study', date: now },
          ],
        },
        {
          type: 'Consent',
          id: ulid(),
          date: now,
          name: 'main',
          title: { en: 'main' },
          text: { en: 'main' },
          version: 1,
          accepted: true,
          programName,
        },
        submissionPast,
        submissionToday,
      ];

      const resourcesFHIR = resourcesToFHIR(resources);
      const records: DonationRecord[] = resourcesFHIR.map((document) => {
        return {
          id: ULIDtoUUID(document.id!),
          status: 'Active',
          document,
        };
      });
      return records;
    }
    if (programName === 'test_suite2') {
      return state.test_suite2;
    } else return [];
  }
}
