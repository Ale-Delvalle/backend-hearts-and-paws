import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InsigniasService } from './insignias.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { prismaMock } from 'src/test/mocks/prisma.mock';

describe('InsigniasService', () => {
  let service: InsigniasService;
  const usuarioDb = prismaMock.usuario as any;
  const insigniaDb = prismaMock.insigniaUsuario as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [InsigniasService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get(InsigniasService);
  });

  describe('buscarUsuarios', () => {
    it.each([undefined, '', '  ', 'ab', ' a '])('rechaza la búsqueda %p por ser demasiado corta', async (q) => {
      await expect(service.buscarUsuarios(q)).rejects.toThrow(BadRequestException);
      expect(usuarioDb.findMany).not.toHaveBeenCalled();
    });

    it('busca por nombre o email, con máximo 10 resultados', async () => {
      usuarioDb.findMany.mockResolvedValue([]);

      await service.buscarUsuarios(' ana ');

      const args = usuarioDb.findMany.mock.calls[0][0];
      expect(args.take).toBe(10);
      expect(args.where.OR).toEqual([
        { nombre: { contains: 'ana', mode: 'insensitive' } },
        { email: { contains: 'ana', mode: 'insensitive' } },
      ]);
    });
  });

  describe('otorgar', () => {
    const dto = { usuarioId: 'u-1', tipo: 'TRANSITO' as const };

    it('otorga la insignia a un usuario existente', async () => {
      usuarioDb.findUnique.mockResolvedValue({ id: 'u-1' });
      insigniaDb.upsert.mockResolvedValue({ id: 'i-1', ...dto });

      const res = await service.otorgar('org-1', dto);

      expect(insigniaDb.upsert.mock.calls[0][0].where).toEqual({
        usuarioId_organizacionId_tipo: {
          usuarioId: 'u-1',
          organizacionId: 'org-1',
          tipo: 'TRANSITO',
        },
      });
      expect(insigniaDb.upsert.mock.calls[0][0].update).toEqual({});
      expect(res.ok).toBe(true);
    });

    it('lanza 404 si el usuario no existe', async () => {
      usuarioDb.findUnique.mockResolvedValue(null);

      await expect(service.otorgar('org-1', dto)).rejects.toThrow(NotFoundException);
      expect(insigniaDb.upsert).not.toHaveBeenCalled();
    });
  });

  describe('revocar', () => {
    it('revoca una insignia propia', async () => {
      insigniaDb.findUnique.mockResolvedValue({ id: 'i-1', organizacionId: 'org-1' });

      const res = await service.revocar('org-1', 'i-1');

      expect(insigniaDb.delete).toHaveBeenCalledWith({ where: { id: 'i-1' } });
      expect(res.ok).toBe(true);
    });

    it('lanza 403 si la insignia es de otra ONG', async () => {
      insigniaDb.findUnique.mockResolvedValue({ id: 'i-1', organizacionId: 'org-2' });

      await expect(service.revocar('org-1', 'i-1')).rejects.toThrow(ForbiddenException);
      expect(insigniaDb.delete).not.toHaveBeenCalled();
    });

    it('lanza 404 si no existe', async () => {
      insigniaDb.findUnique.mockResolvedValue(null);

      await expect(service.revocar('org-1', 'x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listarDeOng', () => {
    it('lista solo las insignias de la ONG', async () => {
      insigniaDb.findMany.mockResolvedValue([]);

      await service.listarDeOng('org-1');

      expect(insigniaDb.findMany.mock.calls[0][0].where).toEqual({ organizacionId: 'org-1' });
    });
  });
});
