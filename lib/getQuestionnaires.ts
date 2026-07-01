import { Locale } from '@/i18n/config';
import { parseQuestionnaire } from '@/lib/fhir-parser/questionnaire';
import { ParsedQuestionnaire } from '@/lib/questionnaireTypes';
import { SENSORHUB_BASE_PATH } from './constants';

export async function getQuestionnaires(
  programName: string,
  lang: Locale,
  server: boolean = true,
): Promise<ParsedQuestionnaire[]> {
  const resource = `static/programs/${programName}/questionnaires?language=${lang}`;
  const url = server ? `${SENSORHUB_BASE_PATH}/${resource}` : `/api/sensorhub/${resource}`;
  const response = await fetch(url, {
    method: 'GET',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  const parsed = data.questionnaires.map((q: unknown) => {
    try {
      return parseQuestionnaire({ questionnaire: q });
    } catch {
      return undefined;
    }
  });

  return parsed.filter((q: ParsedQuestionnaire | undefined) => q !== undefined);
}
