/**
 * Fetch public programs from SensorHub.
 */

import { SENSORHUB_BASE_PATH } from '@/lib/constants';
import { Program } from './programTypes';

export async function getPublicPrograms(server: boolean = true): Promise<Program[]> {
  try {
    const resource = `static/programs`;
    const url = server ? `${SENSORHUB_BASE_PATH}/${resource}` : `/api/sensorhub/${resource}`;
    const programRes = await fetch(url, { method: 'GET' });

    if (programRes.ok) {
      const programData = await programRes.json();
      if (programData && Array.isArray(programData.programs)) {
        return programData.programs as Program[];
      }
    }

    return [];
  } catch (err) {
    console.error(`Failed to fetch public programs:`, err);
    return [];
  }
}
