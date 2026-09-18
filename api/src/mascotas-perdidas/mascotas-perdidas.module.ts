import { Module } from '@nestjs/common';
import { MascotasPerdidasController } from './mascotas-perdidas.controller';
import { MascotasPerdidasService } from './mascotas-perdidas.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [MascotasPerdidasController],
  providers: [MascotasPerdidasService],
  exports: [MascotasPerdidasService],
})
export class MascotasPerdidasModule {}
