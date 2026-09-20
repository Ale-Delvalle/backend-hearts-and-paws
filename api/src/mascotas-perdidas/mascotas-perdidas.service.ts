import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CrearMascotaPerdidaDto } from './dto/crear-mascota-perdida.dto';
import { FiltroMascotasPerdidasDto } from './dto/filtro-mascotas-perdidas.dto';
import { ModerarMascotaPerdidaDto } from './dto/moderar-mascota-perdida.dto';
import { EstadoModeracion, EstadoPerdida, Prisma } from '@prisma/client';

const AUTOR_SELECT = {
  id: true,
  nombre: true,
  email: true,
  telefono: true,
  imagenPerfil: true,
} as const;

const INCLUDE_AUTOR = {
  usuario: { select: AUTOR_SELECT },
  organizacion: { select: AUTOR_SELECT },
} as const;

@Injectable()
export class MascotasPerdidasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async obtenerTodas(filtros: FiltroMascotasPerdidasDto) {
    const page = Math.max(1, parseInt(filtros.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(filtros.limit || '12', 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.MascotaPerdidaWhereInput = {
      moderacion: EstadoModeracion.APROBADA,
    };

    if (filtros.estado) {
      where.estado = filtros.estado as EstadoPerdida;
    }

    if (filtros.tipo && filtros.tipo.trim() !== '') {
      where.tipo = {
        equals: filtros.tipo.trim(),
        mode: 'insensitive',
      };
    }

    if (filtros.ciudad && filtros.ciudad.trim() !== '') {
      where.ciudad = {
        contains: filtros.ciudad.trim(),
        mode: 'insensitive',
      };
    }

    if (filtros.search && filtros.search.trim() !== '') {
      const q = filtros.search.trim();
      where.OR = [
        { nombre: { contains: q, mode: 'insensitive' } },
        { descripcion: { contains: q, mode: 'insensitive' } },
        { ubicacion: { contains: q, mode: 'insensitive' } },
        { ciudad: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.mascotaPerdida.count({ where }),
      this.prisma.mascotaPerdida.findMany({
        where,
        skip,
        take: limit,
        orderBy: { creado_en: 'desc' },
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              email: true,
              telefono: true,
              imagenPerfil: true,
            },
          },
          organizacion: {
            select: {
              id: true,
              nombre: true,
              email: true,
              telefono: true,
              imagenPerfil: true,
            },
          },
        },
      }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    };
  }

  async obtenerPorId(id: string, user?: { id: string; tipo: string; rol?: string }) {
    const mascotaPerdida = await this.prisma.mascotaPerdida.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            imagenPerfil: true,
          },
        },
        organizacion: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            imagenPerfil: true,
          },
        },
      },
    });

    if (!mascotaPerdida) {
      throw new NotFoundException('Publicación de mascota perdida no encontrada.');
    }

    if (mascotaPerdida.moderacion !== EstadoModeracion.APROBADA) {
      const puedeVer =
        user?.rol === 'ADMIN' ||
        (user?.tipo === 'USUARIO' && mascotaPerdida.usuarioId === user.id) ||
        (user?.tipo === 'ONG' && mascotaPerdida.organizacionId === user.id);

      if (!puedeVer) {
        throw new NotFoundException('Publicación de mascota perdida no encontrada.');
      }
    }

    return mascotaPerdida;
  }

  async crear(
    dto: CrearMascotaPerdidaDto,
    archivo: Express.Multer.File | undefined,
    user: { id: string; tipo: string; email: string; rol?: string },
  ) {
    let imagenUrl: string | null = null;

    if (archivo) {
      try {
        const uploadResult = await this.cloudinary.subirIamgen(archivo);
        imagenUrl = uploadResult.secure_url;
      } catch (error: any) {
        console.error('Error al subir imagen de mascota perdida:', error);
        throw new InternalServerErrorException(
          'Error al procesar la imagen: ' + (error.message || 'Error desconocido'),
        );
      }
    }

    let fechaPerdido = new Date();
    if (dto.fechaPerdido) {
      const parsed = new Date(dto.fechaPerdido);
      if (!isNaN(parsed.getTime())) {
        fechaPerdido = parsed;
      }
    }

    const estadoInicial = (dto.estado as EstadoPerdida) || EstadoPerdida.PERDIDO;
    const esAdmin = user.rol === 'ADMIN';

    const nuevaPublicacion = await this.prisma.mascotaPerdida.create({
      data: {
        nombre: dto.nombre,
        tipo: dto.tipo,
        descripcion: dto.descripcion,
        ubicacion: dto.ubicacion,
        ciudad: dto.ciudad || null,
        contacto: dto.contacto,
        recompensa: dto.recompensa || null,
        estado: estadoInicial,
        moderacion: esAdmin ? EstadoModeracion.APROBADA : EstadoModeracion.PENDIENTE,
        fechaPerdido,
        imagenUrl,
        usuarioId: user.tipo === 'USUARIO' ? user.id : null,
        organizacionId: user.tipo === 'ONG' ? user.id : null,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            imagenPerfil: true,
          },
        },
        organizacion: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            imagenPerfil: true,
          },
        },
      },
    });

    return {
      ok: true,
      mensaje: esAdmin
        ? 'Publicación creada exitosamente'
        : 'Publicación creada. Quedará visible cuando un administrador la apruebe',
      publicacion: nuevaPublicacion,
    };
  }

  async obtenerPendientes(filtros: FiltroMascotasPerdidasDto) {
    const page = Math.max(1, parseInt(filtros.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(filtros.limit || '12', 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.MascotaPerdidaWhereInput = {
      moderacion: EstadoModeracion.PENDIENTE,
    };

    const [total, data] = await Promise.all([
      this.prisma.mascotaPerdida.count({ where }),
      this.prisma.mascotaPerdida.findMany({
        where,
        skip,
        take: limit,
        orderBy: { creado_en: 'asc' },
        include: INCLUDE_AUTOR,
      }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    };
  }

  async moderar(id: string, dto: ModerarMascotaPerdidaDto) {
    const publicacion = await this.prisma.mascotaPerdida.findUnique({
      where: { id },
    });

    if (!publicacion) {
      throw new NotFoundException('Publicación no encontrada.');
    }

    const actualizada = await this.prisma.mascotaPerdida.update({
      where: { id },
      data: { moderacion: dto.moderacion as EstadoModeracion },
      include: INCLUDE_AUTOR,
    });

    return {
      ok: true,
      mensaje:
        dto.moderacion === 'APROBADA'
          ? 'Publicación aprobada exitosamente'
          : 'Publicación rechazada exitosamente',
      publicacion: actualizada,
    };
  }

  async obtenerMias(user: { id: string; tipo: string }) {
    return this.prisma.mascotaPerdida.findMany({
      where:
        user.tipo === 'ONG'
          ? { organizacionId: user.id }
          : { usuarioId: user.id },
      orderBy: { creado_en: 'desc' },
      include: INCLUDE_AUTOR,
    });
  }

  async actualizarEstado(
    id: string,
    estado: EstadoPerdida,
    user: { id: string; tipo: string; rol?: string },
  ) {
    const publicacion = await this.prisma.mascotaPerdida.findUnique({
      where: { id },
    });

    if (!publicacion) {
      throw new NotFoundException('Publicación no encontrada.');
    }

    const esAutor =
      (user.tipo === 'USUARIO' && publicacion.usuarioId === user.id) ||
      (user.tipo === 'ONG' && publicacion.organizacionId === user.id) ||
      user.rol === 'ADMIN';

    if (!esAutor) {
      throw new ForbiddenException('No tienes permisos para modificar esta publicación.');
    }

    const actualizada = await this.prisma.mascotaPerdida.update({
      where: { id },
      data: { estado },
    });

    return {
      ok: true,
      mensaje: 'Estado de la publicación actualizado exitosamente',
      publicacion: actualizada,
    };
  }

  async eliminar(id: string, user: { id: string; tipo: string; rol?: string }) {
    const publicacion = await this.prisma.mascotaPerdida.findUnique({
      where: { id },
    });

    if (!publicacion) {
      throw new NotFoundException('Publicación no encontrada.');
    }

    const esAutor =
      (user.tipo === 'USUARIO' && publicacion.usuarioId === user.id) ||
      (user.tipo === 'ONG' && publicacion.organizacionId === user.id) ||
      user.rol === 'ADMIN';

    if (!esAutor) {
      throw new ForbiddenException('No tienes permisos para eliminar esta publicación.');
    }

    await this.prisma.mascotaPerdida.delete({
      where: { id },
    });

    return {
      ok: true,
      mensaje: 'Publicación eliminada correctamente',
    };
  }
}
