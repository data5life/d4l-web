import { DashboardQuestionnaire } from '@/components/ProgramDashboardProvider';
import {
  exists,
  validate,
  validateArray,
  validateNumber,
  validateObject,
  validateString,
} from './helper';
import { Locale, locales } from '@/i18n/config';
import {
  AppAnswerItem,
  Resource,
  ResourceConsent,
  ResourceQuestionnaire,
  ResourceResearchSubject,
} from '@/lib/types/resource';
import {
  generateFHIRConsent,
  generateFHIRResearchSubject,
  generateFHIRResponse,
  ResearchSubjectProgress,
  ResponseValue,
} from '@d4l/collect-lib';
import { Question } from '../questionnaireTypes';
import { calculateIteration } from '../iterationCalculator';

function parseConsentResource(
  doc: Record<string, unknown>,
  path: string,
  programName: string,
): ResourceConsent {
  validateString(doc.id, `${path}.id`);
  validateString(doc.date, `${path}.date`);
  validate(
    doc.decision === 'permit' || doc.decision === 'deny',
    `${path}.decision`,
    "'permit' | 'deny'",
    doc.decision,
  );

  validateArray(doc.sourceAttachment, `${path}.sourceAttachment`);
  const text: Record<string, string> = {};
  const title: Record<string, string> = {};
  doc.sourceAttachment.forEach((a, i) => {
    const atPath = `${path}.sourceAttachment[${i}]`;

    validateObject(a, atPath);

    const lang = a.language as Locale;
    validate(locales.includes(lang), `${atPath}.language`, 'a Language specifier', lang);

    validateString(a.data, `${atPath}.data`);
    validateString(a.title, `${atPath}.title`);
    title[lang] = a.title;
    text[lang] = Buffer.from(a.data, 'base64').toString();
  });

  let consentName = undefined,
    consentVersion = undefined;
  validateArray(doc.identifier, `${path}.identifier`);
  doc.identifier.forEach((id, i) => {
    const idPath = `${path}.identifier[${i}]`;
    validateObject(id, idPath);
    if (id.system === 'http://fhir.data4life.care/r5/NamingSystem/consent-name') {
      validateString(id.value, `${idPath}.value`);
      consentName = id.value;
    }
    if (id.system === 'http://fhir.data4life.care/r5/NamingSystem/consent-version') {
      validateString(id.value, `${idPath}.value`);
      consentVersion = id.value;
    }
  });
  validate(
    consentName !== undefined && consentVersion !== undefined,
    `${path}.identifier`,
    'c',
    doc.identifier,
  );

  return {
    id: doc.id,
    type: 'Consent',
    date: doc.date,
    accepted: doc.decision === 'permit',
    title,
    text,
    name: consentName,
    version: Number(consentVersion),
    programName,
  };
}

function parseResearchSubject(
  doc: Record<string, unknown>,
  path: string,
  programName: string,
): ResourceResearchSubject {
  validateString(doc.id, `${path}.id`);
  validateArray(doc.progress, `${path}.progress`);
  const progress = doc.progress.map((p, i) => {
    const progPath = `${path}.progress[${i}]`;
    validateObject(p, progPath);

    validateString(p.startDate, `${progPath}.startDate`);

    validateObject(p.subjectState, `${progPath}.subjectState`);
    const codingPath = `${progPath}.subjectState.coding`;

    const coding = p.subjectState.coding;
    validateArray(coding, codingPath);

    const state = coding.find((cUnknown, i) => {
      const cPath = `${codingPath}[${i}]`;
      validateObject(cUnknown, cPath);
      const c = cUnknown as Record<string, unknown>;

      if (c.system !== 'http://terminology.hl7.org/CodeSystem/research-subject-state') return false;
      validateString(c.code, `${cPath}.code`);
      return true;
    }) as { code: string };
    return {
      date: p.startDate,
      state: state.code,
    } as ResearchSubjectProgress;
  });

  const subject = doc.subject;
  validateObject(subject, `${path}.subject`);
  const idPath = `${path}.subjet.identifier`;
  validateObject(subject.identifier, idPath);

  const identifier = subject.identifier as Record<string, unknown>;
  validateString(identifier.system, `${idPath}.system`);

  const identifierUrl = 'http://fhir.data4life.care/r5/NamingSystem/participation-token';
  validate(
    identifier.system === identifierUrl,
    `${idPath}.system`,
    identifierUrl,
    identifier.system,
  );
  validateString(identifier.value, `${idPath}.value`);
  return {
    type: 'ResearchSubject',
    id: doc.id,
    programName,
    progress,
    subject: identifier.value,
  };
}

function getValue(obj: Record<string, unknown>, path: string, type: Question['type']) {
  if (type === 'decimal' || type === 'scale-numeric') {
    validate(exists(obj.valueDecimal), path, `field valueDecimal due to type ${type}`, obj);
    validateNumber(obj.valueDecimal, `${path}.valueDecimal`);

    return { value: obj.valueDecimal.toString() };
  } else if (type === 'date' || type === 'year') {
    validate(exists(obj.valueDate), path, `field valueDate due to type ${type}`, obj);
    validateString(obj.valueDate, `${path}.valueDate`);

    return { value: obj.valueDate };
  } else if (type === 'scale-ordinal') {
    validate(exists(obj.valueInteger), path, `field valueInteger due to type ${type}`, obj);
    validateNumber(obj.valueInteger, `${path}.valueInteger`);

    return { value: obj.valueInteger.toString() };
  } else if (type === 'single-select' || type === 'multi-select') {
    validate(exists(obj.valueCoding), path, `field valueCoding due to type ${type}`, obj);
    validateObject(obj.valueCoding, path);

    validateString(obj.valueCoding.system, path);
    validateString(obj.valueCoding.display, path);
    validateString(obj.valueCoding.code, path);
    return {
      value: obj.valueCoding.code,
      system: obj.valueCoding.system,
      display: obj.valueCoding.display,
    };
  } else {
    validate(exists(obj.valueString), path, `field valueString due to type ${type}`, obj);
    validateString(obj.valueString, `${path}.valueString`);

    return { value: obj.valueString };
  }
}

function parseQuestionnaireResponse(
  doc: Record<string, unknown>,
  path: string,
  programName: string,
  questionnaireMap: Map<string, DashboardQuestionnaire>,
): ResourceQuestionnaire {
  validateString(doc.id, `${path}.id`);

  const uriPath = `${path}.questionnaire`;
  const uri = doc.questionnaire;
  validateString(uri, uriPath);
  const prefix = `http://www.sensorhub.hpi.de/r5/Questionnaire/${programName}/`;
  if (!uri.startsWith(prefix)) {
    validate(false, uriPath, `starting with "${prefix}"`, uri);
  }
  const remainder = uri.slice(prefix.length);
  const parts = remainder.split('|');
  if (parts.length !== 2) {
    validate(false, uriPath, `questionnaireName|version`, remainder);
  }
  const [name, version] = parts;

  const questionnaireDefinition = questionnaireMap.get(name);

  if (!questionnaireDefinition)
    validate(false, `${path}.questionnaire`, 'a valid questionnaire name', name);

  validateString(doc.status, `${path}.status`);
  const lang = doc.language as Locale;
  validate(locales.includes(lang), `${path}.language`, 'a Language specifier', lang);
  validateString(doc.authored, `${path}.authored`);

  const answers: AppAnswerItem[] = [];
  validateArray(doc.item, `${path}.item`);
  doc.item.forEach((item, i) => {
    const itemPath = `${path}.item[${i}]`;
    validateObject(item, itemPath);

    validateString(item.linkId, `${itemPath}.linkId`);
    const questionDefiniton = questionnaireDefinition.questions.find((q) => q.id === item.linkId);
    if (!questionDefiniton)
      validate(false, `${itemPath}.linkId`, 'a valid question id', item.linkId);

    if (item.answer === undefined) {
      answers.push({
        id: item.linkId,
        type: questionDefiniton.type,
        text: questionDefiniton.text,
        response: undefined,
      });
      return;
    }
    validateArray(item.answer, `${itemPath}.answer`);

    const items: ResponseValue[] = [];
    item.answer.forEach((answer, i) => {
      const answerPath = `${itemPath}.answer[${i}]`;
      validateObject(answer, answerPath);
      items.push(getValue(answer, answerPath, questionDefiniton.type));
    });

    if (questionDefiniton.type === 'multi-select') {
      answers.push({
        id: item.linkId,
        type: questionDefiniton.type,
        text: questionDefiniton.text,
        response: items.length === 0 ? undefined : items,
      });
    } else {
      if (items.length > 1) {
        validate(false, `${itemPath}.answer`, 'not more than 1 element', items);
      }
      answers.push({
        id: item.linkId,
        type: questionDefiniton.type,
        text: questionDefiniton.text,
        response: items[0],
      });
    }
  });

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const createdAt = doc.authored;
  const iteration = calculateIteration(
    questionnaireDefinition.frequency,
    timeZone,
    new Date(createdAt),
  );
  validate(
    iteration.status === 'active',
    `${path}.authored`,
    'author date is out of bounds',
    createdAt,
  );
  return {
    id: doc.id,
    type: 'Questionnaire',
    language: lang,
    programName,
    answers,
    status: doc.status as fhir5.QuestionnaireResponse['status'],
    questionnaire: {
      name,
      url: uri,
      version,
    },
    createdAt,
    iteration: iteration.info,
  };
}

export function parseResources(
  donations: unknown,
  programName: string,
  questionnaireMap: Map<string, DashboardQuestionnaire>,
): Resource[] {
  validateArray(donations, 'donation');

  const resources: Resource[] = [];
  donations.map((fhir, i) => {
    const objPath = `donation[${i}]`;
    validateObject(fhir, objPath);

    const path = `${objPath}.document`;
    const doc = fhir.document;
    validateObject(doc, path);
    validateString(doc.resourceType, `${path}.resourceType`);

    if (doc.resourceType === 'Consent')
      resources.push(parseConsentResource(doc, path, programName));

    if (doc.resourceType === 'ResearchSubject')
      resources.push(parseResearchSubject(doc, path, programName));

    if (doc.resourceType === 'QuestionnaireResponse')
      resources.push(parseQuestionnaireResponse(doc, path, programName, questionnaireMap));
  });

  return resources;
}

export function resourcesToFHIR(resources: Resource[]) {
  return resources.map((r) => {
    switch (r.type) {
      case 'Consent': {
        return generateFHIRConsent(r.id, r, r.accepted ? 'permit' : 'deny', r.date);
      }
      case 'ResearchSubject': {
        return generateFHIRResearchSubject(r.id, r);
      }
      case 'Questionnaire': {
        return generateFHIRResponse(r.id, r);
      }
      default: {
        const exhaustiveCheck: never = r;
        console.error(`Unknown resource ${exhaustiveCheck}`);
        throw new Error('Unknown resource');
      }
    }
  });
}
