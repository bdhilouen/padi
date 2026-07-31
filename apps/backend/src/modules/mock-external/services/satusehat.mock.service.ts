import { Injectable } from '@nestjs/common';
import { deterministicPastDate, deterministicPick } from '../mock.helpers.js';

export interface SatusehatData {
  patient_id: string;
  last_visit_date: string;
  last_facility: string;
  vaccination_status: string;
  active_prescriptions: number;
}

@Injectable()
export class SatusehatMockService {
  getData(userId: string): SatusehatData {
    const facilities = [
      'RSUD dr. Soetomo',
      'Puskesmas Kebayoran',
      'RS Siloam TB Simatupang',
      'RSUP Dr. Sardjito',
      'Klinik Medika Utama',
    ];
    const vaccinations = ['LENGKAP', 'LENGKAP', 'SEBAGIAN', 'BELUM'];

    return {
      patient_id: 'P-' + userId.replace(/-/g, '').slice(0, 12).toUpperCase(),
      last_visit_date: deterministicPastDate(userId, 'satu-visit', 365),
      last_facility: deterministicPick(userId, 'satu-facility', facilities),
      vaccination_status: deterministicPick(userId, 'satu-vax', vaccinations),
      active_prescriptions: [0, 0, 1, 2][
        parseInt(userId.replace(/-/g, '').slice(0, 2), 16) % 4
      ],
    };
  }
}
