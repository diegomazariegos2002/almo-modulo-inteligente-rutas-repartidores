import type { DomainError } from '@almo/exceptions';
import type { Result } from '@almo/result';
import type { UsuarioAutenticado } from '../interfaces/usuario-autenticado.interface';

export interface OwnershipParams {
  /** Tipo de recurso en kebab-case; cada servicio define los suyos. */
  resourceType: string;
  resourceId: string;
  user: UsuarioAutenticado;
}

/**
 * Autorización a nivel de objeto (BOLA): tener el permiso no basta, el recurso
 * concreto debe pertenecer a quien lo pide.
 *
 * Cada servicio aporta su adaptador. El controller llama `assertOwnership()`
 * ANTES del caso de uso. Respuestas esperadas:
 *  - `ok`                      → el usuario puede operar sobre el recurso.
 *  - `err(NotFoundError)`      → el recurso no existe.
 *  - `err(RecursoAjenoError)`  → existe, pero es de otro usuario.
 */
export abstract class ResourceOwnershipPort {
  abstract assertOwnership(params: OwnershipParams): Promise<Result<void, DomainError>>;
}
