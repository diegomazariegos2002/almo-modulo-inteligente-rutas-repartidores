import { inject, Injectable } from '@angular/core';
import { SESION_CONTRACT } from './contracts/sesion.contract';

@Injectable()
export class CerrarSesionUseCase {
  private readonly sesion = inject(SESION_CONTRACT);

  /** El token no se invalida en el servidor (la API no tiene logout): basta con olvidarlo. */
  execute(): void {
    this.sesion.limpiar();
  }
}
