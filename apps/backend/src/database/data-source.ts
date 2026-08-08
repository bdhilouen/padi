/**
 * TypeORM DataSource used exclusively by the TypeORM CLI for migration
 * generation and execution. This is NOT the DataSource used at runtime
 * (that one is wired through TypeOrmModule.forRootAsync in app.module.ts).
 *
 * Usage:
 *   npm run migration:generate -- src/database/migrations/<Name>
 *   npm run migration:run
 *   npm run migration:revert
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

// Cek apakah ada DATABASE_URL, kalau tidak ada baru fallback ke variabel terpisah
const isUsingUrl = Boolean(process.env.DATABASE_URL);

export const AppDataSource = new DataSource(
  isUsingUrl
    ? {
        type: 'postgres',
        url: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false, // Wajib buat Supabase / Cloud DB
        },
        entities: ['dist/modules/**/entities/*.entity.js'],
        migrations: ['dist/database/migrations/*.js'],
        synchronize: false,
        logging: true,
      }
    : {
        type: 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        port: parseInt(process.env.DB_PORT ?? '5432', 10),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        entities: ['dist/modules/**/entities/*.entity.js'],
        migrations: ['dist/database/migrations/*.js'],
        synchronize: false,
        logging: true,
      },
);
