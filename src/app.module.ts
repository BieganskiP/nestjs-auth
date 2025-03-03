import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { RoutesModule } from './routes/routes.module';
import { RegionsModule } from './regions/regions.module';
import { DeliveryManifestsModule } from './delivery-manifests/delivery-manifests.module';
import { DeliveryStopsModule } from './delivery-stops/delivery-stops.module';
import { RateLimiterMiddleware } from './common/middleware/rate-limiter.middleware';
import {
  databaseConfig,
  appConfig,
  smtpConfig,
  cookieConfig,
} from './config/env.config';
import { getDatabaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig, smtpConfig, cookieConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    UsersModule,
    AuthModule,
    EmailModule,
    RoutesModule,
    RegionsModule,
    DeliveryManifestsModule,
    DeliveryStopsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimiterMiddleware).forRoutes('*');
  }
}
