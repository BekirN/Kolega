/*
  Warnings:

  - A unique constraint covering the columns `[userId,name,isDefault]` on the table `MaterialFolder` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MaterialFolder_userId_name_isDefault_key" ON "MaterialFolder"("userId", "name", "isDefault");
