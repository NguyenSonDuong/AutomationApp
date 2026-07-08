import { Project } from '../entities/Project';
import { ProjectDto } from '../dto/ProjectDto';

export interface IProjectRepository {
  create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectDto>;
  getById(id: number): Promise<ProjectDto | null>;
  getAll(): Promise<ProjectDto[]>;
  update(id: number, projectData: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ProjectDto | null>;
  delete(id: number): Promise<boolean>;
  deleteMany(ids: number[]): Promise<number>;
}
