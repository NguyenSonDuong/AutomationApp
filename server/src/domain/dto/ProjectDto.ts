import { BaseDto } from './BaseDto';
import { Project } from '../entities/Project';
import { ActionStepDto } from './ActionStepDto';
import { FlowEdgeDto } from './FlowEdgeDto';

export class ProjectDto extends BaseDto {
  id?: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  steps?: ActionStepDto[];
  edges?: FlowEdgeDto[];

  constructor(project: Project, steps?: ActionStepDto[], edges?: FlowEdgeDto[]) {
    super();
    this.id = project.id;
    this.name = project.name;
    this.description = project.description;
    this.createdAt = project.createdAt;
    this.updatedAt = project.updatedAt;
    this.steps = steps;
    this.edges = edges;
  }
}
