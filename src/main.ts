import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as session from 'express-session';
import * as passport from 'passport';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as csurf from 'csurf';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Security headers
  app.use(helmet());

  // Cookie parser
  app.use(cookieParser());

  // Configure CORS
  const frontendUrl = configService.get<string>('app.frontendUrl');
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // Configure session
  const cookieConfig = configService.get('cookie');
  app.use(
    session({
      secret: cookieConfig.secret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: cookieConfig.httpOnly,
        secure: cookieConfig.secure,
        maxAge: cookieConfig.maxAge,
        sameSite: cookieConfig.sameSite,
      },
    }),
  );

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // CSRF protection
  app.use(csurf({ cookie: true }));

  // Global prefix
  app.setGlobalPrefix('api');

  const port = configService.get<number>('app.port') || 3000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
