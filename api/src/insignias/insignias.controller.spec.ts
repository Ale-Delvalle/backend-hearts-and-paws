import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InsigniasController } from './insignias.controller';
import { InsigniasService } from './insignias.service';

describe('InsigniasController', () => {
  let controller: InsigniasController;
  const service = {
    buscarUsuarios: jest.fn(),
    listarDeOng: jest.fn(),
    otorgar: jest.fn(),
    revocar: jest.fn(),
  };

  const reqOng = { user: { id: 'org-1', tipo: 'ONG', rol: 'ONG' } } as any;
  const reqUsuario = { user: { id: 'u-1', tipo: 'USUARIO', rol: 'USUARIO' } } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InsigniasController],
      providers: [{ provide: InsigniasService, useValue: service }],
    })
      .overrideGuard(AuthGuard('jwt-local'))
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(InsigniasController);
  });

  it('buscarUsuarios delega en el service para una ONG', () => {
    controller.buscarUsuarios('ana', reqOng);

    expect(service.buscarUsuarios).toHaveBeenCalledWith('ana');
  });

  it('listar usa el id de la ONG autenticada', () => {
    controller.listar(reqOng);

    expect(service.listarDeOng).toHaveBeenCalledWith('org-1');
  });

  it('otorgar usa el id de la ONG autenticada', () => {
    const dto = { usuarioId: 'u-1', tipo: 'PADRINO' as const };

    controller.otorgar(dto, reqOng);

    expect(service.otorgar).toHaveBeenCalledWith('org-1', dto);
  });

  it('revocar usa el id de la ONG autenticada', () => {
    controller.revocar('i-1', reqOng);

    expect(service.revocar).toHaveBeenCalledWith('org-1', 'i-1');
  });

  it.each([
    ['buscarUsuarios', () => controller.buscarUsuarios('ana', reqUsuario)],
    ['listar', () => controller.listar(reqUsuario)],
    ['otorgar', () => controller.otorgar({ usuarioId: 'u-2', tipo: 'TRANSITO' }, reqUsuario)],
    ['revocar', () => controller.revocar('i-1', reqUsuario)],
  ])('%s rechaza a quien no es ONG', (_nombre, llamar) => {
    expect(llamar).toThrow(ForbiddenException);
  });
});
