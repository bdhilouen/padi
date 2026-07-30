/**
 * Shared TypeScript enums that mirror the native PostgreSQL enum types
 * defined in database/schema.sql.
 *
 * Keep these in sync with the schema. Do not add values here without
 * a corresponding migration that extends the Postgres enum.
 */

export enum ServiceNameEnum {
  CORETAX = 'CORETAX',
  BPJS = 'BPJS',
  SATUSEHAT = 'SATUSEHAT',
  OSS = 'OSS',
  SAMSAT = 'SAMSAT',
  PLN = 'PLN',
  PDAM = 'PDAM',
  ETLE = 'ETLE',
  MPASPOR = 'MPASPOR',
}

export enum StatusEnum {
  ACTIVE = 'ACTIVE',
  WARNING = 'WARNING',
  EXPIRED = 'EXPIRED',
}

export enum ConsentStatusEnum {
  GRANTED = 'GRANTED',
  REVOKED = 'REVOKED',
  PENDING = 'PENDING',
}

export enum NotificationTypeEnum {
  SMART_REMINDER = 'SMART_REMINDER',
  GENERAL = 'GENERAL',
  CHECKLIST = 'CHECKLIST',
}

export enum NotificationChannelEnum {
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

export enum UserRoleEnum {
  USER = 'USER',
  ADMINISTRATOR = 'ADMINISTRATOR',
}
