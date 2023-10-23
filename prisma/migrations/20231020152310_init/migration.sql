-- CreateTable
CREATE TABLE "UserModel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "profilePhoto" TEXT
);

-- CreateTable
CREATE TABLE "BoardModel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdById" INTEGER NOT NULL,
    "previewImage" TEXT,
    CONSTRAINT "BoardModel_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "UserModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ParticipantsModel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "boardId" INTEGER NOT NULL,
    CONSTRAINT "ParticipantsModel_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "BoardModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ColumnModel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "boardId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "ColumnModel_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "BoardModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CardModel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "columnId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "CardModel_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "ColumnModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CardPhotoModel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "photo" TEXT NOT NULL,
    "cardId" INTEGER NOT NULL,
    CONSTRAINT "CardPhotoModel_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "CardModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MessageModel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "cardId" INTEGER NOT NULL,
    CONSTRAINT "MessageModel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MessageModel_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "CardModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MessageReadStatusModel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "messageId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "isRead" BOOLEAN NOT NULL,
    CONSTRAINT "MessageReadStatusModel_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "MessageModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MessageReadStatusModel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ParticipantsModelToUserModel" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ParticipantsModelToUserModel_A_fkey" FOREIGN KEY ("A") REFERENCES "ParticipantsModel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ParticipantsModelToUserModel_B_fkey" FOREIGN KEY ("B") REFERENCES "UserModel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "UserModel_email_key" ON "UserModel"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantsModel_boardId_key" ON "ParticipantsModel"("boardId");

-- CreateIndex
CREATE UNIQUE INDEX "CardModel_columnId_key" ON "CardModel"("columnId");

-- CreateIndex
CREATE UNIQUE INDEX "CardPhotoModel_cardId_key" ON "CardPhotoModel"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "_ParticipantsModelToUserModel_AB_unique" ON "_ParticipantsModelToUserModel"("A", "B");

-- CreateIndex
CREATE INDEX "_ParticipantsModelToUserModel_B_index" ON "_ParticipantsModelToUserModel"("B");
