-- DropIndex
DROP INDEX "Enrollment_programId_subjectId_idx";

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "recoveryKey" BLOB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en'
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "id", "image", "name", "preferredLanguage", "recoveryKey", "updatedAt") SELECT "createdAt", "email", "emailVerified", "id", "image", "name", coalesce("preferredLanguage", 'en') AS "preferredLanguage", "recoveryKey", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Enrollment_subjectId_idx" ON "Enrollment"("subjectId");
