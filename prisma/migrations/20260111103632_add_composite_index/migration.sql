-- CreateIndex
CREATE INDEX "QuestionnaireResponse_userId_programId_questionnaireId_iterationNumber_idx" ON "QuestionnaireResponse"("userId", "programId", "questionnaireId", "iterationNumber");
