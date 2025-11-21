-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "type" TEXT NOT NULL DEFAULT 'new_article',
    "startDate" DATETIME,
    "dueDate" DATETIME NOT NULL,
    "feedbackDate1" DATETIME,
    "feedbackDate2" DATETIME,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "articleUrl" TEXT,
    "articleSlug" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "assigneeId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "checkerId" INTEGER NOT NULL,
    CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Task_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Task_checkerId_fkey" FOREIGN KEY ("checkerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("articleSlug", "articleUrl", "assigneeId", "authorId", "checkerId", "createdAt", "description", "dueDate", "feedbackDate1", "feedbackDate2", "id", "isPublished", "publishedAt", "startDate", "status", "title", "type", "updatedAt") SELECT "articleSlug", "articleUrl", "assigneeId", "authorId", "checkerId", "createdAt", "description", "dueDate", "feedbackDate1", "feedbackDate2", "id", "isPublished", "publishedAt", "startDate", "status", "title", "type", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
