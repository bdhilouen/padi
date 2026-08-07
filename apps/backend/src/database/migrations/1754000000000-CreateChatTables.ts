import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates chat_sessions and chat_messages tables for the ChatModule.
 *
 * Run:  npm run migration:run
 * Undo: npm run migration:revert
 */
export class CreateChatTables1754000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE chat_sessions (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title       VARCHAR(255) NOT NULL DEFAULT 'Untitled',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at  TIMESTAMPTZ
      )
    `);

    await queryRunner.query(`
      CREATE TABLE chat_messages (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id  UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
        role        VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
        content     TEXT NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_chat_sessions_user_id
        ON chat_sessions(user_id) WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX idx_chat_messages_session
        ON chat_messages(session_id, created_at ASC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_chat_messages_session`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_chat_sessions_user_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS chat_messages`);
    await queryRunner.query(`DROP TABLE IF EXISTS chat_sessions`);
  }
}
