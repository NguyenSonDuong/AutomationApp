export interface FlowEdge {
  id?: number;
  projectId: number;
  sourceStepId: number;
  targetStepId: number;
  condition?: Record<string, any> | string; // JSON in DB
  isLoop: boolean;
  timeDelay: number;
  extraParams?: Record<string, any> | string; // JSON in DB
}
