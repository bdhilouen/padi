import { Module } from '@nestjs/common';
import { CryptoService } from './crypto/crypto.service.js';

/**
 * CommonModule exports shared infrastructure services.
 * Import this into any feature module that needs CryptoService.
 */
@Module({
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CommonModule {}
