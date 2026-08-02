import { IsBoolean } from 'class-validator';

/**
 * PATCH /checklist-items/:itemId
 *
 * Toggles the completion state of a checklist item.
 * is_completed: true → marks as complete, sets completed_at = now().
 * is_completed: false → unmarks, sets completed_at = null.
 */
export class UpdateChecklistItemDto {
  @IsBoolean({ message: 'is_completed must be a boolean' })
  is_completed: boolean;
}
