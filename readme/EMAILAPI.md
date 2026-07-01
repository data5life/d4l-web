## Email API Documentation

### Email Request

| Properties        | Required | Type                           | Description                                                                                                                  |
| ----------------- | -------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `subjects`        | true     | `string[]`                     | Subject IDs used to identify participants by matching against `Enrollment.subjectId` in the database.                        |
| `languages`       | true     | `string[]`                     | Language codes supported in this batch, e.g. `["en", "de"]`. Used to validate allowed languages and user preferences.        |
| `defaultLanguage` | true     | `string`                       | Fallback language code used when a user has no valid `preferredLanguage`. Must be included in `languages`.                   |
| `email`           | true     | `Record<string, EmailContent>` | Map of language code to email content. Each key is a language (e.g. `"en"`, `"de"`), each value is an `EmailContent` object. |

#### EmailContent

| Properties    | Required | Type     | Description                        |
| ------------- | -------- | -------- | ---------------------------------- |
| `subjectline` | true     | `string` | Subject line for this language.    |
| `message`     | true     | `string` | Plain-text body for this language. |

---

## Example Request

```json
{
  "subjects": ["subject-id-1", "subject-id-2"],
  "languages": ["en", "de"],
  "defaultLanguage": "en",
  "email": {
    "en": {
      "subjectline": "Study update",
      "message": "Dear participant, ..."
    },
    "de": {
      "subjectline": "Studien-Update",
      "message": "Liebe Teilnehmerin, lieber Teilnehmer, ..."
    }
  }
}
```

---

## Authentication

The `/api/v1/email` endpoint is a **trusted internal endpoint** and must not be exposed to end users.

- The caller must send a static shared secret via HTTP header:
  - Header: `x-email-secret`
  - Value: the value of the `INTERNAL_EMAIL_SECRET` environment variable.
- Requests without this header or with an invalid value are rejected with HTTP `401 Unauthorized`.

The secret must be stored in environment variables or a secret manager and rotated as needed.

---

## Processing Overview

1. **Validation**
   - Check that `subjects`, `languages`, and `email are non-empty arrays.
   - Check that `defaultLanguage` is present in `languages`.

2. **Lookup**
   - Query `Enrollment` records where `subjectId` is in `subjects`, including the related `User`.
   - For each user, read `email` and `preferredLanguage`.

3. **Language Selection**
   - If `preferredLanguage` is present in `languages`, use it.
   - Otherwise, use `defaultLanguage`.
   - Select `EmailContent` from `email[chosenLanguage]`.

4. **Sending & Response**
   - Add the email to the email job queue.
   - Collect results per subject (`accepted`, or `skipped`) and return a summary JSON:
     - `result`: a list containing the results object:
       - `subjectId`: the subjectId
       - `status`: `accepted` or `skipped`
       - `reason`: if status is `skipped` this field contains the reason
     - `summary`:
       - `skipped`: a number representing the amount of subjectIds that got skipped
       - `accepted`: a number representing the amount of subjectIds that got accepted
