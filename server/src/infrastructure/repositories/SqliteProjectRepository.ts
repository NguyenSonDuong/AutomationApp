import { IProjectRepository } from '../../domain/repositories/IProjectRepository';
import { Project } from '../../domain/entities/Project';
import { ProjectDto } from '../../domain/dto/ProjectDto';
import { ActionStepDto } from '../../domain/dto/ActionStepDto';
import { FlowEdgeDto } from '../../domain/dto/FlowEdgeDto';
import { getDatabase } from '../database/sqlite';

export class SqliteProjectRepository implements IProjectRepository {
  private async getProjectStepsAndEdges(db: any, projectId: number): Promise<{ steps: ActionStepDto[], edges: FlowEdgeDto[] }> {
    const stepRows = await db.all('SELECT * FROM action_steps WHERE project_id = ?', projectId);
    const edgeRows = await db.all('SELECT * FROM flow_edges WHERE project_id = ?', projectId);

    const steps = stepRows.map((row: any) => new ActionStepDto({
      id: row.id,
      projectId: row.project_id,
      isStart: row.is_start === 1,
      actionType: row.action_type,
      targetTab: row.target_tab,
      selector: row.selector,
      targetSelector: row.target_selector,
      value: row.value,
      scrollX: row.scroll_x,
      scrollY: row.scroll_y,
      positionX: row.position_x,
      positionY: row.position_y,
      extraParams: row.extra_params,
      isRandom: row.is_random === 1,
      minVal: row.min_val,
      maxVal: row.max_val,
      randomType: row.random_type
    }));

    const edges = edgeRows.map((row: any) => new FlowEdgeDto({
      id: row.id,
      projectId: row.project_id,
      sourceStepId: row.source_step_id,
      targetStepId: row.target_step_id,
      condition: row.condition,
      isLoop: row.is_loop === 1,
      timeDelay: row.time_delay,
      extraParams: row.extra_params
    }));

    return { steps, edges };
  }

  async create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectDto> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const result = await db.run(
      `INSERT INTO projects (name, description, created_at, updated_at) VALUES (?, ?, ?, ?)`,
      project.name,
      project.description || null,
      now,
      now
    );
    const id = result.lastID!;
    return new ProjectDto({ ...project, id, createdAt: now, updatedAt: now }, [], []);
  }

  async getById(id: number): Promise<ProjectDto | null> {
    const db = await getDatabase();
    const row = await db.get('SELECT * FROM projects WHERE id = ?', id);
    if (!row) return null;
    const { steps, edges } = await this.getProjectStepsAndEdges(db, id);
    return new ProjectDto({
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }, steps, edges);
  }

  async getAll(): Promise<ProjectDto[]> {
    const db = await getDatabase();
    const rows = await db.all('SELECT * FROM projects ORDER BY created_at DESC');
    return rows.map(row => new ProjectDto({
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }, [], []));
  }

  async update(id: number, projectData: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ProjectDto | null> {
    const db = await getDatabase();
    const project = await this.getById(id);
    if (!project) return null;

    const name = projectData.name !== undefined ? projectData.name : project.name;
    const description = projectData.description !== undefined ? projectData.description : project.description;
    const now = new Date().toISOString();

    await db.run(
      `UPDATE projects SET name = ?, description = ?, updated_at = ? WHERE id = ?`,
      name,
      description,
      now,
      id
    );

    return this.getById(id);
  }

  async delete(id: number): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.run('DELETE FROM projects WHERE id = ?', id);
    return (result.changes ?? 0) > 0;
  }

  async deleteMany(ids: number[]): Promise<number> {
    if (!ids || ids.length === 0) return 0;
    const db = await getDatabase();
    const placeholders = ids.map(() => '?').join(',');
    const result = await db.run(`DELETE FROM projects WHERE id IN (${placeholders})`, ...ids);
    return result.changes ?? 0;
  }
}
