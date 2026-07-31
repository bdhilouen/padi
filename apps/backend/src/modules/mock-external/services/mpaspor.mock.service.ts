import { Injectable } from '@nestjs/common';
import {
  deterministicFutureDate,
  deterministicPastDate,
  deterministicPick,
} from '../mock.helpers.js';

export interface MpasporData {
  passport_number: string;
  status: string;
  issue_date: string;
  expiry_date: string;
  issuing_office: string;
  renewal_queue_number: string | null;
}

@Injectable()
export class MpasporMockService {
  getData(userId: string): MpasporData {
    const statuses = [
      'AKTIF',
      'AKTIF',
      'AKTIF',
      'AKAN_KADALUARSA',
      'KADALUARSA',
    ];
    const offices = [
      'Imigrasi Jakarta Selatan',
      'Imigrasi Jakarta Pusat',
      'Imigrasi Bandung',
      'Imigrasi Surabaya',
      'Imigrasi Medan',
    ];

    const passportSeed = parseInt(userId.replace(/-/g, '').slice(0, 8), 16);
    const passportNum = 'A' + String(passportSeed).padStart(7, '0').slice(0, 7);
    const status = deterministicPick(userId, 'mpas-status', statuses);

    return {
      passport_number: passportNum,
      status,
      issue_date: deterministicPastDate(userId, 'mpas-issued', 1825),
      expiry_date:
        status === 'KADALUARSA'
          ? deterministicPastDate(userId, 'mpas-expiry', 365)
          : deterministicFutureDate(userId, 'mpas-expiry', 1825),
      issuing_office: deterministicPick(userId, 'mpas-office', offices),
      renewal_queue_number:
        status === 'AKAN_KADALUARSA'
          ? `ANTRIAN-${userId.slice(0, 6).toUpperCase()}`
          : null,
    };
  }
}
