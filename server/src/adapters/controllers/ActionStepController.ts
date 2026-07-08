import { Request, Response } from 'express';
import { 
  GetActionStepsByProjectIdUseCase, 
  GetActionStepByIdUseCase, 
  CreateActionStepUseCase, 
  UpdateActionStepUseCase, 
  DeleteActionStepUseCase, 
  DeleteManyActionStepsUseCase, 
  ReorderActionStepsUseCase 
} from '../../use-cases/ActionStepUseCases';

export class ActionStepController {
  constructor(
    private getStepsByProjectId: GetActionStepsByProjectIdUseCase,
    private getStepById: GetActionStepByIdUseCase,
    private createStep: CreateActionStepUseCase,
    private updateStep: UpdateActionStepUseCase,
    private deleteStep: DeleteActionStepUseCase,
    private deleteManySteps: DeleteManyActionStepsUseCase,
    private reorderSteps: ReorderActionStepsUseCase
  ) {}

  async getListByProject(req: Request, res: Response): Promise<void> {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      const dtos = await this.getStepsByProjectId.execute(projectId);
      res.json(dtos.map(dto => dto.toDict()));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const dto = await this.getStepById.execute(id);
      if (!dto) {
        res.status(404).json({ error: 'Action step not found' });
        return;
      }
      res.json(dto.toDict());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const dto = await this.createStep.execute(req.body);
      res.status(201).json(dto.toDict());
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const dto = await this.updateStep.execute(id, req.body);
      if (!dto) {
        res.status(404).json({ error: 'Action step not found' });
        return;
      }
      res.json(dto.toDict());
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteOne(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await this.deleteStep.execute(id);
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteMany(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        res.status(400).json({ error: 'Invalid ids array' });
        return;
      }
      const count = await this.deleteManySteps.execute(ids.map(Number));
      res.json({ success: true, deletedCount: count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async reorder(req: Request, res: Response): Promise<void> {
    try {
      const { projectId, orderedStepIds } = req.body;
      if (!projectId || !Array.isArray(orderedStepIds)) {
        res.status(400).json({ error: 'Invalid projectId or orderedStepIds array' });
        return;
      }
      const dtos = await this.reorderSteps.execute(Number(projectId), orderedStepIds.map(Number));
      res.json(dtos.map(dto => dto.toDict()));
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
