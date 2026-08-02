/**
 * Response shape for a single checklist item.
 *
 * Included in GET /life-events/selections/:selectionId/checklist
 * and returned from PATCH /checklist-items/:itemId.
 *
 * selection_id is omitted — caller already knows which selection
 * they are working with from the URL.
 */
export class ChecklistItemDto {
  id: string;
  document_name: string;
  display_order: number;
  is_required: boolean;
  is_completed: boolean;
  completed_at: Date | null;
  created_at: Date;
}
