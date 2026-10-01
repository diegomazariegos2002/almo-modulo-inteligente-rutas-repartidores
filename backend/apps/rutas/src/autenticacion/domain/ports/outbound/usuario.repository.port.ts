import type { DomainError } from '@almo/exceptions';
import type { Result } from '@almo/result';
import type { Usuario } from '../../entities/usuario.entity';

export abstract class UsuarioRepository {
  /** `ok(null)` si no hay un usuario con ese correo. */
  abstract findByCorreo(correo: string): Promise<Result<Usuario | null, DomainError>>;
}
