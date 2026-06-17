-- Reconcile committed migrations with schema.prisma.
--
-- These objects exist in schema.prisma but no migration ever created them, so a
-- fresh `prisma migrate deploy` produced a database that the seed and the
-- billing/usage features could not use (the seed failed on `Coach.googleId`).
--
-- Guards (IF NOT EXISTS / constraint check) make this migration safe to apply to
-- environments that may already have gained these objects via `prisma db push`.

-- Coach.googleId (+ unique index)
ALTER TABLE "Coach" ADD COLUMN IF NOT EXISTS "googleId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Coach_googleId_key" ON "Coach"("googleId");

-- TokenUsage
CREATE TABLE IF NOT EXISTS "TokenUsage" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "creditsCharged" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenUsage_pkey" PRIMARY KEY ("id")
);

-- CreditsTransaction
CREATE TABLE IF NOT EXISTS "CreditsTransaction" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "stripeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditsTransaction_pkey" PRIMARY KEY ("id")
);

-- TokenUsage -> Coach foreign key (Postgres has no ADD CONSTRAINT IF NOT EXISTS)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TokenUsage_coachId_fkey') THEN
    ALTER TABLE "TokenUsage" ADD CONSTRAINT "TokenUsage_coachId_fkey"
      FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
