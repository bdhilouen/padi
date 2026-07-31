import { ServiceNameEnum, StatusEnum } from '../../../common/enums/index.js';

/**
 * Response shape for a single service entry in GET /dashboard.
 *
 * raw_data is deliberately excluded — the client only needs the
 * status summary per backend-rules §7.
 *
 * If consent was not granted for a service, that service's entry
 * will have status = null and a consent_required flag instead.
 */
export class DashboardServiceDto {
  service_name: ServiceNameEnum;
  status: StatusEnum | null;
  last_synced_at: Date | null;
  /** Present only when consent has not been granted for this service. */
  consent_required?: boolean;
  /** Present only when a sync call failed (graceful degradation). */
  sync_error?: boolean;
}
