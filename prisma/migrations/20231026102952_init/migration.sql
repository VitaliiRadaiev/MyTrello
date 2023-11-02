/*
  Warnings:

  - You are about to drop the `MessageModel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MessageReadStatusModel` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "CardImageModel_cardId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "MessageModel";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "MessageReadStatusModel";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "CommentModel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "cardId" INTEGER NOT NULL,
    CONSTRAINT "CommentModel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CommentModel_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "CardModel" ("cardId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommentReadStatusModel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "isRead" BOOLEAN NOT NULL,
    "commentId" INTEGER NOT NULL,
    CONSTRAINT "CommentReadStatusModel_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "CommentModel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CommentReadStatusModel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
