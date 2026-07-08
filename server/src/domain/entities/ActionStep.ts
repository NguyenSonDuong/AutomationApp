export interface ActionStep {
  id?: number;
  projectId: number;
  isStart: boolean;
  actionType: string;
  targetTab: string;
  selector?: string;
  targetSelector?: string;
  value?: string;
  scrollX?: number;
  scrollY?: number;
  positionX?: number;
  positionY?: number;
  extraParams?: Record<string, any> | string; // Handled as JSON string in sqlite
  isRandom?: boolean;
  minVal?: number;
  maxVal?: number;
  randomType?: string;
}
