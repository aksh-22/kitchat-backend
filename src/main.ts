import { NestFactory } from '@nestjs/core';
import { MainModule } from './main.module';
import { ValidationPipe } from '@nestjs/common';
import { TrimPipe } from './trim.pipe';

async function bootstrap() {
  const app = await NestFactory.create(MainModule);
  app.useGlobalPipes(new TrimPipe());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  app.enableCors({
    origin: '*',
  });

  await app.listen(3002);
}
bootstrap();
