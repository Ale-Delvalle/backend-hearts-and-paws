import { PrismaService } from 'src/prisma/prisma.service';
import { jest } from '@jest/globals';

export const prismaMock: jest.Mocked<PrismaService> = {
  usuario: {
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    findFirst: jest.fn(),
    findFirstOrThrow: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  } as any,

  solicitudDeAdopcion: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  } as any,

  casoAdopcion: {
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  } as any,

  mascota: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  } as any,

  mascotaPerdida: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  } as any,
} as unknown as jest.Mocked<PrismaService>;
