import { DetalleValidacion } from '../../Domain/api.models';

/** Sobre que devuelven los `POST` y `PATCH` de la API (contrato, sección 4). */
export interface RespuestaEscrituraApi<T> {
  statusCode: number;
  code: string;
  message: string;
  data: T;
}

/** Cuerpo de cualquier respuesta de error de la API (contrato, sección 4). */
export interface ErrorApi {
  statusCode: number;
  code: string;
  message: string;
  timestamp: string;
  details?: DetalleValidacion[];
}
