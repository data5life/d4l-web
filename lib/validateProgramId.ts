'use server';

import { getProgram } from '@/lib/getProgram';

type ValidateResult = { status: 'found' } | { status: 'not_found' } | { status: 'error' };

export async function validateProgramId(programId: string): Promise<ValidateResult> {
  try {
    await getProgram(programId);
    return { status: 'found' };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('404')) {
        return { status: 'not_found' };
      }
    }
    return { status: 'error' };
  }
}
