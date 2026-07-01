/*
  Warnings:

  - Added the required column `programId` to the `QuestionnaireResponse` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_QuestionnaireResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "questionnaireId" TEXT NOT NULL,
    "responses" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuestionnaireResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_QuestionnaireResponse" ("createdAt", "id", "questionnaireId", "responses", "userId") SELECT "createdAt", "id", "questionnaireId", "responses", "userId" FROM "QuestionnaireResponse";
DROP TABLE "QuestionnaireResponse";
ALTER TABLE "new_QuestionnaireResponse" RENAME TO "QuestionnaireResponse";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
