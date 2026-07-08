import { Router } from 'express';
import { ActionStepController } from '../../../adapters/controllers/ActionStepController';

export function createActionStepRouter(stepController: ActionStepController): Router {
  const router = Router();

  // Project-nested step routes
  router.get('/projects/:projectId/steps', (req, res) => stepController.getListByProject(req, res));
  router.post('/projects/:projectId/steps', (req, res, next) => {
    req.body.projectId = parseInt(req.params.projectId, 10);
    next();
  }, (req, res) => stepController.create(req, res));
  
  router.post('/projects/:projectId/steps/reorder', (req, res, next) => {
    req.body.projectId = parseInt(req.params.projectId, 10);
    next();
  }, (req, res) => stepController.reorder(req, res));

  // Direct step routes as defined in routes.py
  router.get('/steps/:id', (req, res) => stepController.getOne(req, res));
  router.patch('/steps/:id', (req, res) => stepController.update(req, res));
  router.put('/steps/:id', (req, res) => stepController.update(req, res));
  router.delete('/steps/:id', (req, res) => stepController.deleteOne(req, res));
  router.post('/steps/delete-many', (req, res) => stepController.deleteMany(req, res));
  router.delete('/steps', (req, res) => stepController.deleteMany(req, res));

  return router;
}
