import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateOrganizacioneDto } from './dto/update-organizacione.dto';
import { OtorgarReconocimientoDto } from './dto/otorgar-reconocimiento.dto';
import { RevocarReconocimientoDto } from './dto/revocar-reconocimiento.dto';
import { EstadoOrganizacion, EstadoMascota, EstadoCasoAdopcion, EstadoCasoDonacion, Prisma } from '@prisma/client';
import { MailerService } from 'src/shared/email/email-server.service';
import { Response } from 'express';
import axios from 'axios';

interface AutorReconocimiento {
  id: string;
  tipo: string;
}

@Injectable()
export class OrganizacionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
  ){}

  async actualizarFotoPerfil(id: string, fotoUrl: string){
    const ongActualizada = this.prisma.organizacion.update({
      where: { id },
      data: { imagenPerfil: fotoUrl},
      select: {
        id: true,
        nombre: true,
        email: true,
        imagenPerfil: true,
        plan: true,
        creado_en: true
      }
    });

    return ongActualizada;
  }  

  async buscarPorId(id: string){
    const organizacion = await this.prisma.organizacion.findUnique({
      where: {id},
      select: {
        id: true,
        nombre: true,
        email: true,
        descripcion: true,
        telefono: true,
        direccion: true,
        ciudad: true,
        pais: true,
        imagenPerfil: true,
        archivoVerificacionUrl: true,
        plan: true,
        creado_en: true,
      },
    });

    if (!organizacion) {
      throw new NotFoundException('Organización no encontrada');
    }
    return organizacion;
  }


  async obtenerPerfilPublico(id: string){
    const organizacion = await this.prisma.organizacion.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        ciudad: true,
        pais: true,
        imagenPerfil: true,
        creado_en: true,
        estado: true,
      },
    });

    if (!organizacion || organizacion.estado !== EstadoOrganizacion.APROBADA) {
      throw new NotFoundException('Organización no encontrada');
    }

    const [mascotasActivas, casosPublicados, totalReconocimientos] = await Promise.all([
      this.prisma.mascota.count({
        where: {
          organizacionId: id,
          estado: { in: [EstadoMascota.EN_ADOPCION, EstadoMascota.EN_TRANSITO] },
        },
      }),
      this.prisma.caso.count({
        where: { ongId: id },
      }),
      this.prisma.reconocimientoOng.count({
        where: { organizacionId: id, revocado_en: null },
      }),
    ]);

    const { estado, ...datosPublicos } = organizacion;

    return {
      ...datosPublicos,
      mascotasActivas,
      casosPublicados,
      totalReconocimientos,
    };
  }

  private whereAutorReconocimiento(organizacionId: string, autor: AutorReconocimiento) {
    return autor.tipo === 'ONG'
      ? { organizacionId, autorOrganizacionId: autor.id }
      : { organizacionId, autorUsuarioId: autor.id };
  }

  async otorgarReconocimiento(organizacionId: string, autor: AutorReconocimiento, dto: OtorgarReconocimientoDto) {
    if (autor.tipo === 'ONG' && autor.id === organizacionId) {
      throw new ForbiddenException('No podés reconocer a tu propia organización.');
    }

    const organizacion = await this.prisma.organizacion.findUnique({
      where: { id: organizacionId },
      select: { estado: true },
    });

    if (!organizacion || organizacion.estado !== EstadoOrganizacion.APROBADA) {
      throw new NotFoundException('Organización no encontrada');
    }

    const datosAutor =
      autor.tipo === 'ONG'
        ? { autorOrganizacionId: autor.id }
        : { autorUsuarioId: autor.id };

    await this.prisma.reconocimientoOng.upsert({
      where: {
        // El nombre del índice compuesto lo genera Prisma uniendo los campos del @@unique.
        ...(autor.tipo === 'ONG'
          ? { organizacionId_autorOrganizacionId: { organizacionId, autorOrganizacionId: autor.id } }
          : { organizacionId_autorUsuarioId: { organizacionId, autorUsuarioId: autor.id } }),
      } as Prisma.ReconocimientoOngWhereUniqueInput,
      update: { mensaje: dto.mensaje, revocado_en: null, motivoRevocacion: null },
      create: { organizacionId, mensaje: dto.mensaje, ...datosAutor },
    });

    return { ok: true, mensaje: 'Reconocimiento otorgado exitosamente' };
  }

  async revocarReconocimiento(organizacionId: string, autor: AutorReconocimiento, dto: RevocarReconocimientoDto) {
    await this.prisma.reconocimientoOng.updateMany({
      where: { ...this.whereAutorReconocimiento(organizacionId, autor), revocado_en: null },
      data: { revocado_en: new Date(), motivoRevocacion: dto.motivo },
    });

    return { ok: true, mensaje: 'Reconocimiento revocado correctamente' };
  }

  async miEstadoReconocimiento(organizacionId: string, autor?: AutorReconocimiento) {
    if (!autor) {
      return { yaReconocida: false };
    }

    const existente = await this.prisma.reconocimientoOng.findFirst({
      where: { ...this.whereAutorReconocimiento(organizacionId, autor), revocado_en: null },
      select: { id: true },
    });

    return { yaReconocida: !!existente };
  }

  async listarReconocimientosRecibidos(organizacionId: string) {
    const reconocimientos = await this.prisma.reconocimientoOng.findMany({
      where: { organizacionId },
      orderBy: { creado_en: 'desc' },
      include: {
        autorUsuario: { select: { id: true, nombre: true } },
        autorOrganizacion: { select: { id: true, nombre: true } },
      },
    });

    return reconocimientos.map((r) => ({
      id: r.id,
      mensaje: r.mensaje,
      creado_en: r.creado_en,
      revocado_en: r.revocado_en,
      motivoRevocacion: r.motivoRevocacion,
      otorgadoPor: r.autorUsuario
        ? { tipo: 'USUARIO' as const, id: r.autorUsuario.id, nombre: r.autorUsuario.nombre }
        : { tipo: 'ONG' as const, id: r.autorOrganizacion!.id, nombre: r.autorOrganizacion!.nombre },
    }));
  }

  async obtenerTimeline(id: string, page: number, limit: number){
    const organizacion = await this.prisma.organizacion.findUnique({
      where: { id },
      select: { estado: true },
    });

    if (!organizacion || organizacion.estado !== EstadoOrganizacion.APROBADA) {
      throw new NotFoundException('Organización no encontrada');
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.caso.findMany({
        where: { ongId: id },
        orderBy: { creado_en: 'desc' },
        skip,
        take: limit,
        include: {
          mascota: {
            include: {
              imagenes: { orderBy: { subida_en: 'desc' }, take: 1 },
            },
          },
          adopcion: true,
          donacion: true,
        },
      }),
      this.prisma.caso.count({ where: { ongId: id } }),
    ]);

    return { data, total, page, limit };
  }

  async obtenerCasosCerrados(id: string, page: number, limit: number, motivo?: string){
    const organizacion = await this.prisma.organizacion.findUnique({
      where: { id },
      select: { estado: true },
    });

    if (!organizacion || organizacion.estado !== EstadoOrganizacion.APROBADA) {
      throw new NotFoundException('Organización no encontrada');
    }

    const motivoUpper = motivo?.toUpperCase();

    let condicionMotivo: Prisma.CasoWhereInput['OR'] = undefined;

    if (motivoUpper === 'ADOPCION') {
      condicionMotivo = [
        { adopcion: { estado: EstadoCasoAdopcion.ACEPTADA } },
        { mascota: { estado: EstadoMascota.ADOPTADO } },
      ];
    } else if (motivoUpper === 'DONACION') {
      condicionMotivo = [
        { donacion: { estado: EstadoCasoDonacion.COMPLETADO } },
      ];
    } else if (motivoUpper === 'FALLECIDO') {
      condicionMotivo = [
        { mascota: { estado: EstadoMascota.FALLECIDO } },
      ];
    } else {
      condicionMotivo = [
        { mascota: { estado: { in: [EstadoMascota.ADOPTADO, EstadoMascota.FALLECIDO] } } },
        { adopcion: { estado: EstadoCasoAdopcion.ACEPTADA } },
        { donacion: { estado: EstadoCasoDonacion.COMPLETADO } },
      ];
    }

    const where: Prisma.CasoWhereInput = {
      ongId: id,
      OR: condicionMotivo,
    };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.caso.findMany({
        where,
        orderBy: { creado_en: 'desc' },
        skip,
        take: limit,
        include: {
          mascota: {
            include: {
              imagenes: { orderBy: { subida_en: 'desc' }, take: 1 },
            },
          },
          adopcion: true,
          donacion: true,
        },
      }),
      this.prisma.caso.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async obtenerMascotas(id: string, estado: EstadoMascota | undefined, page: number, limit: number){
    const organizacion = await this.prisma.organizacion.findUnique({
      where: { id },
      select: { estado: true },
    });

    if (!organizacion || organizacion.estado !== EstadoOrganizacion.APROBADA) {
      throw new NotFoundException('Organización no encontrada');
    }

    const where = {
      organizacionId: id,
      ...(estado && { estado }),
    };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.mascota.findMany({
        where,
        orderBy: { creada_en: 'desc' },
        skip,
        take: limit,
        include: {
          tipo: true,
          imagenes: { orderBy: { subida_en: 'desc' }, take: 1 },
        },
      }),
      this.prisma.mascota.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async listarTodas(query: any){
    const { nombre, email, ciudad, plan, creado_en} = query

    return this.prisma.organizacion.findMany({
      where: { 
        estado: EstadoOrganizacion.PENDIENTE,
        nombre: nombre ? { contains: nombre, mode: 'insensitive'} : undefined,
        email: email ? { contains: email, mode: 'insensitive'} : undefined,
        ciudad: ciudad ? { contains: ciudad, mode: 'insensitive'} : undefined,
        plan: plan ? plan : undefined,
        creado_en: creado_en ? new Date(creado_en) : undefined,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        imagenPerfil: true,
        plan: true,
        creado_en: true,
      },
    });
  }

  async actualizarDatosOng(id: string, data: UpdateOrganizacioneDto){
    const existe = await this.prisma.organizacion.findUnique({where: {id}})

    if (!existe) {
      throw new NotFoundException('Organización no encontrada');
    }

    const organizacionActualizada = await this.prisma.organizacion.update({
      where: {id},
      data,
      select: {
        id: true,
        nombre: true,
        email: true,
        descripcion: true,
        telefono: true,
        direccion: true,
        ciudad: true,
        pais: true,
        imagenPerfil: true,
        archivoVerificacionUrl: true,
        plan: true,
        creado_en: true,
      },
    });
    
    return organizacionActualizada;
  }

  async actualizarEstado(id: string, estado: EstadoOrganizacion){
    const organizacion = await this.prisma.organizacion.findUnique({where: {id}});
    if (!organizacion) {
      throw new NotFoundException('Organización no encontrada');
    }

    const actualizada = await this.prisma.organizacion.update({
      where: { id },
      data: { estado }
    });

    const resultado =
      estado === EstadoOrganizacion.APROBADA ? 'ACEPTADA' : 'RECHAZADA';

      await this.mailerService.enviarEstadoActualizado(
        organizacion.email,
        resultado,
      )

    return {
      ok: true,
      mensaje: `Estado actualizado a ${estado}`,
      nombre: actualizada.nombre,
    };
  }

  async servirArchivoVerificacion(id: string, res: Response){
    const organizacion = await this.prisma.organizacion.findUnique({
      where: { id },
      select: { archivoVerificacionUrl: true, nombre: true},
    });

    if (!organizacion || !organizacion.archivoVerificacionUrl) {
      throw new NotFoundException('Archivo de verificación no encontrado');
    }

    try {
      const response = await axios.get(organizacion.archivoVerificacionUrl, {
        responseType: 'stream',
      });

      res.set({
        'content-type': 'application/pdf',
        'content-Disposition': `inline; filename="${organizacion.nombre}-verificacion.pdf"`
      });

      response.data.pipe(res);
    } catch (error) {
      throw new NotFoundException('No se pudo acceder al archivo de verificación');
    }
  }

  async listarAprobadas(query: any){
    const { nombre, email, ciudad, plan, creado_en} = query

    return await this.prisma.organizacion.findMany({
      where: {
        estado: EstadoOrganizacion.APROBADA,
        nombre: nombre ? { contains: nombre, mode: 'insensitive'} : undefined,
        email: email ? { contains: email, mode: 'insensitive'} : undefined,
        ciudad: ciudad ? { contains: ciudad, mode: 'insensitive'} : undefined,
        plan: plan ? plan : undefined,
        creado_en: creado_en ? new Date(creado_en) : undefined,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        imagenPerfil: true,
        plan: true,
        creado_en: true,
      },
    });
  }

  async listarRechazadas(query: any){
    const { nombre, email, ciudad, plan, creado_en} = query

    return await this.prisma.organizacion.findMany({
      where: { 
        estado: EstadoOrganizacion.RECHAZADA,
        nombre: nombre ? { contains: nombre, mode: 'insensitive'} : undefined,
        email: email ? { contains: email, mode: 'insensitive'} : undefined,
        ciudad: ciudad ? { contains: ciudad, mode: 'insensitive'} : undefined,
        plan: plan ? plan : undefined,
        creado_en: creado_en ? new Date(creado_en) : undefined,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        imagenPerfil: true,
        plan: true,
        creado_en: true
      },
    });
  }

  async contarAprobadas(){
    const total = await this.prisma.organizacion.count({
      where: {estado: EstadoOrganizacion.APROBADA},
    });
    return { total };
  }

  async buscarPorEmail(email: string){
    return await this.prisma.organizacion.findUnique({
      where: { email },
    });
  }

}
