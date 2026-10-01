// Piezas que dependen de NestJS: solo las puede importar la capa de infraestructura.
export { I18nResolver, SimpleI18nResolver } from './i18n-resolver';
export type { I18nCatalog } from './i18n-resolver';
export { DEFAULT_LOCALE, extractLocaleFromRequest } from './http-locale';
export { buildErrorBody, toErrorBody, toOkBody } from './http-response.mapper';
export type { ErrorResponseBody, OkResponseBody } from './http-response.mapper';
export { ResultHttpInterceptor } from './result-http.interceptor';
export { DomainExceptionFilter } from './domain-exception.filter';
export { SkipResultHttpInterceptor, SKIP_RESULT_HTTP_INTERCEPTOR_KEY } from './skip-result-http-interceptor.decorator';
export { validationExceptionFactory } from './validation-exception.factory';
