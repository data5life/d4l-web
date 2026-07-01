import { CryptoModule } from '@d4l/collect-lib';
import { Buffer } from 'buffer/';

export class WebCrypto implements CryptoModule {
  async deriveEncryptionKey(
    recoveryKey: Uint8Array,
    salt: string = 'phoenix',
    iterations: number = 100000,
  ): Promise<Uint8Array> {
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      Buffer.from(recoveryKey),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey'],
    );

    const keyAsArrayBuffer = await window.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: Buffer.from(salt, 'binary'),
        iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      32 << 3,
    );

    const keyAsUint8Array = new Uint8Array(keyAsArrayBuffer);

    return keyAsUint8Array;
  }

  generateKey(size: number): Uint8Array {
    const recoveryKey = new Uint8Array(size);
    crypto.getRandomValues(recoveryKey);
    return recoveryKey;
  }
}
