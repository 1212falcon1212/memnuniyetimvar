import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3001', // Admin panel
    ],
    credentials: true,
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global filters
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('MemnuniyetimVar API')
    .setDescription('Türkiye\'nin pozitif müşteri deneyimi platformu API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Kimlik doğrulama')
    .addTag('Users', 'Kullanıcı işlemleri')
    .addTag('Companies', 'Firma işlemleri')
    .addTag('Reviews', 'Memnuniyet/yorum işlemleri')
    .addTag('Categories', 'Kategori işlemleri')
    .addTag('Tags', 'Etiket işlemleri')
    .addTag('Search', 'Arama işlemleri')
    .addTag('Admin', 'Yönetim paneli')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.APP_PORT || 4000;
  await app.listen(port);
  console.log(`MemnuniyetimVar API çalışıyor: http://localhost:${port}`);
  console.log(`Swagger: http://localhost:${port}/api/docs`);
}
bootstrap();
