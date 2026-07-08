import { IActionStepRepository } from '../domain/repositories/IActionStepRepository';
import { ActionStepDto } from '../domain/dto/ActionStepDto';
import { ActionStep } from '../domain/entities/ActionStep';

export class GetActionStepsByProjectIdUseCase {
  constructor(private stepRepository: IActionStepRepository) {}
  async execute(projectId: number): Promise<ActionStepDto[]> {
    return this.stepRepository.getByProjectId(projectId);
  }
}

export class GetActionStepByIdUseCase {
  constructor(private stepRepository: IActionStepRepository) {}
  async execute(id: number): Promise<ActionStepDto | null> {
    return this.stepRepository.getById(id);
  }
}

export class CreateActionStepUseCase {
  constructor(private stepRepository: IActionStepRepository) {}
  async execute(stepData: Omit<ActionStep, 'id'>): Promise<ActionStepDto> {
    if (!stepData.projectId || !stepData.actionType) {
      throw new Error('Project ID and Action Type are required for Action Step.');
    }
    return this.stepRepository.create(stepData);
  }
}

export class UpdateActionStepUseCase {
  constructor(private stepRepository: IActionStepRepository) {}
  async execute(id: number, stepData: Partial<Omit<ActionStep, 'id' | 'projectId'>>): Promise<ActionStepDto | null> {
    return this.stepRepository.update(id, stepData);
  }
}

export class DeleteActionStepUseCase {
  constructor(private stepRepository: IActionStepRepository) {}
  async execute(id: number): Promise<boolean> {
    return this.stepRepository.delete(id);
  }
}

export class DeleteManyActionStepsUseCase {
  constructor(private stepRepository: IActionStepRepository) {}
  async execute(ids: number[]): Promise<number> {
    return this.stepRepository.deleteMany(ids);
  }
}

export class ReorderActionStepsUseCase {
  constructor(private stepRepository: IActionStepRepository) {}
  async execute(projectId: number, orderedStepIds: number[]): Promise<ActionStepDto[]> {
    return this.stepRepository.reorder(projectId, orderedStepIds);
  }
}
