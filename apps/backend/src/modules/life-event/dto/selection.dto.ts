import type { ChecklistItemDto } from './checklist-item.dto.js';
import type { LifeEventDto } from './life-event.dto.js';

/**
 * Response shape for a life_event_selections row.
 *
 * Includes:
 *  - core selection metadata
 *  - the associated life_event (name + code)
 *  - progress counters (calculated at query time, not stored)
 *  - optionally the full checklist items (when fetching the checklist endpoint)
 *
 * user_id is intentionally omitted — the caller is always the owner.
 */
export class SelectionDto {
  id: string;
  life_event: LifeEventDto;
  selected_at: Date;
  /** Total number of checklist items for this selection. */
  total_items: number;
  /** Number of items already marked as completed. */
  completed_items: number;
}

/**
 * Extended version of SelectionDto that includes the full checklist.
 * Returned by GET /life-events/selections/:selectionId/checklist.
 */
export class SelectionWithChecklistDto extends SelectionDto {
  checklist: ChecklistItemDto[];
}
