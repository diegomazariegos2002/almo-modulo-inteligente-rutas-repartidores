import { type ErrorDetail } from '@almo/exceptions';

/** Peso máximo de un paquete, en kilogramos. */
export const PESO_MAXIMO_KG = 50;

export const MENSAJE_PESO_INVALIDO = `El peso debe ser un número mayor que 0 y de hasta ${PESO_MAXIMO_KG} kg.`;

/** Peso de un paquete en kilogramos, con 2 decimales (la precisión que guarda la base). */
export class Peso {
  private constructor(readonly kg: number) {}

  /** Errores de validación de un peso; vacío si es válido. */
  static validar(kg: unknown): ErrorDetail[] {
    const valido = typeof kg === 'number' && Number.isFinite(kg) && Peso.redondear(kg) > 0 && kg <= PESO_MAXIMO_KG;
    return valido ? [] : [{ campo: 'peso', mensaje: MENSAJE_PESO_INVALIDO }];
  }

  /** Crea el peso; lanza si es inválido. Validar antes con `Peso.validar`. */
  static de(kg: number): Peso {
    if (Peso.validar(kg).length > 0) throw new RangeError(MENSAJE_PESO_INVALIDO);
    return new Peso(Peso.redondear(kg));
  }

  private static redondear(kg: number): number {
    return Math.round(kg * 100) / 100;
  }
}
