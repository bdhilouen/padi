/**
 * Response shape for a single life event master record.
 *
 * Only UI-relevant fields are included.
 * No internal ORM metadata is exposed.
 */
export class LifeEventDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
}
