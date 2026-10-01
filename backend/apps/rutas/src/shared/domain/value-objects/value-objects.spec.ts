import { Coordenada, MENSAJE_LAT_INVALIDA, MENSAJE_LNG_INVALIDA } from './coordenada.vo';
import { DESCRIPCION_ESTADO_ORDEN, ESTADO_ORDEN, esEstadoOrden, ESTADOS_ORDEN, puedeTransicionar } from './estado-orden.vo';
import { MENSAJE_PESO_INVALIDO, Peso, PESO_MAXIMO_KG } from './peso.vo';

describe('Coordenada', () => {
  it.each([
    [14.6349, -90.5069],
    [-90, -180],
    [90, 180],
    [0, 0],
  ])('acepta lat=%p lng=%p', (lat, lng) => {
    expect(Coordenada.validar(lat, lng)).toEqual([]);
    expect(Coordenada.de(lat, lng)).toMatchObject({ lat, lng });
  });

  it.each([
    ['latitud fuera de rango', 90.0001, 0, ['lat']],
    ['latitud negativa fuera de rango', -91, 0, ['lat']],
    ['longitud fuera de rango', 0, 180.5, ['lng']],
    ['ambas fuera de rango', 200, -300, ['lat', 'lng']],
    ['NaN', Number.NaN, 0, ['lat']],
    ['infinito', 0, Number.POSITIVE_INFINITY, ['lng']],
    ['texto numérico', '14.6', 0, ['lat']],
    ['nulo', null, undefined, ['lat', 'lng']],
  ])('rechaza %s', (_caso, lat, lng, campos) => {
    expect(Coordenada.validar(lat, lng).map((e) => e.campo)).toEqual(campos);
  });

  it('devuelve un mensaje amigable por campo', () => {
    expect(Coordenada.validar(100, 200)).toEqual([
      { campo: 'lat', mensaje: MENSAJE_LAT_INVALIDA },
      { campo: 'lng', mensaje: MENSAJE_LNG_INVALIDA },
    ]);
  });

  it('de() lanza si se saltó la validación', () => {
    expect(() => Coordenada.de(100, 0)).toThrow(RangeError);
  });

  it('compara por valor', () => {
    expect(Coordenada.de(1, 2).equals({ lat: 1, lng: 2 })).toBe(true);
    expect(Coordenada.de(1, 2).equals({ lat: 1, lng: 3 })).toBe(false);
  });
});

describe('Peso', () => {
  it.each([0.01, 1, 4.5, PESO_MAXIMO_KG])('acepta %p kg', (kg) => {
    expect(Peso.validar(kg)).toEqual([]);
    expect(Peso.de(kg).kg).toBe(kg);
  });

  it.each([
    ['cero', 0],
    ['negativo', -1],
    ['por encima del máximo', PESO_MAXIMO_KG + 0.01],
    ['tan pequeño que redondea a cero', 0.004],
    ['NaN', Number.NaN],
    ['infinito', Number.POSITIVE_INFINITY],
    ['texto numérico', '5'],
    ['nulo', null],
  ])('rechaza %s', (_caso, kg) => {
    expect(Peso.validar(kg)).toEqual([{ campo: 'peso', mensaje: MENSAJE_PESO_INVALIDO }]);
  });

  it('redondea a 2 decimales', () => {
    expect(Peso.de(4.456).kg).toBe(4.46);
  });

  it('de() lanza si se saltó la validación', () => {
    expect(() => Peso.de(0)).toThrow(RangeError);
  });
});

describe('EstadoOrden', () => {
  it('define los cuatro estados del enunciado con su descripción', () => {
    expect(ESTADOS_ORDEN).toEqual(['PENDIENTE_ASIGNACION', 'ASIGNADA', 'EN_RUTA', 'ENTREGADA']);
    expect(DESCRIPCION_ESTADO_ORDEN).toEqual({
      PENDIENTE_ASIGNACION: 'Pendiente de Asignación',
      ASIGNADA: 'Asignada',
      EN_RUTA: 'En Ruta',
      ENTREGADA: 'Entregada',
    });
  });

  it('solo permite avanzar un paso: pendiente → asignada → en ruta → entregada', () => {
    const { PENDIENTE_ASIGNACION, ASIGNADA, EN_RUTA, ENTREGADA } = ESTADO_ORDEN;

    expect(puedeTransicionar(PENDIENTE_ASIGNACION, ASIGNADA)).toBe(true);
    expect(puedeTransicionar(ASIGNADA, EN_RUTA)).toBe(true);
    expect(puedeTransicionar(EN_RUTA, ENTREGADA)).toBe(true);

    expect(puedeTransicionar(PENDIENTE_ASIGNACION, ENTREGADA)).toBe(false);
    expect(puedeTransicionar(ASIGNADA, ENTREGADA)).toBe(false);
    expect(puedeTransicionar(EN_RUTA, ASIGNADA)).toBe(false);
    expect(puedeTransicionar(ENTREGADA, EN_RUTA)).toBe(false);
    expect(puedeTransicionar(ASIGNADA, ASIGNADA)).toBe(false);
  });

  it('esEstadoOrden reconoce solo los códigos válidos', () => {
    expect(esEstadoOrden('EN_RUTA')).toBe(true);
    expect(esEstadoOrden('en_ruta')).toBe(false);
    expect(esEstadoOrden('CANCELADA')).toBe(false);
    expect(esEstadoOrden(1)).toBe(false);
  });
});
