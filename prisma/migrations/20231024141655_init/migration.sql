/*
  Warnings:

  - You are about to drop the `CardPhotoModel` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CardPhotoModel";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "CardImageModel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "photo" TEXT NOT NULL,
    "cardId" INTEGER NOT NULL,
    CONSTRAINT "CardImageModel_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "CardModel" ("cardId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CardImageModel_cardId_key" ON "CardImageModel"("cardId");
