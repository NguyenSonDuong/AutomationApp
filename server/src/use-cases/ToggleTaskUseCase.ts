import { ITaskRepository } from '../domain/repositories/ITaskRepository';
import { Task } from '../domain/entities/Task';

export class ToggleTaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(id: string): Promise<Task> {
    const task = await this.taskRepository.getById(id);
    if (!task) {
      throw new Error(`Task with ID ${id} not found`);
    }

    const updatedTask: Task = {
      ...task,
      completed: !task.completed,
    };

    return this.taskRepository.update(updatedTask);
  }
}
