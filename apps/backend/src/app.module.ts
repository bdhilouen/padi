import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { TimelineReminderModule } from './modules/timeline-reminder/timeline-reminder.module';
import { LifeEventModule } from './modules/life-event/life-event.module';
import { DocumentVaultModule } from './modules/document-vault/document-vault.module';
import { ConsentModule } from './modules/consent/consent.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true, // OK buat prototipe, matiin kalau udah production
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
