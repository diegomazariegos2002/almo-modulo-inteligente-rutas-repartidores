import { InjectionToken, Signal } from '@angular/core';
import { Sesion } from '../../Domain/sesion.entity';

/**
 * Sesión del usuario. La aplicación solo conoce este contrato; dónde se guarda
 * (almacenamiento del navegador, memoria en una prueba) lo decide el adapter.
 */
export interface SesionContract {
  /** Sesión vigente, o `null` si nadie ha iniciado sesión. */
  readonly actual: Signal<Sesion | null>;
  guardar(sesion: Sesion): void;
  limpiar(): void;
}

export const SESION_CONTRACT = new InjectionToken<SesionContract>('SesionContract');
