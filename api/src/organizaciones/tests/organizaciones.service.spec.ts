import { Test, TestingModule } from '@nestjs/testing';
import { OrganizacionesService } from '../organizaciones.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailerService } from 'src/shared/email/email-server.service';
import { EstadoOrganizacion } from '@prisma/client';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('OrganizacionesService', () => {
  let service: OrganizacionesService;
  let prisma: PrismaService;
  let mailerService: MailerService;

  const mockPrisma = {
    organizacion: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    mascota: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    caso: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    reconocimientoOng: {
      count: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockMailerService = {
    enviarEstadoActualizado: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizacionesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MailerService, useValue: mockMailerService },
      ],
    }).compile();

    service = module.get<OrganizacionesService>(OrganizacionesService);
    prisma = module.get<PrismaService>(PrismaService);
    mailerService = module.get<MailerService>(MailerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('actualizarFotoPerfil', () => {
    it('debería actualizar la foto de perfil', async () => {
      const resultMock = {
        id: '1',
        nombre: 'Refugio',
        email: 'test@test.com',
        imagenPerfil: 'url.com',
        plan: 'GRATIS',
        creado_en: new Date(),
      };

      mockPrisma.organizacion.update.mockResolvedValue(resultMock);

      const result = await service.actualizarFotoPerfil('1', 'url.com');

      expect(mockPrisma.organizacion.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { imagenPerfil: 'url.com' },
        select: expect.any(Object),
      });
      expect(result).toEqual(resultMock);
    });
  });

  describe('buscarPorId', () => {
    it('debería devolver una organización existente', async () => {
      const organizacionMock = { id: '1', nombre: 'Refugio' };
      mockPrisma.organizacion.findUnique.mockResolvedValue(organizacionMock);

      const result = await service.buscarPorId('1');
      expect(result).toEqual(organizacionMock);
    });

    it('debería lanzar NotFoundException si no existe', async () => {
      mockPrisma.organizacion.findUnique.mockResolvedValue(null);
      await expect(service.buscarPorId('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('actualizarDatosOng', () => {
    it('debería actualizar los datos si existe', async () => {
      const datos = { nombre: 'Nuevo Refugio' };
      const id = '1';

      mockPrisma.organizacion.findUnique.mockResolvedValue({ id });
      mockPrisma.organizacion.update.mockResolvedValue({
        ...datos,
        id,
        creado_en: new Date(),
      });

      const result = await service.actualizarDatosOng(id, datos as any);
      expect(result.nombre).toEqual(datos.nombre);
    });

    it('debería lanzar error si no existe la organización', async () => {
      mockPrisma.organizacion.findUnique.mockResolvedValue(null);
      await expect(
        service.actualizarDatosOng('123', {} as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('actualizarEstado', () => {
    it('debería actualizar el estado y enviar email', async () => {
      const org = { id: '1', email: 'test@test.com' };

      mockPrisma.organizacion.findUnique.mockResolvedValue(org);
      mockPrisma.organizacion.update.mockResolvedValue({
        ...org,
        estado: EstadoOrganizacion.APROBADA,
      });

      const result = await service.actualizarEstado('1', EstadoOrganizacion.APROBADA);

      expect(mockPrisma.organizacion.update).toHaveBeenCalled();
      expect(mailerService.enviarEstadoActualizado).toHaveBeenCalledWith(
        'test@test.com',
        'ACEPTADA',
      );
      expect(result.ok).toBe(true);
    });

    it('debería lanzar NotFoundException si no encuentra la organización', async () => {
      mockPrisma.organizacion.findUnique.mockResolvedValue(null);
      await expect(
        service.actualizarEstado('fake-id', EstadoOrganizacion.RECHAZADA),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('obtenerPerfilPublico', () => {
    const orgAprobada = {
      id: '1',
      nombre: 'Refugio',
      descripcion: 'Descripción',
      ciudad: 'CABA',
      pais: 'Argentina',
      imagenPerfil: 'url.com',
      creado_en: new Date(),
      estado: EstadoOrganizacion.APROBADA,
    };

    it('debería devolver el perfil público con contadores si la ONG está aprobada', async () => {
      mockPrisma.organizacion.findUnique.mockResolvedValue(orgAprobada);
      mockPrisma.mascota.count.mockResolvedValue(3);
      mockPrisma.caso.count.mockResolvedValue(5);
      mockPrisma.reconocimientoOng.count.mockResolvedValue(7);

      const result = await service.obtenerPerfilPublico('1');

      expect(result).toEqual({
        id: '1',
        nombre: 'Refugio',
        descripcion: 'Descripción',
        ciudad: 'CABA',
        pais: 'Argentina',
        imagenPerfil: 'url.com',
        creado_en: orgAprobada.creado_en,
        mascotasActivas: 3,
        casosPublicados: 5,
        totalReconocimientos: 7,
      });
      expect(mockPrisma.reconocimientoOng.count).toHaveBeenCalledWith({
        where: { organizacionId: '1', revocado_en: null },
      });
    });

    it('debería lanzar NotFoundException si la organización no existe', async () => {
      mockPrisma.organizacion.findUnique.mockResolvedValue(null);
      await expect(service.obtenerPerfilPublico('fake-id')).rejects.toThrow(NotFoundException);
    });

    it('debería lanzar NotFoundException si la organización no está aprobada', async () => {
      mockPrisma.organizacion.findUnique.mockResolvedValue({
        ...orgAprobada,
        estado: EstadoOrganizacion.PENDIENTE,
      });
      await expect(service.obtenerPerfilPublico('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('obtenerTimeline', () => {
    it('debería devolver los casos paginados de la ONG', async () => {
      mockPrisma.organizacion.findUnique.mockResolvedValue({ estado: EstadoOrganizacion.APROBADA });
      mockPrisma.caso.findMany.mockResolvedValue([{ id: 'caso-1' }]);
      mockPrisma.caso.count.mockResolvedValue(1);

      const result = await service.obtenerTimeline('1', 1, 10);

      expect(mockPrisma.caso.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ongId: '1' },
          orderBy: { creado_en: 'desc' },
          skip: 0,
          take: 10,
        }),
      );
      expect(result).toEqual({ data: [{ id: 'caso-1' }], total: 1, page: 1, limit: 10 });
    });

    it('debería lanzar NotFoundException si la organización no está aprobada', async () => {
      mockPrisma.organizacion.findUnique.mockResolvedValue(null);
      await expect(service.obtenerTimeline('fake-id', 1, 10)).rejects.toThrow(NotFoundException);
    });
  });

  describe('obtenerCasosCerrados', () => {
    it('debería devolver los casos cerrados paginados', async () => {
      mockPrisma.organizacion.findUnique.mockResolvedValue({ estado: EstadoOrganizacion.APROBADA });
      mockPrisma.caso.findMany.mockResolvedValue([{ id: 'caso-cerrado-1' }]);
      mockPrisma.caso.count.mockResolvedValue(1);

      const result = await service.obtenerCasosCerrados('1', 1, 10);

      expect(mockPrisma.caso.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ongId: '1' }),
          orderBy: { creado_en: 'desc' },
          skip: 0,
          take: 10,
        }),
      );
      expect(result).toEqual({ data: [{ id: 'caso-cerrado-1' }], total: 1, page: 1, limit: 10 });
    });

    it('debería filtrar por motivo de adopción', async () => {
      mockPrisma.organizacion.findUnique.mockResolvedValue({ estado: EstadoOrganizacion.APROBADA });
      mockPrisma.caso.findMany.mockResolvedValue([]);
      mockPrisma.caso.count.mockResolvedValue(0);

      await service.obtenerCasosCerrados('1', 1, 10, 'ADOPCION');

      expect(mockPrisma.caso.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ongId: '1',
            OR: expect.arrayContaining([
              expect.objectContaining({ adopcion: { estado: 'ACEPTADA' } }),
            ]),
          }),
        }),
      );
    });

    it('debería lanzar NotFoundException si la organización no existe o no está aprobada', async () => {
      mockPrisma.organizacion.findUnique.mockResolvedValue(null);
      await expect(service.obtenerCasosCerrados('fake-id', 1, 10)).rejects.toThrow(NotFoundException);
    });
  });

  describe('obtenerMascotas', () => {
    it('debería devolver las mascotas paginadas de la ONG filtradas por estado', async () => {
      mockPrisma.organizacion.findUnique.mockResolvedValue({ estado: EstadoOrganizacion.APROBADA });
      mockPrisma.mascota.findMany.mockResolvedValue([{ id: 'mascota-1' }]);
      mockPrisma.mascota.count.mockResolvedValue(1);

      const result = await service.obtenerMascotas('1', 'EN_ADOPCION' as any, 1, 12);

      expect(mockPrisma.mascota.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizacionId: '1', estado: 'EN_ADOPCION' },
          skip: 0,
          take: 12,
        }),
      );
      expect(result).toEqual({ data: [{ id: 'mascota-1' }], total: 1, page: 1, limit: 12 });
    });

    it('debería lanzar NotFoundException si la organización no está aprobada', async () => {
      mockPrisma.organizacion.findUnique.mockResolvedValue({ estado: EstadoOrganizacion.RECHAZADA });
      await expect(service.obtenerMascotas('1', undefined, 1, 12)).rejects.toThrow(NotFoundException);
    });
  });

  describe('listarTodas', () => {
    it('debería devolver todas las organizaciones pendientes', async () => {
      mockPrisma.organizacion.findMany.mockResolvedValue([
        { id: '1', nombre: 'Refugio' },
      ]);

      const result = await service.listarTodas({});
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('contarAprobadas', () => {
    it('debería devolver el total de aprobadas', async () => {
      mockPrisma.organizacion.count.mockResolvedValue(5);

      const result = await service.contarAprobadas();
      expect(result).toEqual({ total: 5 });
    });
  });

  describe('buscarPorEmail', () => {
    it('debería devolver una organización por email', async () => {
      const mockOrg = { id: '1', email: 'ong@email.com' };
      mockPrisma.organizacion.findUnique.mockResolvedValue(mockOrg);

      const result = await service.buscarPorEmail('ong@email.com');
      expect(result).toEqual(mockOrg);
    });
  });

  describe('otorgarReconocimiento', () => {
    const usuarioAutor = { id: 'u-1', tipo: 'USUARIO' };
    const ongAutora = { id: 'ong-2', tipo: 'ONG' };

    it('rechaza que una ONG se reconozca a sí misma', async () => {
      await expect(
        service.otorgarReconocimiento('ong-2', ongAutora, {}),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.organizacion.findUnique).not.toHaveBeenCalled();
    });

    it('lanza 404 si la organización no existe o no está aprobada', async () => {
      mockPrisma.organizacion.findUnique.mockResolvedValue(null);

      await expect(
        service.otorgarReconocimiento('ong-1', usuarioAutor, {}),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.reconocimientoOng.upsert).not.toHaveBeenCalled();
    });

    it('otorga el reconocimiento cuando el autor es un usuario', async () => {
      mockPrisma.organizacion.findUnique.mockResolvedValue({ estado: EstadoOrganizacion.APROBADA });

      await service.otorgarReconocimiento('ong-1', usuarioAutor, { mensaje: 'Genial' });

      expect(mockPrisma.reconocimientoOng.upsert).toHaveBeenCalledWith({
        where: { organizacionId_autorUsuarioId: { organizacionId: 'ong-1', autorUsuarioId: 'u-1' } },
        update: { mensaje: 'Genial', revocado_en: null, motivoRevocacion: null },
        create: { organizacionId: 'ong-1', mensaje: 'Genial', autorUsuarioId: 'u-1' },
      });
    });

    it('reactiva un reconocimiento previamente revocado', async () => {
      mockPrisma.organizacion.findUnique.mockResolvedValue({ estado: EstadoOrganizacion.APROBADA });
      mockPrisma.reconocimientoOng.upsert.mockResolvedValue({
        id: 'r-1',
        revocado_en: null,
        motivoRevocacion: null,
      });

      await service.otorgarReconocimiento('ong-1', usuarioAutor, {});

      const { update } = mockPrisma.reconocimientoOng.upsert.mock.calls[0][0];
      expect(update).toEqual({ mensaje: undefined, revocado_en: null, motivoRevocacion: null });
    });

    it('otorga el reconocimiento cuando el autor es otra ONG', async () => {
      mockPrisma.organizacion.findUnique.mockResolvedValue({ estado: EstadoOrganizacion.APROBADA });

      await service.otorgarReconocimiento('ong-1', ongAutora, {});

      expect(mockPrisma.reconocimientoOng.upsert).toHaveBeenCalledWith({
        where: { organizacionId_autorOrganizacionId: { organizacionId: 'ong-1', autorOrganizacionId: 'ong-2' } },
        update: { mensaje: undefined, revocado_en: null, motivoRevocacion: null },
        create: { organizacionId: 'ong-1', mensaje: undefined, autorOrganizacionId: 'ong-2' },
      });
    });
  });

  describe('revocarReconocimiento', () => {
    it('marca como revocado el reconocimiento del usuario autenticado, con el motivo', async () => {
      await service.revocarReconocimiento('ong-1', { id: 'u-1', tipo: 'USUARIO' }, { motivo: 'Cambié de opinión' });

      expect(mockPrisma.reconocimientoOng.updateMany).toHaveBeenCalledWith({
        where: { organizacionId: 'ong-1', autorUsuarioId: 'u-1', revocado_en: null },
        data: { revocado_en: expect.any(Date), motivoRevocacion: 'Cambié de opinión' },
      });
    });

    it('marca como revocado el reconocimiento de la ONG autenticada, sin motivo', async () => {
      await service.revocarReconocimiento('ong-1', { id: 'ong-2', tipo: 'ONG' }, {});

      expect(mockPrisma.reconocimientoOng.updateMany).toHaveBeenCalledWith({
        where: { organizacionId: 'ong-1', autorOrganizacionId: 'ong-2', revocado_en: null },
        data: { revocado_en: expect.any(Date), motivoRevocacion: undefined },
      });
    });
  });

  describe('miEstadoReconocimiento', () => {
    it('devuelve false si no hay visitante autenticado', async () => {
      const result = await service.miEstadoReconocimiento('ong-1', undefined);

      expect(result).toEqual({ yaReconocida: false });
      expect(mockPrisma.reconocimientoOng.findFirst).not.toHaveBeenCalled();
    });

    it('devuelve true si el autor ya reconoció a la organización', async () => {
      mockPrisma.reconocimientoOng.findFirst.mockResolvedValue({ id: 'r-1' });

      const result = await service.miEstadoReconocimiento('ong-1', { id: 'u-1', tipo: 'USUARIO' });

      expect(result).toEqual({ yaReconocida: true });
      expect(mockPrisma.reconocimientoOng.findFirst).toHaveBeenCalledWith({
        where: { organizacionId: 'ong-1', autorUsuarioId: 'u-1', revocado_en: null },
        select: { id: true },
      });
    });

    it('devuelve false si el autor no la reconoció', async () => {
      mockPrisma.reconocimientoOng.findFirst.mockResolvedValue(null);

      const result = await service.miEstadoReconocimiento('ong-1', { id: 'u-1', tipo: 'USUARIO' });

      expect(result).toEqual({ yaReconocida: false });
    });
  });

  describe('listarReconocimientosRecibidos', () => {
    it('mapea el autor usuario u organización y conserva mensaje y motivo', async () => {
      mockPrisma.reconocimientoOng.findMany.mockResolvedValue([
        {
          id: 'r-1',
          mensaje: 'Genial',
          creado_en: new Date('2026-01-01'),
          revocado_en: null,
          motivoRevocacion: null,
          autorUsuario: { id: 'u-1', nombre: 'Ana' },
          autorOrganizacion: null,
        },
        {
          id: 'r-2',
          mensaje: null,
          creado_en: new Date('2026-01-02'),
          revocado_en: new Date('2026-02-01'),
          motivoRevocacion: 'Ya no coincide con mis valores',
          autorUsuario: null,
          autorOrganizacion: { id: 'ong-9', nombre: 'Otra ONG' },
        },
      ]);

      const result = await service.listarReconocimientosRecibidos('ong-1');

      expect(mockPrisma.reconocimientoOng.findMany.mock.calls[0][0].where).toEqual({
        organizacionId: 'ong-1',
      });
      expect(result).toEqual([
        {
          id: 'r-1',
          mensaje: 'Genial',
          creado_en: new Date('2026-01-01'),
          revocado_en: null,
          motivoRevocacion: null,
          otorgadoPor: { tipo: 'USUARIO', id: 'u-1', nombre: 'Ana' },
        },
        {
          id: 'r-2',
          mensaje: null,
          creado_en: new Date('2026-01-02'),
          revocado_en: new Date('2026-02-01'),
          motivoRevocacion: 'Ya no coincide con mis valores',
          otorgadoPor: { tipo: 'ONG', id: 'ong-9', nombre: 'Otra ONG' },
        },
      ]);
    });
  });
});