/*
  Warnings:

  - You are about to drop the `Consent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NotificationLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuestionnaireResponse` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `lastLocale` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastTimeZone` on the `User` table. All the data in the column will be lost.
  - Added the required column `did` to the `Enrollment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subjectId` to the `Enrollment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Consent_userId_programId_consentKey_key";

-- DropIndex
DROP INDEX "NotificationLog_userId_programId_surveyName_iterationNumber_key";

-- DropIndex
DROP INDEX "QuestionnaireResponse_userId_programId_questionnaireId_iterationNumber_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Consent";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "NotificationLog";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "QuestionnaireResponse";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Enrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "did" JSONB NOT NULL,
    "subjectId" TEXT NOT NULL,
    "enrolledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Enrollment" ("enrolledAt", "id", "programId", "userId") SELECT "enrolledAt", "id", "programId", "userId" FROM "Enrollment";
DROP TABLE "Enrollment";
ALTER TABLE "new_Enrollment" RENAME TO "Enrollment";
CREATE INDEX "Enrollment_programId_subjectId_idx" ON "Enrollment"("programId", "subjectId");
CREATE UNIQUE INDEX "Enrollment_userId_programId_key" ON "Enrollment"("userId", "programId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "recoveryKey" BLOB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "id", "image", "name", "updatedAt") SELECT "createdAt", "email", "emailVerified", "id", "image", "name", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
