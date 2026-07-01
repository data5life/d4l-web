# Web Development Issues — Backlog

Open issues labeled **Software development**, sorted by priority (Must → Should → Could → unprioritized), then by number ascending.

| Priority      | Count  |
| ------------- | ------ |
| Must          | 3      |
| Should        | 8      |
| Could         | 8      |
| Unprioritized | 11     |
| **Total**     | **30** |

---

## Priority: Must

### #42 — rework privacy policy website

**Status:** Backlog  
**Labels:** Must, Software development

#### User Story

---

As a User I want to be able to view the privacy policy even when not logged in or registered

As a User before or after my first login I want to decide if I get questionnaire notifications or not

#### Acceptance Criteria

---

- [ ] The privacy policy has its own public route and is reachable without authentication (no redirect to `/login`)
- [ ] A link to the privacy policy is shown on the login page (`app/[locale]/login/page.tsx`)
- [ ] The user's notification opt-in is captured BEFORE any notification can be sent, and persisted per program in the `NotificationPreference` table — i.e. nothing is sent until the user opts in
- [ ] The opt-in can be collected on the login page and/or on the onboarding page (feature/donation branch) via a checkbox / pop-up

---

### #57 — GDPR: be able to delete single submissions

**Status:** Backlog  
**Labels:** Must, Software development

#### User Story

---

**As a** study participant,
**I want** to delete a single submitted questionnaire response,
**so that** I can exercise my GDPR right to erasure for an individual submission without losing my account or the rest of my data.

Submissions are stored as `QuestionnaireResponse` resources in the D4L dispatcher; the app's submission list (`SubmissionList.client.tsx`) only renders a cached view of them. Deleting must therefore remove the resource via the donation client, not just hide it locally.

#### Acceptance Criteria

---

- [ ] A delete action is available per submission in the submission list on the program page (`SubmissionList.client.tsx`)
- [ ] Deleting a submission removes the underlying `QuestionnaireResponse` resource from D4L via `createDonationClient()`, not just the local view
- [ ] Deletion is gated behind a confirmation dialog (reuse `components/ui/confirm-dialog.tsx`) and only succeeds for submissions owned by the authenticated user's enrollment (`subjectId` / `did`)
- [ ] After deletion the program dashboard data is updated so the submission disappears from the list
- [ ] If deleting a submission invalidates a dependent task or iteration, the affected task is recomputed / marked accordingly (`lib/evaluateTasks.ts`, `lib/iterationCalculator.ts`) — i.e. "after a submission gets deleted, check whether another submission now has to be (re)created or removed"
- [ ] The action is covered by an E2E and/or unit test

---

### #87 — 🐞 After editing a questionnaire check if the submission is still valid

**Status:** Backlog  
**Labels:** Bug, Must, Software development

#### Description

---

Currently after editing of a submission there is no validation of all required fields are filled out. For example a User can edit a question, that question opens a new conditional question that isn't answered but required. The user is still able to submit.

#### Acceptance Criteria

---

- [ ] When a user edits a submission (`QuestionnaireShell` in `mode="submission"`) and a conditional question becomes visible & required, the submission cannot be completed until that question is answered
- [ ] On the summary/submit step a full validation pass runs over the currently-visible questions (`getVisibleQuestions` from `lib/evaluateConditions.ts`) using `isQuestionAnswered` / `isAnswerValid` / `getValidationError` — not only the per-question checks done while navigating the wizard
- [ ] Answers to questions that are no longer visible (because a condition stopped applying) are dropped from the submitted payload rather than submitted stale
- [ ] The user is shown which question(s) block submission and can jump back to them
- [ ] A regression test covers: edit → toggle a conditional answer → required conditional question appears → cannot submit until answered

---

## Priority: Should

### #30 — Add on demand questionnaires

**Status:** Backlog  
**Labels:** Should, Software development

#### User Story

---

**As a** study participant,
**I want** to fill out questionnaires that a study team opens "on demand",
**so that** I can contribute data whenever a new on-demand questionnaire becomes available to me, rather than only on a fixed schedule.

Open question to confirm with D4L: can an `onDemand` questionnaire occur repeatedly, or only once per participant? This decides whether it is modelled like a recurring task (with iterations, see `lib/iterationCalculator.ts`) or as a one-off task.

#### Acceptance Criteria

---

- [ ] Clarified with D4L whether `onDemand` questionnaires are one-off or repeatable, and documented the result
- [ ] `onDemand` questionnaires are represented as a distinct availability state in `lib/evaluateTasks.ts` (alongside the existing `hidden` / `unavailable` / `pending` / `accessible` states in `evaluateTaskAccess`), so availability is driven by the program definition rather than client-side assumptions
- [ ] A user can only access (fill out and view) an on-demand questionnaire while it is opened by the study team; outside that window it is greyed out / hidden like other non-accessible tasks
- [ ] When an on-demand questionnaire becomes available, the user is notified via the existing pipeline (`scripts/scheduler.ts`), ideally with no more than "a new questionnaire is available" to preserve privacy
- [ ] The on-demand questionnaire appears in / disappears from the task list (`TaskList.client.tsx`) and program dashboard as its availability changes
- [ ] Optional / empty answers are still handled correctly by the submission flow (`Summary.parseAnswers` / `formatAnswerAsArray`)

---

### #64 — d4l ui übernehmen

**Status:** Backlog  
**Labels:** Should, Software development

#### Acceptance Criteria

---

- [ ] obtain the D4L style guide and adopt it (colors, typography, spacing, components), reusing the existing shadcn/ui theming in `tailwind.config.js` / `components.json`

---

### #71 — Add E2EE

**Status:** Backlog  
**Labels:** Should, Software development

#### User Story

---

**As a** study participant,
**I want** my data to be end-to-end encrypted,
**so that** neither the operators of this web app nor the D4L dispatcher can read my submission payload or identifying fields in plaintext.

D4L potentially suggested adding E2EE (End-to-End-Encryption).

The user could create some kind of passphrase, e.g. a 6 digit PIN and from that we somehow get the recovery Key (either saved in our db and encrypted with the pin, or its derived from the PIN or whatever).

But there are a few problems with E2EE:

- If the user forgets his PIN, then RIP
- As far as what we came up with, there is not a completely zero-knowledge implementation of the contact-api

#### Acceptance Criteria

---

- [ ] A password / PIN flow is defined and implemented on top of the existing crypto primitives (`lib/core/crypto.ts` — `deriveEncryptionKey` PBKDF2 + `generateKey`, and the `recoveryKey` field on the `User` model in `prisma/schema.prisma`)
- [ ] Encrypt all sensitive data including the programName and subjectID in the enrollment model (keep in mind that the subjectID needs to be compared somehow with the data D4L sends us, but best would be if we don't have a connection between subjectID and mail for security reasons — one solution could be to hash the subjectID with a secret, but it still opposes the threat if there's an intern)
- [ ] Notification content stays minimal (zero-knowledge): emails only say "a new questionnaire is available" without naming the questionnaire and the questionnaire URL's are encrypted by the user so the user can still easily follow the link but nobody knows what the link actually leads to (see the scheduler in `scripts/scheduler.ts`)
- [ ] Account data export (`/api/user/export`) and GDPR delete (`DELETE /api/user`) still work with encrypted data
- [ ] A key-recovery / lost-PIN story is documented and, if recovery is impossible, clearly communicated to the user up front

---

### #73 — ✨ Consent + optionales consent direkt bei Enrollment anzeigen

**Status:** Backlog  
**Labels:** Enhancement, Should, Software development

#### Description

---

Currently enrollment (`components/program/EnrollButton.client.tsx`) creates the donor + enrollment record, and only afterwards are consents shown via `ConsentList` / `ConsentPopup` on the program page. The main (and optional) consents should be presented and accepted directly as part of the enrollment step, before the user lands on the program dashboard.

#### Acceptance Criteria

---

- [ ] During enrollment the program's consents are fetched (`lib/getProgramConsents.ts`) and the main consent is shown and required before the enrollment is created
- [ ] Optional consents are shown alongside the main consent and clearly marked as optional (accepting them is not required to enroll)
- [ ] Accepting consents creates the corresponding resources via the donation client (`updateOrCreateResourceConsent` in `lib/donation/upsert-resources.ts`) and, where applicable, the research subject (`updateOrCreateResearchSubject`)
- [ ] A user cannot complete enrollment without accepting the required main consent; the enrollment POST (`/api/dashboard/programs/[programId]/enrollment`) is not called until consents are resolved (one exception could be if the user already has submitted consents before enrolling, the question is if we should reuse them)
- [ ] The existing `ConsentPopup` / `ConsentList` components are reused/extended rather than duplicated
- [ ] Already-accepted consents are not re-prompted on later enrollment steps

---

### #82 — D4L added new question types

**Status:** Backlog  
**Labels:** Should, Software development

#### User Story

---

**As a** study participant,
**I want** newly added D4L question types to render and submit correctly,
**so that** I can answer every question a study defines instead of seeing an "unsupported question type" placeholder.

#### Acceptance Criteria

---

- [ ] The new question type(s) D4L added are identified (via the FHIR questionnaire definition)
- [ ] A renderer component is added in `components/questions/` and wired into the `QuestionRenderer` switch in `components/questions/index.tsx`
- [ ] The type is parsed correctly by the FHIR parser (`lib/fhir-parser/questionnaire.ts`) into the app's `Question` type (`lib/questionnaireTypes.ts`)
- [ ] Answers are serialized correctly on submit — `formatAnswerAsArray` in `components/questionnaire/Summary.tsx` produces the expected `ResponseValue`
- [ ] Previously-unsupported types no longer fall through to the "unsupported question type" placeholder (`common('unsupportedQuestionType')`)
- [ ] Round-trip works: submit via the D4L app → reload in this app preserves the answer for the new type

---

### #93 — ✨ The User should be able to delete all account data at once

**Status:** Backlog  
**Labels:** Enhancement, Should, Software development

#### Description

---

The User should be able to easily delete all data or only the account data, but keep the study data for the researcher.

Today `DELETE /api/user` cascade-deletes the local user record (and its `Enrollment` / `NotificationJob` / `NotificationPreference` rows), but the actual study data (`QuestionnaireResponse` resources) lives in the D4L dispatcher. This issue adds a choice: delete everything, or delete only account/PII data while leaving anonymized study data for researchers.

#### Acceptance Criteria

---

- [ ] The account/settings area offers two clearly distinct actions: "delete everything" vs. "delete my account data but keep my study submissions (anonymized)"
- [ ] "Delete everything" removes both the local account (cascade in `DELETE /api/user`) AND the user's resources from D4L via the donation client
- [ ] "Delete account data only" removes the local `User` + `Enrollment` rows (PII, `did`, `subjectId`) but keeps the `QuestionnaireResponse` resources in D4L, with the link to the user severed/anonymized so researchers retain the data
- [ ] Both actions are gated behind a confirmation dialog (`components/ui/confirm-dialog.tsx`) and explain the consequences in plain language
- [ ] Data export (`/api/user/export`) remains available before deletion
- [ ] Covered by E2E and/or unit tests

---

### #94 — Check the sec vul

**Status:** Backlog  
**Labels:** Should, Software development

Check all security vulnerabilities (npm audit) and fix them (npm audit fix).

#### Acceptance Criteria

---

- [ ] Run `npm audit` and review every reported vulnerability (including dev-only / transitive)
- [ ] Apply `npm audit fix` / bump or replace vulnerable dependencies; for anything that cannot be auto-fixed, document the rationale (e.g. dev-only, no fix available, mitigated elsewhere)
- [ ] Re-run `npm audit` to confirm the resolved/remaining state and record the result

---

### #103 — check all TODOs in the code

**Status:** Backlog  
**Labels:** Should, Software development

#### Description

---

Sweep the codebase for outstanding `TODO` / `FIXME` markers, decide for each whether to implement now or convert into a tracked issue, so the codebase handed to the next team has no hidden loose ends.

#### Acceptance Criteria

---

- [ ] `components/RichTextRenderer.tsx` — TODO: switch to server-side rendering (client-only `@tiptap` editor today)
- [ ] `components/program/ProgramHeader.server.tsx` — TODO: add a server-side rich-text renderer for SEO (depends on the RichTextRenderer change above)
- [ ] `components/questions/ScaleNumerical.tsx` — TODO: split `ScaleOrdinal` and `ScaleNumerical` into separate components (ordinal has labels + step 1 + no value input; numeric has no labels)
- [ ] `app/[locale]/dashboard/program/[programId]/components/ConsentPopup.client.tsx` — TODO: when a new major consent version is available, indicate the user already accepted a previous version and must accept the latest (optionally show previous text in a collapsible)
- [ ] Any remaining TODOs found during the sweep are either resolved or filed as individual issues

---

## Priority: Could

### #68 — ✨ skipFirst in recurring questionnaires is ignored

**Status:** Backlog  
**Labels:** Could, Enhancement, Software development

#### Description

---

The `TaskFrequency` type carries an optional `skipFirst` flag (`lib/surveyTypes.ts`), but `calculateIteration()` in `lib/iterationCalculator.ts` never reads it — the iteration counter `n` always starts counting from `frequency.start` unconditionally. So even when a program declares `skipFirst: true`, the web app still shows/activates the first iteration.

Note: setting of the skipFirst got remove from the sensorhub-studio, but it is part of the published frequency type, so the web app must still honour it when a program supplies it.

#### Acceptance Criteria

---

- [ ] When `frequency.skipFirst === true` (and `frequency.type` is `daily`/`weekly`/`monthly`), the **first** iteration window is skipped — i.e. the task is not active/shown during cycle 1 and the first iteration the user can act on is cycle 2. Handling lives in `calculateIteration()` (`lib/iterationCalculator.ts`), which is the single place `n` is computed.
- [ ] `skipFirst` has no effect for `single` / `onDemand` frequencies (they have no iteration cycles).
- [ ] Downstream consumers in `lib/evaluateTasks.ts` (`calculateIteration` call at line ~121) and the composite completion key `${surveyName}-${currentIteration}` in `components/ProgramDashboardProvider.tsx` stay consistent with the shifted numbering.
- [ ] Add/extend a unit test in `__tests__/lib` (iteration calculator) asserting the first cycle is skipped when `skipFirst` is set and not skipped when it is unset.

---

### #69 — ✨ Add user iteration for recurring questionnaires

**Status:** Backlog  
**Labels:** Could, Enhancement, Software development

#### Description

---

For recurring questionnaires a user ends up with several submissions of the same questionnaire, but the submission list only shows the questionnaire title and the submission date — there is no way to tell which iteration/cycle a given submission belongs to.

#### Acceptance Criteria

---

- [ ] Decide if the iteration shown should be the user (relative to the first available iteration) or the global iteration.
- [ ] Each entry in the submission list (`components/SubmissionList.client.tsx`) shows the iteration number for recurring questionnaires — e.g. "Iteration 3" next to / under the questionnaire title — using the already-parsed `submission.iteration.currentIteration`.
- [ ] The iteration label is only shown when the questionnaire is recurring (`frequency.type` is `daily`/`weekly`/`monthly`); for `single`/`onDemand` questionnaires nothing extra is rendered.
- [ ] The iteration number is also surfaced in the submission/edit view so the user can tell which cycle they are editing.
- [ ] Add the corresponding translation keys to `messages/de.json` and `messages/en.json`.

---

### #84 — ✨ Mark not supported tasks as not supported instead of ignoring

**Status:** Backlog  
**Labels:** Could, Enhancement, Software development

#### Description

---

`getAllTasks()` (`lib/evaluateTasks.ts`) returns every non-`survey`/non-`consent` step (sensor tasks, `token`, `eligibility`, `display`) as `type: "unsupported"`, and `TaskList.client.tsx` then filters them out entirely (`task.type !== 'unsupported'`), so the participant never sees them. Tasks the web app can't fulfil should instead be shown but disabled, with a clear note that the mobile app is required for that task.

#### Acceptance Criteria

---

- [ ] Stop filtering `type === 'unsupported"` out of the task list (`app/[locale]/dashboard/program/[programId]/components/TaskList.client.tsx`); render those tasks in a disabled, non-clickable state.
- [ ] Each unsupported task shows an explanatory notice (e.g. "This task is only available in the mobile app").
- [ ] The disabled state is accessible (aria-disabled, no focus action) and visually distinct from pending/accessible tasks.
- [ ] Add the notice copy to `messages/de.json` and `messages/en.json`.
- [ ] (Coordinate with #97: `display` steps — including end-of-participation — should move out of the generic `unsupported` bucket and be handled explicitly, not shown as "use the mobile app".)

---

### #86 — 🐞 After editing a questionnaire check if all submissions are still accessible

**Status:** Backlog  
**Labels:** Bug, Could, Software development

#### Description

---

If a user edits a submission we don't validate if previous submissions are still accessible. If a different submission is not accessible anymore we should delete it.

> **Note:** It appears that conditional questionnaires that depend on answers of a questionnaire can not be set on the research studiohub.

#### Acceptance Criteria

---

- [ ] If a questionnaire becomes not accessible anymore after editing a questionnaire submission, delete the questionnaire that is not accessible anymore

---

### #89 — ✨ Add breadcrumbs for /program/[programId]

**Status:** Backlog  
**Labels:** Could, Enhancement, Software development

#### Description

---

Breadcrumbs already exist for the authenticated path `/dashboard/program/[programId]` (via the `@breadcrumb` slot → `Breadcrumbs` with a `labelMap` for the program title). The **public** program page `/program/[programId]` (`app/[locale]/program/[programId]/page.tsx`) has no breadcrumb slot, so there is no way back to the program overview / dashboard from the public enrollment view. Or add a global breadcrumb route that not starts at /dashboard but at / (home)

#### Acceptance Criteria

---

- [ ] Add a `@breadcrumb` parallel route (or equivalent) to `app/[locale]/program/[programId]` rendering `<Breadcrumbs labelMap={{ [programId]: program.content.title[lang] }} />`, mirroring the dashboard implementation.
- [ ] The public program page layout renders the breadcrumb slot above the content.
- [ ] Breadcrumb links resolve correctly (e.g. back to the program overview / dashboard) for guest and authenticated users.

---

### #91 — ✨ Add sections in the “my study” page for finished studies, ongoing studies etc.

**Status:** Backlog  
**Labels:** Could, Enhancement, Software development

#### Description

---

The dashboard (`app/[locale]/dashboard/page.tsx`) renders every enrolled program as one flat grid with no grouping or status. `getUserPrograms()` returns only program IDs, so there is no notion of ongoing vs. finished vs. withdrawn. Grouping the list into sections makes the overview scannable, especially once withdrawn studies are kept (#92) instead of removed.

#### Acceptance Criteria

---

- [ ] Compute a per-program status (at least `ongoing` / `finished` / `withdrawn`) for the programs returned by `getUserPrograms()` in `app/[locale]/dashboard/page.tsx`. "Finished" reuses the same ended-detection used by `ProgramEndedNotice` (endDate / end-of-participation, see #97); "withdrawn" comes from the withdrawal status added in #92.
- [ ] Render the program list grouped into labelled sections (e.g. Ongoing / Finished / Withdrawn), each collapsible, instead of one flat grid.
- [ ] Empty sections are hidden (or shown with a short empty-state line).
- [ ] Add the section labels to `messages/de.json` and `messages/en.json`.

---

### #92 — ✨ After withdrawing make the study read only instead of removing it from the overview

**Status:** Backlog  
**Labels:** Could, Enhancement, Software development

#### Description

---

Today, withdrawing from a study deletes the local `Enrollment` row (`DELETE /api/dashboard/programs/[programId]/enrollment`) and redirects to `/dashboard`, so the study disappears from the user's overview entirely (`UnenrollButton.confirmUnenroll()` in `components/program/UnenrollButton.client.tsx`; the dashboard list comes from `getUserPrograms()` → `user.enrollments`). The D4L side already records the withdrawal by setting the `ResearchSubject` status to `off-study`.

The study should instead stay visible but become read-only, so the participant retains a record of their participation and past submissions.

#### Acceptance Criteria

---

- [ ] Withdrawing no longer hard-deletes the `Enrollment` (`prisma/schema.prisma`). Add a withdrawal status (e.g. a `status`/`withdrawnAt` field on `Enrollment`) so `getUserPrograms()` still returns the program.
- [ ] The dashboard (`app/[locale]/dashboard/page.tsx`) shows withdrawn studies in a distinct read-only/"withdrawn" state (pairs naturally with #91's study sections).
- [ ] On the program page (`/dashboard/program/[programId]`) a withdrawn study is read-only: existing submissions are visible but not editable, and all task/submit/enroll actions are hidden or disabled.
- [ ] Re-enrolling into a previously withdrawn study is handled deliberately (allowed → flips status back to active; or blocked with a message) — pick one and document it.
- [ ] Add translation keys for the withdrawn state to `messages/de.json` and `messages/en.json`.

---

### #104 — Dashboard/ Programm Seite (description) und ausfüllen auch ohne Login ermöglichen, erst bei submit einloggen

**Status:** Backlog  
**Labels:** Could, Enhancement, Software development

#### Description

---

Today every questionnaire route lives under `/dashboard/...` and is gated behind `auth()` + an enrollment, and `EnrollButton` (`components/program/EnrollButton.client.tsx`) redirects guests to `/login` before anything else. The desired flow: a user opens a program/questionnaire via a link, can read the description and start filling out the questionnaire as a guest, and is only asked to sign in (and enroll) when they press submit.

#### Acceptance Criteria

---

- [ ] The public program page (`/program/[programId]`) and a questionnaire entry point are reachable and fillable without a session; guests are not bounced to `/login` on open.
- [ ] Guest answers are held client-side (e.g. in memory / local storage) while filling.
- [ ] On submit, the user is prompted to sign in / enroll; after auth, the held answers are submitted for the now-authenticated enrollment (no re-entry needed).
- [ ] Authenticated users are unaffected (existing flow preserved).
- [ ] Security check: a guest cannot read or submit another user's data; the gating only relaxes for the guest's own in-progress answers.

---

## Priority: Unprioritized

### #13 — Kubernetes Deployabiliy

**Status:** Backlog  
**Labels:** Software development

#### Description

---

Today the app is deployed with Docker Compose (`docker-compose.prod.yml`, see `readme/DEPLOYMENT.md`): a multi-stage image (`Dockerfile` — `deps` → `build` → `prod`, plus a separate `migrate` target) running Next.js standalone on port 3000, with a SQLite DB file (`/app/data/prod.db`) on a persistent volume, and a health endpoint at `/api/health`. There is no Kubernetes manifests / Helm chart.

The SQLite-file database is the main constraint: a plain Deployment with replicas > 1 would corrupt the DB, so K8s deployment needs a single-replica StatefulSet (or an external DB) with a PVC, and the `migrate` step becomes an init container.

#### Acceptance Criteria

---

- [ ] A Helm chart (or Kustomize manifests) is added that deploys the `prod` image as a StatefulSet with a PVC for the SQLite data directory (mirroring the `next_db_data` volume), plus a Service and Ingress on port 3000.
- [ ] DB migrations (`migrate` target → `prisma migrate deploy`) run as an init container / init Job before the app starts, and only once.
- [ ] Liveness and readiness probes hit `/api/health`.
- [ ] All runtime config comes from env vars / Secrets (the list in `readme/DEPLOYMENT.md` — `DATABASE_URL`, `AUTH_SECRET`, email, `NEXT_PUBLIC_D4L_DISPATCHER_SECRET`, NPM token not needed at runtime, etc.), templated via chart values.
- [ ] `helm install` in a test cluster brings the app up healthy; documented in `readme/DEPLOYMENT.md`.

---

### #53 — ✨ better error messages, when fetching questionnaire

**Status:** Backlog  
**Labels:** Enhancement, Software development

#### Description

---

`getQuestionnaire` (`lib/getQuestionnaire.ts`) throws a single generic `Error(data.error || HTTP ${status})` for every failure, and language fallback is done silently by `resolveProgramLanguage` (`lib/getProgramLang.ts`). So the user can't tell (a) that they are seeing a different language than requested because their language wasn't available, or (b) whether a failure is an auth problem vs. the server being down.

#### Acceptance Criteria

---

- [ ] Distinguish error causes in `getQuestionnaire` / `getQuestionnaires`: auth (401/403), not-found/unsupported-language (404), and server/network (5xx, fetch throw) produce distinguishable error types instead of one generic `Error`.
- [ ] When the requested language is unavailable and a fallback language is served (`resolveProgramLanguage`), surface a notice to the user ("shown in English because X is not available").
- [ ] The questionnaire page error UI (`error.tsx` / the wizard) shows a meaningful, cause-specific message (re-login vs. "service unavailable, try again") rather than a raw HTTP string.
- [ ] Add the new message keys to `messages/de.json` and `messages/en.json`.

---

### #54 — ✨ Show better error messages when getProgram fails

**Status:** Backlog  
**Labels:** Enhancement, Software development

#### Description

---

When getProgram fails, it throws the error code. However, our API always gives back 500. 404 would be nicer, when program not available. Already implemented for pending consents (I think), but check all routes. Maybe also throw the error in the selected language.

#### Acceptance Criteria

---

- [ ] Ensure that we show more verbose error messages to the user if `getProgram` fails

---

### #96 — 🐞 Dont show enroll button for closed studies

**Status:** Backlog  
**Labels:** Bug, Software development

#### Description

---

`EnrollButton` (`components/program/EnrollButton.client.tsx`) is rendered unconditionally on the public program page (`/program/[programId]`).

> **Note:** A study can be _closed_ on the D4L/Dispatcher side (fetching/enrolling throws) while its `endDate` is absent — this happens when an endDate is added in the research hub but the change is saved without being published. So the closed state is not derivable from `endDate` alone. This is an error on D4L side

#### Acceptance Criteria

---

- [ ] On `/program/[programId]`, the enroll button is hidden (or replaced with a "study closed" notice) when the program is closed — detect this from the program fetch response / Dispatcher status, not only from `endDate`.
- [ ] The enroll path (`EnrollButton.handleEnroll` → `POST /api/dashboard/programs/[programId]/enrollment`) handles a "study closed" error from the Dispatcher and surfaces a clear message instead of failing silently / creating a broken enrollment.
- [ ] Submission paths likewise handle a closed-study error (a study can be closed after the user enrolled but before they submit).
- [ ] Covered by a test simulating a closed program (Dispatcher error, no `endDate`): no enroll button, friendly message, no enrollment row created.

---

### #97 — Show the end-of-participation display and lock study

**Status:** Backlog  
**Labels:** Software development

#### Description

---

A program phase can contain a `DisplayStep` with `type: "display"` and `displayName: "end-of-participation"` (`lib/programTypes.ts`). When that step's conditions are met, the participant should be shown the step's defined text and the study should be locked (no further tasks/submissions).

Currently this does not happen: in `getAllTasks()` (`lib/evaluateTasks.ts`) every non-`survey`/non-`consent` step — including all `display` steps — falls into the generic `else` branch and is returned as `type: "unsupported"`, so the end-of-participation step is neither rendered nor used to lock anything. (Open question: where the display text actually comes from — program content vs. a step field — needs confirming against a real program definition.)

#### Acceptance Criteria

---

- [ ] `display` steps are handled distinctly in `getAllTasks()` (`lib/evaluateTasks.ts`)
- [ ] When the `end-of-participation` display step's conditions are met, the study is locked: remaining survey/consent tasks become inaccessible and the existing `ProgramEndedNotice` (or equivalent) is shown on `/dashboard/program/[programId]`.
- [ ] The display step's defined text is rendered to the user (source of the text confirmed against the program definition).
- [ ] A test asserts: end-of-participation condition unmet → study active; condition met → notice shown and tasks locked.

---

### #98 — ✨ Make data exports write to disk immediately

**Status:** Backlog  
**Labels:** Enhancement, Software development

#### Description

---

`GET /api/user/export` (`app/api/user/export/route.ts`) returns only the server-side data as JSON; the client then fetches the raw D4L Dispatcher resources and assembles the full export in-browser before triggering a download (see the route comment). For users with a lot of data this means the entire payload is held in browser memory before writing to disk, which can crash/freeze low-memory devices.

#### Acceptance Criteria

---

- [ ] The complete export (server data + D4L Dispatcher resources) is assembled server-side in `/api/user/export` and returned as a streamed download (streaming `Response` / appropriate content headers) so the browser never holds the whole document in memory.
- [ ] The download still includes the same data the client-side path currently produces (user, linked accounts, enrollments, and all questionnaire responses/resources from the Dispatcher).
- [ ] Auth and the per-user scoping (`session.user.email`) are preserved.
- [ ] Large-dataset behaviour verified (e.g. a user with many submissions exports without freezing the browser).

---

### #99 — add error handling in programDashboardProvider when fetching

**Status:** Backlog  
**Labels:** Software development

#### Description

---

`ProgramDashboardProvider` (`components/ProgramDashboardProvider.tsx`, `load()` effect) does wrap its fetches in try/catch and dispatches `FETCH_ERROR` → `data.status = 'error'`. The problem is the consumers: e.g. `SubmissionList.client.tsx` treats `'error'` the same as `'loading'` and renders a spinner, so a failed dashboard load looks like an infinite spinner with no message and no way to retry. The error is captured but never surfaced.

#### Acceptance Criteria

---

- [ ] When `data.status === 'error'`, the dashboard UI shows a real error state (message + retry action) instead of a loading spinner. Audit all consumers of `useProgramDashboard()` (`SubmissionList`, `TaskList`, `ConsentList`, etc.).
- [ ] The error message reflects the cause where possible (network vs. Dispatcher vs. parse), reusing the typed errors from #53 where applicable.
- [ ] A retry path re-runs the `load()` effect without requiring a full page reload.

---

### #100 — The notification sync uses a user submitted timestamp

**Status:** Backlog  
**Labels:** Software development

#### Description

---

`POST /api/notifications/sync` (`app/api/notifications/sync/route.ts`) orders syncs by the client-supplied `clientTimestamp`, storing it as `enrollment.lastNotificationSync` and rejecting only timestamps in the future. The intended use is de-duplication when one device fires two syncs back-to-back and they arrive out of order. The real-world failure is a device with a wrong/skewed system clock (e.g. 2 days behind): its syncs are treated as older and it can never push updates, because ordering trusts the client clock.

#### Acceptance Criteria

---

- [ ] Come up with a better way to handle this. A server side timestamp would be pointless, as it would do basically nothing. A option would be to use like transaction counters or so.

---

### #101 — Docker deps doesnt cache

**Status:** Backlog  
**Labels:** Software development

#### Description

---

The CI (`.github/workflows/ci.yml`) already has a `build-deps` job that runs first and caches the `deps` stage to the GitHub Actions cache (`type=gha,scope=deps`); the downstream `unit-tests` and `e2e-tests` jobs then each run `docker/build-push-action` for their own target (`test-unit`, `playwright`, `migrate`, `prod`) with `cache-from: type=gha,scope=deps`. The problem is that each downstream job still _rebuilds_ the `deps` stage and re-runs `npm ci` + `db:generate`, so the dedicated `build-deps` job adds little. Goal: build `deps` once and have the other jobs reuse that exact image instead of rebuilding it.

#### Acceptance Criteria

---

- [ ] Downstream jobs (`unit-tests`, `e2e-tests`) reuse the cached `deps` stage, e.g. directly by a registry
- [ ] On a `package-lock.json` change, `deps` rebuilds once in `build-deps` and the new image is reused by all downstream jobs.

---

### #102 — Long program titles lead to problems on mobile

**Status:** Backlog  
**Labels:** Software development

#### Description

---

Program titles are rendered with no length control, so long titles overflow / skew the default svg icon on these pages: the dashboard list (`app/[locale]/dashboard/page.tsx`, `<h3 className="mb-1 text-xl font-bold">`) and the program header on `/dashboard/program/[programId]` / `/program/[programId]` (`components/program/ProgramHeader.server.tsx`).

#### Acceptance Criteria

---

- [ ] Program titles in the dashboard list and the program header wrap or truncate gracefully on narrow viewports without pushing the chevron/image.
- [ ] Verify on a mobile viewport (Playwright `e2e/` or manual) with a deliberately long title.

---

### #105 — Use the resolveSensorhubUrl function instead of resolving it manually

**Status:** Backlog  
**Labels:** Software development

#### Description

---

Several getXXX() helper functions take server: boolean = true as an flag to decide if sensorhub should be called directly or via our webserver proxy.
Instead we should use the resolveSensorhubUrl from `lib/utils.ts` that automatically resolves the URL that should be used.

#### Acceptance Criteria

---

- [ ] All helper functions that fetch something from sensorhub should use the resolveSensorhubUrl function

---
