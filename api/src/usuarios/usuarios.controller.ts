import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
  Put,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { filtroArchivoImagen, limits } from 'src/cloudinary/file.interceptor';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { ActualizarUsuarioDTO } from 'src/usuarios/dto/ActualizarUsuario.dto';
import { AuthGuard } from '@nestjs/passport';
import { Rol } from '@prisma/client';
import { RolesGuard } from 'src/autenticacion/guards/roles.guard';
import { Roles } from 'src/autenticacion/decoradores/roles.decorator';
import { AuthenticateRequest } from 'src/common/interfaces/authenticated-request.interface';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly cloudinaryService: CloudinaryService
  ) {}


  @UseGuards(AuthGuard(['jwt-local', 'supabase']), RolesGuard)
  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Listar todos los usuarios' })
  @ApiQuery({ name: 'rol', enum: Rol, required: false })
  @ApiQuery({ name: 'pais', type: 'string', required: false })
  @ApiQuery({ name: 'email', type: 'string', required: false })
  @ApiQuery({ name: 'nombre', type: 'string', required: false })
  @ApiResponse({ status: 200, description: 'Lista de usuarios obtenida correctamente' })
  async obtenerUsuarios(
    @Query('rol') rol: Rol,
    @Query('pais') pais: string,
    @Query('email') email: string,
    @Query('nombre') nombre: string
  ) {
    return await this.usuariosService.listaDeUsuarios({ rol, pais, email, nombre });
  }


  @UseGuards(AuthGuard(['jwt-local', 'supabase']), RolesGuard)
  @Get('estadisticas/total')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Obtener total de usuarios' })
  @ApiResponse({ status: 200, description: 'Total de usuarios', schema: { example: { total: 100 } } })
  async totalUsuarios() {
    const total = await this.usuariosService.totalUsuarios();
    return { total };
  }

  @UseGuards(AuthGuard(['jwt-local', 'supabase']))
  @Get('mis-donaciones')
  @ApiOperation({ summary: 'Ver mis donaciones' })
  @ApiResponse({ status: 200, description: 'Donaciones del usuario autenticado' })
  async obtenerMisDonaciones(@Req() req: AuthenticateRequest) {
    const usuarioId = req.user.id;
    return await this.usuariosService.obtenerDonacionesDelUsuarioAutenticado(usuarioId);
  }

  @UseGuards(AuthGuard(['jwt-local', 'supabase']))
  @Get('mis-solicitudes')
  @ApiOperation({ summary: 'Ver mis solicitudes de adopción' })
  @ApiResponse({ status: 200, description: 'Solicitudes de adopción del usuario autenticado' })
  async obtenerMisSolicitudes(@Req() req: AuthenticateRequest) {
    const usuarioId = req.user.id;
    return await this.usuariosService.obtenerSolicitudesDelUsuario(usuarioId);
  }


  @Get('verificar-email/:email')
  @ApiOperation({ summary: 'Verificar si el email ya está registrado' })
  @ApiParam({ name: 'email', type: 'string' })
  @ApiResponse({ status: 200, description: 'Estado de disponibilidad del email', schema: { example: { disponible: true, mensaje: 'El email está disponible' } } })
  async verificarEmail(@Param('email') email: string) {
    const usuario = await this.usuariosService.buscarPorEmail(email);
    return {
      disponible: !usuario,
      mensaje: usuario ? 'El email ya está registrado' : 'El email está disponible',
    };
  }

  @UseGuards(AuthGuard(['jwt-local', 'supabase']))
  @Get('me')
  @ApiOperation({ summary: 'Obtener el usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Usuario actual retornado exitosamente' })
  async getUsuarioActual(@Req() req: AuthenticateRequest){
    return await this.usuariosService.usuarioPorId(req.user.id)
  }


  @UseGuards(AuthGuard(['jwt-local', 'supabase']), RolesGuard)
  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'UUID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  async obtenerUsuarioPorId(@Param('id', ParseUUIDPipe) id: string) {
    return await this.usuariosService.usuarioPorId(id);
  }

  @Get(':id/perfil')
  @ApiOperation({ summary: 'Obtener el perfil público de un usuario (sin datos de contacto)' })
  @ApiParam({ name: 'id', type: 'string', description: 'UUID del usuario' })
  @ApiResponse({ status: 200, description: 'Perfil público del usuario.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async obtenerPerfilPublico(@Param('id', ParseUUIDPipe) id: string) {
    return await this.usuariosService.obtenerPerfilPublico(id);
  }

  @UseGuards(AuthGuard(['jwt-local', 'supabase']))
  @Get('favoritos/casos')
  @ApiOperation({ summary: 'Obtener todos los casos favoritos del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de favoritos' })
  obetnerFavoritos(@Req() req: AuthenticateRequest) {
    const usuarioId = req.user.id;
    return this.usuariosService.obtenerFavoritosDelUsuario(usuarioId);
  }


  @Patch('me')
  @UseGuards(AuthGuard(['jwt-local', 'supabase']))
  @ApiOperation({ summary: 'Cambia los datos del usuario' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: ActualizarUsuarioDTO })
  @ApiResponse({ status: 200, description: 'Datos actualizados' })
  async actualizarUsuario(
    @Req() req: AuthenticateRequest,
    @Body() datosDeUsuario: ActualizarUsuarioDTO,
  ) {
    const userId = req.user.id;
    return await this.usuariosService.actualizarUsuario(userId, datosDeUsuario);
  }


  @UseGuards(AuthGuard(['jwt-local', 'supabase']), RolesGuard)
  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Eliminar un usuario por ID' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado correctamente' })
  async borrarUsuario(@Param('id', ParseUUIDPipe) id: string) {
    return await this.usuariosService.borrarUsuario(id);
  }



  @Post('foto')
  @UseGuards(AuthGuard(['jwt-local', 'supabase']))
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: filtroArchivoImagen,
    limits: limits
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir imagen de perfil del usuario' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Foto de perfil actualizada correctamente' })
  async subirFotoPerfil(
    @Req() req: AuthenticateRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = req.user.id;
    const subirImagen = await this.cloudinaryService.subirIamgen(file);
    return this.usuariosService.actualizarFotoPerfil(userId, subirImagen.secure_url);
  }

  @UseGuards(AuthGuard(['jwt-local', 'supabase']))
  @Put(':casoId/favoritos')
  @ApiOperation({ summary: 'Agregar o eliminar caso de favoritos para el usuario autenticado' })
  @ApiParam({ name: 'casoId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Favorito actualizado correctamente' })
  toggleFavorito(
    @Param('casoId', ParseUUIDPipe) casoId: string,
    @Req() req: AuthenticateRequest,
  ) {
    const userId = req.user.id;
    return this.usuariosService.toggleFavorito(userId, casoId);
  }
}
