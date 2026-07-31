import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ChecklistItem } from './entities/checklist-item.entity.js';
import { LifeEventSelection } from './entities/life-event-selection.entity.js';
import { LifeEventTemplate } from './entities/life-event-template.entity.js';
import { LifeEvent } from './entities/life-event.entity.js';
import type { ChecklistItemDto } from './dto/checklist-item.dto.js';
import type { LifeEventDto } from './dto/life-event.dto.js';
import type {
  SelectionDto,
  SelectionWithChecklistDto,
} from './dto/selection.dto.js';
import type { SelectLifeEventDto } from './dto/select-life-event.dto.js';
import type { UpdateChecklistItemDto } from './dto/update-checklist-item.dto.js';

@Injectable()
export class LifeEventService {
  constructor(
    @InjectRepository(LifeEvent)
    private readonly lifeEventRepo: Repository<LifeEvent>,

    @InjectRepository(LifeEventTemplate)
    private readonly templateRepo: Repository<LifeEventTemplate>,

    @InjectRepository(LifeEventSelection)
    private readonly selectionRepo: Repository<LifeEventSelection>,

    @InjectRepository(ChecklistItem)
    private readonly checklistRepo: Repository<ChecklistItem>,

    /**
     * DataSource is injected to run the "select + generate checklist" flow
     * inside a single transaction, ensuring atomicity:
     * if checklist creation fails, the selection row is rolled back too.
     */
    private readonly dataSource: DataSource,
  ) {}

  // ─── GET /life-events ─────────────────────────────────────────────────────

  /**
   * Returns all life event master records, ordered by name.
   * This is reference/catalogue data — no user context required.
   */
  async listLifeEvents(): Promise<LifeEventDto[]> {
    const events = await this.lifeEventRepo.find({
      order: { name: 'ASC' },
    });
    return events.map((e) => this.toLifeEventDto(e));
  }

  // ─── POST /life-events/select ─────────────────────────────────────────────

  /**
   * Selects a life event for the authenticated user and auto-generates
   * checklist_items from the associated life_event_templates.
   *
   * The insert of the selection row and all checklist rows is executed in
   * a single transaction so that partial failures leave no orphaned rows.
   *
   * Idempotency note: the schema does NOT have a unique constraint on
   * (user_id, life_event_id) in life_event_selections, so a user may
   * select the same event multiple times (e.g. a second marriage).
   * Each selection gets its own independent checklist.
   */
  async selectLifeEvent(
    userId: string,
    dto: SelectLifeEventDto,
  ): Promise<SelectionDto> {
    // Verify the life event exists before starting the transaction
    const lifeEvent = await this.lifeEventRepo.findOne({
      where: { id: dto.life_event_id },
    });
    if (!lifeEvent) {
      throw new NotFoundException(
        `Life event with id "${dto.life_event_id}" not found`,
      );
    }

    // Load templates once — used inside the transaction
    const templates = await this.templateRepo.find({
      where: { lifeEventId: lifeEvent.id },
      order: { displayOrder: 'ASC' },
    });

    // Run selection + checklist creation atomically
    const selection = await this.dataSource.transaction(async (manager) => {
      // 1. Insert the selection row
      const newSelection = manager.create(LifeEventSelection, {
        userId,
        lifeEventId: lifeEvent.id,
      });
      const savedSelection = await manager.save(
        LifeEventSelection,
        newSelection,
      );

      // 2. Copy each template row into a checklist_item for this selection
      if (templates.length > 0) {
        const items = templates.map((t) =>
          manager.create(ChecklistItem, {
            selectionId: savedSelection.id,
            documentName: t.documentName,
            displayOrder: t.displayOrder,
            isRequired: t.isRequired,
          }),
        );
        await manager.save(ChecklistItem, items);
      }

      return savedSelection;
    });

    // Load the freshly created checklist for the response counters
    const items = await this.checklistRepo.find({
      where: { selectionId: selection.id },
    });

    return this.toSelectionDto(selection, lifeEvent, items);
  }

  // ─── GET /life-events/selections ─────────────────────────────────────────

  /**
   * Returns all selections made by the authenticated user,
   * with per-selection progress counters.
   */
  async listMySelections(userId: string): Promise<SelectionDto[]> {
    const selections = await this.selectionRepo.find({
      where: { userId },
      relations: { lifeEvent: true },
      order: { selectedAt: 'DESC' },
    });

    // Load all checklist items for this user's selections in one query
    // to avoid N+1 queries.
    const selectionIds = selections.map((s) => s.id);
    const allItems =
      selectionIds.length > 0
        ? await this.checklistRepo
            .createQueryBuilder('item')
            .where('item.selection_id IN (:...ids)', { ids: selectionIds })
            .getMany()
        : [];

    // Group items by selection_id for O(1) lookup
    const itemsBySelection = new Map<string, ChecklistItem[]>();
    for (const item of allItems) {
      const group = itemsBySelection.get(item.selectionId) ?? [];
      group.push(item);
      itemsBySelection.set(item.selectionId, group);
    }

    return selections.map((s) =>
      this.toSelectionDto(s, s.lifeEvent, itemsBySelection.get(s.id) ?? []),
    );
  }

  // ─── GET /life-events/selections/:selectionId/checklist ──────────────────

  /**
   * Returns the full checklist for a specific selection, plus progress.
   * Returns 404 if the selection does not exist.
   * Returns 403 if the selection belongs to a different user.
   */
  async getChecklist(
    userId: string,
    selectionId: string,
  ): Promise<SelectionWithChecklistDto> {
    const selection = await this.selectionRepo.findOne({
      where: { id: selectionId },
      relations: { lifeEvent: true },
    });

    if (!selection) {
      throw new NotFoundException(
        `Selection with id "${selectionId}" not found`,
      );
    }

    // Ownership check — 403 before exposing any data
    if (selection.userId !== userId) {
      throw new ForbiddenException('You do not have access to this selection');
    }

    const items = await this.checklistRepo.find({
      where: { selectionId: selection.id },
      order: { displayOrder: 'ASC' },
    });

    return this.toSelectionWithChecklistDto(
      selection,
      selection.lifeEvent,
      items,
    );
  }

  // ─── PATCH /checklist-items/:itemId ──────────────────────────────────────

  /**
   * Marks or unmarks a checklist item as completed.
   *
   * Ownership is verified via the item's selection → the selection must
   * belong to the authenticated user.
   *
   * Returns 404 if the item does not exist.
   * Returns 403 if the item belongs to a different user's selection.
   *
   * Idempotent: marking an already-completed item as completed again is
   * a no-op (completed_at is not overwritten).
   */
  async toggleChecklistItem(
    userId: string,
    itemId: string,
    dto: UpdateChecklistItemDto,
  ): Promise<ChecklistItemDto> {
    // Load item together with its selection to verify ownership in one query
    const item = await this.checklistRepo.findOne({
      where: { id: itemId },
      relations: { selection: true },
    });

    if (!item) {
      throw new NotFoundException(
        `Checklist item with id "${itemId}" not found`,
      );
    }

    // Ownership check via the parent selection
    if (item.selection.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this checklist item',
      );
    }

    if (dto.is_completed) {
      item.isCompleted = true;
      // Preserve existing completed_at if already set (idempotent)
      if (!item.completedAt) {
        item.completedAt = new Date();
      }
    } else {
      item.isCompleted = false;
      item.completedAt = null;
    }

    const saved = await this.checklistRepo.save(item);
    return this.toChecklistItemDto(saved);
  }

  // ─── Private mappers ──────────────────────────────────────────────────────

  /** Explicit allow-list — new entity columns never surface in responses. */
  private toLifeEventDto(e: LifeEvent): LifeEventDto {
    return {
      id: e.id,
      code: e.code,
      name: e.name,
      description: e.description,
    };
  }

  private toChecklistItemDto(item: ChecklistItem): ChecklistItemDto {
    return {
      id: item.id,
      document_name: item.documentName,
      display_order: item.displayOrder,
      is_required: item.isRequired,
      is_completed: item.isCompleted,
      completed_at: item.completedAt,
      created_at: item.createdAt,
    };
  }

  private toSelectionDto(
    selection: LifeEventSelection,
    lifeEvent: LifeEvent,
    items: ChecklistItem[],
  ): SelectionDto {
    return {
      id: selection.id,
      life_event: this.toLifeEventDto(lifeEvent),
      selected_at: selection.selectedAt,
      total_items: items.length,
      completed_items: items.filter((i) => i.isCompleted).length,
    };
  }

  private toSelectionWithChecklistDto(
    selection: LifeEventSelection,
    lifeEvent: LifeEvent,
    items: ChecklistItem[],
  ): SelectionWithChecklistDto {
    return {
      ...this.toSelectionDto(selection, lifeEvent, items),
      checklist: items.map((i) => this.toChecklistItemDto(i)),
    };
  }
}
