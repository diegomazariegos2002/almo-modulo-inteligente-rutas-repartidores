/** Verificación de contraseñas contra su hash almacenado. */
export abstract class PasswordHasher {
  abstract verificar(plano: string, hash: string): Promise<boolean>;
}
