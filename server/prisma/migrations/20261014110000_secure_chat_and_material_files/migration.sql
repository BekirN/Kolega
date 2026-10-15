ALTER TABLE "Message"
ADD COLUMN "fileMimeType" TEXT;

ALTER TABLE "Material"
ADD COLUMN "sourceMessageId" TEXT;

CREATE UNIQUE INDEX "Material_uploaderId_sourceMessageId_key"
ON "Material"("uploaderId", "sourceMessageId");
