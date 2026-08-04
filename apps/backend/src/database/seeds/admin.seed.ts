import 'reflect-metadata';
import { config } from 'dotenv';
import { AppDataSource } from '../data-source';
import { User } from '../../modules/users/entities/user.entity';
import { CryptoService } from '../../common/crypto/crypto.service';
import { UserRoleEnum } from '../../common/enums';

// Load environment variables from .env
config();

/**
 * Default Administrator account seed configuration.
 * Edit these constants to change the initial admin credentials.
 */
const SEED_ADMIN_CONFIG = {
  email: 'admin@padi.go.id',
  password: 'AdminPassword123!',
  fullName: 'Administrator PADI',
  nik: '3171010101010001',
  phoneNumber: '081234567890',
};

const cryptoService = new CryptoService();

async function seedAdmin() {
  console.log('Connecting to database...');

  if (!AppDataSource.isInitialized) {
    AppDataSource.setOptions({
      entities: [User],
    });
    await AppDataSource.initialize();
  }

  const userRepo = AppDataSource.getRepository(User);

  // Check idempotency: skip if administrator with this email already exists
  const existingUser = await userRepo.findOne({
    where: { email: SEED_ADMIN_CONFIG.email },
    withDeleted: false,
  });

  if (existingUser) {
    console.log(
      `[SEED SKIPPED] Administrator user with email "${SEED_ADMIN_CONFIG.email}" already exists.`,
    );
    await AppDataSource.destroy();
    return;
  }

  console.log(
    `Creating Administrator user with email: ${SEED_ADMIN_CONFIG.email}...`,
  );

  const passwordHash = await cryptoService.hashPassword(
    SEED_ADMIN_CONFIG.password,
  );
  const nikHash = cryptoService.hashNik(SEED_ADMIN_CONFIG.nik);
  const nikEncryptionKey = cryptoService.getNikEncryptionKey();

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    await queryRunner.query(
      `
      INSERT INTO users
        (nik_encrypted, nik_hash, email, password_hash, full_name, phone_number, role, is_active)
      VALUES
        (pgp_sym_encrypt($1::text, $2), $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        SEED_ADMIN_CONFIG.nik,
        nikEncryptionKey,
        nikHash,
        SEED_ADMIN_CONFIG.email,
        passwordHash,
        SEED_ADMIN_CONFIG.fullName,
        SEED_ADMIN_CONFIG.phoneNumber,
        UserRoleEnum.ADMINISTRATOR,
        true,
      ],
    );

    await queryRunner.commitTransaction();
    console.log(
      `[SEED SUCCESS] Administrator account "${SEED_ADMIN_CONFIG.email}" created successfully.`,
    );
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error(
      '[SEED ERROR] Failed to seed administrator user:',
      error,
    );
    process.exitCode = 1;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

seedAdmin().catch((err) => {
  console.error('[SEED ERROR] Unexpected error during admin seed execution:', err);
  process.exit(1);
});
