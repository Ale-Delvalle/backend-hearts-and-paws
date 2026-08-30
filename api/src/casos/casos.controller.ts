import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { CasosService } from './casos.service';
import { CreateCasoDto } from './dto/create-caso.dto';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FiltrarPorCasosFechasDto } from './dto/filtro-por-caso-y-fecha.dto';
import { FiltrarPorTipoViejoRecienteDto } from './dto/filtro-tipo-viejo-reciente.dto';
import { AuthenticateRequest } from 'src/common/interfaces/authenticated-request.interface';

@ApiTags('Casos')
@Controller('casos')
export class CasosController {
  constructor(
    private readonly casosService: CasosService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los casos' })
  @ApiResponse({ status: 200, description: 'Lista de todos los casos obtenida exitosamente' })
  GetCasos(){
    return this.casosService.GetCasos();
  }

  @Get('adopcion')
  @ApiOperation({ summary: 'Obtener casos de adopción' })
  @ApiResponse({ status: 200, description: 'Lista de casos de adopción obtenida exitosamente' })
  GetCasosAdopcion() {
    return this.casosService.GetCasosAdopcion();
  }

  @Get('donacion')
  @ApiOperation({ summary: 'Obtener casos de donación' })
  @ApiResponse({ status: 200, description: 'Lista de casos de donación obtenida exitosamente' })
  GetCasosDonacion() {
    return this.casosService.GetCasosDonacion();
  }

  @Get('idAdopcion/:mascotaId')
  @ApiOperation({ summary: 'Obtener ID del caso de adopción por mascota' })
  @ApiParam({ name: 'mascotaId', description: 'ID de la mascota', type: 'string' })
  @ApiResponse({ status: 200, description: 'ID del caso de adopción obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Mascota no encontrada o no tiene caso de adopción' })
  obtenerIdAdopcion(@Param('mascotaId') mascotaId: string){
    return this.casosService.obtenerIdDelCasoAdopcion(mascotaId)
  }

  @Get('adopcion/buscar')
  @ApiOperation({ summary: 'Buscar casos de adopción por tipo de mascota' })
  @ApiQuery({ name: 'tipo', required: true, description: 'Tipo de mascota (Perro, Gato, etc.)' })
  @ApiResponse({ status: 200, description: 'Casos de adopción filtrados obtenidos exitosamente' })
  busquedaAdopcion(@Query('tipo') tipo: string){
    return this.casosService.filtroParaAdopcionesPorMascota(tipo)
  }

  @Get('donacion/buscar')
  @ApiOperation({ summary: 'Buscar casos de donación por tipo de mascota' })
  @ApiQuery({ name: 'tipo', required: true, description: 'Tipo de mascota (Perro, Gato, etc.)' })
  @ApiResponse({ status: 200, description: 'Casos de donación filtrados obtenidos exitosamente' })
  busquedaDonacion(@Query('tipo') tipo: string){
    return this.casosService.buscarCasosDeDonacionPorTipoDeMascota(tipo)
  }


  @Get('filtro-casos-fechas/buscar')
  @UseGuards(AuthGuard(['jwt-local']))
  @ApiOperation({ summary: 'Buscar casos por tipo y rango de fechas' })
  @ApiQuery({ name: 'tipo', required: true, description: 'Tipo de caso (ADOPCION o DONACION)' })
  @ApiQuery({ name: 'fechaDesde', required: true, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fechaHasta', required: true, description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Casos filtrados por fecha obtenidos exitosamente' })
  buscarPorTipoYFechas(@Query() filtros: FiltrarPorCasosFechasDto) {
    return this.casosService.buscarCasosPorTipoYFechas(filtros.tipo, filtros.fechaDesde, filtros.fechaHasta);
  }


  @Get('filtro-tipo-mascota-orden-temporal')
  @UseGuards(AuthGuard(['jwt-local']))
  @ApiOperation({ summary: 'Filtrar casos por tipo de mascota y orden temporal' })
  @ApiQuery({ name: 'ongId', required: true, description: 'ID de la organización' })
  @ApiQuery({ name: 'viejoReciente', required: false, description: 'Orden temporal (RECIENTE o ANTIGUO)' })
  @ApiQuery({ name: 'tipoMascota', required: false, description: 'Tipo de mascota' })
  @ApiResponse({ status: 200, description: 'Casos filtrados y ordenados obtenidos exitosamente' })
  filtroPorTipoRecienteAntiguo(@Query() filtros: FiltrarPorTipoViejoRecienteDto) {
    return this.casosService.filtrarPorTipoYordenTemporal(filtros.ongId, filtros.viejoReciente, filtros.tipoMascota);
  }


  @UseGuards(AuthGuard(['jwt-local']))
  @UseGuards(AuthGuard('jwt-local'))
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo caso (solo ONG autenticada)' })
  @ApiBody({
    type: CreateCasoDto,
    description: 'Datos para crear un nuevo caso de adopción o donación',
    examples: {
      'caso-adopcion': {
        summary: 'Caso de adopción',
        description: 'Ejemplo de creación de un caso de adopción con estado pendiente',
        value: {
          titulo: 'Busco hogar para Max',
          descripcion: 'Max es un perro muy cariñoso de 3 años que necesita un hogar lleno de amor. Es muy juguetón y se lleva bien con otros animales.',
          tipo: 'ADOPCION',
          mascotaId: '550e8400-e29b-41d4-a716-446655440000',
          ongId: '550e8400-e29b-41d4-a716-446655440001',
          adopcion: { estado: 'PENDIENTE' }
        }
      },
      'caso-donacion': {
        summary: 'Caso de donación',
        description: 'Ejemplo de creación de un caso de donación con meta específica',
        value: {
          titulo: 'Ayuda médica para Luna',
          descripcion: 'Luna necesita una cirugía urgente. Es una gata rescatada que requiere atención veterinaria especializada para salvar su vida.',
          tipo: 'DONACION',
          mascotaId: '550e8400-e29b-41d4-a716-446655440002',
          ongId: '550e8400-e29b-41d4-a716-446655440001',
          donacion: { metaDonacion: 250000 }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Caso creado exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440005' },
        titulo: { type: 'string', example: 'Busco hogar para Max' },
        descripcion: { type: 'string', example: 'Max es un perro muy cariñoso...' },
        tipo: { type: 'string', enum: ['ADOPCION', 'DONACION'], example: 'ADOPCION' },
        mascotaId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
        ongId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440001' },
        creado_en: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Ya existe un caso de este tipo para la mascota o datos inválidos',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Ya existe un caso de adopción para esta mascota' },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Mascota u organización no encontrada',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Mascota no encontrada' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  CreateCaso(
    @Req() req: AuthenticateRequest,
    @Body() createCasoDto: CreateCasoDto
  ) {
    const ongId = req.user.id;
    if (req.user.tipo !== 'ONG') {
      throw new UnauthorizedException('Solo una organización puede crear casos.');
    }
    return this.casosService.CreateCaso(createCasoDto, ongId);
  }

  @Get('timeline')
  @ApiOperation({ summary: 'Obtener el timeline público global (casos de todas las ONGs aprobadas), paginado y ordenado por fecha' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página (default 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Cantidad de resultados por página (default 10, máximo 50)' })
  @ApiResponse({ status: 200, description: 'Timeline paginado de casos publicados por todas las organizaciones aprobadas' })
  async obtenerTimelineGlobal(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(parseInt(page ?? '1', 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit ?? '10', 10) || 10, 1), 50);
    return this.casosService.obtenerTimelineGlobal(pageNum, limitNum);
  }

  @Get('buscar')
  @ApiOperation({ summary: 'Buscar casos por tipo y nombre de mascota' })
  @ApiQuery({ name: 'tipo', required: false, description: 'Tipo de mascota' })
  @ApiQuery({ name: 'nombre', required: false, description: 'Nombre de la mascota' })
  @ApiResponse({ status: 200, description: 'Casos encontrados exitosamente' })
  async buscarCasos(@Query('tipo') tipoMascota?: string, @Query('nombre') nombreMascota?: string) {
    return this.casosService.buscarCasos({ tipoMascota, nombreMascota });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un caso por ID' })
  @ApiParam({ name: 'id', description: 'ID del caso', type: 'string' })
  @ApiResponse({ status: 200, description: 'Caso obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Caso no encontrado' })
  GetCasoById(@Param('id') id: string) {
    return this.casosService.GetCasoById(id);
  }

  @UseGuards(AuthGuard('jwt-local'))
  @Get('ong/mis-casos')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todos los casos de una ONG autenticada' })
  @ApiResponse({ status: 200, description: 'Casos de la ONG obtenidos exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado - Solo organizaciones pueden acceder' })
  async obtenerCasosPorOng(@Req() req: AuthenticateRequest){
    const ongId = req.user.id;
    if (req.user.tipo !== 'ONG') {
      throw new UnauthorizedException('Solo una organizacion puede acceder a esta ruta.');
    }
    return await this.casosService.obtenerCasosPorOng(ongId);
  }
}
