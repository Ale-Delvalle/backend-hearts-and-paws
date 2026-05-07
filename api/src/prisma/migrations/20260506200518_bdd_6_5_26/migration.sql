/*
  Warnings:

  - A unique constraint covering the columns `[usuarioId,casoAdopcionId]` on the table `SolicitudDeAdopcion` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SolicitudDeAdopcion_usuarioId_casoAdopcionId_key" ON "SolicitudDeAdopcion"("usuarioId", "casoAdopcionId");
