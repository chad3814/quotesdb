/*
  Warnings:

  - A unique constraint covering the columns `[imdbId]` on the table `actors` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[imdbId]` on the table `movies` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[imdbQuoteId]` on the table `quotes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."JobType" AS ENUM ('TMDB_SYNC', 'BATCH_QUOTE_PROCESS', 'FETCH_IMDB_QUOTES');

-- AlterTable
ALTER TABLE "public"."actors" ADD COLUMN     "imdbId" TEXT;

-- AlterTable
ALTER TABLE "public"."movies" ADD COLUMN     "imdbId" TEXT,
ADD COLUMN     "overview" TEXT;

-- AlterTable
ALTER TABLE "public"."quotes" ADD COLUMN     "imdbQuoteId" TEXT;

-- CreateTable
CREATE TABLE "public"."jobs" (
    "id" TEXT NOT NULL,
    "type" "public"."JobType" NOT NULL,
    "arguments" JSONB NOT NULL,
    "runnerId" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "timeoutMs" INTEGER NOT NULL,
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "jobs_createdAt_idx" ON "public"."jobs"("createdAt");

-- CreateIndex
CREATE INDEX "jobs_claimedAt_idx" ON "public"."jobs"("claimedAt");

-- CreateIndex
CREATE INDEX "jobs_nextRetryAt_idx" ON "public"."jobs"("nextRetryAt");

-- CreateIndex
CREATE INDEX "jobs_completedAt_idx" ON "public"."jobs"("completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "actors_imdbId_key" ON "public"."actors"("imdbId");

-- CreateIndex
CREATE UNIQUE INDEX "movies_imdbId_key" ON "public"."movies"("imdbId");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_imdbQuoteId_key" ON "public"."quotes"("imdbQuoteId");
