import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { SolicitudParaAdoptarDto } from './dtos/solicitud-adoptar.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { EstadoAdopcion } from '@prisma/client';
import { MailerService } from 'src/shared/email/email-server.service';


@Injectable()
export class SolicitudAdoptarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService
  ) {}

  async crearSolicitud(usuarioId: string ,solicitud: SolicitudParaAdoptarDto) {
    const { 
      casoAdopcionId, 
      estado, 
      tipoVivienda, 
      integrantesFlia, 
      hijos,  
      hayOtrasMascotas,
    descripcionOtrasMascotas, cubrirGastos, darAlimentoCuidados, darAmorTiempoEj,
    devolucionDeMascota, siNoPodesCuidarla, declaracionFinal} = solicitud

    const usuarioSolicitante = await this.prisma.usuario.findUnique({
    where: {
      id: usuarioId
    },
  });

  if (!usuarioSolicitante) {
    throw new BadRequestException('Falta el usuario solicitante');
  }

  const solicitudExistente = await this.prisma.solicitudDeAdopcion.findFirst({
    where: {
      usuarioId,
      casoAdopcionId,
    },
  });

  if (solicitudExistente) {
    throw new BadRequestException('Ya enviaste una solicitud para este caso de adopción');
  }

  const nuevaSolicitud = await this.prisma.solicitudDeAdopcion.create({
    data: {
      usuarioId, casoAdopcionId, estado, tipoVivienda, integrantesFlia, hijos, hayOtrasMascotas,
      descripcionOtrasMascotas, cubrirGastos, darAlimentoCuidados, darAmorTiempoEj,
      devolucionDeMascota, siNoPodesCuidarla, declaracionFinal
    },
  });

  return nuevaSolicitud;
}

  async verCasosAdopcionPorEstado(estado?: EstadoAdopcion) {
    return await this.prisma.casoAdopcion.findMany({
      where: estado ? {
        solicitudes: {
          some: {
            estado: estado
          },
        },
      } : {},
      include: {
        caso: {
          include: {
            mascota: {
              include: {
                organizacion: true,
                tipo: true,
                imagenes: true,
              },
            },
          },
        },
        solicitudes: {
          where: estado ? { estado } : undefined, 
          include:{
            usuario: true,
          },
        },
      },
    });
  }


async obtenerMascotasConAdopcionPorOng(ongId: string) {
  return await this.prisma.mascota.findMany({
    where: {
      organizacionId: ongId,
      casos: {
        some: {
          tipo: 'ADOPCION',
        },
      },
    },
    include: {
      casos: {
        where: {
          tipo: 'ADOPCION',
        },
        include: {
          adopcion: true,
        },
      },
    },
  });
}

async filtroViviendaQdeMascotas(
  casoAdopcionId: string,
  tipoVivienda?: string,
) {
  return this.prisma.solicitudDeAdopcion.findMany({
    where: {
      casoAdopcionId,
      ...(tipoVivienda && { tipoVivienda }),
    },
    orderBy: {
      hayOtrasMascotas: 'asc', // Orden de menor a mayor
    },
    include: {
      usuario: true,
      casoAdopcion: true,
    },
  });
}


  async verSolicitudesPorCasoDeAdopcion(ongId: string) {
    const mascotas = await this.prisma.mascota.findMany({
    where: { organizacionId: ongId },
    include: {
      imagenes: true,
      casos: {
        where: {
          tipo: 'ADOPCION',
        },
        include: {
          adopcion: {
            include: {
              solicitudes: {
                include: {
                  usuario: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const resultado = mascotas.map((mascota) => {
    const casoAdopcion = mascota.casos[0]?.adopcion;
    const solicitudes = casoAdopcion?.solicitudes || [];

    return {
      mascota: {
        id: mascota.id,
        nombre: mascota.nombre,
        edad: mascota.edad,
        descripcion: mascota.descripcion,
        imagenes: mascota.imagenes,
      },
      solicitudes: solicitudes.map((s) => ({
        id: s.id,
        estado: s.estado,
        tipoVivienda: s.tipoVivienda,
        integrantesFlia: s.integrantesFlia,
        hijos: s.hijos,
        hayOtrasMascotas: s.hayOtrasMascotas,
        descripcionOtrasMascotas: s.descripcionOtrasMascotas,
        cubrirGastos: s.cubrirGastos,
        darAlimentoCuidados: s.darAlimentoCuidados,
        darAmorTiempoEj: s.darAmorTiempoEj,
        devolucionDeMascota: s.devolucionDeMascota,
        siNoPodesCuidarla: s.siNoPodesCuidarla,
        declaracionFinal: s.declaracionFinal,
        usuario: {
          id: s.usuario.id,
          nombre: s.usuario.nombre,
          email: s.usuario.email,
          telefono: s.usuario.telefono,
          direccion: s.usuario.direccion,
          ciudad: s.usuario.ciudad,
          pais: s.usuario.pais,
          imagenPerfil: s.usuario.imagenPerfil,
        },
      })),
    };
  });

  return resultado;

}

async aceptarSolicitud(
  idDelCasoAdopcion: string,
  idDeSolicitudAceptada: string,
  estadoNuevo: EstadoAdopcion,
  ongId: string
) {
  const caso = await this.prisma.casoAdopcion.findUnique({
    where: { id: idDelCasoAdopcion },
    include: {
      caso: {
        select: {
          ongId: true,
          mascotaId: true,
        },
      },
    },
  });

  if (!caso || caso.caso.ongId !== ongId) {
    throw new UnauthorizedException('No tienes permiso para modificar este caso');
  }

  if (estadoNuevo !== 'ACEPTADA') {
    throw new BadRequestException('Solo se permite aceptar una solicitud en esta ruta');
  }

  const solicitudValidar = await this.prisma.solicitudDeAdopcion.findUnique({
    where: { id: idDeSolicitudAceptada },
    select: { estado: true },
  });

  if (!solicitudValidar) {
    throw new NotFoundException('No se encontró la solicitud indicada');
  }

  if (solicitudValidar.estado !== 'PENDIENTE') {
    throw new BadRequestException('Solo se pueden aceptar solicitudes que esten en estado PENDIENTE');
  }

  // 1. Actualizar estado general del caso
  await this.prisma.casoAdopcion.update({
    where: { id: idDelCasoAdopcion },
    data: { estado: 'ACEPTADA' },
  });


  const solicitudes = await this.prisma.solicitudDeAdopcion.findMany({
    where: {
      casoAdopcionId: idDelCasoAdopcion,
    },
    include: {
      usuario: true,
    },
  });

    // 3. Rechazar las demás solicitudes pendientes
    await this.prisma.solicitudDeAdopcion.updateMany({
      where: {
        casoAdopcionId: idDelCasoAdopcion,
        estado: 'PENDIENTE',
        NOT: {
          id: idDeSolicitudAceptada,
        },
      },
      data: {
        estado: 'RECHAZADA',
      },
    });

    // 4. Aceptar la solicitud seleccionada
    await this.prisma.solicitudDeAdopcion.update({
      where: { id: idDeSolicitudAceptada },
      data: { estado: 'ACEPTADA' },
    });

    const nombreMascota = caso?.caso?.mascotaId
      ? await this.prisma.mascota.findUnique({
        where: { id: caso.caso.mascotaId },
        select: { nombre: true },
      })
      : null;

    // 5. Extraer correos y nombre de mascota
    const listaDeCorreos = solicitudes.map(s => s.usuario.email);
    const emailAceptado = solicitudes.find(s => s.id === idDeSolicitudAceptada)?.usuario.email;

    // const nombreMascota = await this.obtenerNombreMascotaPorCasoAdopcion(idDelCasoAdopcion);

    if ( emailAceptado && listaDeCorreos.length && nombreMascota?.nombre) {
      await this.mailerService.enviarEmailsNotificacionAdopcion(
        listaDeCorreos,
        emailAceptado,
        nombreMascota.nombre,
      );
    }

    // 6. Enviar correos
    return { message: 'Solicitud aceptada correctamente y otras rechazadas.'}

}


  async borrarSolicitud(id: string) {
    await this.prisma.solicitudDeAdopcion.delete({
  where: {
    id
  },
});
  return { mensaje: `Solicitud borrada id: ${id}`}
  }

  async contarAdopcionesAceptadas(){
    const total = await this.prisma.casoAdopcion.count({
      where: {
        estado: EstadoAdopcion.ACEPTADA,
      },
    });

    return { total };
  }

  async obtenerResumenMisSolicitudes(usuarioId: string) {
    const solicitudes = await this.prisma.solicitudDeAdopcion.findMany({
      where: { usuarioId },
      select: {
        casoAdopcionId: true,
        estado: true,
        casoAdopcion: { select: { caso: { select: { mascotaId: true } } } },
      },
    });

    return solicitudes.map((s) => ({
      casoAdopcionId: s.casoAdopcionId,
      mascotaId: s.casoAdopcion.caso.mascotaId,
      estado: s.estado,
    }));
  }

  async existenciaDeSolicitud(usuarioId: string, casoAdopcionId: string) {
  const solicitud = await this.prisma.solicitudDeAdopcion.findFirst({
    where: {
      usuarioId,
      casoAdopcionId,
    },
  });
  return solicitud !== null;
}
}
