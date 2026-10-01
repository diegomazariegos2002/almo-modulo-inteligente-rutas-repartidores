import { resolve } from 'node:path';
import { config } from 'dotenv';
import * as joi from 'joi';

// En local se carga el .env de la raíz del workspace; en Docker las variables llegan del contenedor.
config({ path: resolve(process.cwd(), '.env'), quiet: true });

interface EnvVars {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
  CACHE_TTL_RUTA_SECONDS: number;
  JWT_SECRET: string;
  JWT_EXPIRES_IN_SECONDS: number;
  ENABLE_SWAGGER: boolean;
  ALLOWED_ORIGINS: string;
}

const schema = joi
  .object<EnvVars>({
    NODE_ENV: joi.string().valid('development', 'production', 'test').default('development'),
    PORT: joi.number().port().default(3000),
    DATABASE_URL: joi
      .string()
      .uri({ scheme: ['postgresql', 'postgres'] })
      .required(),
    REDIS_HOST: joi.string().default('localhost'),
    REDIS_PORT: joi.number().port().default(6379),
    REDIS_PASSWORD: joi.string().allow('').default(''),
    CACHE_TTL_RUTA_SECONDS: joi.number().integer().min(1).default(300),
    // Un secreto corto haría trivial falsificar tokens HS256.
    JWT_SECRET: joi.string().min(32).required(),
    JWT_EXPIRES_IN_SECONDS: joi.number().integer().min(60).default(28_800),
    ENABLE_SWAGGER: joi.boolean().default(false),
    ALLOWED_ORIGINS: joi.string().allow('').default(''),
  })
  // Docker y el sistema operativo aportan muchas variables ajenas al servicio.
  .unknown(true);

const { error, value } = schema.validate(process.env);
// Falla al arrancar, con el nombre de la variable: mejor que un error raro en la primera petición.
if (error) throw new Error(`[rutas] Configuración inválida: ${error.message}`);

const e: EnvVars = value;

export const envs = {
  nodeEnv: e.NODE_ENV,
  port: e.PORT,
  databaseUrl: e.DATABASE_URL,
  redis: {
    host: e.REDIS_HOST,
    port: e.REDIS_PORT,
    password: e.REDIS_PASSWORD,
  },
  cacheTtlRutaSeconds: e.CACHE_TTL_RUTA_SECONDS,
  jwt: {
    secret: e.JWT_SECRET,
    expiresInSeconds: e.JWT_EXPIRES_IN_SECONDS,
  },
  enableSwagger: e.ENABLE_SWAGGER,
  allowedOrigins: e.ALLOWED_ORIGINS.split(',')
    .map((origen) => origen.trim())
    .filter(Boolean),
};
