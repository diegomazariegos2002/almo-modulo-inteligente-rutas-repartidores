import { PASSWORD_DEMO } from '@almo/prisma/seed';
import axios, { type AxiosResponse } from 'axios';

export const CORREO = {
  cliente: 'cliente@almo.test',
  ana: 'repartidor1@almo.test',
  bruno: 'repartidor2@almo.test',
  carla: 'repartidor3@almo.test',
  admin: 'admin@almo.test',
} as const;

export type Sesion = { headers: { Authorization: string } };

/**
 * Bitácora de pasos de un flujo. Cada paso y cada respuesta se imprimen con su
 * estado y su cuerpo, así un fallo se diagnostica leyendo el log, sin depurar.
 */
export function crearBitacora(prefijo: string) {
  let numero = 0;

  return {
    step(label: string, payload?: Record<string, unknown>): void {
      numero += 1;
      const etiqueta = `[${prefijo}][${String(numero).padStart(2, '0')}]`;
      if (payload) console.debug(`${etiqueta} ${label}`, payload);
      else console.debug(`${etiqueta} ${label}`);
    },

    /** Imprime estado + cuerpo y lanza si la respuesta es 4xx/5xx. */
    expectOkResponse(label: string, res: AxiosResponse): void {
      const resumen = typeof res.data === 'object' ? res.data : { raw: res.data };
      console.debug(`  → status=${res.status} ${label}`, JSON.stringify(resumen));
      if (res.status >= 400) {
        throw new Error(`${label} respondió ${res.status} — body: ${JSON.stringify(res.data)}`);
      }
    },
  };
}

/** Inicia sesión con una cuenta de demostración y devuelve la cabecera lista para usar. */
export async function iniciarSesion(correo: string): Promise<Sesion> {
  const res = await axios.post('/api/auth/login', { correo, password: PASSWORD_DEMO });
  if (res.status !== 200) {
    throw new Error(`No se pudo iniciar sesión con ${correo}: ${res.status} ${JSON.stringify(res.data)}`);
  }
  return { headers: { Authorization: `Bearer ${res.data.accessToken}` } };
}
