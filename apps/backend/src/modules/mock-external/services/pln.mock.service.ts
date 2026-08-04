import { Injectable } from '@nestjs/common';
import {
  deterministicFloat,
  deterministicPastDate,
  deterministicPick,
} from '../mock.helpers.js';

export interface PlnData {
  customer_id: string;
  tariff_class: string;
  token_credit_kwh: number;
  last_payment_date: string;
  last_payment_amount_idr: number;
  meter_number: string;
  status: string;
}

@Injectable()
export class PlnMockService {
  getData(userId: string): PlnData {
    const tariffs = [
      'R-1/900 VA',
      'R-1/1300 VA',
      'R-1/2200 VA',
      'R-2/3500 VA',
      'R-3/6600 VA',
    ];
    const statuses = ['NORMAL', 'NORMAL', 'NORMAL', 'BERDAYA_RENDAH'];

    const meterSeed = parseInt(userId.replace(/-/g, '').slice(4, 12), 16);
    const meterId = String(meterSeed).padStart(11, '0').slice(0, 11);
    const customerId = userId.replace(/-/g, '').slice(0, 12).toUpperCase();

    return {
      customer_id: customerId,
      tariff_class: deterministicPick(userId, 'pln-tariff', tariffs),
      token_credit_kwh: Math.round(
        deterministicFloat(userId, 'pln-kwh') * 150 + 10,
      ),
      last_payment_date: deterministicPastDate(userId, 'pln-paid', 45),
      last_payment_amount_idr:
        Math.round(deterministicFloat(userId, 'pln-amount') * 400_000) + 50_000,
      meter_number: meterId,
      status: deterministicPick(userId, 'pln-status', statuses),
    };
  }
}
