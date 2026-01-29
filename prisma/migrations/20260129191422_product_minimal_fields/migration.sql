/*
  Warnings:

  - You are about to drop the column `CodigoBarras` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `Comprometimentos` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `EAN13` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `QuantidadeDisponivel` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `Variacoes` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `hash` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `sku` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "CodigoBarras",
DROP COLUMN "Comprometimentos",
DROP COLUMN "EAN13",
DROP COLUMN "QuantidadeDisponivel",
DROP COLUMN "Variacoes",
DROP COLUMN "description",
DROP COLUMN "hash",
DROP COLUMN "sku",
ADD COLUMN     "Colecao" TEXT,
ADD COLUMN     "Grupo" TEXT,
ADD COLUMN     "Marca" TEXT,
ADD COLUMN     "Quantidade" INTEGER,
ADD COLUMN     "Valor" DOUBLE PRECISION,
ADD COLUMN     "ValorCusto" DOUBLE PRECISION,
ALTER COLUMN "stockTotal" SET DEFAULT 0;
