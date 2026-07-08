export interface AutomationLog {
  id?: number;
  targetUrl: string;
  status: string; // pending, running, success, failed
  title?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}
