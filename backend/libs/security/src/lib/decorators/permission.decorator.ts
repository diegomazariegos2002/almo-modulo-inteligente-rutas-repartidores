import { type CustomDecorator, SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';

/** Permiso que debe traer el token para ejecutar el endpoint. */
export const Permission = (code: string): CustomDecorator<string> => SetMetadata(PERMISSION_KEY, code);
