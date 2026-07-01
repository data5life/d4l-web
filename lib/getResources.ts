import { MockClient } from '@/mocks/DonationSDK';
import { DonationSDK, DonorIdentity } from '@d4l/collect-lib';

export async function getResources(
  client: DonationSDK | MockClient,
  did: DonorIdentity,
  programName: string,
) {
  return await client.restore(did, programName);
}
