import { BaseDto } from './BaseDto';
import { AutomationLog } from '../entities/AutomationLog';

export class AutomationLogDto extends BaseDto {
  id?: number;
  targetUrl: string;
  status: string;
  title?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;

  constructor(log: AutomationLog) {
    super();
    this.id = log.id;
    this.targetUrl = log.targetUrl;
    this.status = log.status;
    this.title = log.title;
    this.errorMessage = log.errorMessage;
    this.createdAt = log.createdAt;
    this.completedAt = log.completedAt;
  }
}
