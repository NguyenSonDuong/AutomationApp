import { Router } from 'express';
import { ProjectController } from '../../../adapters/controllers/ProjectController';

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

  // Placeholder runner and flow saving endpoints as defined in routes.py
  router.post('/run', (req, res) => {
    res.json({ success: true, message: 'Automation task triggered in background (stub)' });
  });

  router.post('/:projectId/flow', (req, res) => {
    res.json({ success: true, message: `Flow chart layout saved for project ${req.params.projectId} (stub)` });
  });

  return router;
}
