import { MockClient } from '@/mocks/DonationSDK';
import { DonationSDK, Program as D4LProgram } from '@d4l/collect-lib';

export async function createDonor(
  client: DonationSDK | MockClient,
  program: D4LProgram,
  code: string | undefined,
  recoveryKey: Uint8Array,
) {
  return await client.register(recoveryKey, program as D4LProgram, code);
}
