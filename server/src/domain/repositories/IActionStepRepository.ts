import { ActionStep } from '../entities/ActionStep';
import { ActionStepDto } from '../dto/ActionStepDto';

export interface IActionStepRepository {
  create(step: Omit<ActionStep, 'id'>): Promise<ActionStepDto>;
  getById(id: number): Promise<ActionStepDto | null>;
  getByProjectId(projectId: number): Promise<ActionStepDto[]>;
  update(id: number, stepData: Partial<Omit<ActionStep, 'id' | 'projectId'>>): Promise<ActionStepDto | null>;
  delete(id: number): Promise<boolean>;
  deleteMany(ids: number[]): Promise<number>;
  reorder(projectId: number, orderedStepIds: number[]): Promise<ActionStepDto[]>;
}
