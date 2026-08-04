import { IsEnum } from 'class-validator';
import { ServiceNameEnum } from '../../../common/enums/index.js';

/**
 * POST /consent
 *
 * Grants consent for a specific external service.
 * service_name must be one of the values defined in service_name_enum
 * (Postgres native enum), mirrored in ServiceNameEnum.
 *
 * user_id is never accepted from the body — it is always taken from
 * the JWT payload in the controller.
 */
export class GrantConsentDto {
  @IsEnum(ServiceNameEnum, {
    message: `service_name must be one of: ${Object.values(ServiceNameEnum).join(', ')}`,
  })
  service_name: ServiceNameEnum;
}
