import { Request, Response } from 'express';
import { 
  GetAllProxiesUseCase, 
  GetProxyByIdUseCase, 
  CreateProxyUseCase, 
  UpdateProxyUseCase, 
  DeleteProxyUseCase, 
  DeleteManyProxiesUseCase, 
  ImportProxiesUseCase 
} from '../../use-cases/ProxyUseCases';

export class ProxyController {
  constructor(
    private getAllProxies: GetAllProxiesUseCase,
    private getProxyById: GetProxyByIdUseCase,
    private createProxy: CreateProxyUseCase,
    private updateProxy: UpdateProxyUseCase,
    private deleteProxy: DeleteProxyUseCase,
    private deleteManyProxies: DeleteManyProxiesUseCase,
    private importProxies: ImportProxiesUseCase
  ) {}

  async getList(req: Request, res: Response): Promise<void> {
    try {
      const dtos = await this.getAllProxies.execute();
      res.json(dtos.map(dto => dto.toDict()));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const dto = await this.getProxyById.execute(id);
      if (!dto) {
        res.status(404).json({ error: 'Proxy not found' });
        return;
      }
      res.json(dto.toDict());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const dto = await this.createProxy.execute(req.body);
      res.status(201).json(dto.toDict());
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const dto = await this.updateProxy.execute(id, req.body);
      if (!dto) {
        res.status(404).json({ error: 'Proxy not found' });
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
      const success = await this.deleteProxy.execute(id);
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
      const count = await this.deleteManyProxies.execute(ids.map(Number));
      res.json({ success: true, deletedCount: count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async import(req: Request, res: Response): Promise<void> {
    try {
      const { textContent } = req.body;
      const result = await this.importProxies.execute(textContent);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
