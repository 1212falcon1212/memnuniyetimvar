import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'memnuniyetimvar',
  password: process.env.DB_PASSWORD || 'memnuniyetimvar_dev',
  database: process.env.DB_NAME || 'memnuniyetimvar',
  autoLoadEntities: true,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
}));
