import { Router } from 'express';
import { ChromeProfileController } from '../../../adapters/controllers/ChromeProfileController';

export function createChromeProfileRouter(profileController: ChromeProfileController): Router {
  const router = Router();

  router.get('/', (req, res) => profileController.getList(req, res));
  router.get('/:id', (req, res) => profileController.getOne(req, res));
  router.post('/', (req, res) => profileController.create(req, res));
  router.patch('/:id', (req, res) => profileController.update(req, res));
  router.put('/:id', (req, res) => profileController.update(req, res));
  router.delete('/:id', (req, res) => profileController.deleteOne(req, res));
  router.post('/delete-many', (req, res) => profileController.deleteMany(req, res));
  router.delete('/', (req, res) => profileController.deleteMany(req, res));

  return router;
}
