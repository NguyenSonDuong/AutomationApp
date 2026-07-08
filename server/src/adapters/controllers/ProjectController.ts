import { Request, Response } from 'express';
import { 
  GetAllProjectsUseCase, 
  GetProjectByIdUseCase, 
  CreateProjectUseCase, 
  UpdateProjectUseCase, 
  DeleteProjectUseCase, 
  DeleteManyProjectsUseCase 
} from '../../use-cases/ProjectUseCases';

export class ProjectController {
  constructor(
    private getAllProjects: GetAllProjectsUseCase,
    private getProjectById: GetProjectByIdUseCase,
    private createProject: CreateProjectUseCase,
    private updateProject: UpdateProjectUseCase,
    private deleteProject: DeleteProjectUseCase,
    private deleteManyProjects: DeleteManyProjectsUseCase
  ) {}

  async getList(req: Request, res: Response): Promise<void> {
    try {
      const dtos = await this.getAllProjects.execute();
      res.json(dtos.map(dto => dto.toDict()));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const dto = await this.getProjectById.execute(id);
      if (!dto) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
      res.json(dto.toDict());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const dto = await this.createProject.execute(req.body);
      res.status(201).json(dto.toDict());
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const dto = await this.updateProject.execute(id, req.body);
      if (!dto) {
        res.status(404).json({ error: 'Project not found' });
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
      const success = await this.deleteProject.execute(id);
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
      const count = await this.deleteManyProjects.execute(ids.map(Number));
      res.json({ success: true, deletedCount: count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
