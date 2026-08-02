import { IsUUID } from 'class-validator';

/**
 * POST /life-events/select
 *
 * Selects a life event for the authenticated user.
 * The backend auto-generates checklist_items from the life_event_templates
 * associated with the selected life_event_id.
 *
 * user_id is never accepted from the body — always taken from the JWT payload.
 */
export class SelectLifeEventDto {
  @IsUUID('4', { message: 'life_event_id must be a valid UUID' })
  life_event_id: string;
}
