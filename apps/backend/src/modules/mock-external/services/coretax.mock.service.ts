import { Injectable } from '@nestjs/common';
import {
  deterministicFloat,
  deterministicPastDate,
  deterministicPick,
} from '../mock.helpers.js';

export interface CoretaxData {
  npwp: string;
  tax_status: string;
  outstanding_amount_idr: number;
  last_filing_date: string;
  next_due_date: string;
}

@Injectable()
export class CoretaxMockService {
  getData(userId: string): CoretaxData {
    const statuses = [
      'COMPLIANT',
      'COMPLIANT',
      'COMPLIANT',
      'LATE_FILING',
      'OUTSTANDING',
    ];
    const outstanding = Math.round(
      deterministicFloat(userId, 'ctx-amount') * 50_000_000,
    );
    // Derive a fake but plausible 15-digit NPWP from userId hash
    const npwpSeed = Buffer.from(userId.replace(/-/g, ''), 'hex').readUInt32BE(
      0,
    );
    const npwp =
      String(npwpSeed).padStart(9, '0').slice(0, 9) + '.000.0-000.000';

    return {
      npwp,
      tax_status: deterministicPick(userId, 'ctx-status', statuses),
      outstanding_amount_idr: outstanding,
      last_filing_date: deterministicPastDate(userId, 'ctx-filed', 180),
      next_due_date: deterministicPastDate(userId, 'ctx-due', 30),
    };
  }
}
