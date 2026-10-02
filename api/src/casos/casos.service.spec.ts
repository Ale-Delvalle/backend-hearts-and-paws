import { Test, TestingModule } from '@nestjs/testing';
import { CasosService } from './casos.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TipoCaso } from './dto/create-caso.dto';

describe('CasosService', () => {
  let service: CasosService;
  let prismaService: any;

  const mockCaso = {
    id: 'caso-1',
    titulo: 'Adopción de Firulais',
    descripcion: 'Perro necesita hogar',
    tipo: 'ADOPCION',
    mascotaId: 'mascota-1',
    ongId: 'ong-1',
    fechaCreacion: new Date(),
    fechaActualizacion: new Date(),
    mascota: {
      id: 'mascota-1',
      nombre: 'Firulais',
      tipo: { nombre: 'Perro' },
      imagenes: []
    },
    ong: {
      id: 'ong-1',
      nombre: 'ONG Rescate'
    },
    adopcion: {
      id: 'adopcion-1',
      estado: 'PENDIENTE'
    },
    donacion: null
  };

  const mockMascota = {
    id: 'mascota-1',
    nombre: 'Firulais',
    casos: [
      {
        id: 'caso-1',
        tipo: 'ADOPCION',
        adopcion: {
          id: 'adopcion-1',
          estado: 'PENDIENTE'
        }
      }
    ]
  };

  const mockCreateCasoDto = {
    titulo: 'Adopción de Firulais',
    descripcion: 'Perro necesita hogar',
    tipo: TipoCaso.ADOPCION,
    mascotaId: 'mascota-1'
  };

  const mockCreateCasoDonacionDto = {
    titulo: 'Donación para Firulais',
    descripcion: 'Necesita medicamentos',
    tipo: TipoCaso.DONACION,
    mascotaId: 'mascota-1',
    donacion: {
      metaDonacion: 1000
    }
  };

  beforeEach(async () => {
    const mockPrismaService = {
      caso: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      mascota: {
        findUnique: jest.fn(),
      },
      casoAdopcion: {
        create: jest.fn(),
      },
      casoDonacion: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CasosService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CasosService>(CasosService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('GetCasos', () => {
    it('should return all casos', async () => {
      const expectedCasos = [mockCaso];
      prismaService.caso.findMany.mockResolvedValue(expectedCasos);

      const result = await service.GetCasos();

      expect(result).toEqual(expectedCasos);
      expect(prismaService.caso.findMany).toHaveBeenCalledWith({
        include: {
          mascota: true,
          ong: true,
        }
      });
    });
  });

  describe('GetCasoById', () => {
    it('should return a caso by id', async () => {
      prismaService.caso.findUnique.mockResolvedValue(mockCaso);

      const result = await service.GetCasoById('caso-1');

      expect(result).toEqual(mockCaso);
      expect(prismaService.caso.findUnique).toHaveBeenCalledWith({
        where: { id: 'caso-1' },
        include: {
          mascota: true,
          ong: true,
        },
      });
    });
  });

  describe('GetCasosAdopcion', () => {
    it('should return adoption cases', async () => {
      const expectedCasos = [mockCaso];
      prismaService.caso.findMany.mockResolvedValue(expectedCasos);

      const result = await service.GetCasosAdopcion();

      expect(result).toEqual(expectedCasos);
      expect(prismaService.caso.findMany).toHaveBeenCalledWith({
        where: { 
          tipo: 'ADOPCION',
          adopcion: {
            estado: 'PENDIENTE',
          }
        },
        include: {
          mascota: {
            include: {
              imagenes: {
                orderBy: { subida_en: 'desc'},
              },
            },
          },
          ong: { select: { id: true, nombre: true } },
        },
      });
    });
  });

  describe('GetCasosDonacion', () => {
    it('should return donation cases', async () => {
      const expectedCasos = [mockCaso];
      prismaService.caso.findMany.mockResolvedValue(expectedCasos);

      const result = await service.GetCasosDonacion();

      expect(result).toEqual(expectedCasos);
      expect(prismaService.caso.findMany).toHaveBeenCalledWith({
        where: { tipo: 'DONACION' },
        include: {
          mascota: {
            include: {
              imagenes: {
                orderBy: { subida_en: 'desc'},
              },
            },
          },
          ong: { select: { id: true, nombre: true } },
          donacion: true,
        },
      });
    });
  });

  describe('obtenerIdDelCasoAdopcion', () => {
    it('should return adoption case id for a pet', async () => {
      prismaService.mascota.findUnique.mockResolvedValue(mockMascota);

      const result = await service.obtenerIdDelCasoAdopcion('mascota-1');

      expect(result).toEqual({ casoAdopcionId: 'adopcion-1' });
      expect(prismaService.mascota.findUnique).toHaveBeenCalledWith({
        where: { id: 'mascota-1' },
        include: {
          casos: {
            where: { tipo: 'ADOPCION' },
            include: {
              adopcion: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException when pet not found', async () => {
      prismaService.mascota.findUnique.mockResolvedValue(null);

      await expect(service.obtenerIdDelCasoAdopcion('mascota-1'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when no adoption case found', async () => {
      prismaService.mascota.findUnique.mockResolvedValue({
        ...mockMascota,
        casos: []
      });

      await expect(service.obtenerIdDelCasoAdopcion('mascota-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('CreateCaso', () => {
    it('should create an adoption case', async () => {
      const expectedCaso = { ...mockCaso, adopcion: { id: 'adopcion-1' } };
      prismaService.caso.findFirst.mockResolvedValue(null);
      prismaService.caso.create.mockResolvedValue(expectedCaso);
      prismaService.casoAdopcion.create.mockResolvedValue({ id: 'adopcion-1' });

      const result = await service.CreateCaso(mockCreateCasoDto, 'ong-1');

      expect(result).toEqual(expectedCaso);
      expect(prismaService.caso.create).toHaveBeenCalled();
      expect(prismaService.casoAdopcion.create).toHaveBeenCalled();
    });

    it('should create a donation case', async () => {
      const expectedCaso = { ...mockCaso, donacion: { id: 'donacion-1' } };
      prismaService.caso.findFirst.mockResolvedValue(null);
      prismaService.caso.create.mockResolvedValue(expectedCaso);
      prismaService.casoDonacion.create.mockResolvedValue({ id: 'donacion-1' });

      const result = await service.CreateCaso(mockCreateCasoDonacionDto, 'ong-1');

      expect(result).toEqual(expectedCaso);
      expect(prismaService.caso.create).toHaveBeenCalled();
      expect(prismaService.casoDonacion.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException when case already exists', async () => {
      prismaService.caso.findFirst.mockResolvedValue(mockCaso);

      await expect(service.CreateCaso(mockCreateCasoDto, 'ong-1'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('buscarCasos', () => {
    it('should search cases by tipoMascota', async () => {
      const expectedCasos = [mockCaso];
      prismaService.caso.findMany.mockResolvedValue(expectedCasos);

      const result = await service.buscarCasos({ tipoMascota: 'Perro' });

      expect(result).toEqual(expectedCasos);
      expect(prismaService.caso.findMany).toHaveBeenCalledWith({
        where: {
          mascota: {
            tipo: { nombre: { equals: 'Perro', mode: 'insensitive' } }
          }
        },
        include: {
          mascota: {
            include: {
              tipo: true,
              imagenes: true,
            }
          },
          ong: true,
          adopcion: true,
          donacion: true,
        }
      });
    });

    it('should search cases by nombreMascota', async () => {
      const expectedCasos = [mockCaso];
      prismaService.caso.findMany.mockResolvedValue(expectedCasos);

      const result = await service.buscarCasos({ nombreMascota: 'Firulais' });

      expect(result).toEqual(expectedCasos);
      expect(prismaService.caso.findMany).toHaveBeenCalledWith({
        where: {
          mascota: {
            nombre: { contains: 'Firulais', mode: 'insensitive' }
          }
        },
        include: {
          mascota: {
            include: {
              tipo: true,
              imagenes: true,
            }
          },
          ong: true,
          adopcion: true,
          donacion: true,
        }
      });
    });

    it('should search cases by both filters', async () => {
      const expectedCasos = [mockCaso];
      prismaService.caso.findMany.mockResolvedValue(expectedCasos);

      const result = await service.buscarCasos({ 
        tipoMascota: 'Perro',
        nombreMascota: 'Firulais'
      });

      expect(result).toEqual(expectedCasos);
      expect(prismaService.caso.findMany).toHaveBeenCalledWith({
        where: {
          mascota: {
            tipo: { nombre: { equals: 'Perro', mode: 'insensitive' } },
            nombre: { contains: 'Firulais', mode: 'insensitive' }
          }
        },
        include: {
          mascota: {
            include: {
              tipo: true,
              imagenes: true,
            }
          },
          ong: true,
          adopcion: true,
          donacion: true,
        }
      });
    });

    it('should return empty array when no cases found', async () => {
      prismaService.caso.findMany.mockResolvedValue([]);

      const result = await service.buscarCasos({ tipoMascota: 'Gato' });

      expect(result).toEqual([]);
      expect(prismaService.caso.findMany).toHaveBeenCalled();
    });
  });
});