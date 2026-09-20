import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MascotasPerdidasService } from './mascotas-perdidas.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { prismaMock } from 'src/test/mocks/prisma.mock';

describe('MascotasPerdidasService', () => {
  let service: MascotasPerdidasService;
  const mp = prismaMock.mascotaPerdida as any;

  const dto = {
    nombre: 'Milo',
    tipo: 'Perro',
    descripcion: 'Se perdió cerca de la plaza',
    ubicacion: 'Calle 50',
    contacto: '+54 9 221 456-7890',
  };

  const usuario = { id: 'u-1', tipo: 'USUARIO', email: 'u@test.com', rol: 'USUARIO' };
  const admin = { id: 'a-1', tipo: 'USUARIO', email: 'a@test.com', rol: 'ADMIN' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MascotasPerdidasService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: CloudinaryService, useValue: { subirIamgen: jest.fn() } },
      ],
    }).compile();
    service = module.get(MascotasPerdidasService);
  });

  describe('crear', () => {
    it('deja la publicación PENDIENTE si el autor no es admin', async () => {
      mp.create.mockResolvedValue({ id: 'p-1' });

      const res = await service.crear(dto as any, undefined, usuario);

      expect(mp.create.mock.calls[0][0].data.moderacion).toBe('PENDIENTE');
      expect(res.mensaje).toContain('administrador');
    });

    it('aprueba automáticamente si el autor es admin', async () => {
      mp.create.mockResolvedValue({ id: 'p-1' });

      await service.crear(dto as any, undefined, admin);

      expect(mp.create.mock.calls[0][0].data.moderacion).toBe('APROBADA');
    });
  });

  describe('obtenerTodas', () => {
    it('filtra solo publicaciones APROBADA', async () => {
      mp.count.mockResolvedValue(0);
      mp.findMany.mockResolvedValue([]);

      await service.obtenerTodas({});

      expect(mp.findMany.mock.calls[0][0].where.moderacion).toBe('APROBADA');
      expect(mp.count.mock.calls[0][0].where.moderacion).toBe('APROBADA');
    });
  });

  describe('obtenerPorId', () => {
    const pendiente = { id: 'p-1', moderacion: 'PENDIENTE', usuarioId: 'u-1', organizacionId: null };

    it('devuelve una publicación aprobada a cualquiera', async () => {
      mp.findUnique.mockResolvedValue({ ...pendiente, moderacion: 'APROBADA' });

      await expect(service.obtenerPorId('p-1')).resolves.toBeDefined();
    });

    it('oculta una pendiente al público', async () => {
      mp.findUnique.mockResolvedValue(pendiente);

      await expect(service.obtenerPorId('p-1')).rejects.toThrow(NotFoundException);
    });

    it('oculta una pendiente a otro usuario', async () => {
      mp.findUnique.mockResolvedValue(pendiente);

      await expect(
        service.obtenerPorId('p-1', { id: 'u-2', tipo: 'USUARIO', rol: 'USUARIO' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('permite a su autor ver una pendiente', async () => {
      mp.findUnique.mockResolvedValue(pendiente);

      await expect(service.obtenerPorId('p-1', usuario)).resolves.toBeDefined();
    });

    it('permite a un admin ver una pendiente', async () => {
      mp.findUnique.mockResolvedValue(pendiente);

      await expect(service.obtenerPorId('p-1', admin)).resolves.toBeDefined();
    });

    it('lanza 404 si no existe', async () => {
      mp.findUnique.mockResolvedValue(null);

      await expect(service.obtenerPorId('x', admin)).rejects.toThrow(NotFoundException);
    });
  });

  describe('obtenerPendientes', () => {
    it('lista solo las PENDIENTE con paginación', async () => {
      mp.count.mockResolvedValue(25);
      mp.findMany.mockResolvedValue([]);

      const res = await service.obtenerPendientes({ page: '2', limit: '10' });

      expect(mp.findMany.mock.calls[0][0]).toMatchObject({
        where: { moderacion: 'PENDIENTE' },
        skip: 10,
        take: 10,
      });
      expect(res.totalPages).toBe(3);
    });
  });

  describe('moderar', () => {
    it('aprueba una publicación', async () => {
      mp.findUnique.mockResolvedValue({ id: 'p-1' });
      mp.update.mockResolvedValue({ id: 'p-1', moderacion: 'APROBADA' });

      const res = await service.moderar('p-1', { moderacion: 'APROBADA' });

      expect(mp.update.mock.calls[0][0].data).toEqual({ moderacion: 'APROBADA' });
      expect(res.mensaje).toContain('aprobada');
    });

    it('rechaza una publicación', async () => {
      mp.findUnique.mockResolvedValue({ id: 'p-1' });
      mp.update.mockResolvedValue({ id: 'p-1', moderacion: 'RECHAZADA' });

      const res = await service.moderar('p-1', { moderacion: 'RECHAZADA' });

      expect(res.mensaje).toContain('rechazada');
    });

    it('lanza 404 si no existe', async () => {
      mp.findUnique.mockResolvedValue(null);

      await expect(service.moderar('x', { moderacion: 'APROBADA' })).rejects.toThrow(
        NotFoundException,
      );
      expect(mp.update).not.toHaveBeenCalled();
    });
  });

  describe('obtenerMias', () => {
    it('filtra por usuarioId para usuarios', async () => {
      mp.findMany.mockResolvedValue([]);

      await service.obtenerMias(usuario);

      expect(mp.findMany.mock.calls[0][0].where).toEqual({ usuarioId: 'u-1' });
    });

    it('filtra por organizacionId para ONG', async () => {
      mp.findMany.mockResolvedValue([]);

      await service.obtenerMias({ id: 'o-1', tipo: 'ONG' });

      expect(mp.findMany.mock.calls[0][0].where).toEqual({ organizacionId: 'o-1' });
    });
  });
});
