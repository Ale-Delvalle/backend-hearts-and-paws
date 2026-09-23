import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { ActualizarUsuarioDTO } from './dto/ActualizarUsuario.dto';
import { Rol } from '@prisma/client';

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
  ){}

  async actualizarFotoPerfil(id: string, fotoUrl: string){
    const usuario = await this.prisma.usuario.findUnique({where: {id}});

    if (!usuario) {
      throw new NotFoundException(`No se encontro el usuario con id ${ id }`);
    }
    
    return this.prisma.usuario.update({
      where: { id },
      data: { imagenPerfil: fotoUrl}
    });
  }

    async obtenerPerfilPublico(id: string) {
      const usuario = await this.prisma.usuario.findUnique({
        where: { id },
        select: {
          id: true,
          nombre: true,
          imagenPerfil: true,
          ciudad: true,
          pais: true,
          genero: true,
          creado_en: true,
          insignias: {
            select: {
              id: true,
              tipo: true,
              otorgada_en: true,
              organizacion: { select: { id: true, nombre: true } },
            },
            orderBy: { otorgada_en: 'asc' },
          },
        },
      });

      if (!usuario) {
        throw new NotFoundException(`No se encontró el usuario con Id ${id}`);
      }

      return usuario;
    }

    async usuarioPorId(id: string) {

      const usuario = await this.prisma.usuario.findUnique({
        where: { id },
        select: {
          id: true,
          nombre: true,
          email: true,
          rol: true,
          imagenPerfil: true,
          telefono: true,
          direccion: true,
          ciudad: true,
          pais: true,
          genero: true,
          creado_en: true,
          insignias: {
            select: {
              id: true,
              tipo: true,
              otorgada_en: true,
              organizacion: { select: { id: true, nombre: true } },
            },
            orderBy: { otorgada_en: 'asc' },
          },
        },
      });

      if (!usuario) {
        throw new NotFoundException(`No se encontró el usuario con Id ${id}`);
      }

      return usuario;
    }

    async listaDeUsuarios(filtros?: { 
      rol?: Rol; 
      pais?: string;
      email?: string;
      nombre?: string;
    }) {
      const { rol, pais, email, nombre } = filtros || {};

    return await this.prisma.usuario.findMany({
      where: {
        ...( rol ? { rol } : {}),
        ...( pais ? { pais: { contains: pais, mode: 'insensitive'}}: {}),
        ...( email && { email: {contains: email, mode: 'insensitive'} }),
        ...( nombre && { nombre: {contains: nombre, mode: 'insensitive'}}),
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        imagenPerfil: true,
        pais: true,
        creado_en: true,
        ciudad: true,
        externalId: true,
        direccion: true,
        // No incluir contraseñas ni otros campos sensibles
      },
    });
  }


  async actualizarUsuario(id: string, datosDeUsuario: ActualizarUsuarioDTO) {

    const usuario = await this.prisma.usuario.findUnique({
      where: { id }
    });

    if (!usuario) {
      throw new NotFoundException(`No se encuentro el usuario con id ${id}`);
    }

    const esExterno = !!usuario.externalId;

    const data: Partial<typeof usuario> = {};

    if (!esExterno) {
      if (datosDeUsuario.email && datosDeUsuario.email !== usuario.email) {
        data.email = datosDeUsuario.email;
      }

      if (datosDeUsuario.contrasena) {
        data.contrasena = await bcrypt.hash(datosDeUsuario.contrasena, 10);
      }
    }

      if (datosDeUsuario.telefono) data.telefono = datosDeUsuario.telefono;
      if (datosDeUsuario.direccion) data.direccion = datosDeUsuario.direccion;
      if (datosDeUsuario.ciudad) data.ciudad = datosDeUsuario.ciudad;
      if (datosDeUsuario.pais) data.pais = datosDeUsuario.pais;
      if (datosDeUsuario.genero) data.genero = datosDeUsuario.genero;

      await this.prisma.usuario.update({
        where: { id },
        data,
      });

      const usuarioActualizado = await this.prisma.usuario.findUnique({
        where: { id },
        select: {
          id: true,
          nombre: true,
          email: true,
          telefono: true,
          direccion: true,
          ciudad: true,
          pais: true,
          genero: true,
          rol: true,
        },
      });

      return {
        ok: true,
        mensaje: 'Usuario axtualizado correctamente',
        usuarioActualizado,
      }
  }

  async borrarUsuario(id: string) {
    try {
      const usuarioEliminado = await this.prisma.usuario.delete({
        where: { id },
      });

      return {
        ok: true,
        mensaje: 'Usuario eliminado correctamente',
        usuario: {
          id: usuarioEliminado.id,
          email: usuarioEliminado.email,
          nombre: usuarioEliminado.nombre,
        },
      };
    } catch (error) {
      throw new NotFoundException(`No se encontró el usuario con id ${id}`);
    }
  }

  async totalUsuarios() {
  return this.prisma.usuario.count();
}

async obtenerDonacionesDelUsuarioAutenticado( usuarioId: string){
  return await this.prisma.donacion.findMany({
    where: { usuarioId },
    select: {
      id: true,
      monto: true,
      montoARS: true,
      tasaCambio: true,
      fecha: true,
      estadoPago: true,
      stripeSessionId: true,
      referenciaPago: true,
      organizacion: {
        select: { nombre: true},
      },
      mascota: {
        select: {
          nombre: true,
          imagenes: {
            select: { url: true},
          },
          casos: {
            select: { descripcion: true},
          },
        },
      },
    },
  });
}


async obtenerSolicitudesDelUsuario(usuarioId: string){
  return await this.prisma.solicitudDeAdopcion.findMany({
    where: { usuarioId },
    include: {
      casoAdopcion: {
        include: {
          caso: {
            include: {
              mascota: {
                select: {
                  nombre: true,
                  imagenes: {
                    select: { url: true,}
                  },
                },
              },
              ong: {
                select: { nombre: true,}
              },
            },
          },
        },
      },
    },
  });

}

  async toggleFavorito(userId: string, casoId: string) {

    const favorito = await this.prisma.favorito.findUnique({
      where: { usuarioId_casoId: { usuarioId: userId, casoId } },
    })

    if(favorito){

      await this.prisma.favorito.delete({
        where: { usuarioId_casoId: { usuarioId: userId, casoId } },
      });

      return { message: 'Eliminado de favoritos' };
    }

    await this.prisma.favorito.create({
      data: {usuarioId: userId, casoId },
    });

    return { message: 'Agregado a favoritos' };

  }

  async obtenerFavoritosDelUsuario(usuarioId: string) {
    return await this.prisma.favorito.findMany({
      where: { usuarioId },
      include: {
        caso: {
          include: {
            mascota: {
              select: { nombre: true, imagenes: { select: { url: true } } },
            },
            ong: {
              select: { nombre: true },
            },
          },
        },
      },
    });
  }

  async buscarPorEmail(email: string){
    return await this.prisma.usuario.findUnique({
      where: { email },
    });
  }

}
