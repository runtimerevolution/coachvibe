-- AlterTable
-- Adds Nango connection tracking to Integration. We store only the connection id
-- and provider config key; Nango holds and refreshes the OAuth tokens.
ALTER TABLE "Integration" ADD COLUMN     "nangoConnectionId" TEXT,
ADD COLUMN     "nangoProviderConfigKey" TEXT;
