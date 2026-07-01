# Database Documentation

This document describes the database schema and data handling logic for the D4L-Collect Web Interface.

## Database Technology

The application uses **SQLite** as the database, managed through **Prisma ORM**.

## Schema Overview

See [schema.prisma](/prisma/schema.prisma) for model definitions.

### User Model

Handles user authentication and profile information.

### Enrollment Model

Handles the programs a user is enrolled in with a DonationID and a SubjectID.

### NextAuth.js Models

The following models are standard requirements for `next-auth` to manage authentication state, sessions, and account linking.

#### Account Model

Links OAuth accounts (e.g., Google) to a `User`.

#### Session Model

Stores user session information.

#### VerificationToken Model

Used for email-based magic link authentication.

## Database Operations

### Creating a Migration

After modifying the Prisma schema:

```bash
npm run db:migrate
```

### Applying Migrations in Production

```bash
npm run db:deploy
```

### Regenerating Prisma Client

After schema changes:

```bash
npm run db:generate
```

## API Endpoints

For detailed API endpoint documentation, see [API.md](API.md).

## Database File Location

The SQLite database file is located at:

```
d4l-web/prisma/dev.db
```

## Security Considerations

1. **Cascade Deletion**: Ensures data consistency when users are removed
2. **Query Optimization**: Index on subjectId in Enrollment table improves query performance and prevents full table scans

## Future Enhancements

Potential improvements to consider:

- Implement rate limiting for API endpoints
- Standarize the API responses (e.g. return always the "success" field)
