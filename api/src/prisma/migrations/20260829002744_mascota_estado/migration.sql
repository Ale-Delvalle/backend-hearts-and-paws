-- CreateEnum
CREATE TYPE "EstadoMascota" AS ENUM ('EN_ADOPCION', 'EN_TRANSITO', 'ADOPTADO', 'FALLECIDO');

-- AlterTable
ALTER TABLE "Mascota" ADD COLUMN     "estado" "EstadoMascota" NOT NULL DEFAULT 'EN_ADOPCION';

-- CreateIndex
CREATE INDEX "Caso_ongId_creado_en_idx" ON "Caso"("ongId", "creado_en");

-- CreateIndex
CREATE INDEX "Mascota_organizacionId_estado_idx" ON "Mascota"("organizacionId", "estado");
