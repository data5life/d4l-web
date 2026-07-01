import { MockClient } from '@/mocks/DonationSDK';
import { DonationSDK, Program as D4LProgram, DonorIdentity } from '@d4l/collect-lib';

export async function getDonor(programName: string): Promise<DonorIdentity> {
  const res = await fetch(`/api/dashboard/programs/${programName}/enrollment`, { method: 'GET' });
  if (res.ok) {
    const data = await res.json();
    return data.did;
  }
  if (res.status === 404) {
    throw new Error('Could not find donor identity. User probably not enrolled');
  }
  throw new Error('Unexpected return code when fetching donor identity');
}

export async function createDonor(
  client: DonationSDK | MockClient,
  program: D4LProgram,
  code: string | undefined,
  recoveryKey: Uint8Array,
) {
  return await client.register(recoveryKey, program as D4LProgram, code);
}
