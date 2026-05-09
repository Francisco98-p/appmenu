-- AlterTable
ALTER TABLE "Local" ADD COLUMN "horarioApertura" TEXT;
ALTER TABLE "Local" ADD COLUMN "horarioCierre" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "localId" INTEGER NOT NULL,
    "mesa" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Recibido',
    "total" REAL NOT NULL,
    "metodoPago" TEXT NOT NULL,
    "tipoOrden" TEXT NOT NULL DEFAULT 'salon',
    "pagoConfirmado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_localId_fkey" FOREIGN KEY ("localId") REFERENCES "Local" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "estado", "id", "localId", "mesa", "metodoPago", "pagoConfirmado", "total") SELECT "createdAt", "estado", "id", "localId", "mesa", "metodoPago", "pagoConfirmado", "total" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
