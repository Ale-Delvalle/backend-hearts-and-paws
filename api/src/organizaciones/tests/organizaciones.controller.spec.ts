import { Test, TestingModule } from '@nestjs/testing';
import { OrganizacionesController } from '../organizaciones.controller';
import { OrganizacionesService } from '../organizaciones.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/autenticacion/guards/roles.guard';
import { JwtAutCookiesGuardia } from 'src/autenticacion/guards/jwtAut.guardia';
import { AuthOpcionalGuard } from 'src/autenticacion/guards/auth-opcional.guard';

describe('OrganizacionesController', () => {
  let controller: OrganizacionesController;
  let service: any;

  beforeEach(async () => {
    const mockOrganizacionesService = {
      obtenerPerfilPublico: jest.fn(),
      obtenerTimeline: jest.fn(),
      obtenerCasosCerrados: jest.fn(),
      obtenerMascotas: jest.fn(),
      otorgarReconocimiento: jest.fn(),
      revocarReconocimiento: jest.fn(),
      miEstadoReconocimiento: jest.fn(),
    };

    const mockCloudinaryService = {};

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizacionesController],
      providers: [
        { provide: OrganizacionesService, useValue: mockOrganizacionesService },
        { provide: CloudinaryService, useValue: mockCloudinaryService },
      ],
    })
      .overrideGuard(AuthGuard('jwt-local'))
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(AuthGuard(['jwt-local', 'supabase']))
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(JwtAutCookiesGuardia)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(AuthOpcionalGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<OrganizacionesController>(OrganizacionesController);
    service = module.get(OrganizacionesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('obtenerPerfilPublico', () => {
    it('debería devolver el perfil público de la organización', async () => {
      const perfilMock = { id: '1', nombre: 'Refugio', mascotasActivas: 3, casosPublicados: 5 };
      service.obtenerPerfilPublico.mockResolvedValue(perfilMock);

      const result = await controller.obtenerPerfilPublico('1');

      expect(result).toEqual(perfilMock);
      expect(service.obtenerPerfilPublico).toHaveBeenCalledWith('1');
    });
  });

  describe('obtenerTimeline', () => {
    it('debería usar los valores por defecto de paginación', async () => {
      const timelineMock = { data: [], total: 0, page: 1, limit: 10 };
      service.obtenerTimeline.mockResolvedValue(timelineMock);

      const result = await controller.obtenerTimeline('1', undefined, undefined);

      expect(result).toEqual(timelineMock);
      expect(service.obtenerTimeline).toHaveBeenCalledWith('1', 1, 10);
    });

    it('debería parsear page y limit, y limitar el máximo a 50', async () => {
      service.obtenerTimeline.mockResolvedValue({ data: [], total: 0, page: 2, limit: 50 });

      await controller.obtenerTimeline('1', '2', '999');

      expect(service.obtenerTimeline).toHaveBeenCalledWith('1', 2, 50);
    });
  });

  describe('obtenerCasosCerrados', () => {
    it('debería usar los valores por defecto de paginación y pasar el motivo', async () => {
      const casosMock = { data: [], total: 0, page: 1, limit: 10 };
      service.obtenerCasosCerrados.mockResolvedValue(casosMock);

      const result = await controller.obtenerCasosCerrados('1', 'ADOPCION', undefined, undefined);

      expect(result).toEqual(casosMock);
      expect(service.obtenerCasosCerrados).toHaveBeenCalledWith('1', 1, 10, 'ADOPCION');
    });

    it('debería limitar el máximo a 50', async () => {
      service.obtenerCasosCerrados.mockResolvedValue({ data: [], total: 0, page: 1, limit: 50 });

      await controller.obtenerCasosCerrados('1', undefined, '1', '999');

      expect(service.obtenerCasosCerrados).toHaveBeenCalledWith('1', 1, 50, undefined);
    });
  });

  describe('obtenerMascotas', () => {
    it('debería usar los valores por defecto de paginación', async () => {
      const catalogoMock = { data: [], total: 0, page: 1, limit: 12 };
      service.obtenerMascotas.mockResolvedValue(catalogoMock);

      const result = await controller.obtenerMascotas('1', undefined, undefined, undefined);

      expect(result).toEqual(catalogoMock);
      expect(service.obtenerMascotas).toHaveBeenCalledWith('1', undefined, 1, 12);
    });

    it('debería filtrar por estado cuando es válido', async () => {
      service.obtenerMascotas.mockResolvedValue({ data: [], total: 0, page: 1, limit: 12 });

      await controller.obtenerMascotas('1', 'EN_ADOPCION', '1', '12');

      expect(service.obtenerMascotas).toHaveBeenCalledWith('1', 'EN_ADOPCION', 1, 12);
    });

    it('debería lanzar BadRequestException si el estado no es válido', async () => {
      await expect(
        controller.obtenerMascotas('1', 'ESTADO_INVENTADO', undefined, undefined),
      ).rejects.toThrow(BadRequestException);
      expect(service.obtenerMascotas).not.toHaveBeenCalled();
    });
  });

  describe('reconocimientos', () => {
    const reqUsuario = { user: { id: 'u-1', tipo: 'USUARIO' } } as any;

    it('otorgarReconocimiento delega en el service con el usuario autenticado', async () => {
      service.otorgarReconocimiento.mockResolvedValue({ ok: true });

      await controller.otorgarReconocimiento('ong-1', { mensaje: 'Genial' }, reqUsuario);

      expect(service.otorgarReconocimiento).toHaveBeenCalledWith('ong-1', reqUsuario.user, {
        mensaje: 'Genial',
      });
    });

    it('revocarReconocimiento delega en el service con el usuario autenticado', async () => {
      service.revocarReconocimiento.mockResolvedValue({ ok: true });

      await controller.revocarReconocimiento('ong-1', reqUsuario);

      expect(service.revocarReconocimiento).toHaveBeenCalledWith('ong-1', reqUsuario.user);
    });

    it('miEstadoReconocimiento delega en el service con el usuario si está autenticado', async () => {
      service.miEstadoReconocimiento.mockResolvedValue({ yaReconocida: true });

      await controller.miEstadoReconocimiento('ong-1', reqUsuario);

      expect(service.miEstadoReconocimiento).toHaveBeenCalledWith('ong-1', reqUsuario.user);
    });

    it('miEstadoReconocimiento pasa undefined si no hay sesión', async () => {
      service.miEstadoReconocimiento.mockResolvedValue({ yaReconocida: false });

      await controller.miEstadoReconocimiento('ong-1', { user: null } as any);

      expect(service.miEstadoReconocimiento).toHaveBeenCalledWith('ong-1', undefined);
    });
  });
});
