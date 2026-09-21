import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OtorgarInsigniaDto } from './dto/otorgar-insignia.dto';

const MIN_CARACTERES_BUSQUEDA = 3;
const MAX_RESULTADOS_BUSQUEDA = 10;

const SELECT_USUARIO = {
  id: true,
  nombre: true,
  email: true,
  imagenPerfil: true,
  ciudad: true,
} as const;

@Injectable()
export class InsigniasService {
  constructor(private readonly prisma: PrismaService) {}

  async buscarUsuarios(q?: string) {
    const termino = q?.trim() ?? '';

    if (termino.length < MIN_CARACTERES_BUSQUEDA) {
      throw new BadRequestException(
        `La búsqueda requiere al menos ${MIN_CARACTERES_BUSQUEDA} caracteres.`,
      );
    }

    return this.prisma.usuario.findMany({
      where: {
        OR: [
          { nombre: { contains: termino, mode: 'insensitive' } },
          { email: { contains: termino, mode: 'insensitive' } },
        ],
      },
      select: SELECT_USUARIO,
      orderBy: { nombre: 'asc' },
      take: MAX_RESULTADOS_BUSQUEDA,
    });
  }

  async otorgar(organizacionId: string, dto: OtorgarInsigniaDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: dto.usuarioId },
      select: { id: true },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const insignia = await this.prisma.insigniaUsuario.upsert({
      where: {
        usuarioId_organizacionId_tipo: {
          usuarioId: dto.usuarioId,
          organizacionId,
          tipo: dto.tipo,
        },
      },
      update: {},
      create: {
        usuarioId: dto.usuarioId,
        organizacionId,
        tipo: dto.tipo,
      },
      include: { usuario: { select: SELECT_USUARIO } },
    });

    return {
      ok: true,
      mensaje: 'Insignia otorgada exitosamente',
      insignia,
    };
  }

  async revocar(organizacionId: string, id: string) {
    const insignia = await this.prisma.insigniaUsuario.findUnique({
      where: { id },
    });

    if (!insignia) {
      throw new NotFoundException('Insignia no encontrada.');
    }

    if (insignia.organizacionId !== organizacionId) {
      throw new ForbiddenException('No puedes revocar una insignia de otra organización.');
    }

    await this.prisma.insigniaUsuario.delete({ where: { id } });

    return {
      ok: true,
      mensaje: 'Insignia revocada correctamente',
    };
  }

  async listarDeOng(organizacionId: string) {
    return this.prisma.insigniaUsuario.findMany({
      where: { organizacionId },
      orderBy: { otorgada_en: 'desc' },
      include: { usuario: { select: SELECT_USUARIO } },
    });
  }
}
