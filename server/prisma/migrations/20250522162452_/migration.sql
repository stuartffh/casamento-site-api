/*
  Warnings:

  - You are about to drop the column `mercadoPagoToken` on the `Config` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Sale" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "presentId" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "amount" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sale_presentId_fkey" FOREIGN KEY ("presentId") REFERENCES "Present" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Config" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "siteTitle" TEXT,
    "weddingDate" TEXT,
    "pixKey" TEXT,
    "pixDescription" TEXT,
    "pixQrCodeImage" TEXT,
    "mercadoPagoPublicKey" TEXT,
    "mercadoPagoAccessToken" TEXT,
    "mercadoPagoWebhookUrl" TEXT,
    "mercadoPagoNotificationUrl" TEXT,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Config" ("id", "pixDescription", "pixKey", "pixQrCodeImage", "siteTitle", "updatedAt", "weddingDate") SELECT "id", "pixDescription", "pixKey", "pixQrCodeImage", "siteTitle", "updatedAt", "weddingDate" FROM "Config";
DROP TABLE "Config";
ALTER TABLE "new_Config" RENAME TO "Config";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
