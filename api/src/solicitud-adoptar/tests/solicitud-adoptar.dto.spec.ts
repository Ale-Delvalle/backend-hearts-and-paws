import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SolicitudParaAdoptarDto } from '../dtos/solicitud-adoptar.dto';

const baseValida = {
  casoAdopcionId: '123e4567-e89b-12d3-a456-426614174000',
  tipoVivienda: 'casa',
  integrantesFlia: 4,
  hijos: 2,
  hayOtrasMascotas: 1,
  descripcionOtrasMascotas: 'Un perro',
  cubrirGastos: 'Sí',
  darAlimentoCuidados: 'Comida dos veces al día',
  darAmorTiempoEj: '2 horas de juego',
  devolucionDeMascota: 'Buscaría otra familia',
  siNoPodesCuidarla: 'Contactaría a la organización',
  declaracionFinal: 'Me comprometo a cuidarla',
};

async function validar(datos: Record<string, unknown>) {
  const dto = plainToInstance(SolicitudParaAdoptarDto, datos);
  const errores = await validate(dto);
  return { dto, errores };
}

describe('SolicitudParaAdoptarDto', () => {
  it('acepta una solicitud válida sin cambios', async () => {
    const { dto, errores } = await validar(baseValida);

    expect(errores).toHaveLength(0);
    expect(dto.cubrirGastos).toBe('Sí');
  });

  it('elimina el HTML y los scripts de los campos de texto', async () => {
    const { dto, errores } = await validar({
      ...baseValida,
      declaracionFinal: '<script>alert("x")</script>Me comprometo',
      tipoVivienda: '<img src=x onerror=alert(1)>casa',
    });

    expect(errores).toHaveLength(0);
    expect(dto.declaracionFinal).not.toContain('<script');
    expect(dto.declaracionFinal).toContain('Me comprometo');
    expect(dto.tipoVivienda).not.toContain('onerror');
  });

  it('quita espacios sobrantes al inicio y al final', async () => {
    const { dto } = await validar({ ...baseValida, cubrirGastos: '   Sí   ' });

    expect(dto.cubrirGastos).toBe('Sí');
  });

  it('rechaza un texto corto que supera 500 caracteres', async () => {
    const { errores } = await validar({ ...baseValida, cubrirGastos: 'a'.repeat(501) });

    expect(errores.map((e) => e.property)).toContain('cubrirGastos');
  });

  it('permite hasta 1000 caracteres en declaracionFinal y rechaza más', async () => {
    const ok = await validar({ ...baseValida, declaracionFinal: 'a'.repeat(1000) });
    const mal = await validar({ ...baseValida, declaracionFinal: 'a'.repeat(1001) });

    expect(ok.errores).toHaveLength(0);
    expect(mal.errores.map((e) => e.property)).toContain('declaracionFinal');
  });
});
