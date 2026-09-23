import { Test, TestingModule } from '@nestjs/testing';
import { UsuariosService } from '../usuarios.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Rol } from '@prisma/client';
import { ActualizarUsuarioDTO } from '../dto/ActualizarUsuario.dto';

// Mock bcrypt correctamente
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
}));

import * as bcrypt from 'bcrypt';

describe('UsuariosService', () => {
  let service: UsuariosService;
  let mockPrisma: Record<string, any>;

  beforeEach(async () => {
    mockPrisma = {
      usuario: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      donacion: {
        findMany: jest.fn(),
      },
      solicitudDeAdopcion: {
        findMany: jest.fn(),
      },
      favorito: {
        findUnique: jest.fn(),
        delete: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
  });

  describe('actualizarFotoPerfil', () => {
    it('debería actualizar la foto de perfil si el usuario existe', async () => {
      const id = '123';
      const fotoUrl = 'url-nueva.jpg';

      mockPrisma.usuario.findUnique.mockResolvedValue({ id });
      mockPrisma.usuario.update.mockResolvedValue({ id, imagenPerfil: fotoUrl });

      const result = await service.actualizarFotoPerfil(id, fotoUrl);
      expect(result).toEqual({ id, imagenPerfil: fotoUrl });
    });

    it('debería lanzar NotFoundException si el usuario no existe', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue(null);
      await expect(service.actualizarFotoPerfil('no-existe', 'url')).rejects.toThrow(NotFoundException);
    });
  });

  describe('obtenerPerfilPublico', () => {
    it('devuelve el perfil si el usuario existe, sin pedir datos de contacto', async () => {
      const usuarioPublico = { id: '1', nombre: 'Juan', imagenPerfil: null, ciudad: 'La Plata' };
      mockPrisma.usuario.findUnique.mockResolvedValue(usuarioPublico);

      const result = await service.obtenerPerfilPublico('1');

      expect(result).toEqual(usuarioPublico);

      const select = mockPrisma.usuario.findUnique.mock.calls[0][0].select;
      expect(select).toMatchObject({
        id: true,
        nombre: true,
        imagenPerfil: true,
        ciudad: true,
        pais: true,
        genero: true,
        creado_en: true,
      });
      expect(select).not.toHaveProperty('email');
      expect(select).not.toHaveProperty('telefono');
      expect(select).not.toHaveProperty('direccion');
      expect(select).not.toHaveProperty('rol');
      expect(select).not.toHaveProperty('contrasena');
    });

    it('lanza 404 si el usuario no existe', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue(null);

      await expect(service.obtenerPerfilPublico('invalido')).rejects.toThrow(NotFoundException);
    });
  });

  describe('usuarioPorId', () => {
    it('debería retornar el usuario si existe', async () => {
      const usuario = { id: '1', nombre: 'Juan' };
      mockPrisma.usuario.findUnique.mockResolvedValue(usuario);
      const result = await service.usuarioPorId('1');
      expect(result).toEqual(usuario);
    });

    it('debería lanzar NotFoundException si no existe', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue(null);
      await expect(service.usuarioPorId('invalido')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listaDeUsuarios', () => {
    it('debería retornar la lista filtrada de usuarios', async () => {
      const usuarios = [{ id: '1', nombre: 'Juan' }];
      mockPrisma.usuario.findMany.mockResolvedValue(usuarios);
      const filtros = { rol: Rol.USUARIO, pais: 'Argentina' };
      const result = await service.listaDeUsuarios(filtros);
      expect(result).toEqual(usuarios);
    });
  });

  describe('actualizarUsuario', () => {
    it('debería actualizar email y contraseña usuario no externo', async () => {
      const id = 'user-123';
      const datos: ActualizarUsuarioDTO = {
        email: 'nuevo@test.com',
        contrasena: 'Segura#1234',
      };

      const usuarioMock = {
        id,
        email: 'anterior@test.com',
        externalId: null,
      };

      mockPrisma.usuario.findUnique
        .mockReset()
        .mockResolvedValueOnce(usuarioMock) // Para buscar usuario
        .mockResolvedValueOnce({           // Para retornar usuario actualizado
          id,
          nombre: 'Ana',
          email: 'nuevo@test.com',
          telefono: '987654321',
          direccion: null,
          ciudad: null,
          pais: null,
          rol: 'USER',
        });

      mockPrisma.usuario.update.mockResolvedValue(undefined);

      const result = await service.actualizarUsuario(id, datos);

      expect(bcrypt.hash).toHaveBeenCalledWith('Segura#1234', 10);
      expect(result.ok).toBe(true);
      expect(result.usuarioActualizado).not.toBeNull();
      expect(result.usuarioActualizado?.email).toBe('nuevo@test.com');
    });

    it('debería lanzar NotFoundException si no existe usuario', async () => {
      mockPrisma.usuario.findUnique.mockReset();
      mockPrisma.usuario.findUnique.mockResolvedValue(null);

      await expect(service.actualizarUsuario('id-no-existe', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('borrarUsuario', () => {
    it('debería eliminar el usuario correctamente', async () => {
      const id = 'user-1';
      const usuario = { id, nombre: 'Juan', email: 'juan@test.com' };
      mockPrisma.usuario.delete.mockResolvedValue(usuario);
      const result = await service.borrarUsuario(id);
      expect(result.usuario).toEqual({
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
      });
    });

    it('debería lanzar NotFoundException si no existe', async () => {
      mockPrisma.usuario.delete.mockRejectedValue(new Error());
      await expect(service.borrarUsuario('id-fake')).rejects.toThrow(NotFoundException);
    });
  });

  describe('totalUsuarios', () => {
    it('debería devolver el total de usuarios', async () => {
      mockPrisma.usuario.count.mockResolvedValue(5);
      const total = await service.totalUsuarios();
      expect(total).toBe(5);
    });
  });

  describe('obtenerDonacionesDelUsuarioAutenticado', () => {
    it('debería retornar la lista de donaciones', async () => {
      const donaciones = [{ id: 'd1', monto: 100 }];
      mockPrisma.donacion.findMany.mockResolvedValue(donaciones);
      const result = await service.obtenerDonacionesDelUsuarioAutenticado('user-1');
      expect(result).toEqual(donaciones);
    });
  });

  describe('obtenerSolicitudesDelUsuario', () => {
    it('debería retornar las solicitudes del usuario', async () => {
      const solicitudes = [{ id: 's1' }];
      mockPrisma.solicitudDeAdopcion.findMany.mockResolvedValue(solicitudes);
      const result = await service.obtenerSolicitudesDelUsuario('user-1');
      expect(result).toEqual(solicitudes);
    });
  });

  describe('toggleFavorito', () => {
    it('debería eliminar si ya está en favoritos', async () => {
      mockPrisma.favorito.findUnique.mockResolvedValue({ id: 'f1' });
      const result = await service.toggleFavorito('user-1', 'caso-1');
      expect(result).toEqual({ message: 'Eliminado de favoritos' });
    });

    it('debería agregar si no está en favoritos', async () => {
      mockPrisma.favorito.findUnique.mockResolvedValue(null);
      const result = await service.toggleFavorito('user-1', 'caso-2');
      expect(result).toEqual({ message: 'Agregado a favoritos' });
    });
  });

  describe('obtenerFavoritosDelUsuario', () => {
    it('debería retornar los favoritos del usuario', async () => {
      const favoritos = [{ id: 'f1' }];
      mockPrisma.favorito.findMany.mockResolvedValue(favoritos);
      const result = await service.obtenerFavoritosDelUsuario('user-1');
      expect(result).toEqual(favoritos);
    });
  });

  describe('buscarPorEmail', () => {
    it('debería retornar un usuario si existe con ese email', async () => {
      const usuario = { id: 'user-1', email: 'test@example.com' };
      mockPrisma.usuario.findUnique.mockResolvedValue(usuario);
      const result = await service.buscarPorEmail('test@example.com');
      expect(result).toEqual(usuario);
    });
  });
});
