export interface RedisCacheModuleOptions {
  host: string;
  port: number;
  password?: string;
}

export const REDIS_OPTIONS = Symbol('REDIS_OPTIONS');
