import { Router } from 'express';
import { ProxyController } from '../../../adapters/controllers/ProxyController';

export function createProxyRouter(proxyController: ProxyController): Router {
  const router = Router();

  router.get('/', (req, res) => proxyController.getList(req, res));
  router.get('/:id', (req, res) => proxyController.getOne(req, res));
  router.post('/', (req, res) => proxyController.create(req, res));
  router.post('/import', (req, res) => proxyController.import(req, res));
  router.patch('/:id', (req, res) => proxyController.update(req, res));
  router.put('/:id', (req, res) => proxyController.update(req, res));
  router.delete('/:id', (req, res) => proxyController.deleteOne(req, res));
  router.post('/delete-many', (req, res) => proxyController.deleteMany(req, res));
  router.delete('/', (req, res) => proxyController.deleteMany(req, res));

  // Placeholder connection checks as defined in routes.py
  router.post('/check-all', (req, res) => {
    res.json({ success: true, message: 'Check all proxies connection status (stub)' });
  });
  router.post('/check/:id', (req, res) => {
    res.json({ success: true, message: `Check proxy ${req.params.id} connection status (stub)` });
  });

  return router;
}
