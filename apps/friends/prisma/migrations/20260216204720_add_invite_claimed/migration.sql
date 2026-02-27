-- AlterTable
ALTER TABLE "Invite" ADD COLUMN     "claimedAt" TIMESTAMP(3),
ADD COLUMN     "claimedBy" TEXT;
