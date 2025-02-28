import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));

export const appConfig = registerAs('app', () => ({
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
}));

export const smtpConfig = registerAs('smtp', () => ({
  server: process.env.SMTP_SERVER,
  user: process.env.SMTP_USER,
  password: process.env.SMTP_PASSWORD,
  from: process.env.SMTP_FROM || 'noreply@example.com',
}));

export const cookieConfig = registerAs('cookie', () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    secret: process.env.COOKIE_SECRET || 'your-secret-key',
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  };
});
