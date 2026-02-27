-- CreateTable
CREATE TABLE "ResponseValidation" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reactions" TEXT,
    "acknowledgment" VARCHAR(100),

    CONSTRAINT "ResponseValidation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResponseValidation_responseId_idx" ON "ResponseValidation"("responseId");

-- CreateIndex
CREATE INDEX "ResponseValidation_userId_idx" ON "ResponseValidation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ResponseValidation_responseId_userId_key" ON "ResponseValidation"("responseId", "userId");

-- AddForeignKey
ALTER TABLE "ResponseValidation" ADD CONSTRAINT "ResponseValidation_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "Response"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponseValidation" ADD CONSTRAINT "ResponseValidation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
