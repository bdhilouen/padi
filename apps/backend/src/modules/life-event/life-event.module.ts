import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChecklistItem } from './entities/checklist-item.entity.js';
import { LifeEventSelection } from './entities/life-event-selection.entity.js';
import { LifeEventTemplate } from './entities/life-event-template.entity.js';
import { LifeEvent } from './entities/life-event.entity.js';
import { ChecklistItemController } from './checklist-item.controller.js';
import { LifeEventController } from './life-event.controller.js';
import { LifeEventService } from './life-event.service.js';

/**
 * LifeEventModule — FR-006, FR-007, FR-008.
 *
 * Provides:
 *   GET  /life-events                               — list master life events
 *   POST /life-events/select                        — select event + generate checklist (transactional)
 *   GET  /life-events/selections                    — list user's selections with progress
 *   GET  /life-events/selections/:id/checklist      — full checklist + progress
 *   PATCH /checklist-items/:itemId                  — toggle completion
 *
 * DataSource is injected automatically by TypeOrmModule.forRoot() and is
 * available for constructor injection without explicit registration.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      LifeEvent,
      LifeEventTemplate,
      LifeEventSelection,
      ChecklistItem,
    ]),
  ],
  controllers: [LifeEventController, ChecklistItemController],
  providers: [LifeEventService],
})
export class LifeEventModule {}
