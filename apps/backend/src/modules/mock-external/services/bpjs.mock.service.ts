import { Injectable } from '@nestjs/common';
import {
  deterministicFutureDate,
  deterministicPastDate,
  deterministicPick,
} from '../mock.helpers.js';

export interface BpjsData {
  member_id: string;
  coverage_class: string;
  status: string;
  premium_due_date: string;
  last_payment_date: string;
  arrears_months: number;
}

@Injectable()
export class BpjsMockService {
  getData(userId: string): BpjsData {
    const classes = ['Kelas I', 'Kelas II', 'Kelas III'];
    const statuses = ['AKTIF', 'AKTIF', 'AKTIF', 'MENUNGGAK'];
    const status = deterministicPick(userId, 'bpjs-status', statuses);

    return {
      member_id: '0001' + userId.replace(/-/g, '').slice(0, 9).toUpperCase(),
      coverage_class: deterministicPick(userId, 'bpjs-class', classes),
      status,
      premium_due_date: deterministicFutureDate(userId, 'bpjs-due', 28),
      last_payment_date: deterministicPastDate(userId, 'bpjs-paid', 35),
      arrears_months: status === 'MENUNGGAK' ? 2 : 0,
    };
  }
}
