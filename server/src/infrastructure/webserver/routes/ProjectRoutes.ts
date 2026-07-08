import { Router } from 'express';
import { ProjectController } from '../../../adapters/controllers/ProjectController';
import { getDatabase } from '../../database/sqlite';

export function createProjectRouter(projectController: ProjectController): Router {
  const router = Router();

  router.get('/', (req, res) => projectController.getList(req, res));
  router.get('/:id', (req, res) => projectController.getOne(req, res));
  router.post('/', (req, res) => projectController.create(req, res));
  router.patch('/:id', (req, res) => projectController.update(req, res));
  router.put('/:id', (req, res) => projectController.update(req, res));
  router.delete('/:id', (req, res) => projectController.deleteOne(req, res));
  router.post('/delete-many', (req, res) => projectController.deleteMany(req, res));
  router.delete('/', (req, res) => projectController.deleteMany(req, res));

  // Forward run requests to local Python automation Flask server (Port 5000)
  router.post('/run', async (req, res) => {
    try {
      const response = await fetch('http://localhost:5000/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
      if (response.ok) {
        const data = await response.json();
        res.json(data);
      } else {
        const errText = await response.text();
        res.status(response.status).send(errText);
      }
    } catch (e: any) {
      console.error('[Run] Failed to forward run request to Python automation engine:', e);
      res.status(500).json({ error: 'Công cụ chạy tự động hóa Python chưa hoạt động (Port 5000 offline)' });
    }
  });

  // Save the visual diagram flow graph layout (Nodes and Edges) inside a SQLite Transaction
  router.post('/:projectId/flow', async (req, res) => {
    const projectId = parseInt(req.params.projectId, 10);
    const { nodes, edges } = req.body;

    const db = await getDatabase();
    await db.exec('BEGIN TRANSACTION');

    try {
      // 1. Get existing steps from DB
      const existingSteps = await db.all('SELECT id FROM action_steps WHERE project_id = ?', projectId);
      const existingStepIds = new Set(existingSteps.map(s => s.id));

      const activeStepIds = new Set<number>();
      const tempIdToRealId: Record<string, number> = {};

      // 2. Process nodes
      for (const node of nodes) {
        const nodeId = node.id;
        const isStart = node.is_start ? 1 : 0;
        const extraParamsStr = node.extra_params ? JSON.stringify(node.extra_params) : null;
        
        let realId: number | null = null;
        const isExisting = !isNaN(Number(nodeId)) && existingStepIds.has(Number(nodeId));

        if (isExisting) {
          realId = Number(nodeId);
          await db.run(
            `UPDATE action_steps SET 
              is_start = ?, action_type = ?, target_tab = ?, selector = ?, target_selector = ?, value = ?,
              scroll_x = ?, scroll_y = ?, position_x = ?, position_y = ?, extra_params = ?, is_random = ?,
              min_val = ?, max_val = ?, random_type = ?
             WHERE id = ?`,
            isStart,
            node.action_type,
            node.target_tab || 'current',
            node.selector || null,
            node.target_selector || null,
            node.value || null,
            node.scroll_x !== undefined ? node.scroll_x : null,
            node.scroll_y !== undefined ? node.scroll_y : null,
            node.position_x !== undefined ? node.position_x : 0.0,
            node.position_y !== undefined ? node.position_y : 0.0,
            extraParamsStr,
            node.is_random ? 1 : 0,
            node.min_val !== undefined ? node.min_val : null,
            node.max_val !== undefined ? node.max_val : null,
            node.random_type || null,
            realId
          );
          activeStepIds.add(realId);
        } else {
          // Insert new step
          const insertResult = await db.run(
            `INSERT INTO action_steps (
              project_id, is_start, action_type, target_tab, selector, target_selector, value,
              scroll_x, scroll_y, position_x, position_y, extra_params, is_random, min_val, max_val, random_type
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            projectId,
            isStart,
            node.action_type,
            node.target_tab || 'current',
            node.selector || null,
            node.target_selector || null,
            node.value || null,
            node.scroll_x !== undefined ? node.scroll_x : null,
            node.scroll_y !== undefined ? node.scroll_y : null,
            node.position_x !== undefined ? node.position_x : 0.0,
            node.position_y !== undefined ? node.position_y : 0.0,
            extraParamsStr,
            node.is_random ? 1 : 0,
            node.min_val !== undefined ? node.min_val : null,
            node.max_val !== undefined ? node.max_val : null,
            node.random_type || null
          );
          realId = insertResult.lastID!;
          activeStepIds.add(realId);
        }
        
        tempIdToRealId[String(nodeId)] = realId;
      }

      // 3. Delete action steps that are no longer active
      for (const stepId of existingStepIds) {
        if (!activeStepIds.has(stepId)) {
          await db.run('DELETE FROM action_steps WHERE id = ?', stepId);
        }
      }

      // 4. Delete old edges for this project
      await db.run('DELETE FROM flow_edges WHERE project_id = ?', projectId);

      // 5. Insert new flow edges with mapped real IDs
      for (const edge of edges) {
        const sourceReal = tempIdToRealId[String(edge.source_step_id)];
        const targetReal = tempIdToRealId[String(edge.target_step_id)];

        if (sourceReal && targetReal) {
          await db.run(
            `INSERT INTO flow_edges (
              project_id, source_step_id, target_step_id, condition, is_loop, time_delay, extra_params
             ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            projectId,
            sourceReal,
            targetReal,
            edge.condition ? (typeof edge.condition === 'string' ? edge.condition : JSON.stringify(edge.condition)) : null,
            edge.is_loop ? 1 : 0,
            edge.time_delay || 0.0,
            edge.extra_params ? (typeof edge.extra_params === 'string' ? edge.extra_params : JSON.stringify(edge.extra_params)) : null
          );
        }
      }

      await db.exec('COMMIT');
      res.json({ success: true, message: `Flow chart layout saved for project ${projectId}` });
    } catch (error: any) {
      await db.exec('ROLLBACK');
      console.error('[SaveFlow] Error saving project flow:', error);
      res.status(500).json({ error: error.message || 'Lưu sơ đồ kịch bản thất bại' });
    }
  });

  return router;
}
