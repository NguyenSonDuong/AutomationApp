import { Request, Response } from 'express';
import { GetTasksUseCase } from '../../use-cases/GetTasksUseCase';
import { CreateTaskUseCase } from '../../use-cases/CreateTaskUseCase';
import { ToggleTaskUseCase } from '../../use-cases/ToggleTaskUseCase';
import { Server as SocketIOServer } from 'socket.io';

export class TaskController {
  constructor(
    private getTasksUseCase: GetTasksUseCase,
    private createTaskUseCase: CreateTaskUseCase,
    private toggleTaskUseCase: ToggleTaskUseCase,
    private io: SocketIOServer
  ) {}

  async getTasks(req: Request, res: Response): Promise<void> {
    try {
      const tasks = await this.getTasksUseCase.execute();
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createTask(req: Request, res: Response): Promise<void> {
    try {
      const { title } = req.body;
      const task = await this.createTaskUseCase.execute(title);
      
      // Broadcast real-time update to all connected Socket.io clients
      this.io.emit('task:created', task);
      
      res.status(201).json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async toggleTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const task = await this.toggleTaskUseCase.execute(id);
      
      // Broadcast real-time update to all connected Socket.io clients
      this.io.emit('task:updated', task);
      
      res.json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
