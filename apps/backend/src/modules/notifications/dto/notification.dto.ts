import { NotificationTypeEnum } from '../../../common/enums/index.js';

export class NotificationDto {
  id: string;
  title: string;
  type: NotificationTypeEnum;
  message: string;
  sent_at: Date;
  read_at: Date | null;
}
