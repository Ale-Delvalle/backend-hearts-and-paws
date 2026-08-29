import { Test, TestingModule } from '@nestjs/testing';
import { MascotasService } from './mascotas.service';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { EstadoMascota } from '@prisma/client';

describe('MascotasService', () => {
  let service: MascotasService;
  let prismaService: any;
  let cloudinaryService: any;

  const mockMascota = {
    id: '1',
    nombre: 'Firulais',
    edad: 2,
    organizacionId: 'org-1',
    tipoId: 'tipo-1',
    descripcion: 'Perro amigable',
    creada_en: new Date(),
    imagenes: []
  };

  const mockTipoMascota = {
    id: 'tipo-1',
    nombre: 'PERRO'
  };

  beforeEach(async () => {
    const mockPrismaService = {
      mascota: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      tiposMascota: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      organizacion: {
        findUnique: jest.fn(),
      },
      imagenMascota: {
        create: jest.fn(),
      },
    };

    const mockCloudinaryService = {
      subirIamgen: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MascotasService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
      ],
    }).compile();

    service = module.get<MascotasService>(MascotasService);
    prismaService = module.get(PrismaService);
    cloudinaryService = module.get(CloudinaryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('GetMascotas', () => {
    it('should return all mascotas', async () => {
      const expectedMascotas = [mockMascota];
      prismaService.mascota.findMany.mockResolvedValue(expectedMascotas);

      const result = await service.GetMascotas();

      expect(result).toEqual(expectedMascotas);
      expect(prismaService.mascota.findMany).toHaveBeenCalledWith({
        include: {
          imagenes: true,
        },
      });
    });
  });

  describe('GetMascotaById', () => {
    it('should return a mascota by id', async () => {
      prismaService.mascota.findUnique.mockResolvedValue(mockMascota);

      const result = await service.GetMascotaById('1');

      expect(result).toEqual(mockMascota);
      expect(prismaService.mascota.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          imagenes: true,
        },
      });
    });
  });

  describe('GetMascotasByOngId', () => {
    it('should return mascotas by organization id', async () => {
      const expectedMascotas = [mockMascota];
      prismaService.mascota.findMany.mockResolvedValue(expectedMascotas);

      const result = await service.GetMascotasByOngId('org-1');

      expect(result).toEqual(expectedMascotas);
      expect(prismaService.mascota.findMany).toHaveBeenCalledWith({
        where: { organizacionId: 'org-1' },
        include: {
          imagenes: true,
        },
      });
    });
  });

  describe('GetTipo', () => {
    it('should return all tipos de mascotas', async () => {
      const expectedTipos = [mockTipoMascota];
      prismaService.tiposMascota.findMany.mockResolvedValue(expectedTipos);

      const result = await service.GetTipo();

      expect(result).toEqual(expectedTipos);
      expect(prismaService.tiposMascota.findMany).toHaveBeenCalled();
    });
  });

  describe('CreateTipoMascota', () => {
    it('should create a new tipo de mascota', async () => {
      const createTipoDto = { nombre: 'Gato' };
      const expectedResult = { id: 'tipo-2', nombre: 'Gato' };
      prismaService.tiposMascota.create.mockResolvedValue(expectedResult);

      const result = await service.CreateTipoMascota(createTipoDto);

      expect(result).toEqual(expectedResult);
      expect(prismaService.tiposMascota.create).toHaveBeenCalledWith({
        data: {
          nombre: 'Gato',
        },
      });
    });
  });

  describe('CreateMascota', () => {
    it('should create a new mascota successfully', async () => {
      const createMascotaDto = {
        nombre: 'Firulais',
        edad: 2,
        tipoId: 'tipo-1',
        descripcion: 'Perro amigable'
      };

      prismaService.tiposMascota.findUnique.mockResolvedValue(mockTipoMascota);
      prismaService.organizacion.findUnique.mockResolvedValue({ id: 'org-1' });
      prismaService.mascota.create.mockResolvedValue(mockMascota);

      const result = await service.CreateMascota(createMascotaDto, 'org-1');

      expect(result).toEqual(mockMascota);
      expect(prismaService.tiposMascota.findUnique).toHaveBeenCalledWith({
        where: { id: 'tipo-1' },
      });
      expect(prismaService.organizacion.findUnique).toHaveBeenCalledWith({
        where: { id: 'org-1' },
      });
    });

    it('should throw BadRequestException if tipo does not exist', async () => {
      const createMascotaDto = {
        nombre: 'Firulais',
        edad: 2,
        tipoId: 'tipo-1',
        descripcion: 'Perro amigable'
      };

      prismaService.tiposMascota.findUnique.mockResolvedValue(null);

      await expect(service.CreateMascota(createMascotaDto, 'org-1'))
        .rejects.toThrow(new BadRequestException('El ripo de mascota no existe'));
    });

    it('should throw BadRequestException if organization does not exist', async () => {
      const createMascotaDto = {
        nombre: 'Firulais',
        edad: 2,
        tipoId: 'tipo-1',
        descripcion: 'Perro amigable'
      };

      prismaService.tiposMascota.findUnique.mockResolvedValue(mockTipoMascota);
      prismaService.organizacion.findUnique.mockResolvedValue(null);

      await expect(service.CreateMascota(createMascotaDto, 'org-1'))
        .rejects.toThrow(new BadRequestException('La organizacion no existe'));
    });
  });

  describe('contarMascotas', () => {
    it('should return the total count of mascotas', async () => {
      prismaService.mascota.count.mockResolvedValue(42);

      const result = await service.contarMascotas();

      expect(result).toEqual({ total: 42 });
      expect(prismaService.mascota.count).toHaveBeenCalled();
    });
  });

  describe('obtenerPerfil', () => {
    it('should return the full mascota profile', async () => {
      const mockPerfil = {
        ...mockMascota,
        tipo: mockTipoMascota,
        organizacion: { id: 'org-1', nombre: 'Refugio' },
        casos: [],
      };
      prismaService.mascota.findUnique.mockResolvedValue(mockPerfil);

      const result = await service.obtenerPerfil('1');

      expect(result).toEqual(mockPerfil);
      expect(prismaService.mascota.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.objectContaining({
          tipo: true,
          organizacion: expect.any(Object),
          casos: expect.any(Object),
        }),
      });
    });

    it('should throw NotFoundException if mascota does not exist', async () => {
      prismaService.mascota.findUnique.mockResolvedValue(null);

      await expect(service.obtenerPerfil('fake-id'))
        .rejects.toThrow(new NotFoundException('Mascota no encontrada'));
    });
  });

  describe('actualizarEstado', () => {
    it('should update the estado when the ONG owns the mascota', async () => {
      prismaService.mascota.findUnique.mockResolvedValue(mockMascota);
      prismaService.mascota.update.mockResolvedValue({
        ...mockMascota,
        estado: EstadoMascota.ADOPTADO,
      });

      const result = await service.actualizarEstado('1', EstadoMascota.ADOPTADO, 'org-1');

      expect(prismaService.mascota.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { estado: EstadoMascota.ADOPTADO },
      });
      expect(result.estado).toEqual(EstadoMascota.ADOPTADO);
    });

    it('should throw NotFoundException if mascota does not exist', async () => {
      prismaService.mascota.findUnique.mockResolvedValue(null);

      await expect(service.actualizarEstado('1', EstadoMascota.ADOPTADO, 'org-1'))
        .rejects.toThrow(new NotFoundException('Mascota no encontrada'));
    });

    it('should throw ForbiddenException if the ONG does not own the mascota', async () => {
      prismaService.mascota.findUnique.mockResolvedValue(mockMascota);

      await expect(service.actualizarEstado('1', EstadoMascota.ADOPTADO, 'otra-org'))
        .rejects.toThrow(new ForbiddenException('No puedes modificar el estado de esta mascota'));
    });
  });

  describe('SubirImagenes - Basic validation', () => {
    it('should throw NotFoundException if mascota does not exist', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      prismaService.mascota.findUnique.mockResolvedValue(null);

      await expect(service.SubirImagenes('1', [mockFile], 'org-1'))
        .rejects.toThrow(new NotFoundException('Mascota no encontrada'));
    });

    it('should throw ForbiddenException if wrong organization', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      prismaService.mascota.findUnique.mockResolvedValue(mockMascota);

      await expect(service.SubirImagenes('1', [mockFile], 'wrong-org'))
        .rejects.toThrow(new ForbiddenException('No puedes subir imagenes a esta mascota'));
    });
  });
});
