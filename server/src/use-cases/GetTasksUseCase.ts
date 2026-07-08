import { ITaskRepository } from '../domain/repositories/ITaskRepository';
import { Task } from '../domain/entities/Task';

export class GetTasksUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(): Promise<Task[]> {
    return this.taskRepository.getAll();
  }
}
