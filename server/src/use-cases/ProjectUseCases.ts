import { IProjectRepository } from '../domain/repositories/IProjectRepository';
import { ProjectDto } from '../domain/dto/ProjectDto';
import { Project } from '../domain/entities/Project';

export class GetAllProjectsUseCase {
  constructor(private projectRepository: IProjectRepository) {}
  async execute(): Promise<ProjectDto[]> {
    return this.projectRepository.getAll();
  }
}

export class GetProjectByIdUseCase {
  constructor(private projectRepository: IProjectRepository) {}
  async execute(id: number): Promise<ProjectDto | null> {
    return this.projectRepository.getById(id);
  }
}

export class CreateProjectUseCase {
  constructor(private projectRepository: IProjectRepository) {}
  async execute(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectDto> {
    if (!projectData.name) {
      throw new Error('Project name is required.');
    }
    return this.projectRepository.create(projectData);
  }
}

export class UpdateProjectUseCase {
  constructor(private projectRepository: IProjectRepository) {}
  async execute(id: number, projectData: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ProjectDto | null> {
    return this.projectRepository.update(id, projectData);
  }
}

export class DeleteProjectUseCase {
  constructor(private projectRepository: IProjectRepository) {}
  async execute(id: number): Promise<boolean> {
    return this.projectRepository.delete(id);
  }
}

export class DeleteManyProjectsUseCase {
  constructor(private projectRepository: IProjectRepository) {}
  async execute(ids: number[]): Promise<number> {
    return this.projectRepository.deleteMany(ids);
  }
}
