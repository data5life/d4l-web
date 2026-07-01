/* eslint-disable */
'use client';

import { D4L_DISPATCHER_SECRET, donationHost } from '@/lib/constants';
import { WebCrypto } from '@/lib/core/crypto';
import { createDonor, getDonor } from '@/lib/donation/get-donor';
import { parseResources } from '@/lib/fhir-parser/resource';
import { getProgram } from '@/lib/getProgram';
import { Program as D4LProgram, DonationSDK, KeyHandler, WebConverter } from '@d4l/collect-lib';
import { Suspense, useEffect } from 'react';

function createClientAndKeyHandler() {
  if (!D4L_DISPATCHER_SECRET) throw new Error('D4L_DISPATCHER_SECRET not set');
  const crypto = new WebCrypto();
  const converter = new WebConverter();
  const client = new DonationSDK(D4L_DISPATCHER_SECRET, `${donationHost}/v2`, converter, crypto);
  const keyHandler = new KeyHandler(converter, crypto);

  return { client, keyHandler };
}

export async function getSubject(programName: string) {
  const res = await fetch(`/api/dashboard/programs/${programName}/enrollment`, { method: 'GET' });
  if (res.ok) {
    const data = await res.json();
    return data;
  }
  if (res.status === 404) {
    throw new Error('Could not find donor identity. User probably not enrolled');
  }
  throw new Error('Unexpected return code when fetching donor identity');
}

// const pName = 'question_types_test';
const pName = 'tper';
async function test() {
  const { client, keyHandler } = createClientAndKeyHandler();

  const program = await getProgram(pName, false);

  // Hardcoded from the db cuz im to lazy to fetch
  // const recoveryKey = new Uint8Array([
  // ]);

  // const enrollInfo = getSubject(pName);
  // console.log(enrollInfo);

  // const mnemonic = keyHandler.entropyToMnemonic(recoveryKey, 'en');
  // const parsed = parseResources(restored, program.name);
  // console.log(mnemonic);

  const did = await getDonor(program.name);
  const restored = await client.restore(did, pName);
  console.log(restored);

  // if (restored.length === 3) {
  //   const r = restored[2];
  //   r.status = 'Deleted';
  //   await client.donate(did, program as D4LProgram, [r]);
  // }
}

function InnerTest() {
  useEffect(() => {
    test();
  }, []);

  return <div>Hi</div>;
}

export default function Test() {
  return (
    <Suspense>
      <InnerTest />
    </Suspense>
  );
}
