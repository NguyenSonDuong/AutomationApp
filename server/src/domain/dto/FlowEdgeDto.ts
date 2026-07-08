import { BaseDto } from './BaseDto';
import { FlowEdge } from '../entities/FlowEdge';

export class FlowEdgeDto extends BaseDto {
  id?: number;
  projectId: number;
  sourceStepId: number;
  targetStepId: number;
  condition?: Record<string, any>;
  isLoop: boolean;
  timeDelay: number;
  extraParams?: Record<string, any>;

  constructor(edge: FlowEdge) {
    super();
    this.id = edge.id;
    this.projectId = edge.projectId;
    this.sourceStepId = edge.sourceStepId;
    this.targetStepId = edge.targetStepId;
    this.isLoop = edge.isLoop;
    this.timeDelay = edge.timeDelay;

    // Parse condition
    if (typeof edge.condition === 'string') {
      try {
        this.condition = JSON.parse(edge.condition);
      } catch {
        this.condition = {};
      }
    } else {
      this.condition = edge.condition || {};
    }

    // Parse extraParams
    if (typeof edge.extraParams === 'string') {
      try {
        this.extraParams = JSON.parse(edge.extraParams);
      } catch {
        this.extraParams = {};
      }
    } else {
      this.extraParams = edge.extraParams || {};
    }
  }
}
