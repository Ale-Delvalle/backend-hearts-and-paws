import { Test, TestingModule } from '@nestjs/testing';
import { UsuariosController } from '../usuarios.controller';
import { UsuariosService } from '../usuarios.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

describe('UsuariosController', () => {
  let controller: UsuariosController;
  const service = {
    obtenerPerfilPublico: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsuariosController],
      providers: [
        { provide: UsuariosService, useValue: service },
        { provide: CloudinaryService, useValue: {} },
      ],
    }).compile();

    controller = module.get(UsuariosController);
  });

  describe('obtenerPerfilPublico', () => {
    it('delega en el service con el id recibido', async () => {
      const perfil = { id: 'u-1', nombre: 'Juan' };
      service.obtenerPerfilPublico.mockResolvedValue(perfil);

      const result = await controller.obtenerPerfilPublico('u-1');

      expect(service.obtenerPerfilPublico).toHaveBeenCalledWith('u-1');
      expect(result).toEqual(perfil);
    });

    it('no tiene ningún guard, es un endpoint público', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        controller.obtenerPerfilPublico,
      );
      expect(guards).toBeUndefined();
    });
  });
});
