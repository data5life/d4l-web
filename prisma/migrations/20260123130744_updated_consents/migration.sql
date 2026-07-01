-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Consent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "consentKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL,
    "text" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "accepted" BOOLEAN NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Consent" (
  "accepted", "consentKey", "id", "programId", "text", "updatedAt", "userId", "version",
  "title", "publishedAt"
)
SELECT 
  "accepted", "consentKey", "id", "programId", "text", "updatedAt", "userId", "version",
  '' AS "title",
  CURRENT_TIMESTAMP AS "publishedAt"
FROM "Consent";
DROP TABLE "Consent";
ALTER TABLE "new_Consent" RENAME TO "Consent";
CREATE UNIQUE INDEX "Consent_userId_programId_consentKey_key" ON "Consent"("userId", "programId", "consentKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
