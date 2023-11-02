/*
  Warnings:

  - You are about to drop the column `photo` on the `CardImageModel` table. All the data in the column will be lost.
  - Added the required column `imageName` to the `CardImageModel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `CardImageModel` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CardImageModel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "imageName" TEXT NOT NULL,
    "cardId" INTEGER NOT NULL,
    CONSTRAINT "CardImageModel_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "CardModel" ("cardId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CardImageModel" ("cardId", "id") SELECT "cardId", "id" FROM "CardImageModel";
DROP TABLE "CardImageModel";
ALTER TABLE "new_CardImageModel" RENAME TO "CardImageModel";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
