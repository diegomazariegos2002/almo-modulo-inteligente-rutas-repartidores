import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const PREFIJO = 'scrypt';
const LONGITUD_SAL = 16;
const LONGITUD_CLAVE = 64;

function derivar(plano: string, sal: Buffer, longitud: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(plano, sal, longitud, (error, clave) => (error ? reject(error) : resolve(clave)));
  });
}

/**
 * Deriva un hash con scrypt (módulo `crypto` de Node, sin dependencias nativas).
 * Formato almacenado: `scrypt$<sal base64>$<hash base64>`; cada hash lleva su propia sal.
 */
export async function hashPassword(plano: string): Promise<string> {
  const sal = randomBytes(LONGITUD_SAL);
  const clave = await derivar(plano, sal, LONGITUD_CLAVE);
  return [PREFIJO, sal.toString('base64'), clave.toString('base64')].join('$');
}

/** Compara en tiempo constante para no filtrar información por duración. */
export async function verifyPassword(plano: string, almacenado: string): Promise<boolean> {
  const [prefijo, salB64, claveB64] = almacenado.split('$');
  if (prefijo !== PREFIJO || !salB64 || !claveB64) return false;

  const esperada = Buffer.from(claveB64, 'base64');
  if (esperada.length === 0) return false;

  const calculada = await derivar(plano, Buffer.from(salB64, 'base64'), esperada.length);
  return timingSafeEqual(esperada, calculada);
}
