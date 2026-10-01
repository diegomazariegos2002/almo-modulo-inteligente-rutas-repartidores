import { InjectionToken } from '@angular/core';

/**
 * Registro de diagnóstico. El código de la aplicación no usa `console` directamente
 * (ESLint lo prohíbe): depende de este contrato y así el destino del log se puede
 * cambiar sin tocar a quien lo usa.
 */
export interface LoggerContract {
  warn(mensaje: string, contexto?: unknown): void;
  error(mensaje: string, contexto?: unknown): void;
}

export const LOGGER_CONTRACT = new InjectionToken<LoggerContract>('LoggerContract');
