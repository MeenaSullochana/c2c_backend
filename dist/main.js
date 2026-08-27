"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: true,
    });
    const config = app.get((config_1.ConfigService));
    const prefix = config.get('API_PREFIX', { infer: true });
    const port = config.get('API_PORT', { infer: true });
    const origin = config.get('WEB_ORIGIN', { infer: true });
    app.setGlobalPrefix(prefix);
    app.use((0, helmet_1.default)());
    app.enableCors({
        origin,
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor());
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('C2C Platform API')
        .setDescription('Modular multi-tenant SaaS API. Secrets must never appear in examples.')
        .setVersion('0.1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup(`${prefix}/docs`, app, document);
    await app.listen(port);
    common_1.Logger.log(`API listening on http://localhost:${port}/${prefix}`);
}
void bootstrap();
//# sourceMappingURL=main.js.map