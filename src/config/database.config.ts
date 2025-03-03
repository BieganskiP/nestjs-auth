import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const databaseUrl = configService.get<string>('database.url');

  if (!databaseUrl) {
    throw new Error('Database URL is not defined in environment variables');
  }

  return {
    type: 'postgres',
    url: databaseUrl,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: configService.get('app.nodeEnv') !== 'production',
    ssl:
      configService.get('app.nodeEnv') === 'production'
        ? { rejectUnauthorized: false }
        : false,
  };
};
