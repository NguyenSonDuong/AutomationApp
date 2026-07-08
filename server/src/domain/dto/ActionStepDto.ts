import { BaseDto } from './BaseDto';
import { ActionStep } from '../entities/ActionStep';

export class ActionStepDto extends BaseDto {
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
  extraParams?: Record<string, any>;
  isRandom?: boolean;
  minVal?: number;
  maxVal?: number;
  randomType?: string;

  constructor(step: ActionStep) {
    super();
    this.id = step.id;
    this.projectId = step.projectId;
    this.isStart = step.isStart;
    this.actionType = step.actionType;
    this.targetTab = step.targetTab;
    this.selector = step.selector;
    this.targetSelector = step.targetSelector;
    this.value = step.value;
    this.scrollX = step.scrollX;
    this.scrollY = step.scrollY;
    this.positionX = step.positionX;
    this.positionY = step.positionY;
    this.isRandom = step.isRandom;
    this.minVal = step.minVal;
    this.maxVal = step.maxVal;
    this.randomType = step.randomType;

    // Parse extraParams if it comes as a JSON string from DB
    if (typeof step.extraParams === 'string') {
      try {
        this.extraParams = JSON.parse(step.extraParams);
      } catch {
        this.extraParams = {};
      }
    } else {
      this.extraParams = step.extraParams || {};
    }
  }
}
