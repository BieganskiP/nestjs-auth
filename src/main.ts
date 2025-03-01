import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as session from 'express-session';
import * as passport from 'passport';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as csrf from 'csurf';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable validation with better error messages
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map(error => {
          return {
            property: error.property,
            constraints: error.constraints,
          };
        });
        return {
          statusCode: 400,
          message: messages,
          error: 'Bad Request',
        };
      },
    }),
  );

  // Security headers
  app.use(helmet());

  // Cookie parser
  app.use(cookieParser());

  // Configure CORS with credentials support
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL'),
    credentials: true,
  });

  // Configure session
  const sessionConfig: session.SessionOptions = {
    secret: configService.get<string>('COOKIE_SECRET', ''),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
  };

  app.use(session(sessionConfig));

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Only enable CSRF protection in production
  if (process.env.NODE_ENV === 'production') {
    const csrfMiddleware = csrf({ cookie: { secure: true, sameSite: 'none' } });

    app.use(csrfMiddleware);

    // Add middleware to expose CSRF token
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (typeof req.csrfToken === 'function') {
        res.cookie('XSRF-TOKEN', req.csrfToken(), {
          secure: true,
          sameSite: 'none',
          httpOnly: false,
        });
      }
      next();
    });
  }

  // Global prefix
  app.setGlobalPrefix('api');

  await app.listen(configService.get<number>('PORT', 3001));
  console.log(`Application is running on: ${await app.getUrl()}`);
}

void bootstrap();
