import 'reflect-metadata';
import { config } from 'dotenv';
import { AppDataSource } from '../data-source';
import { User } from '../../modules/users/entities/user.entity';
import { ConsentRecord } from '../../modules/consent/entities/consent-record.entity';
import { ServiceStatus } from '../../modules/dashboard/entities/service-status.entity';
import { Deadline } from '../../modules/timeline-reminder/entities/deadline.entity';
import { NotificationLog } from '../../modules/notifications/entities/notification-log.entity';
import { LifeEvent } from '../../modules/life-event/entities/life-event.entity';
import { LifeEventSelection } from '../../modules/life-event/entities/life-event-selection.entity';
import { ChecklistItem } from '../../modules/life-event/entities/checklist-item.entity';
import { CryptoService } from '../../common/crypto/crypto.service';
import {
  ConsentStatusEnum,
  NotificationChannelEnum,
  NotificationTypeEnum,
  ServiceNameEnum,
  StatusEnum,
  UserRoleEnum,
} from '../../common/enums';

// Load environment variables from .env
config();

/**
 * Fixed demo user account definitions.
 */
const DEMO_USERS = [
  {
    email: 'user1@padi.test',
    password: 'Password123!',
    fullName: 'Budi Santoso',
    nik: '3171011503850001',
    phoneNumber: '081234567891',
  },
  {
    email: 'user2@padi.test',
    password: 'Password123!',
    fullName: 'Siti Aminah',
    nik: '3171014207900002',
    phoneNumber: '081234567892',
  },
  {
    email: 'user3@padi.test',
    password: 'Password123!',
    fullName: 'Andi Wijaya',
    nik: '3171012011920003',
    phoneNumber: '081234567893',
  },
];

const cryptoService = new CryptoService();

/** Helper function to format Date object into YYYY-MM-DD string for PostgreSQL DATE columns */
function formatDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

async function seedDemoData() {
  console.log('Connecting to database for demo seeding...');

  if (!AppDataSource.isInitialized) {
    AppDataSource.setOptions({
      entities: [
        User,
        ConsentRecord,
        ServiceStatus,
        Deadline,
        NotificationLog,
        LifeEvent,
        LifeEventSelection,
        ChecklistItem,
      ],
    });
    await AppDataSource.initialize();
  }

  const userRepo = AppDataSource.getRepository(User);
  const consentRepo = AppDataSource.getRepository(ConsentRecord);
  const serviceStatusRepo = AppDataSource.getRepository(ServiceStatus);
  const deadlineRepo = AppDataSource.getRepository(Deadline);
  const notificationRepo = AppDataSource.getRepository(NotificationLog);
  const lifeEventRepo = AppDataSource.getRepository(LifeEvent);
  const selectionRepo = AppDataSource.getRepository(LifeEventSelection);
  const checklistRepo = AppDataSource.getRepository(ChecklistItem);

  const seededSummary: Array<{ email: string; password: string; name: string }> = [];

  // Compute dates for deadlines (ACTIVE = future > 30d, WARNING = future <= 30d, EXPIRED = past)
  const today = new Date();
  const futureActiveDate = new Date(today);
  futureActiveDate.setDate(today.getDate() + 60);

  const futureWarningDate = new Date(today);
  futureWarningDate.setDate(today.getDate() + 5);

  const pastExpiredDate = new Date(today);
  pastExpiredDate.setDate(today.getDate() - 15);

  const nikEncryptionKey = cryptoService.getNikEncryptionKey();

  for (const demoConfig of DEMO_USERS) {
    // 1. Check idempotency: skip if user already exists
    const existingUser = await userRepo.findOne({
      where: { email: demoConfig.email },
      withDeleted: false,
    });

    if (existingUser) {
      console.log(
        `[DEMO SEED SKIPPED] User "${demoConfig.email}" already exists.`,
      );
      seededSummary.push({
        email: demoConfig.email,
        password: `${demoConfig.password} (Existing account)`,
        name: demoConfig.fullName,
      });
      continue;
    }

    console.log(`Creating demo user: ${demoConfig.email} (${demoConfig.fullName})...`);

    const passwordHash = await cryptoService.hashPassword(demoConfig.password);
    const nikHash = cryptoService.hashNik(demoConfig.nik);

    // Create User record using pgcrypto for encrypted NIK
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let userId: string;

    try {
      const result = (await queryRunner.query(
        `
        INSERT INTO users
          (nik_encrypted, nik_hash, email, password_hash, full_name, phone_number, role, is_active)
        VALUES
          (pgp_sym_encrypt($1::text, $2), $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
        `,
        [
          demoConfig.nik,
          nikEncryptionKey,
          nikHash,
          demoConfig.email,
          passwordHash,
          demoConfig.fullName,
          demoConfig.phoneNumber,
          UserRoleEnum.USER,
          true,
        ],
      )) as Array<{ id: string }>;

      await queryRunner.commitTransaction();
      userId = result[0].id;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error(`[DEMO SEED ERROR] Failed to create user ${demoConfig.email}:`, err);
      continue;
    } finally {
      await queryRunner.release();
    }

    // 2. Seed Related Data based on user email
    if (demoConfig.email === 'user1@padi.test') {
      // Consent Records
      await consentRepo.save([
        consentRepo.create({ userId, serviceName: ServiceNameEnum.CORETAX, status: ConsentStatusEnum.GRANTED, grantedAt: new Date() }),
        consentRepo.create({ userId, serviceName: ServiceNameEnum.BPJS, status: ConsentStatusEnum.GRANTED, grantedAt: new Date() }),
        consentRepo.create({ userId, serviceName: ServiceNameEnum.SAMSAT, status: ConsentStatusEnum.GRANTED, grantedAt: new Date() }),
        consentRepo.create({ userId, serviceName: ServiceNameEnum.SATUSEHAT, status: ConsentStatusEnum.PENDING }),
        consentRepo.create({ userId, serviceName: ServiceNameEnum.PLN, status: ConsentStatusEnum.PENDING }),
      ]);

      // Service Status (ACTIVE, WARNING, EXPIRED examples)
      await serviceStatusRepo.save([
        serviceStatusRepo.create({
          userId,
          serviceName: ServiceNameEnum.CORETAX,
          status: StatusEnum.ACTIVE,
          rawData: { npwp: '98.765.432.1-012.000', tax_year: 2025, status: 'COMPLIANT', last_filing: '2025-03-15' },
        }),
        serviceStatusRepo.create({
          userId,
          serviceName: ServiceNameEnum.BPJS,
          status: StatusEnum.ACTIVE,
          rawData: { bpjs_number: '0001234567890', class: 'KLAS_1', status: 'ACTIVE', faskes: 'Klinik Sehat Bersama' },
        }),
        serviceStatusRepo.create({
          userId,
          serviceName: ServiceNameEnum.SAMSAT,
          status: StatusEnum.WARNING,
          rawData: { plate_number: 'B 1234 ABC', vehicle_type: 'MOTORCYCLE', tax_due_date: formatDateString(futureWarningDate), amount_due: 350000 },
        }),
      ]);

      // Deadlines (ACTIVE, WARNING, EXPIRED ranges)
      const d1 = await deadlineRepo.save(
        deadlineRepo.create({
          userId,
          serviceName: ServiceNameEnum.CORETAX,
          title: 'SPT Tahunan PPh Orang Pribadi 2025',
          description: 'Pelaporan SPT Tahunan PPh melalui Coretax DJP',
          dueDate: formatDateString(futureActiveDate),
        }),
      );

      const d2 = await deadlineRepo.save(
        deadlineRepo.create({
          userId,
          serviceName: ServiceNameEnum.SAMSAT,
          title: 'Pajak Kendaraan Bermotor B 1234 ABC',
          description: 'Pembayaran Pajak Tahunan Sepeda Motor Honda Vario',
          dueDate: formatDateString(futureWarningDate),
        }),
      );

      const d3 = await deadlineRepo.save(
        deadlineRepo.create({
          userId,
          serviceName: ServiceNameEnum.BPJS,
          title: 'Iuran BPJS Kesehatan Bulan Lalu',
          description: 'Tunggakan Iuran BPJS Kesehatan Kelas 1',
          dueDate: formatDateString(pastExpiredDate),
        }),
      );

      // Notification Logs (Read and Unread, mixing SMART_REMINDER & GENERAL)
      await notificationRepo.save([
        notificationRepo.create({
          userId,
          deadlineId: d2.id,
          title: 'Peringatan Jatuh Tempo SAMSAT',
          type: NotificationTypeEnum.SMART_REMINDER,
          channel: NotificationChannelEnum.IN_APP,
          message: 'Pajak Kendaraan Bermotor B 1234 ABC akan jatuh tempo dalam 5 hari.',
          sentAt: new Date(Date.now() - 2 * 86400000),
          readAt: new Date(Date.now() - 1 * 86400000),
        }),
        notificationRepo.create({
          userId,
          deadlineId: d3.id,
          title: 'Peringatan Jatuh Tempo BPJS',
          type: NotificationTypeEnum.SMART_REMINDER,
          channel: NotificationChannelEnum.IN_APP,
          message: 'Iuran BPJS Kesehatan Bulan Lalu telah melewati jatuh tempo!',
          sentAt: new Date(Date.now() - 1 * 86400000),
          readAt: null,
        }),
        notificationRepo.create({
          userId,
          deadlineId: null,
          title: 'Selamat Datang di PADI',
          type: NotificationTypeEnum.GENERAL,
          channel: NotificationChannelEnum.IN_APP,
          message: 'Selamat datang di PADI (Portal Administrasi Indonesia). Hubungkan layanan Anda untuk memulai.',
          sentAt: new Date(Date.now() - 3 * 86400000),
          readAt: null,
        }),
      ]);

      // Life Event Selection + Partially Completed Checklist
      const marriedEvent = await lifeEventRepo.findOne({ where: { code: 'MENIKAH' } });
      if (marriedEvent) {
        const selection = await selectionRepo.save(
          selectionRepo.create({ userId, lifeEventId: marriedEvent.id }),
        );

        await checklistRepo.save([
          checklistRepo.create({
            selectionId: selection.id,
            documentName: 'Fotokopi KTP',
            displayOrder: 1,
            isRequired: true,
            isCompleted: true,
            completedAt: new Date(Date.now() - 2 * 86400000),
          }),
          checklistRepo.create({
            selectionId: selection.id,
            documentName: 'Fotokopi KK',
            displayOrder: 2,
            isRequired: true,
            isCompleted: true,
            completedAt: new Date(Date.now() - 1 * 86400000),
          }),
          checklistRepo.create({
            selectionId: selection.id,
            documentName: 'Surat Pengantar RT/RW',
            displayOrder: 3,
            isRequired: true,
            isCompleted: false,
            completedAt: null,
          }),
        ]);
      }
    } else if (demoConfig.email === 'user2@padi.test') {
      // Consent Records
      await consentRepo.save([
        consentRepo.create({ userId, serviceName: ServiceNameEnum.BPJS, status: ConsentStatusEnum.GRANTED, grantedAt: new Date() }),
        consentRepo.create({ userId, serviceName: ServiceNameEnum.SATUSEHAT, status: ConsentStatusEnum.GRANTED, grantedAt: new Date() }),
        consentRepo.create({ userId, serviceName: ServiceNameEnum.CORETAX, status: ConsentStatusEnum.PENDING }),
        consentRepo.create({ userId, serviceName: ServiceNameEnum.SAMSAT, status: ConsentStatusEnum.REVOKED, revokedAt: new Date() }),
      ]);

      // Service Status
      await serviceStatusRepo.save([
        serviceStatusRepo.create({
          userId,
          serviceName: ServiceNameEnum.BPJS,
          status: StatusEnum.ACTIVE,
          rawData: { bpjs_number: '0009876543210', class: 'KLAS_2', status: 'ACTIVE', faskes: 'Puskesmas Tebet' },
        }),
        serviceStatusRepo.create({
          userId,
          serviceName: ServiceNameEnum.SATUSEHAT,
          status: StatusEnum.EXPIRED,
          rawData: { vaccine_doses: 3, last_dose_date: '2022-11-10', status: 'BOOSTER_DUE' },
        }),
      ]);

      // Deadlines
      const d1 = await deadlineRepo.save(
        deadlineRepo.create({
          userId,
          serviceName: ServiceNameEnum.SATUSEHAT,
          title: 'Pemeriksaan Kesehatan Berkala',
          description: 'Jadwal check-up rutin kesehatan di Puskesmas Tebet',
          dueDate: formatDateString(futureWarningDate),
        }),
      );

      const d2 = await deadlineRepo.save(
        deadlineRepo.create({
          userId,
          serviceName: ServiceNameEnum.BPJS,
          title: 'Pembaruan Data Kepesertaan BPJS',
          description: 'Verifikasi ulang data faskes tingkat pertama',
          dueDate: formatDateString(pastExpiredDate),
        }),
      );

      // Notification Logs
      await notificationRepo.save([
        notificationRepo.create({
          userId,
          deadlineId: d1.id,
          title: 'Pengingat SATUSEHAT',
          type: NotificationTypeEnum.SMART_REMINDER,
          channel: NotificationChannelEnum.IN_APP,
          message: 'Jadwal Pemeriksaan Kesehatan Berkala mendekati batas waktu.',
          sentAt: new Date(Date.now() - 86400000),
          readAt: new Date(Date.now() - 43200000),
        }),
        notificationRepo.create({
          userId,
          deadlineId: d2.id,
          title: 'Integrasi Layanan Baru',
          type: NotificationTypeEnum.GENERAL,
          channel: NotificationChannelEnum.IN_APP,
          message: 'Sistem PADI telah memperbarui integrasi layanan BPJS dan SATUSEHAT.',
          sentAt: new Date(Date.now() - 2 * 86400000),
          readAt: null,
        }),
      ]);
    } else if (demoConfig.email === 'user3@padi.test') {
      // Consent Records
      await consentRepo.save([
        consentRepo.create({ userId, serviceName: ServiceNameEnum.CORETAX, status: ConsentStatusEnum.PENDING }),
        consentRepo.create({ userId, serviceName: ServiceNameEnum.BPJS, status: ConsentStatusEnum.PENDING }),
        consentRepo.create({ userId, serviceName: ServiceNameEnum.PLN, status: ConsentStatusEnum.GRANTED, grantedAt: new Date() }),
        consentRepo.create({ userId, serviceName: ServiceNameEnum.PDAM, status: ConsentStatusEnum.GRANTED, grantedAt: new Date() }),
      ]);

      // Service Status
      await serviceStatusRepo.save([
        serviceStatusRepo.create({
          userId,
          serviceName: ServiceNameEnum.PLN,
          status: StatusEnum.ACTIVE,
          rawData: { meter_number: '541234567890', tariff: 'R1M/900VA', status: 'PAID' },
        }),
        serviceStatusRepo.create({
          userId,
          serviceName: ServiceNameEnum.PDAM,
          status: StatusEnum.WARNING,
          rawData: { customer_id: '10098765', usage_m3: 24, amount_due: 125000, due_date: formatDateString(futureWarningDate) },
        }),
      ]);

      // Deadlines
      const d1 = await deadlineRepo.save(
        deadlineRepo.create({
          userId,
          serviceName: ServiceNameEnum.PDAM,
          title: 'Tagihan Air PDAM Bulan Ini',
          description: 'Jatuh tempo pembayaran tagihan air bersih PDAM',
          dueDate: formatDateString(futureWarningDate),
        }),
      );

      await deadlineRepo.save(
        deadlineRepo.create({
          userId,
          serviceName: ServiceNameEnum.PLN,
          title: 'Tagihan Listrik PLN Bulan Depan',
          description: 'Estimasi tagihan pascabayar listrik PLN',
          dueDate: formatDateString(futureActiveDate),
        }),
      );

      // Notification Logs
      await notificationRepo.save([
        notificationRepo.create({
          userId,
          deadlineId: d1.id,
          title: 'Tagihan PDAM Mendekati Jatuh Tempo',
          type: NotificationTypeEnum.SMART_REMINDER,
          channel: NotificationChannelEnum.IN_APP,
          message: 'Tagihan Air PDAM Bulan Ini mendekati jatuh tempo. Lakukan pembayaran tepat waktu.',
          sentAt: new Date(Date.now() - 4 * 3600000),
          readAt: null,
        }),
      ]);
    }

    seededSummary.push({
      email: demoConfig.email,
      password: demoConfig.password,
      name: demoConfig.fullName,
    });
  }

  console.log('\n=============================================================');
  console.log('            DEMO DATA SEEDING COMPLETE                       ');
  console.log('=============================================================');
  console.log('Share these test accounts with the frontend team:\n');
  seededSummary.forEach((user, index) => {
    console.log(`[Account ${index + 1}] ${user.name}`);
    console.log(`  Email:    ${user.email}`);
    console.log(`  Password: ${user.password}\n`);
  });
  console.log('=============================================================\n');

  await AppDataSource.destroy();
}

seedDemoData().catch((err) => {
  console.error('[DEMO SEED ERROR] Unexpected error during demo seed execution:', err);
  process.exit(1);
});
