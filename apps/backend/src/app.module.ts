import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
// ConsentModule is intentionally NOT imported here — it is already imported
// transitively via DashboardModule, which re-exports ConsentService.
// Importing it again at the root level would be redundant.
import { ChatModule } from './modules/chat/chat.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { DocumentVaultModule } from './modules/document-vault/document-vault.module.js';
import { LifeEventModule } from './modules/life-event/life-event.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { TimelineReminderModule } from './modules/timeline-reminder/timeline-reminder.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');

        // If DATABASE_URL is set (e.g. Supabase session pooler), use it directly.
        // Otherwise fall back to individual DB_* vars for local development.
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            ssl: {
              rejectUnauthorized: false, // Required for Supabase / Cloud DB
            },
            // autoLoadEntities picks up every entity registered via TypeOrmModule.forFeature()
            autoLoadEntities: true,
            // synchronize is disabled — schema is managed by migrations
            synchronize: false,
          };
        }

        return {
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
        };
      },
    }),

    AuthModule,
    UsersModule,
    DashboardModule,
    TimelineReminderModule,
    LifeEventModule,
    DocumentVaultModule,
    NotificationsModule,
    AdminModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
