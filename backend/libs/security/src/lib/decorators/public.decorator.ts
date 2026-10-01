import { type CustomDecorator, SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marca un endpoint como accesible sin token (login, health). */
export const Public = (): CustomDecorator<string> => SetMetadata(IS_PUBLIC_KEY, true);
