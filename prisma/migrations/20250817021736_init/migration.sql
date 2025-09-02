-- CreateEnum
CREATE TYPE "public"."LineType" AS ENUM ('DIALOGUE', 'STAGE_DIRECTION', 'NARRATION');

-- CreateTable
CREATE TABLE "public"."actors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tmdbId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."characters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."character_portrayals" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "movieId" TEXT,
    "tvShowId" TEXT,
    "seasonId" TEXT,
    "episodeId" TEXT,

    CONSTRAINT "character_portrayals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."movies" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "releaseYear" INTEGER,
    "tmdbId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tv_shows" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "tmdbId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tv_shows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."seasons" (
    "id" TEXT NOT NULL,
    "tvShowId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT,
    "tmdbId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."episodes" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT,
    "tmdbId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "episodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."quotes" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "movieId" TEXT,
    "episodeId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."quote_lines" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "characterId" TEXT,
    "content" TEXT NOT NULL,
    "lineType" "public"."LineType" NOT NULL DEFAULT 'DIALOGUE',
    "orderIndex" INTEGER NOT NULL,
    "startTime" DOUBLE PRECISION,
    "endTime" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "displayName" VARCHAR(15),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "actors_tmdbId_key" ON "public"."actors"("tmdbId");

-- CreateIndex
CREATE UNIQUE INDEX "character_portrayals_characterId_actorId_movieId_key" ON "public"."character_portrayals"("characterId", "actorId", "movieId");

-- CreateIndex
CREATE UNIQUE INDEX "character_portrayals_characterId_actorId_tvShowId_seasonId__key" ON "public"."character_portrayals"("characterId", "actorId", "tvShowId", "seasonId", "episodeId");

-- CreateIndex
CREATE UNIQUE INDEX "movies_tmdbId_key" ON "public"."movies"("tmdbId");

-- CreateIndex
CREATE UNIQUE INDEX "tv_shows_tmdbId_key" ON "public"."tv_shows"("tmdbId");

-- CreateIndex
CREATE UNIQUE INDEX "seasons_tvShowId_number_key" ON "public"."seasons"("tvShowId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "episodes_seasonId_number_key" ON "public"."episodes"("seasonId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "quote_lines_quoteId_orderIndex_key" ON "public"."quote_lines"("quoteId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_displayName_key" ON "public"."users"("displayName");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "public"."accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "public"."sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "public"."verification_tokens"("identifier", "token");

-- AddForeignKey
ALTER TABLE "public"."character_portrayals" ADD CONSTRAINT "character_portrayals_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "public"."characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."character_portrayals" ADD CONSTRAINT "character_portrayals_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."actors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."character_portrayals" ADD CONSTRAINT "character_portrayals_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "public"."movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."character_portrayals" ADD CONSTRAINT "character_portrayals_tvShowId_fkey" FOREIGN KEY ("tvShowId") REFERENCES "public"."tv_shows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."character_portrayals" ADD CONSTRAINT "character_portrayals_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "public"."seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."character_portrayals" ADD CONSTRAINT "character_portrayals_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "public"."episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."seasons" ADD CONSTRAINT "seasons_tvShowId_fkey" FOREIGN KEY ("tvShowId") REFERENCES "public"."tv_shows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."episodes" ADD CONSTRAINT "episodes_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "public"."seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quotes" ADD CONSTRAINT "quotes_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "public"."movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quotes" ADD CONSTRAINT "quotes_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "public"."episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quotes" ADD CONSTRAINT "quotes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quote_lines" ADD CONSTRAINT "quote_lines_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "public"."quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quote_lines" ADD CONSTRAINT "quote_lines_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "public"."characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
