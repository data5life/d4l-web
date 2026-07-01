export class ParseError extends Error {
  constructor(
    message: string,
    public path: string,
    public expected: string,
    public received: unknown,
  ) {
    super(message);
    this.name = 'ParseError';
  }

  toDetailedString(): string {
    const typeOfReceived = Array.isArray(this.received) ? 'array' : typeof this.received;

    const receivedStr =
      this.received === undefined
        ? 'undefined'
        : this.received === null
          ? 'null'
          : typeof this.received === 'object'
            ? JSON.stringify(this.received, null, 2).slice(0, 200)
            : String(this.received);

    return [
      ``,
      `════════════════════════════════════════════════════════════════`,
      `FHIR-PARSER ERROR: ${this.message}`,
      `════════════════════════════════════════════════════════════════`,
      ``,
      `  Location:  ${this.path}`,
      `  Expected:  ${this.expected}`,
      `  Received:  ${receivedStr} (Type: ${typeOfReceived})`,
      ``,
      `════════════════════════════════════════════════════════════════`,
    ].join('\n');
  }
}

export function validate(
  condition: boolean,
  path: string,
  expected: string,
  received: unknown,
): asserts condition {
  if (!condition) {
    const error = new ParseError(`Invalid value at "${path}"`, path, expected, received);
    console.error(error.toDetailedString());
    throw error;
  }
}

export function validateObject(
  test: unknown,
  path: string,
): asserts test is Record<string, unknown> {
  validate(typeof test === 'object' && test !== null, path, 'an Object', test);
}

export function validateString(test: unknown, path: string): asserts test is string {
  validate(typeof test === 'string', path, 'a String', test);
}
export function validateNumber(test: unknown, path: string): asserts test is number {
  validate(typeof test === 'number', path, 'a Number', test);
}

export function validateArray(test: unknown, path: string): asserts test is unknown[] {
  validate(Array.isArray(test), path, 'an Array', test);
}

export function validateStringArray(test: unknown, path: string): asserts test is string[] {
  validateArray(test, path);
  for (const i in test) {
    validateString(test[i], `${path}[${i}]`);
  }
}

export function validateNonEmptyString(test: unknown, path: string): asserts test is string {
  validate(typeof test === 'string', path, 'a String', test);
  validate(test.length > 0, path, 'non empty String', 'empty String');
}

export function exists<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
