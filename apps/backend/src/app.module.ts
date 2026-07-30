import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ConsentModule } from './modules/consent/consent.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { DocumentVaultModule } from './modules/document-vault/document-vault.module.js';
import { LifeEventModule } from './modules/life-event/life-event.module.js';
import { TimelineReminderModule } from './modules/timeline-reminder/timeline-reminder.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        // autoLoadEntities picks up every entity registered via TypeOrmModule.forFeature()
        autoLoadEntities: true,
        // synchronize is disabled — schema is managed by migrations
        synchronize: false,
      }),
    }),

    AuthModule,
    DashboardModule,
    TimelineReminderModule,
    LifeEventModule,
    DocumentVaultModule,
    ConsentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
