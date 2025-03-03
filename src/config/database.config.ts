import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const databaseUrl = configService.get<string>('database.url');

  if (!databaseUrl) {
    throw new Error('Database URL is not defined in environment variables');
  }

  const url = new URL(databaseUrl);

  return {
    type: 'postgres',
    host: url.hostname,
    port: parseInt(url.port),
    username: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: configService.get('app.nodeEnv') !== 'production',
    ssl:
      configService.get('app.nodeEnv') === 'production'
        ? { rejectUnauthorized: false }
        : false,
  };
};
