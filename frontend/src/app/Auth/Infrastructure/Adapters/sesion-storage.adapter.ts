import { inject, Injectable, signal } from '@angular/core';
import { LOGGER_CONTRACT } from '@shared/Application/contracts/logger.contract';
import { SesionContract } from '../../Application/contracts/sesion.contract';
import { SesionPlain } from '../../Domain/auth.models';
import { Sesion } from '../../Domain/sesion.entity';

const CLAVE = 'rutas.sesion';

/**
 * Guarda la sesión en `sessionStorage`: sobrevive a una recarga de la página, se
 * borra al cerrar la pestaña y cada pestaña tiene la suya, lo que permite probar dos
 * roles a la vez (por ejemplo, cliente y repartidor).
 */
@Injectable()
export class SesionStorageAdapter implements SesionContract {
  private readonly logger = inject(LOGGER_CONTRACT);
  private readonly sesion = signal<Sesion | null>(this.restaurar());

  readonly actual = this.sesion.asReadonly();

  guardar(sesion: Sesion): void {
    sessionStorage.setItem(CLAVE, JSON.stringify(sesion.toPlain()));
    this.sesion.set(sesion);
  }

  limpiar(): void {
    sessionStorage.removeItem(CLAVE);
    this.sesion.set(null);
  }

  /** Recupera la sesión guardada; descarta la que ya expiró o no se puede leer. */
  private restaurar(): Sesion | null {
    const guardada = sessionStorage.getItem(CLAVE);
    if (!guardada) {
      return null;
    }

    try {
      const sesion = Sesion.fromPlain(JSON.parse(guardada) as SesionPlain);
      if (sesion.estaVigente()) {
        return sesion;
      }
    } catch (error) {
      this.logger.warn('La sesión guardada no se pudo leer y se descartó.', error);
    }

    sessionStorage.removeItem(CLAVE);
    return null;
  }
}
