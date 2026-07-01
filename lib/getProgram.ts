import { SENSORHUB_BASE_PATH } from '@/lib/constants';
import { Program } from '@/lib/programTypes';

export async function getProgram(programName: string, server: boolean = true): Promise<Program> {
  const resource = `static/programs/${programName}`;
  const url = server ? `${SENSORHUB_BASE_PATH}/${resource}` : `/api/sensorhub/${resource}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch program`);
    }

    const data = await response.json();

    // Validate that we received program data
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid program data received');
    }

    // Validate required fields
    if (
      !data.program.name ||
      !data.program.tenantID ||
      !data.program.type ||
      !data.program.phases ||
      !data.program.donation ||
      !data.program.content ||
      !data.program.languages
    ) {
      throw new Error('Program data is missing required fields');
    }

    // Return the program data typed as Program
    const program: Program = {
      name: data.program.name,
      tenantID: data.program.tenantID,
      languages: data.program.languages,
      type: data.program.type,
      phases: data.program.phases,
      donation: data.program.donation,
      content: data.program.content,
      publishedAt: data.program.publishedAt,
      featured: data.program.featured,
      endDate: data.program.endDate,
      tags: data.program.tags,
      theme: data.program.theme,
    };

    return program;
  } catch (err) {
    console.error(`Failed to fetch program ${programName}:`, err);
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Program '${programName}' not found`);
  }
}
