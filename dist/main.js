"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
require("reflect-metadata");
const package_json_1 = __importDefault(require("../package.json"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    const version = package_json_1.default.version ?? '1.0.0';
    const swaggerConfig = new swagger_1.DocumentBuilder()
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
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
        },
    });
    await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
void bootstrap();
