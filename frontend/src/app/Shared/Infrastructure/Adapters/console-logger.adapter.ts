import { Injectable } from '@angular/core';
import { LoggerContract } from '../../Application/contracts/logger.contract';

/** Único punto de la aplicación autorizado a escribir en la consola del navegador. */
@Injectable()
export class ConsoleLoggerAdapter implements LoggerContract {
  warn(mensaje: string, contexto?: unknown): void {
    console.warn(mensaje, contexto ?? '');
  }

  error(mensaje: string, contexto?: unknown): void {
    console.error(mensaje, contexto ?? '');
  }
}
