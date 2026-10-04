// solicitud-adoptar.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { SolicitudAdoptarService } from '../solicitud-adoptar.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailerService } from 'src/shared/email/email-server.service';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { EstadoAdopcion } from '@prisma/client';

describe('SolicitudAdoptarService', () => {
  let service: SolicitudAdoptarService;
  let prisma: any;
  let mailer: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SolicitudAdoptarService,
        {
          provide: PrismaService,
          useValue: {
            usuario: { findUnique: jest.fn() },
            solicitudDeAdopcion: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              delete: jest.fn(),
              findFirst: jest.fn(),
            },
            casoAdopcion: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            mascota: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: MailerService,
          useValue: {
            enviarEmailsNotificacionAdopcion: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SolicitudAdoptarService>(SolicitudAdoptarService);
    prisma = module.get<PrismaService>(PrismaService);
    mailer = module.get<MailerService>(MailerService);
  });

  // crearSolicitud()
  describe('crearSolicitud', () => {
    const usuarioId = 'user-uuid';
    const dto = {
      casoAdopcionId: 'caso-uuid',
      tipoVivienda: 'casa',
      integrantesFlia: 2,
      hijos: 1,
      hayOtrasMascotas: 1,
      descripcionOtrasMascotas: 'Un gato',
      cubrirGastos: 'Sí',
      darAlimentoCuidados: 'Sí',
      darAmorTiempoEj: 'Sí',
      devolucionDeMascota: 'No',
      siNoPodesCuidarla: 'La devuelvo',
      declaracionFinal: 'Sí',
    };

    it('debe crear una solicitud correctamente', async () => {
      (prisma.usuario.findUnique as jest.Mock).mockResolvedValueOnce({ id: usuarioId });
      (prisma.solicitudDeAdopcion.create as jest.Mock).mockResolvedValueOnce({ id: 'solicitud-id', ...dto });

      const result = await service.crearSolicitud(usuarioId, dto);

      expect(result).toEqual({ id: 'solicitud-id', ...dto });
    });

    it('lanza BadRequestException si no hay usuario', async () => {
      (prisma.usuario.findUnique as jest.Mock).mockResolvedValueOnce(null);
      await expect(service.crearSolicitud(usuarioId, dto)).rejects.toThrow(BadRequestException);
    });
  });

  // verCasosAdopcionPorEstado()
  describe('verCasosAdopcionPorEstado', () => {
    it('debe devolver casos con solicitudes filtradas por estado', async () => {
      (prisma.casoAdopcion.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: 'caso-1',
          solicitudes: [{ id: 'sol-1', estado: EstadoAdopcion.ACEPTADA }],
        },
      ]);

      const result = await service.verCasosAdopcionPorEstado(EstadoAdopcion.ACEPTADA);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  // obtenerMascotasConAdopcionPorOng()
  describe('obtenerMascotasConAdopcionPorOng', () => {
    it('debe retornar mascotas de la ONG con casos de adopción', async () => {
      (prisma.mascota.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: 'mascota-1',
          casos: [{ tipo: 'ADOPCION', adopcion: { id: 'adopcion-1' } }],
        },
      ]);

      const result = await service.obtenerMascotasConAdopcionPorOng('ong-id');
      expect(result).toHaveLength(1);
    });
  });

  // filtroViviendaQdeMascotas()
  describe('filtroViviendaQdeMascotas', () => {
    it('debe devolver solicitudes filtradas y ordenadas', async () => {
      (prisma.solicitudDeAdopcion.findMany as jest.Mock).mockResolvedValueOnce([
        { id: 'sol-1', hayOtrasMascotas: 0 },
        { id: 'sol-2', hayOtrasMascotas: 2 },
      ]);

      const result = await service.filtroViviendaQdeMascotas('caso-id', 'casa');
      expect(result).toHaveLength(2);
      expect(result[0].hayOtrasMascotas).toBeLessThanOrEqual(result[1].hayOtrasMascotas);
    });
  });

  // verSolicitudesPorCasoDeAdopcion()
  describe('verSolicitudesPorCasoDeAdopcion', () => {
    it('debe devolver solicitudes organizadas por mascota', async () => {
      (prisma.mascota.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: 'mascota-1',
          nombre: 'Luna',
          edad: 2,
          descripcion: 'tierna',
          imagenes: [],
          casos: [
            {
              adopcion: {
                solicitudes: [
                  {
                    id: 'sol-1',
                    usuario: {
                      id: 'u1',
                      nombre: 'Ana',
                      email: 'ana@example.com',
                    },
                  },
                ],
              },
            },
          ],
        },
      ]);

      const result = await service.verSolicitudesPorCasoDeAdopcion('ong-id');
      expect(result[0].mascota.nombre).toBe('Luna');
    });
  });

  // aceptarSolicitud()
  describe('aceptarSolicitud', () => {
    const idCaso = 'caso-id';
    const idSolicitud = 'solicitud-id';
    const ongId = 'ong-uuid';

    it('debe aceptar una solicitud correctamente', async () => {
      (prisma.casoAdopcion.findUnique as jest.Mock).mockResolvedValueOnce({
        id: idCaso,
        caso: { ongId, mascotaId: 'mascota-id' },
      });

      (prisma.solicitudDeAdopcion.findUnique as jest.Mock).mockResolvedValueOnce({
        estado: 'PENDIENTE',
      });

      (prisma.solicitudDeAdopcion.findMany as jest.Mock).mockResolvedValueOnce([
        { id: idSolicitud, usuario: { email: 'aceptado@example.com' } },
        { id: 'otra-sol', usuario: { email: 'rechazado@example.com' } },
      ]);

      (prisma.mascota.findUnique as jest.Mock).mockResolvedValueOnce({
        nombre: 'Luna',
      });

      const result = await service.aceptarSolicitud(idCaso, idSolicitud, EstadoAdopcion.ACEPTADA, ongId);

      expect(result).toEqual({
        message: 'Solicitud aceptada correctamente y otras rechazadas.',
      });
    });

    it('lanza Unauthorized si la ONG no es la dueña del caso', async () => {
      (prisma.casoAdopcion.findUnique as jest.Mock).mockResolvedValueOnce({
        caso: { ongId: 'otra-ong' },
      });

      await expect(
        service.aceptarSolicitud(idCaso, idSolicitud, EstadoAdopcion.ACEPTADA, ongId)
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza BadRequest si el estado es diferente de ACEPTADA', async () => {
      (prisma.casoAdopcion.findUnique as jest.Mock).mockResolvedValueOnce({
        caso: { ongId },
      });

      await expect(
        service.aceptarSolicitud(idCaso, idSolicitud, EstadoAdopcion.RECHAZADA, ongId)
      ).rejects.toThrow(BadRequestException);
    });
  });

  // borrarSolicitud()
  describe('borrarSolicitud', () => {
    it('debe borrar la solicitud correctamente', async () => {
      (prisma.solicitudDeAdopcion.delete as jest.Mock).mockResolvedValueOnce({ id: 'sol-123' });

      const result = await service.borrarSolicitud('sol-123');

      expect(result).toEqual({ mensaje: 'Solicitud borrada id: sol-123' });
    });
  });

  // contarAdopcionesAceptadas()
  describe('contarAdopcionesAceptadas', () => {
    it('debe devolver el total de adopciones aceptadas', async () => {
      (prisma.casoAdopcion.count as jest.Mock).mockResolvedValueOnce(5);

      const result = await service.contarAdopcionesAceptadas();

      expect(result).toEqual({ total: 5 });
    });
  });

  // existenciaDeSolicitud()
  describe('existenciaDeSolicitud', () => {
    it('debe devolver true si existe la solicitud', async () => {
      (prisma.solicitudDeAdopcion.findFirst as jest.Mock).mockResolvedValueOnce({ id: 'abc' });

      const result = await service.existenciaDeSolicitud('user-id', 'caso-id');
      expect(result).toBe(true);
    });

    it('debe devolver false si no existe', async () => {
      (prisma.solicitudDeAdopcion.findFirst as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.existenciaDeSolicitud('user-id', 'caso-id');
      expect(result).toBe(false);
    });
  });

  describe('obtenerResumenMisSolicitudes', () => {
    it('devuelve mascotaId, casoAdopcionId y estado solo del usuario indicado', async () => {
      prisma.solicitudDeAdopcion.findMany.mockResolvedValue([
        {
          casoAdopcionId: 'ca-1',
          estado: 'PENDIENTE',
          casoAdopcion: { caso: { mascotaId: 'masc-1' } },
        },
      ]);

      const result = await service.obtenerResumenMisSolicitudes('user-1');

      expect(prisma.solicitudDeAdopcion.findMany).toHaveBeenCalledWith({
        where: { usuarioId: 'user-1' },
        select: {
          casoAdopcionId: true,
          estado: true,
          casoAdopcion: { select: { caso: { select: { mascotaId: true } } } },
        },
      });
      expect(result).toEqual([
        { casoAdopcionId: 'ca-1', mascotaId: 'masc-1', estado: 'PENDIENTE' },
      ]);
    });

    it('devuelve una lista vacía si el usuario no tiene solicitudes', async () => {
      prisma.solicitudDeAdopcion.findMany.mockResolvedValue([]);

      const result = await service.obtenerResumenMisSolicitudes('user-1');

      expect(result).toEqual([]);
    });
  });
});
