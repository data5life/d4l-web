import { WebCrypto } from '@/lib/core/crypto';
import { DonationSDK, WebConverter } from '@d4l/collect-lib';
import { D4L_DISPATCHER_SECRET, donationHost, MOCK_DONATION_CLIENT } from '@/lib/constants';
import { MockClient } from '@/mocks/DonationSDK';

export function createDonationClient() {
  if (MOCK_DONATION_CLIENT) {
    return new MockClient();
  }
  if (!D4L_DISPATCHER_SECRET) throw new Error('D4L_DISPATCHER_SECRET not set');
  const crypto = new WebCrypto();
  const converter = new WebConverter();
  const client = new DonationSDK(D4L_DISPATCHER_SECRET, `${donationHost}/v2`, converter, crypto);

  return client;
}
