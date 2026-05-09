import { Injectable, Get, NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CreateMascotaDto } from './dto/create-mascota.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { TipoMascotaDto } from './dto/tipoMascota.dto';
import axios from 'axios';

@Injectable()
export class MascotasService {
  
  constructor(private readonly prismaService: PrismaService, private readonly cloudinaryService: CloudinaryService){}
  
  
  
  async GetMascotas() {
    
    return this.prismaService.mascota.findMany({
      include: {
        imagenes: true,
      },
    });
    
    
  }

  async GetMascotaById(id: string) {
      
    return this.prismaService.mascota.findUnique({
      where: { id },
      include: {
        imagenes: true,
      },
    });
  }

  async GetMascotasByOngId(ongId: string) {
    
    return this.prismaService.mascota.findMany({
      where: { organizacionId: ongId },
      include: {
        imagenes: true,
      },
    });
  }

async mascotasEnAdopcionPorOng(ongId: string) {
  return await this.prismaService.mascota.findMany({
    where: {
      organizacionId: ongId,
      casos: {
        some: {
          tipo: 'ADOPCION',
        },
      },
    },
    include: {
      imagenes: true,
      tipo: true,
      casos: {
        where: { tipo: 'ADOPCION' },
        include: {
          adopcion: true,
        },
      },
    },
  });
}


  async GetTipo(){
    
    return await this.prismaService.tiposMascota.findMany();
    
  }
  async CreateTipoMascota(createTipoMascotaDto: TipoMascotaDto) {
    return this.prismaService.tiposMascota.create({
      data: {
        nombre: createTipoMascotaDto.nombre,
      },
    });
  }

 async crearTipoDeMascota(nombre: string) {
  return this.prismaService.tiposMascota.create({
    data: {
      nombre: nombre.toUpperCase(),
    },
  });
}

async CreateMascota(createMascotaDto: CreateMascotaDto, ongId: string) {

  const tipoExist = await this.prismaService.tiposMascota.findUnique({
    where: { id: createMascotaDto.tipoId}
  });

  if (!tipoExist) {
    throw new BadRequestException('El tipo de mascota no existe');
  }

  const ongExiste = await this.prismaService.organizacion.findUnique({
    where: { id: ongId }
  });

  if (!ongExiste) {
    throw new BadRequestException('La organizacion no existe')
  }
  
  return this.prismaService.mascota.create({
    data: {
      ...createMascotaDto,
      organizacionId: ongId,
    },
    include: {
        imagenes: true,
        tipo: true
      },
    });
  
  }

  async SubirImagenes(mascotaId: string, archivos: Express.Multer.File[], ongId: string) {

    const mascota = await this.prismaService.mascota.findUnique({
      where: { id: mascotaId},
    });

    if (!mascota) {
      throw new NotFoundException('Mascota no encontrada');
    }

    if (mascota.organizacionId !== ongId) {
      throw new ForbiddenException('No puedes subir imagenes a esta mascota');
    }

    const imagenes: any = []

    try {
      for(const file of archivos){
        const result = await this.cloudinaryService.subirIamgen(file);

        const res = await axios.get('https://api.sightengine.com/1.0/check.json', {
          params: {
            url: result.secure_url,
            models: 'violence,gore',
            api_user: process.env.SIGHTENGINE_USER,
            api_secret: process.env.SIGHTENGINE_SECRET,
          },
        });

        if (res.data.status === 'failure') {
          console.warn('Sightengine error:', res.data.error.message);
          throw new BadRequestException('Error al analizar imagen: ' + res.data.error.message);
        }

        const violenciaScore = Math.max(
          res.data.violence?.prob || 0,
          res.data.gore?.prob || 0
        );
        const esSensible = violenciaScore > 0.7;

        let urlDesenfocada: string | null = null;
        if (esSensible) {
          const urlOriginal = result.secure_url;
          const partes = urlOriginal.split('/upload/');
          urlDesenfocada = `${partes[0]}/upload/e_pixelate:100/${partes[1]}`;
        }

        const imagen = await this.prismaService.imagenMascota.create({
          data: {
            url: result.secure_url,
            urlBlur: urlDesenfocada,
            mascotaId,
            violenciaScore,
            esSensible,
          },
        });

        imagenes.push(imagen);
      }

      return imagenes;
    } catch (error: any) {
      // Re-throw specific HTTP exceptions
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException || 
          error instanceof ForbiddenException) {
        throw error;
      }
      
      const detallesError = error.response?.data?.error?.message || error.message || 'Error desconocido';
      console.error('Error detallado al subir imagen:', error.response?.data || error.message || error);
      throw new InternalServerErrorException('Fallo la subida de imagen. Detalles: ' + detallesError);
    }

  }

  async contarMascotas(){
    const total = await this.prismaService.mascota.count();
    return { total };
  }
  
}
