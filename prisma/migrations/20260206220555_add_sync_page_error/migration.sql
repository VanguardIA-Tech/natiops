-- CreateEnum
CREATE TYPE "SyncPageErrorStatus" AS ENUM ('PENDING_RETRY', 'RESOLVED', 'PERMANENT_FAILURE');

-- CreateTable
CREATE TABLE "SyncPageError" (
    "id" TEXT NOT NULL,
    "syncRunId" TEXT NOT NULL,
    "page" INTEGER NOT NULL,
    "httpStatus" INTEGER,
    "errorMessage" TEXT,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "status" "SyncPageErrorStatus" NOT NULL DEFAULT 'PENDING_RETRY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncPageError_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SyncPageError_syncRunId_status_idx" ON "SyncPageError"("syncRunId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SyncPageError_syncRunId_page_key" ON "SyncPageError"("syncRunId", "page");

-- AddForeignKey
ALTER TABLE "SyncPageError" ADD CONSTRAINT "SyncPageError_syncRunId_fkey" FOREIGN KEY ("syncRunId") REFERENCES "SyncRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
