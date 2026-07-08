import express from 'express';
import cors from 'cors';
import { TaskController } from '../../adapters/controllers/TaskController';
import { ProxyController } from '../../adapters/controllers/ProxyController';
import { ChromeProfileController } from '../../adapters/controllers/ChromeProfileController';
import { ProjectController } from '../../adapters/controllers/ProjectController';
import { ActionStepController } from '../../adapters/controllers/ActionStepController';

// Import Route routers
import { createProxyRouter } from './routes/ProxyRoutes';
import { createChromeProfileRouter } from './routes/ChromeProfileRoutes';
import { createProjectRouter } from './routes/ProjectRoutes';
import { createActionStepRouter } from './routes/ActionStepRoutes';

export interface ExpressAppControllers {
  taskController: TaskController;
  proxyController: ProxyController;
  profileController: ChromeProfileController;
  projectController: ProjectController;
  stepController: ActionStepController;
}

export function createExpressApp(controllers: ExpressAppControllers): express.Application {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Baseline Task API routes
  app.get('/api/tasks', (req, res) => controllers.taskController.getTasks(req, res));
  app.post('/api/tasks', (req, res) => controllers.taskController.createTask(req, res));
  app.patch('/api/tasks/:id/toggle', (req, res) => controllers.taskController.toggleTask(req, res));

  // Mount Modular Routes
  // 1. Proxies Router
  app.use('/api/proxies', createProxyRouter(controllers.proxyController));

  // 2. Chrome Profiles Router (bind to both /api/profiles and /api/chrome-profiles for compatibility)
  app.use('/api/profiles', createChromeProfileRouter(controllers.profileController));
  app.use('/api/chrome-profiles', createChromeProfileRouter(controllers.profileController));

  // 3. Projects Router (mounts on /api/projects, handles project endpoints)
  app.use('/api/projects', createProjectRouter(controllers.projectController));
  // Mount runner endpoints on root /api (handles /api/run)
  app.use('/api', createProjectRouter(controllers.projectController));

  // 4. Action Steps Router (handles /api/projects/:projectId/steps and /api/steps/:id)
  app.use('/api', createActionStepRouter(controllers.stepController));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
  });

  return app;
}
