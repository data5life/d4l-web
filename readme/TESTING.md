# Testing

## Tech Stack

| Tool                       | Purpose                      |
| -------------------------- | ---------------------------- |
| **Jest**                   | Unit & Integration Tests     |
| **@testing-library/react** | React Component Tests        |
| **Playwright**             | End-to-End (E2E) Tests       |
| **MSW**                    | API Mocking (for future use) |

---

## Structure

```
d4l-web/
├── __tests__/          # Unit & Integration Tests (Jest)
│   └── lib/
│       └── evaluateConditions.test.ts
├── e2e/                # End-to-End Tests (Playwright)
│   └── home.spec.ts
├── jest.config.mjs
├── jest.setup.js
└── playwright.config.ts
```

---

## Unit Tests (Jest)

> Run these commands within your docker container.

```bash
# Run all unit tests
npm run test

# Run a specific test file
npx jest __tests__/lib/evaluateConditions.test.ts

# Watch mode (re-runs on file changes)
npx jest --watch

# With coverage report
npx jest --coverage
```

---

## E2E Tests (Playwright)

> Run these commands outside your docker container on your host system.

Start the test environment (app + mock server + DB) and run all tests:

```bash
make test-e2e
```

Interactive UI mode for debugging:

```bash
make test-ui
```

Run a specific test file:

```bash
make test-file FILE=e2e/dashboard.spec.ts
```

Stop the test environment and remove the DB volume:

```bash
make stop-test
```

### Rebuilding

After changing Next.js application code:

```bash
make rebuild-app
```

After changing the mock server (`mocks/server/`):

```bash
make rebuild-mock
```

Rebuild everything and reset the DB:

```bash
make rebuild-all
```

## CI

```bash
make test
```

Runs unit tests, then E2E tests against a clean DB. Tears down everything including the DB volume afterwards.

---

## Writing Tests

### Unit Test (Jest)

Place test files in `__tests__/` mirroring the source structure:

```
lib/evaluateConditions.ts  →  __tests__/lib/evaluateConditions.test.ts
```

### E2E Test (Playwright)

Place test files in `e2e/` with `.spec.ts` extension:

```
e2e/my-feature.spec.ts
```
