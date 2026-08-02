import { Injectable } from '@nestjs/common';
import {
  deterministicFutureDate,
  deterministicPastDate,
  deterministicPick,
} from '../mock.helpers.js';

export interface OssData {
  nib: string;
  business_name: string;
  risk_level: string;
  license_status: string;
  issued_date: string;
  expiry_date: string;
}

@Injectable()
export class OssMockService {
  getData(userId: string): OssData {
    const riskLevels = [
      'RENDAH',
      'RENDAH',
      'MENENGAH RENDAH',
      'MENENGAH TINGGI',
    ];
    const statuses = ['BERLAKU', 'BERLAKU', 'BERLAKU', 'PERLU_PERPANJANGAN'];
    const businesses = [
      'CV Maju Bersama',
      'UD Sinar Harapan',
      'PT Karya Mandiri',
      'Usaha Dagang Sejahtera',
      'CV Berkah Abadi',
    ];

    const nibSeed = parseInt(userId.replace(/-/g, '').slice(0, 8), 16);
    const nib = String(nibSeed).padStart(13, '0').slice(0, 13);

    return {
      nib,
      business_name: deterministicPick(userId, 'oss-biz', businesses),
      risk_level: deterministicPick(userId, 'oss-risk', riskLevels),
      license_status: deterministicPick(userId, 'oss-status', statuses),
      issued_date: deterministicPastDate(userId, 'oss-issued', 730),
      expiry_date: deterministicFutureDate(userId, 'oss-expiry', 365),
    };
  }
}
