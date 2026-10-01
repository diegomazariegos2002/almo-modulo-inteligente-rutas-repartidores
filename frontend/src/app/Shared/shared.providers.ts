import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { LOGGER_CONTRACT } from './Application/contracts/logger.contract';
import { ConsoleLoggerAdapter } from './Infrastructure/Adapters/console-logger.adapter';

/** Registra los servicios transversales: por ahora, el registro de diagnóstico. */
export const provideShared = (): EnvironmentProviders =>
  makeEnvironmentProviders([{ provide: LOGGER_CONTRACT, useClass: ConsoleLoggerAdapter }]);
