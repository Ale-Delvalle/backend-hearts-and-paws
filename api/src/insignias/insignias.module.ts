import { Module } from '@nestjs/common';
import { InsigniasController } from './insignias.controller';
import { InsigniasService } from './insignias.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InsigniasController],
  providers: [InsigniasService],
})
export class InsigniasModule {}
