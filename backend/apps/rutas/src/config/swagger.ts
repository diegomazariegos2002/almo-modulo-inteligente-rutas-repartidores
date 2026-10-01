import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { envs } from './rutas.envs';

const DESCRIPCION = `
API del módulo de asignación inteligente de rutas para repartidores.

**Cómo probarla desde aquí**

1. Ejecuta \`POST /api/auth/login\` con una de las cuentas de demostración del README.
2. Copia el \`accessToken\` de la respuesta, pulsa **Authorize** y pégalo.
3. Cada endpoint indica el permiso que exige; el rol del token decide si pasa.

Los mensajes se devuelven en español; con \`Accept-Language: en\` llegan en inglés.
`;

export function setupSwagger(app: INestApplication): void {
  if (!envs.enableSwagger) return;

  const config = new DocumentBuilder().setTitle('Rutas API').setDescription(DESCRIPCION).setVersion('1.0').addBearerAuth().build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/docs/openapi.json',
    customSiteTitle: 'Rutas API',
    swaggerOptions: { persistAuthorization: true },
  });
}
