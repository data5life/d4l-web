/*
  Warnings:

  - You are about to drop the column `createdAt` on the `QuestionnaireResponse` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_QuestionnaireResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "questionnaireId" TEXT NOT NULL,
    "iterationNumber" INTEGER NOT NULL DEFAULT 1,
    "responses" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuestionnaireResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_QuestionnaireResponse" ("id", "programId", "questionnaireId", "responses", "userId") SELECT "id", "programId", "questionnaireId", "responses", "userId" FROM "QuestionnaireResponse";
DROP TABLE "QuestionnaireResponse";
ALTER TABLE "new_QuestionnaireResponse" RENAME TO "QuestionnaireResponse";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
