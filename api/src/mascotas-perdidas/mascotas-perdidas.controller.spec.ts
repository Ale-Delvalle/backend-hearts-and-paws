import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { MascotasPerdidasController } from './mascotas-perdidas.controller';
import { MascotasPerdidasService } from './mascotas-perdidas.service';
import { RolesGuard } from 'src/autenticacion/guards/roles.guard';
import { AuthOpcionalGuard } from 'src/autenticacion/guards/auth-opcional.guard';

describe('MascotasPerdidasController', () => {
  let controller: MascotasPerdidasController;
  const service = {
    obtenerTodas: jest.fn(),
    obtenerPorId: jest.fn(),
    obtenerPendientes: jest.fn(),
    obtenerMias: jest.fn(),
    moderar: jest.fn(),
    crear: jest.fn(),
    actualizarEstado: jest.fn(),
    eliminar: jest.fn(),
  };

  const admin = { id: 'a-1', tipo: 'USUARIO', rol: 'ADMIN' } as any;
  const usuario = { id: 'u-1', tipo: 'USUARIO', rol: 'USUARIO' } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MascotasPerdidasController],
      providers: [{ provide: MascotasPerdidasService, useValue: service }],
    })
      .overrideGuard(AuthGuard(['jwt-local', 'supabase']))
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthOpcionalGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(MascotasPerdidasController);
  });

  it('obtenerPorId pasa el usuario autenticado al service', () => {
    controller.obtenerPorId('p-1', { user: usuario } as any);

    expect(service.obtenerPorId).toHaveBeenCalledWith('p-1', usuario);
  });

  it('obtenerPorId pasa undefined si no hay sesión', () => {
    controller.obtenerPorId('p-1', { user: null } as any);

    expect(service.obtenerPorId).toHaveBeenCalledWith('p-1', undefined);
  });

  it('obtenerPendientes delega en el service', () => {
    controller.obtenerPendientes({ page: '1' });

    expect(service.obtenerPendientes).toHaveBeenCalledWith({ page: '1' });
  });

  it('moderar delega en el service', () => {
    controller.moderar('p-1', { moderacion: 'APROBADA' });

    expect(service.moderar).toHaveBeenCalledWith('p-1', { moderacion: 'APROBADA' });
  });

  it('obtenerMias delega con el usuario de la request', () => {
    controller.obtenerMias({ user: usuario } as any);

    expect(service.obtenerMias).toHaveBeenCalledWith(usuario);
  });

  describe('autorización con RolesGuard real', () => {
    const guard = new RolesGuard(new Reflector());

    const contextoPara = (handler: (...args: any[]) => any, user: any) =>
      ({
        getHandler: () => handler,
        getClass: () => MascotasPerdidasController,
        switchToHttp: () => ({ getRequest: () => ({ user }) }),
      }) as unknown as ExecutionContext;

    it.each(['obtenerPendientes', 'moderar'] as const)(
      '%s rechaza a un usuario sin rol ADMIN',
      (metodo) => {
        const ctx = contextoPara(MascotasPerdidasController.prototype[metodo], usuario);

        expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
      },
    );

    it.each(['obtenerPendientes', 'moderar'] as const)('%s permite a un ADMIN', (metodo) => {
      const ctx = contextoPara(MascotasPerdidasController.prototype[metodo], admin);

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });
});
