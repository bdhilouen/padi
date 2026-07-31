import { Injectable } from '@nestjs/common';
import {
  deterministicFloat,
  deterministicFutureDate,
  deterministicPastDate,
  deterministicPick,
} from '../mock.helpers.js';

export interface SamsatData {
  plate_number: string;
  vehicle_type: string;
  vehicle_year: number;
  tax_due_date: string;
  last_payment_date: string;
  tax_amount_idr: number;
  stnk_expiry_date: string;
  status: string;
}

@Injectable()
export class SamsatMockService {
  getData(userId: string): SamsatData {
    const plates = ['B', 'D', 'F', 'L', 'AB', 'AD', 'N'];
    const types = ['Sepeda Motor', 'Mobil Sedan', 'Mobil SUV', 'Mobil Pick-Up'];
    const statuses = ['LUNAS', 'LUNAS', 'LUNAS', 'BELUM_BAYAR'];

    const plateArea = deterministicPick(userId, 'sams-area', plates);
    const plateNum =
      1000 + (parseInt(userId.replace(/-/g, '').slice(2, 6), 16) % 8999);
    const plateSuffix = deterministicPick(userId, 'sams-suffix', [
      'AB',
      'BC',
      'CD',
      'DE',
      'EF',
    ]);
    const year =
      2015 + (parseInt(userId.replace(/-/g, '').slice(0, 2), 16) % 9);

    return {
      plate_number: `${plateArea} ${plateNum} ${plateSuffix}`,
      vehicle_type: deterministicPick(userId, 'sams-type', types),
      vehicle_year: year,
      tax_due_date: deterministicFutureDate(userId, 'sams-due', 365),
      last_payment_date: deterministicPastDate(userId, 'sams-paid', 380),
      tax_amount_idr:
        Math.round(deterministicFloat(userId, 'sams-amount') * 3_500_000) +
        200_000,
      stnk_expiry_date: deterministicFutureDate(userId, 'sams-stnk', 1825),
      status: deterministicPick(userId, 'sams-status', statuses),
    };
  }
}
