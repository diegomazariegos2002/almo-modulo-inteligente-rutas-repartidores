import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

// Si el arranque falla todavía no existe el inyector, así que no se puede usar el
// contrato de logging: es el único `console` permitido fuera de su adapter.
bootstrapApplication(App, appConfig).catch((error: unknown) => console.error(error));
