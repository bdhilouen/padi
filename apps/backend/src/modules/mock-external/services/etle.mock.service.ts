import { Injectable } from '@nestjs/common';
import {
  deterministicFloat,
  deterministicPastDate,
  deterministicPick,
} from '../mock.helpers.js';

export interface EtleData {
  violations: EtleViolation[];
  total_fines_idr: number;
  status: string;
}

export interface EtleViolation {
  violation_id: string;
  location: string;
  violation_type: string;
  date: string;
  fine_amount_idr: number;
  paid: boolean;
}

@Injectable()
export class EtleMockService {
  getData(userId: string): EtleData {
    const locations = [
      'Jl. Gatot Subroto, Jakarta',
      'Jl. Sudirman, Jakarta',
      'Jl. MH Thamrin, Jakarta',
      'Jl. Ahmad Yani, Surabaya',
      'Tol Cipularang KM 72',
    ];
    const types = [
      'Melebihi Batas Kecepatan',
      'Melanggar Lampu Merah',
      'Tidak Menggunakan Sabuk Pengaman',
      'Menggunakan HP Saat Berkendara',
    ];

    // 0–2 violations deterministically
    const countSeed = parseInt(userId.replace(/-/g, '').slice(0, 2), 16) % 3;
    const violations: EtleViolation[] = [];

    for (let i = 0; i < countSeed; i++) {
      const fineBase =
        Math.round(deterministicFloat(userId, `etle-fine-${i}`) * 400_000) +
        100_000;
      const paid = deterministicPick(userId, `etle-paid-${i}`, [
        true,
        true,
        false,
      ]);
      violations.push({
        violation_id: `ETLE-${userId.slice(0, 8).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
        location: deterministicPick(userId, `etle-loc-${i}`, locations),
        violation_type: deterministicPick(userId, `etle-type-${i}`, types),
        date: deterministicPastDate(userId, `etle-date-${i}`, 180),
        fine_amount_idr: fineBase,
        paid,
      });
    }

    const unpaidTotal = violations
      .filter((v) => !v.paid)
      .reduce((sum, v) => sum + v.fine_amount_idr, 0);

    return {
      violations,
      total_fines_idr: unpaidTotal,
      status: unpaidTotal > 0 ? 'ADA_TUNGGAKAN' : 'BERSIH',
    };
  }
}
