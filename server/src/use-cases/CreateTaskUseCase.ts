import { ITaskRepository } from '../domain/repositories/ITaskRepository';
import { Task } from '../domain/entities/Task';

export class CreateTaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(title: string): Promise<Task> {
    if (!title || title.trim() === '') {
      throw new Error('Task title cannot be empty');
    }

    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: title.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    return this.taskRepository.create(newTask);
  }
}
