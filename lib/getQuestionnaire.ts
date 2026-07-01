import { Locale } from '@/i18n/config';
import { parseQuestionnaire } from '@/lib/fhir-parser/questionnaire';
import { ParsedQuestionnaire } from '@/lib/questionnaireTypes';
import { resolveSensorhubUrl } from './utils';

export async function getQuestionnaire(
  programName: string,
  lang: Locale,
  questionnaireName: string,
): Promise<ParsedQuestionnaire> {
  const fetchQuestionnaire = async (language: Locale) => {
    const resource = `/static/programs/${programName}/questionnaires/${questionnaireName}?language=${language}`;
    const url = resolveSensorhubUrl(resource);
    const response = await fetch(url, {
      method: 'GET',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  };

  const data = await fetchQuestionnaire(lang);
  return parseQuestionnaire(data);
}
