import { Request, Response } from 'express';
import { 
  GetAllChromeProfilesUseCase, 
  GetChromeProfileByIdUseCase, 
  CreateChromeProfileUseCase, 
  UpdateChromeProfileUseCase, 
  DeleteChromeProfileUseCase, 
  DeleteManyChromeProfilesUseCase 
} from '../../use-cases/ChromeProfileUseCases';

export class ChromeProfileController {
  constructor(
    private getAllProfiles: GetAllChromeProfilesUseCase,
    private getProfileById: GetChromeProfileByIdUseCase,
    private createProfile: CreateChromeProfileUseCase,
    private updateProfile: UpdateChromeProfileUseCase,
    private deleteProfile: DeleteChromeProfileUseCase,
    private deleteManyProfiles: DeleteManyChromeProfilesUseCase
  ) {}

  async getList(req: Request, res: Response): Promise<void> {
    try {
      const dtos = await this.getAllProfiles.execute();
      res.json(dtos.map(dto => dto.toDict()));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const dto = await this.getProfileById.execute(id);
      if (!dto) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }
      res.json(dto.toDict());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const dto = await this.createProfile.execute(req.body);
      res.status(201).json(dto.toDict());
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const dto = await this.updateProfile.execute(id, req.body);
      if (!dto) {
        res.status(404).json({ error: 'Profile not found' });
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
      const success = await this.deleteProfile.execute(id);
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
      const count = await this.deleteManyProfiles.execute(ids.map(Number));
      res.json({ success: true, deletedCount: count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
