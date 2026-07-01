/**
 * Fetch survey frequency data from SensorHub.
 *
 * The /static/programs/{programName} endpoint returns a `surveys` array
 * that is currently ignored by getProgram. This module extracts it.
 */

import { SENSORHUB_BASE_PATH } from '@/lib/constants';
import { Survey } from '@/lib/surveyTypes';

export async function getSurveys(programName: string, server: boolean = true): Promise<Survey[]> {
  try {
    // Try the dedicated surveys endpoint first
    const resource = `static/programs/${programName}/surveys`;
    const url = server ? `${SENSORHUB_BASE_PATH}/${resource}` : `/api/sensorhub/${resource}`;
    const surveysRes = await fetch(url, { method: 'GET' });

    if (surveysRes.ok) {
      const surveysData = await surveysRes.json();
      if (surveysData && Array.isArray(surveysData.surveys)) {
        return surveysData.surveys as Survey[];
      }
    }

    return [];
  } catch (err) {
    console.error(`Failed to fetch surveys for program ${programName}:`, err);
    return [];
  }
}
