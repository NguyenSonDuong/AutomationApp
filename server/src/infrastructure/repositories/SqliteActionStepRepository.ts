import { IActionStepRepository } from '../../domain/repositories/IActionStepRepository';
import { ActionStep } from '../../domain/entities/ActionStep';
import { ActionStepDto } from '../../domain/dto/ActionStepDto';
import { getDatabase } from '../database/sqlite';

export class SqliteActionStepRepository implements IActionStepRepository {
  async create(step: Omit<ActionStep, 'id'>): Promise<ActionStepDto> {
    const db = await getDatabase();
    
    // If this step is set as start, unset is_start on other steps for the same project
    if (step.isStart) {
      await db.run('UPDATE action_steps SET is_start = 0 WHERE project_id = ?', step.projectId);
    }

    const extraParamsStr = step.extraParams 
      ? (typeof step.extraParams === 'string' ? step.extraParams : JSON.stringify(step.extraParams))
      : null;

    const result = await db.run(
      `INSERT INTO action_steps (
        project_id, is_start, action_type, target_tab, selector, target_selector, value,
        scroll_x, scroll_y, position_x, position_y, extra_params, is_random, min_val, max_val, random_type
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      step.projectId,
      step.isStart ? 1 : 0,
      step.actionType,
      step.targetTab || 'current',
      step.selector || null,
      step.targetSelector || null,
      step.value || null,
      step.scrollX !== undefined ? step.scrollX : null,
      step.scrollY !== undefined ? step.scrollY : null,
      step.positionX !== undefined ? step.positionX : 0.0,
      step.positionY !== undefined ? step.positionY : 0.0,
      extraParamsStr,
      step.isRandom ? 1 : 0,
      step.minVal !== undefined ? step.minVal : null,
      step.maxVal !== undefined ? step.maxVal : null,
      step.randomType || null
    );

    const id = result.lastID!;
    return new ActionStepDto({ ...step, id });
  }

  async getById(id: number): Promise<ActionStepDto | null> {
    const db = await getDatabase();
    const row = await db.get('SELECT * FROM action_steps WHERE id = ?', id);
    if (!row) return null;
    return new ActionStepDto({
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
    });
  }

  async getByProjectId(projectId: number): Promise<ActionStepDto[]> {
    const db = await getDatabase();
    const rows = await db.all('SELECT * FROM action_steps WHERE project_id = ? ORDER BY id ASC', projectId);
    return rows.map(row => new ActionStepDto({
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
  }

  async update(id: number, stepData: Partial<Omit<ActionStep, 'id' | 'projectId'>>): Promise<ActionStepDto | null> {
    const db = await getDatabase();
    const step = await this.getById(id);
    if (!step) return null;

    // Handle isStart change
    const isStart = stepData.isStart !== undefined ? stepData.isStart : step.isStart;
    if (stepData.isStart === true) {
      await db.run('UPDATE action_steps SET is_start = 0 WHERE project_id = ? AND id != ?', step.projectId, id);
    }

    const actionType = stepData.actionType !== undefined ? stepData.actionType : step.actionType;
    const targetTab = stepData.targetTab !== undefined ? stepData.targetTab : step.targetTab;
    const selector = stepData.selector !== undefined ? stepData.selector : step.selector;
    const targetSelector = stepData.targetSelector !== undefined ? stepData.targetSelector : step.targetSelector;
    const value = stepData.value !== undefined ? stepData.value : step.value;
    const scrollX = stepData.scrollX !== undefined ? stepData.scrollX : step.scrollX;
    const scrollY = stepData.scrollY !== undefined ? stepData.scrollY : step.scrollY;
    const positionX = stepData.positionX !== undefined ? stepData.positionX : step.positionX;
    const positionY = stepData.positionY !== undefined ? stepData.positionY : step.positionY;
    
    let extraParamsStr = step.extraParams ? JSON.stringify(step.extraParams) : null;
    if (stepData.extraParams !== undefined) {
      extraParamsStr = stepData.extraParams 
        ? (typeof stepData.extraParams === 'string' ? stepData.extraParams : JSON.stringify(stepData.extraParams))
        : null;
    }

    const isRandom = stepData.isRandom !== undefined ? stepData.isRandom : step.isRandom;
    const minVal = stepData.minVal !== undefined ? stepData.minVal : step.minVal;
    const maxVal = stepData.maxVal !== undefined ? stepData.maxVal : step.maxVal;
    const randomType = stepData.randomType !== undefined ? stepData.randomType : step.randomType;

    await db.run(
      `UPDATE action_steps SET 
        is_start = ?, action_type = ?, target_tab = ?, selector = ?, target_selector = ?, value = ?,
        scroll_x = ?, scroll_y = ?, position_x = ?, position_y = ?, extra_params = ?, is_random = ?,
        min_val = ?, max_val = ?, random_type = ?
       WHERE id = ?`,
      isStart ? 1 : 0,
      actionType,
      targetTab,
      selector,
      targetSelector,
      value,
      scrollX,
      scrollY,
      positionX,
      positionY,
      extraParamsStr,
      isRandom ? 1 : 0,
      minVal,
      maxVal,
      randomType,
      id
    );

    return this.getById(id);
  }

  async delete(id: number): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.run('DELETE FROM action_steps WHERE id = ?', id);
    return (result.changes ?? 0) > 0;
  }

  async deleteMany(ids: number[]): Promise<number> {
    if (!ids || ids.length === 0) return 0;
    const db = await getDatabase();
    const placeholders = ids.map(() => '?').join(',');
    const result = await db.run(`DELETE FROM action_steps WHERE id IN (${placeholders})`, ...ids);
    return result.changes ?? 0;
  }

  async reorder(projectId: number, orderedStepIds: number[]): Promise<ActionStepDto[]> {
    const steps = await this.getByProjectId(projectId);
    const stepMap = new Map(steps.map(s => [s.id, s]));
    
    const sortedSteps: ActionStepDto[] = [];
    for (const sid of orderedStepIds) {
      const step = stepMap.get(sid);
      if (step) {
        sortedSteps.push(step);
      }
    }
    
    // Append remaining steps
    for (const s of steps) {
      if (s.id && !orderedStepIds.includes(s.id)) {
        sortedSteps.push(s);
      }
    }
    return sortedSteps;
  }
}
