import { SENSORHUB_BASE_PATH } from '@/lib/constants';

export interface ProgramConsent {
  name: string;
  programName: string;
  published?: string;
  text: {
    en?: string;
    de?: string;
  };
  title: {
    en?: string;
    de?: string;
  };
  version: number;
}

export async function getProgramConsents(
  programName: string,
  server: boolean = true,
): Promise<ProgramConsent[]> {
  const resource = `static/programs/${programName}/consents`;
  const url = server ? `${SENSORHUB_BASE_PATH}/${resource}` : `/api/sensorhub/${resource}`;
  const response = await fetch(url, {
    method: 'GET',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data.consents;
}
