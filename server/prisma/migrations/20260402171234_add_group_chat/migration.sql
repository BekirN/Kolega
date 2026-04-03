-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "adminId" TEXT,
ADD COLUMN     "groupImage" TEXT,
ADD COLUMN     "isGroup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT;
