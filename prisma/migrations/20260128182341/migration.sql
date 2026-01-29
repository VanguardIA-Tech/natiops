-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "referencia" TEXT,
    "descricaoFabrica" TEXT,
    "status" TEXT,
    "unidadeMedida" TEXT,
    "fotos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalogItem_externalId_key" ON "CatalogItem"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogItem_referencia_key" ON "CatalogItem"("referencia");
