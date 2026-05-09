import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCasoDto } from './dto/create-caso.dto';
import { UpdateCasoDto } from './dto/update-caso.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { TipoCaso } from '@prisma/client';
import { FiltroViejoRecienteEnum } from './enums/filtro-tipo-reciente-antiguo.enum';

@Injectable()
export class CasosService {
  constructor(private readonly prismaService: PrismaService){}

  async GetCasos() {

    return this.prismaService.caso.findMany({
      include: {
        mascota: true,
        ong: true,
      }
    });

  }
  
  async GetCasoById(id: string) {
    return this.prismaService.caso.findUnique({
      where: { id },
      include: {
        mascota: true,
        ong: true,
      },
    });
  }
  
  async GetCasosAdopcion() {
    return this.prismaService.caso.findMany({
      where: { 
        tipo: 'ADOPCION',
        adopcion: {
          estado: 'PENDIENTE',
        }
      },
      include: {
        mascota: {
          include: {
            imagenes: {
              orderBy: { subida_en: 'desc'}, 
            },
          },
        },
        ong: true
      },
    });
    
  }

  async GetCasosDonacion() {
    return this.prismaService.caso.findMany({
      where: { tipo: 'DONACION' },
      include: {
        mascota: {
          include: {
            imagenes: {
              orderBy: { subida_en: 'desc'}, 
            },
          },
        },
        ong: true,
        donacion: true
      },
    });
  }

  async obtenerIdDelCasoAdopcion(mascotaId: string) {
  const mascota = await this.prismaService.mascota.findUnique({
    where: { id: mascotaId },
    include: {
      casos: {
        where: { tipo: 'ADOPCION' },
        include: {
          adopcion: true,
        },
      },
    },
  });

  if (!mascota) {
    throw new NotFoundException('Mascota no encontrada');
  }

  const casoConAdopcion = mascota.casos.find((caso) => caso.adopcion);

  if (!casoConAdopcion) {
    throw new NotFoundException('No se encontró un CasoAdopcion para esta mascota');
  }

  return { casoAdopcionId: casoConAdopcion.adopcion!.id };
}


  async CreateCaso(createCasoDto: CreateCasoDto, ongId: string) {
    
    const casoExistente = await this.prismaService.caso.findFirst({
      where: {
        tipo: createCasoDto.tipo,
        mascotaId: createCasoDto.mascotaId,
      }
    })

    if (casoExistente) {
      throw new BadRequestException(`Ya existe un caso de tipo ${createCasoDto.tipo} para la mascota con ID ${createCasoDto.mascotaId}`);
    }

    const caso = await this.prismaService.caso.create({
      data: {
        titulo: createCasoDto.titulo,
        descripcion: createCasoDto.descripcion,
        tipo: createCasoDto.tipo,
        mascotaId: createCasoDto.mascotaId,
        ongId,
      },
    });

    if(createCasoDto.tipo === 'ADOPCION') {

      await this.prismaService.casoAdopcion.create({
        data: {
          casoId: caso.id,
          estado: 'PENDIENTE',
        },
      });

    } else if(createCasoDto.tipo === 'DONACION' && createCasoDto.donacion) {
      await this.prismaService.casoDonacion.create({
        data: {
          casoId: caso.id,
          metaDonacion: createCasoDto.donacion.metaDonacion,
          estadoDonacion: 0,
        },
      });
    }

    return caso;

  }

  async buscarCasos(filtros: { tipoMascota?: string; nombreMascota?: string }) {
    
    return this.prismaService.caso.findMany({
      where: {
        mascota: {
          ...(filtros.tipoMascota && {
            tipo: { nombre: { equals: filtros.tipoMascota, mode: 'insensitive' } }
          }),
          ...(filtros.nombreMascota && {
            nombre: { contains: filtros.nombreMascota, mode: 'insensitive' }
          })
        }
      },
      include: {
        mascota: {
          include: {
            tipo: true,
            imagenes: true,
          }
        },
        ong: true,
        adopcion: true,
        donacion: true,
      }
    })
  }

async filtroParaDonacionesPorMascota(tipo: string) {
  return await this.prismaService.caso.findMany({
    where: {
      tipo: 'DONACION',
      mascota: {
        tipo: {
          nombre: {
            equals: tipo,
            mode: 'insensitive',
          },
        },
      },
    },
    include: {
      donacion: true,
      mascota: {
        include: {
          tipo: true,
          imagenes: true,
        },
      },
      ong: true,
    },
  });
}

async filtroParaAdopcionesPorMascota(tipo: string) {
  return await this.prismaService.caso.findMany({
    where: {
      tipo: 'ADOPCION',
      mascota: {
        tipo: {
          nombre: {
            equals: tipo,
            mode: 'insensitive',
          },
        },
      },
      adopcion: {
        estado: 'PENDIENTE',
      }
    },
    include: {
      adopcion: true,
      mascota: {
        include: {
          tipo: true,
          imagenes: true,
        }
      },
      ong: true
    }
  })
}

async buscarCasosPorTipoYFechas(tipo: TipoCaso, fechaDesde: string, fechaHasta: string) {
  const desde = new Date(fechaDesde);
  const hasta = new Date(fechaHasta);

  return this.prismaService.caso.findMany({
    where: {
      tipo: tipo as TipoCaso,
      creado_en: {
        gte: desde,
        lte: hasta,
      },
    },
    include: {
      mascota: {
        include: {
          tipo: true,
          imagenes: true,
        }
      },
      ong: true,
      adopcion: true,
      donacion: true,
    }
  });
}

async filtrarPorTipoYordenTemporal(ongId: string, orden?: string, tipoMascota?: string) {
  return this.prismaService.caso.findMany({
    where: {
      ...(ongId && { ongId }),
      ...(tipoMascota && {
        mascota: {
          tipo: {
            nombre: tipoMascota.toUpperCase(),
          },
        },
      }),
    },
    orderBy: {
      creado_en: orden === FiltroViejoRecienteEnum.Reciente ? 'desc' : 'asc',
    },
    include: {
      mascota: {
        include: {
          tipo: true,
          imagenes: true,
        },
      },
      ong: true,
      adopcion: true,
      donacion: true,
    },
  });
}


async obtenerCasosPorOng(ongId: string){
  return await this.prismaService.caso.findMany({
    where: { ongId },
    include: {
      mascota: {
        include: {
          tipo: true,
          imagenes: true,
        },
      },
      adopcion: true,
      donacion: true,
    },
  });
}

async buscarCasosDeDonacionPorTipoDeMascota(tipo: string) {
  return this.prismaService.caso.findMany({
    where: {
      donacion: {
        isNot: null, // Solo casos que tienen relación con CasoDonacion
      },
      mascota: {
        tipo: {
          nombre: {
            equals: tipo,
            mode: 'insensitive', // Ignora mayúsculas y minúsculas
          },
        },
      },
    },
    include: {
      mascota: {
        include: {
          tipo: true, // Incluye el tipo de mascota
          imagenes: true
        },
      },
      ong: true,       // Incluye la organización
      donacion: true,  // Incluye los datos del subtipo donación
    },
  });
}


}