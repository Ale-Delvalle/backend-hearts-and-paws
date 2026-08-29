import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateOrganizacioneDto } from './dto/update-organizacione.dto';
import { EstadoOrganizacion, EstadoMascota } from '@prisma/client';
import { MailerService } from 'src/shared/email/email-server.service';
import { Response } from 'express';
import axios from 'axios';

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

    const [mascotasActivas, casosPublicados] = await Promise.all([
      this.prisma.mascota.count({
        where: {
          organizacionId: id,
          estado: { in: [EstadoMascota.EN_ADOPCION, EstadoMascota.EN_TRANSITO] },
        },
      }),
      this.prisma.caso.count({
        where: { ongId: id },
      }),
    ]);

    const { estado, ...datosPublicos } = organizacion;

    return {
      ...datosPublicos,
      mascotasActivas,
      casosPublicados,
    };
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
