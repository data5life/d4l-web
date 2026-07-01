import { json } from '../../utils.mjs';

export async function handleStatic(_req, res, path, url) {
  // return handler(req, res, rest, url);
  const p = path.join('/');
  if (p === 'programs/test_suite1') {
    return json(res, 200, {
      program: {
        content: {
          contact: {
            de: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Musterstraße 123,"}]},{"type":"paragraph","content":[{"type":"text","text":"Berlin"}]}]}',
            en: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Musterstraße 123,"}]},{"type":"paragraph","content":[{"type":"text","text":"London"}]}]}',
          },
          contactInfo: { email: 'testing@example.com' },
          description: {
            de: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Diese Studie ist fürs testing"}]}]}',
            en: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"This study is for testing"}]}]}',
          },
          title: { de: 'Das ist test_suite1', en: 'This is test_suite1' },
        },
        donation: { delay: 0, revocation: 'delete', target: 'datarec' },
        featured: { enabled: false, showSensors: false },
        languages: ['en', 'de'],
        name: 'test_suite1',
        phases: [
          [{ consentKey: 'main', minVersion: 1, required: true, type: 'consent' }],
          [
            { required: true, surveyName: 'q1', type: 'survey' },
            {
              required: true,
              start: { consentKey: 'main', offset: 'P1D', type: 'consent' },
              surveyName: 'delayed_q',
              type: 'survey',
            },
            { required: true, surveyName: 'recurring_today', type: 'survey' },
            { required: true, surveyName: 'recurring_past', type: 'survey' },
          ],
        ],
        tenantID: 'local',
        type: 'sensor',
        updatedAt: '2026-04-10T20:29:30Z',
      },
    });
  }
  if (p === 'programs/test_suite1/consents') {
    return json(res, 200, {
      consents: [
        {
          name: 'main',
          programName: 'test_suite1',
          published: '2026-04-10T17:28:59Z',
          text: {
            de: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Ich bin damit einverstanden, dass meine Daten irgendwo landen"}]}]}',
            en: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"I consent that my data is somewhere"}]}]}',
          },
          title: { de: 'Zustimmungserklärung', en: 'Consent' },
          version: 1,
        },
      ],
    });
  }
  if (p === 'programs/test_suite1/surveys') {
    return json(res, 200, {
      surveys: [
        {
          content: {
            default: { title: { de: 'Verzögertes Questionnaire', en: 'Delayed Questionnaire' } },
          },
          frequency: {
            editDuration: 'P2D',
            start: '2025-04-10T09:00:00.000+02:00',
            type: 'single',
          },
          name: 'delayed_q',
          programName: 'test_suite1',
        },
        {
          content: {
            default: { title: { de: 'Erstes Questionnaire', en: 'First questionnaire' } },
          },
          frequency: {
            editDuration: 'P2D',
            start: '2025-04-10T09:00:00.000+02:00',
            type: 'single',
          },
          name: 'q1',
          programName: 'test_suite1',
        },
        {
          content: {
            default: { title: { de: 'Wiederkehrend Vergangenheit', en: 'Recurring past' } },
          },
          frequency: {
            editDuration: 'P2D',
            factor: 1,
            start: '2025-04-10T09:00:00.000+02:00',
            type: 'daily',
          },
          name: 'recurring_past',
          programName: 'test_suite1',
        },
        {
          content: { default: { title: { de: 'Wiederkehrend heute', en: 'Recurring today' } } },
          frequency: {
            editDuration: 'P2D',
            factor: 1,
            start: '2025-04-10T09:00:00.000+02:00',
            type: 'daily',
          },
          name: 'recurring_today',
          programName: 'test_suite1',
        },
      ],
    });
  }
  if (p === 'programs/test_suite1/questionnaires') {
    const lang = url.searchParams.get('language');
    if (lang === 'en') {
      return json(res, 200, {
        questionnaires: [
          {
            contact: [
              {
                name: 'D4L data4life gGmbH',
                telecom: [{ system: 'url', value: 'https://www.data4life.care' }],
              },
            ],
            date: '2026-04-10T17:28:33Z',
            item: [
              { linkId: 'q1', required: true, text: 'First question in delayed', type: 'decimal' },
            ],
            language: 'en',
            name: 'delayed_q',
            publisher: 'D4L data4life gGmbH',
            resourceType: 'Questionnaire',
            status: 'active',
            subjectType: ['Patient'],
            title: 'Delayed Questionnaire',
            url: 'http://www.sensorhub.hpi.de/r5/Questionnaire/test_suite1/delayed_q',
            version: '1.0.0',
          },
          {
            contact: [
              {
                name: 'D4L data4life gGmbH',
                telecom: [{ system: 'url', value: 'https://www.data4life.care' }],
              },
            ],
            date: '2026-04-10T17:27:30Z',
            item: [{ linkId: 'q1', required: true, text: 'First question', type: 'decimal' }],
            language: 'en',
            name: 'q1',
            publisher: 'D4L data4life gGmbH',
            resourceType: 'Questionnaire',
            status: 'active',
            subjectType: ['Patient'],
            title: 'First questionnaire',
            url: 'http://www.sensorhub.hpi.de/r5/Questionnaire/test_suite1/q1',
            version: '1.0.0',
          },
          {
            contact: [
              {
                name: 'D4L data4life gGmbH',
                telecom: [{ system: 'url', value: 'https://www.data4life.care' }],
              },
            ],
            date: '2026-04-10T20:29:26Z',
            item: [{ linkId: 'q1', required: true, text: 'Question', type: 'decimal' }],
            language: 'en',
            name: 'recurring_past',
            publisher: 'D4L data4life gGmbH',
            resourceType: 'Questionnaire',
            status: 'active',
            subjectType: ['Patient'],
            title: 'Recurring past',
            url: 'http://www.sensorhub.hpi.de/r5/Questionnaire/test_suite1/recurring_past',
            version: '1.0.0',
          },
          {
            contact: [
              {
                name: 'D4L data4life gGmbH',
                telecom: [{ system: 'url', value: 'https://www.data4life.care' }],
              },
            ],
            date: '2026-04-10T20:29:26Z',
            item: [{ linkId: 'q1', required: true, text: 'Question', type: 'decimal' }],
            language: 'en',
            name: 'recurring_today',
            publisher: 'D4L data4life gGmbH',
            resourceType: 'Questionnaire',
            status: 'active',
            subjectType: ['Patient'],
            title: 'Recurring today',
            url: 'http://www.sensorhub.hpi.de/r5/Questionnaire/test_suite1/recurring_today',
            version: '1.0.0',
          },
        ],
      });
    }
  }

  if (p === 'programs/test_suite2') {
    return json(res, 200, {
      program: {
        content: {
          contact: {
            de: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Musterstraße 123,"}]},{"type":"paragraph","content":[{"type":"text","text":"Berlin"}]}]}',
            en: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Musterstraße 123,"}]},{"type":"paragraph","content":[{"type":"text","text":"London"}]}]}',
          },
          contactInfo: { email: 'testing@example.com' },
          description: {
            de: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Diese Studie ist fürs testing"}]}]}',
            en: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"This study is for testing"}]}]}',
          },
          title: { de: 'Das ist test_suite2', en: 'This is test_suite2' },
        },
        donation: { delay: 0, revocation: 'delete', target: 'datarec' },
        featured: { enabled: false, showSensors: false },
        languages: ['en', 'de'],
        name: 'test_suite2',
        phases: [
          [{ consentKey: 'main', minVersion: 1, required: true, type: 'consent' }],
          [
            { required: true, surveyName: 'q1', type: 'survey' },
            {
              required: true,
              start: { consentKey: 'main', offset: 'P1D', type: 'consent' },
              surveyName: 'delayed_q',
              type: 'survey',
            },
            { required: true, surveyName: 'recurring_today', type: 'survey' },
            { required: true, surveyName: 'recurring_past', type: 'survey' },
          ],
        ],
        tenantID: 'local',
        type: 'sensor',
        updatedAt: '2026-04-10T20:29:30Z',
      },
    });
  }
  if (p === 'programs/test_suite2/consents') {
    return json(res, 200, {
      consents: [
        {
          name: 'main',
          programName: 'test_suite2',
          published: '2026-04-10T17:28:59Z',
          text: {
            de: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Ich bin damit einverstanden, dass meine Daten irgendwo landen"}]}]}',
            en: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"I consent that my data is somewhere"}]}]}',
          },
          title: { de: 'Zustimmungserklärung', en: 'Consent' },
          version: 1,
        },
      ],
    });
  }
  if (p === 'programs/test_suite2/surveys') {
    return json(res, 200, {
      surveys: [
        {
          content: {
            default: { title: { de: 'Verzögertes Questionnaire', en: 'Delayed Questionnaire' } },
          },
          frequency: {
            editDuration: 'P2D',
            start: '2025-04-10T09:00:00.000+02:00',
            type: 'single',
          },
          name: 'delayed_q',
          programName: 'test_suite2',
        },
        {
          content: {
            default: { title: { de: 'Erstes Questionnaire', en: 'First questionnaire' } },
          },
          frequency: {
            editDuration: 'P2D',
            start: '2025-04-10T09:00:00.000+02:00',
            type: 'single',
          },
          name: 'q1',
          programName: 'test_suite2',
        },
        {
          content: {
            default: { title: { de: 'Wiederkehrend Vergangenheit', en: 'Recurring past' } },
          },
          frequency: {
            editDuration: 'P2D',
            factor: 1,
            start: '2025-04-10T09:00:00.000+02:00',
            type: 'daily',
          },
          name: 'recurring_past',
          programName: 'test_suite2',
        },
        {
          content: { default: { title: { de: 'Wiederkehrend heute', en: 'Recurring today' } } },
          frequency: {
            editDuration: 'P2D',
            factor: 1,
            start: '2025-04-10T09:00:00.000+02:00',
            type: 'daily',
          },
          name: 'recurring_today',
          programName: 'test_suite2',
        },
      ],
    });
  }
  if (p === 'programs/test_suite2/questionnaires') {
    const lang = url.searchParams.get('language');
    if (lang === 'en') {
      return json(res, 200, {
        questionnaires: [
          {
            contact: [
              {
                name: 'D4L data4life gGmbH',
                telecom: [{ system: 'url', value: 'https://www.data4life.care' }],
              },
            ],
            date: '2026-04-10T17:28:33Z',
            item: [
              { linkId: 'q1', required: true, text: 'First question in delayed', type: 'decimal' },
            ],
            language: 'en',
            name: 'delayed_q',
            publisher: 'D4L data4life gGmbH',
            resourceType: 'Questionnaire',
            status: 'active',
            subjectType: ['Patient'],
            title: 'Delayed Questionnaire',
            url: 'http://www.sensorhub.hpi.de/r5/Questionnaire/test_suite2/delayed_q',
            version: '1.0.0',
          },
          {
            contact: [
              {
                name: 'D4L data4life gGmbH',
                telecom: [{ system: 'url', value: 'https://www.data4life.care' }],
              },
            ],
            date: '2026-04-10T17:27:30Z',
            item: [{ linkId: 'q1', required: true, text: 'First question', type: 'decimal' }],
            language: 'en',
            name: 'q1',
            publisher: 'D4L data4life gGmbH',
            resourceType: 'Questionnaire',
            status: 'active',
            subjectType: ['Patient'],
            title: 'First questionnaire',
            url: 'http://www.sensorhub.hpi.de/r5/Questionnaire/test_suite2/q1',
            version: '1.0.0',
          },
          {
            contact: [
              {
                name: 'D4L data4life gGmbH',
                telecom: [{ system: 'url', value: 'https://www.data4life.care' }],
              },
            ],
            date: '2026-04-10T20:29:26Z',
            item: [{ linkId: 'q1', required: true, text: 'Question', type: 'decimal' }],
            language: 'en',
            name: 'recurring_past',
            publisher: 'D4L data4life gGmbH',
            resourceType: 'Questionnaire',
            status: 'active',
            subjectType: ['Patient'],
            title: 'Recurring past',
            url: 'http://www.sensorhub.hpi.de/r5/Questionnaire/test_suite2/recurring_past',
            version: '1.0.0',
          },
          {
            contact: [
              {
                name: 'D4L data4life gGmbH',
                telecom: [{ system: 'url', value: 'https://www.data4life.care' }],
              },
            ],
            date: '2026-04-10T20:29:26Z',
            item: [{ linkId: 'q1', required: true, text: 'Question', type: 'decimal' }],
            language: 'en',
            name: 'recurring_today',
            publisher: 'D4L data4life gGmbH',
            resourceType: 'Questionnaire',
            status: 'active',
            subjectType: ['Patient'],
            title: 'Recurring today',
            url: 'http://www.sensorhub.hpi.de/r5/Questionnaire/test_suite2/recurring_today',
            version: '1.0.0',
          },
        ],
      });
    }
    if (lang === 'de') {
      return json(res, 200, {
        questionnaires: [
          {
            contact: [
              {
                name: 'D4L data4life gGmbH',
                telecom: [{ system: 'url', value: 'https://www.data4life.care' }],
              },
            ],
            date: '2026-04-10T17:28:33Z',
            item: [
              { linkId: 'q1', required: true, text: 'Erste Frage im delayed', type: 'decimal' },
            ],
            language: 'de',
            name: 'delayed_q',
            publisher: 'D4L data4life gGmbH',
            resourceType: 'Questionnaire',
            status: 'active',
            subjectType: ['Patient'],
            title: 'Verzögertes Questionnaire',
            url: 'http://www.sensorhub.hpi.de/r5/Questionnaire/test_suite1/delayed_q',
            version: '1.0.0',
          },
          {
            contact: [
              {
                name: 'D4L data4life gGmbH',
                telecom: [{ system: 'url', value: 'https://www.data4life.care' }],
              },
            ],
            date: '2026-04-10T17:27:30Z',
            item: [{ linkId: 'q1', required: true, text: 'Erste Frage', type: 'decimal' }],
            language: 'de',
            name: 'q1',
            publisher: 'D4L data4life gGmbH',
            resourceType: 'Questionnaire',
            status: 'active',
            subjectType: ['Patient'],
            title: 'Erstes Questionnaire',
            url: 'http://www.sensorhub.hpi.de/r5/Questionnaire/test_suite1/q1',
            version: '1.0.0',
          },
          {
            contact: [
              {
                name: 'D4L data4life gGmbH',
                telecom: [{ system: 'url', value: 'https://www.data4life.care' }],
              },
            ],
            date: '2026-04-10T20:29:26Z',
            item: [{ linkId: 'q1', required: true, text: 'Frage', type: 'decimal' }],
            language: 'de',
            name: 'recurring_past',
            publisher: 'D4L data4life gGmbH',
            resourceType: 'Questionnaire',
            status: 'active',
            subjectType: ['Patient'],
            title: 'Wiederkehrend Vergangenheit',
            url: 'http://www.sensorhub.hpi.de/r5/Questionnaire/test_suite1/recurring_past',
            version: '1.0.0',
          },
          {
            contact: [
              {
                name: 'D4L data4life gGmbH',
                telecom: [{ system: 'url', value: 'https://www.data4life.care' }],
              },
            ],
            date: '2026-04-10T20:29:26Z',
            item: [{ linkId: 'q1', required: true, text: 'Frage', type: 'decimal' }],
            language: 'de',
            name: 'recurring_today',
            publisher: 'D4L data4life gGmbH',
            resourceType: 'Questionnaire',
            status: 'active',
            subjectType: ['Patient'],
            title: 'Wiederkehrend heute',
            url: 'http://www.sensorhub.hpi.de/r5/Questionnaire/test_suite1/recurring_today',
            version: '1.0.0',
          },
        ],
      });
    }
  }
  if (p === 'programs/test_suite2/questionnaires/q1') {
    const lang = url.searchParams.get('language');
    if (lang === 'en') {
      return json(res, 200, {
        questionnaire: {
          contact: [
            {
              name: 'D4L data4life gGmbH',
              telecom: [{ system: 'url', value: 'https://www.data4life.care' }],
            },
          ],
          date: '2026-04-10T17:27:30Z',
          item: [{ linkId: 'q1', required: true, text: 'First question', type: 'decimal' }],
          language: 'en',
          name: 'q1',
          publisher: 'D4L data4life gGmbH',
          resourceType: 'Questionnaire',
          status: 'active',
          subjectType: ['Patient'],
          title: 'First questionnaire',
          url: 'http://www.sensorhub.hpi.de/r5/Questionnaire/test_suite1/q1',
          version: '1.0.0',
        },
      });
    }
    if (lang === 'de') {
      return json(res, 200, {
        questionnaire: {
          contact: [
            {
              name: 'D4L data4life gGmbH',
              telecom: [{ system: 'url', value: 'https://www.data4life.care' }],
            },
          ],
          date: '2026-04-10T17:27:30Z',
          item: [{ linkId: 'q1', required: true, text: 'Erste Frage', type: 'decimal' }],
          language: 'de',
          name: 'q1',
          publisher: 'D4L data4life gGmbH',
          resourceType: 'Questionnaire',
          status: 'active',
          subjectType: ['Patient'],
          title: 'Erstes Questionnaire',
          url: 'http://www.sensorhub.hpi.de/r5/Questionnaire/test_suite1/q1',
          version: '1.0.0',
        },
      });
    }
  }

  if (p === 'programs/test_i18n') {
    return json(res, 200, {
      program: {
        content: {
          contact: {
            de: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Contact in Deutsch"}]}]}',
            en: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Contact in English"}]}]}',
          },
          contactInfo: {},
          description: {
            de: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Description in Deutsch"}]}]}',
            en: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Description in English"}]}]}',
          },
          title: { de: 'Title in Deutsch', en: 'Title in English' },
        },
        donation: { delay: 0, revocation: 'delete', target: 'datarec' },
        featured: { enabled: false },
        languages: ['en', 'de'],
        name: 'test_i18n',
        phases: [
          [{ consentKey: 'main', minVersion: 1, required: true, type: 'consent' }],
          [{ required: true, surveyName: 'demographics', type: 'survey' }],
        ],
        tenantID: 'local',
        type: 'sensor',
        updatedAt: '2026-04-23T09:27:31Z',
      },
    });
  }
  if (p === 'programs/test_i18n/consents') {
    return json(res, 200, {
      consents: [
        {
          name: 'main',
          programName: 'test_i18n',
          published: '2026-04-23T09:27:31Z',
          text: {
            de: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Consent text in Deutsch"}]}]}',
            en: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Consent text in English"}]}]}',
          },
          title: { de: 'Consent in Deutsch', en: 'Consent in English' },
          version: 1,
        },
      ],
    });
  }
  if (p === 'programs/test_i18n/surveys') {
    return json(res, 200, {
      surveys: [
        {
          content: {
            default: { title: { de: 'Questionnaire in Deutsch', en: 'Questionnaire in English' } },
          },
          frequency: {
            editDuration: 'P2D',
            start: '2025-04-23T09:00:00.000+02:00',
            type: 'single',
          },
          name: 'demographics',
          programName: 'test_i18n',
        },
      ],
    });
  }
  if (p === 'programs/test_i18n/questionnaires') {
    const lang = url.searchParams.get('language');
    if (lang === 'en') {
      return json(res, 200, {
        questionnaires: [
          {
            contact: [
              {
                name: 'D4L data4life gGmbH',
                telecom: [{ system: 'url', value: 'https://www.data4life.care' }],
              },
            ],
            date: '2026-04-23T09:26:55Z',
            item: [{ linkId: 'q1', required: true, text: 'Question in English', type: 'decimal' }],
            language: 'en',
            name: 'demographics',
            publisher: 'D4L data4life gGmbH',
            resourceType: 'Questionnaire',
            status: 'active',
            subjectType: ['Patient'],
            title: 'Questionnaire in English',
            url: 'http://www.sensorhub.hpi.de/r5/Questionnaire/test_i18n/demographics',
            version: '1.0.0',
          },
        ],
      });
    }
    if (lang === 'de') {
      return json(res, 200, {
        questionnaires: [
          {
            contact: [
              {
                name: 'D4L data4life gGmbH',
                telecom: [{ system: 'url', value: 'https://www.data4life.care' }],
              },
            ],
            date: '2026-04-23T09:26:55Z',
            item: [{ linkId: 'q1', required: true, text: 'Question in Deutsch', type: 'decimal' }],
            language: 'de',
            name: 'demographics',
            publisher: 'D4L data4life gGmbH',
            resourceType: 'Questionnaire',
            status: 'active',
            subjectType: ['Patient'],
            title: 'Questionnaire in Deutsch',
            url: 'http://www.sensorhub.hpi.de/r5/Questionnaire/test_i18n/demographics',
            version: '1.0.0',
          },
        ],
      });
    }
  }
  console.log(p);
  return json(res, 404, { error: 'Not found' });
}
