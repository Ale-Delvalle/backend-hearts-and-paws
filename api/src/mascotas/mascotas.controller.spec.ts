import { Test, TestingModule } from '@nestjs/testing';
import { MascotasController } from './mascotas.controller';
import { MascotasService } from './mascotas.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../autenticacion/guards/roles.guard';
import { CreateMascotaDto } from './dto/create-mascota.dto';
import { TipoMascotaDto } from './dto/tipoMascota.dto';
import { UpdateEstadoMascotaDto } from './dto/update-estado-mascota.dto';
import { EstadoMascota } from '@prisma/client';
import { UnauthorizedException } from '@nestjs/common';

describe('MascotasController', () => {
  let controller: MascotasController;
  let service: any;

  // Mock data
  const mockMascota = {
    id: '1',
    nombre: 'Firulais',
    edad: 2,
    organizacionId: 'org-1',
    tipoId: 'tipo-1',
    descripcion: 'Perro amigable',
    creada_en: new Date(),
    imagenes: [],
    tipo: { id: 'tipo-1', nombre: 'PERRO' }
  };

  const mockTipoMascota = {
    id: 'tipo-1',
    nombre: 'PERRO'
  };

  const mockAuthenticatedRequest = {
    user: {
      id: 'org-1',
      email: 'test@example.com',
      role: 'ORGANIZACION'
    }
  };

  const mockAuthenticatedOngRequest = {
    user: {
      id: 'org-1',
      email: 'ong@example.com',
      tipo: 'ONG'
    }
  };

  const mockAuthenticatedUserRequest = {
    user: {
      id: 'user-1',
      email: 'user@example.com',
      tipo: 'USUARIO'
    }
  };

  const mockCreateMascotaDto: CreateMascotaDto = {
    nombre: 'Firulais',
    edad: 2,
    tipoId: 'tipo-1',
    descripcion: 'Perro amigable'
  };

  const mockTipoMascotaDto: TipoMascotaDto = {
    nombre: 'Gato'
  };

  const mockFiles = [
    {
      originalname: 'test1.jpg',
      buffer: Buffer.from('test1'),
    },
    {
      originalname: 'test2.jpg',
      buffer: Buffer.from('test2'),
    }
  ] as Express.Multer.File[];

  beforeEach(async () => {
    const mockMascotasService = {
      GetMascotas: jest.fn(),
      GetMascotaById: jest.fn(),
      GetMascotasByOngId: jest.fn(),
      mascotasEnAdopcionPorOng: jest.fn(),
      GetTipo: jest.fn(),
      CreateTipoMascota: jest.fn(),
      crearTipoDeMascota: jest.fn(),
      CreateMascota: jest.fn(),
      SubirImagenes: jest.fn(),
      contarMascotas: jest.fn(),
      obtenerPerfil: jest.fn(),
      actualizarEstado: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MascotasController],
      providers: [
        {
          provide: MascotasService,
          useValue: mockMascotasService,
        },
      ],
    })
      .overrideGuard(AuthGuard(['jwt-local', 'supabase']))
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(AuthGuard('jwt-local'))
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<MascotasController>(MascotasController);
    service = module.get(MascotasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GetMascotas', () => {
    it('should return all mascotas', async () => {
      const expectedMascotas = [mockMascota];
      service.GetMascotas.mockResolvedValue(expectedMascotas);

      const result = await controller.GetMascotas();

      expect(result).toEqual(expectedMascotas);
      expect(service.GetMascotas).toHaveBeenCalled();
    });
  });

  describe('GetMascotaById', () => {
    it('should return a mascota by id', async () => {
      service.GetMascotaById.mockResolvedValue(mockMascota);

      const result = await controller.GetMascotaById('1');

      expect(result).toEqual(mockMascota);
      expect(service.GetMascotaById).toHaveBeenCalledWith('1');
    });
  });

  describe('GetMascotasByOngId', () => {
    it('should return mascotas by authenticated ONG id', async () => {
      const expectedMascotas = [mockMascota];
      service.GetMascotasByOngId.mockResolvedValue(expectedMascotas);

      const result = await controller.GetMascotasByOngId(mockAuthenticatedRequest as any);

      expect(result).toEqual(expectedMascotas);
      expect(service.GetMascotasByOngId).toHaveBeenCalledWith('org-1');
    });
  });

  describe('listaDeMascotasEnAdopcionPorOng', () => {
    it('should return mascotas en adopcion for authenticated ONG', async () => {
      const expectedMascotas = [{
        ...mockMascota,
        casos: [{ tipo: 'ADOPCION' }]
      }];
      service.mascotasEnAdopcionPorOng.mockResolvedValue(expectedMascotas);

      const result = await controller.listaDeMascotasEnAdopcionPorOng(mockAuthenticatedRequest as any);

      expect(result).toEqual(expectedMascotas);
      expect(service.mascotasEnAdopcionPorOng).toHaveBeenCalledWith('org-1');
    });
  });

  describe('contarTotalMascotas', () => {
    it('should return total count of mascotas', async () => {
      const expectedCount = { total: 42 };
      service.contarMascotas.mockResolvedValue(expectedCount);

      const result = await controller.contarTotalMascotas();

      expect(result).toEqual(expectedCount);
      expect(service.contarMascotas).toHaveBeenCalled();
    });
  });

  describe('GetTiposMascotas', () => {
    it('should return all tipos de mascotas', async () => {
      const expectedTipos = [mockTipoMascota];
      service.GetTipo.mockResolvedValue(expectedTipos);

      const result = await controller.GetTiposMascotas();

      expect(result).toEqual(expectedTipos);
      expect(service.GetTipo).toHaveBeenCalled();
    });
  });

  describe('obtenerPerfil', () => {
    it('should return the full mascota profile', async () => {
      const mockPerfil = { ...mockMascota, organizacion: {}, casos: [] };
      service.obtenerPerfil.mockResolvedValue(mockPerfil);

      const result = await controller.obtenerPerfil('1');

      expect(result).toEqual(mockPerfil);
      expect(service.obtenerPerfil).toHaveBeenCalledWith('1');
    });
  });

  describe('actualizarEstado', () => {
    const dto: UpdateEstadoMascotaDto = { estado: EstadoMascota.ADOPTADO };

    it('should update estado when requested by the owning ONG', async () => {
      const expectedResult = { ...mockMascota, estado: EstadoMascota.ADOPTADO };
      service.actualizarEstado.mockResolvedValue(expectedResult);

      const result = await controller.actualizarEstado('1', dto, mockAuthenticatedOngRequest as any);

      expect(result).toEqual(expectedResult);
      expect(service.actualizarEstado).toHaveBeenCalledWith('1', dto.estado, 'org-1');
    });

    it('should throw UnauthorizedException if requester is not an ONG', async () => {
      await expect(
        controller.actualizarEstado('1', dto, mockAuthenticatedUserRequest as any),
      ).rejects.toThrow(UnauthorizedException);
      expect(service.actualizarEstado).not.toHaveBeenCalled();
    });
  });

  describe('CreateTipoMascota', () => {
    it('should create a new tipo de mascota', async () => {
      const expectedResult = { id: 'tipo-2', nombre: 'Gato' };
      service.CreateTipoMascota.mockResolvedValue(expectedResult);

      const result = await controller.CreateTipoMascota(mockTipoMascotaDto);

      expect(result).toEqual(expectedResult);
      expect(service.CreateTipoMascota).toHaveBeenCalledWith(mockTipoMascotaDto);
    });
  });
});
