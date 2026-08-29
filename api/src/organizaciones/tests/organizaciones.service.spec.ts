import { Test, TestingModule } from '@nestjs/testing';
import { OrganizacionesService } from '../organizaciones.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailerService } from 'src/shared/email/email-server.service';
import { EstadoOrganizacion } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

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
});