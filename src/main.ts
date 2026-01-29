import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'reflect-metadata';
import packageJson from '../package.json';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const version = packageJson.version ?? '1.0.0';

  const swaggerConfig = new DocumentBuilder()
    .setTitle('NatiOps API')
    .setDescription('Documentação da API responsável por produtos, reservas e sincronizações')
    .setVersion(version)
    .setLicense('ISC', 'https://opensource.org/licenses/ISC')
    .addServer('http://localhost:3000', 'Ambiente local')
    .addTag('Produtos', 'Operações de produto e estoque')
    .addTag('Reservas', 'Gestão de reservas')
    .addTag('Catálogo', 'Consultas de catálogo e imagens')
    .addTag('Sincronização', 'Controle das execuções de sincronização')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
