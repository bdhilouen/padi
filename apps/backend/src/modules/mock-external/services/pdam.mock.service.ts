import { Injectable } from '@nestjs/common';
import {
  deterministicFloat,
  deterministicFutureDate,
  deterministicPastDate,
  deterministicPick,
} from '../mock.helpers.js';

export interface PdamData {
  customer_id: string;
  zone: string;
  status: string;
  last_bill_amount_idr: number;
  last_payment_date: string;
  next_bill_date: string;
  meter_reading_m3: number;
}

@Injectable()
export class PdamMockService {
  getData(userId: string): PdamData {
    const zones = [
      'Jakarta Timur',
      'Jakarta Selatan',
      'Bandung Tengah',
      'Surabaya Utara',
    ];
    const statuses = ['LUNAS', 'LUNAS', 'LUNAS', 'MENUNGGAK'];

    return {
      customer_id: 'PDAM-' + userId.replace(/-/g, '').slice(0, 8).toUpperCase(),
      zone: deterministicPick(userId, 'pdam-zone', zones),
      status: deterministicPick(userId, 'pdam-status', statuses),
      last_bill_amount_idr:
        Math.round(deterministicFloat(userId, 'pdam-bill') * 150_000) + 30_000,
      last_payment_date: deterministicPastDate(userId, 'pdam-paid', 45),
      next_bill_date: deterministicFutureDate(userId, 'pdam-next', 30),
      meter_reading_m3: Math.round(
        deterministicFloat(userId, 'pdam-m3') * 25 + 5,
      ),
    };
  }
}
