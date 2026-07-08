import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { getDatabase } from './infrastructure/database/sqlite';
import dotenv from 'dotenv';

// Baseline Tasks imports
import { SqliteTaskRepository } from './infrastructure/repositories/SqliteTaskRepository';
import { GetTasksUseCase } from './use-cases/GetTasksUseCase';
import { CreateTaskUseCase } from './use-cases/CreateTaskUseCase';
import { ToggleTaskUseCase } from './use-cases/ToggleTaskUseCase';
import { TaskController } from './adapters/controllers/TaskController';

// New Repositories imports
import { SqliteProxyRepository } from './infrastructure/repositories/SqliteProxyRepository';
import { SqliteChromeProfileRepository } from './infrastructure/repositories/SqliteChromeProfileRepository';
import { SqliteProjectRepository } from './infrastructure/repositories/SqliteProjectRepository';
import { SqliteActionStepRepository } from './infrastructure/repositories/SqliteActionStepRepository';

// New Use Cases imports
import { 
  GetAllProxiesUseCase, 
  GetProxyByIdUseCase, 
  CreateProxyUseCase, 
  UpdateProxyUseCase, 
  DeleteProxyUseCase, 
  DeleteManyProxiesUseCase, 
  ImportProxiesUseCase 
} from './use-cases/ProxyUseCases';
import { 
  GetAllChromeProfilesUseCase, 
  GetChromeProfileByIdUseCase, 
  CreateChromeProfileUseCase, 
  UpdateChromeProfileUseCase, 
  DeleteChromeProfileUseCase, 
  DeleteManyChromeProfilesUseCase 
} from './use-cases/ChromeProfileUseCases';
import { 
  GetAllProjectsUseCase, 
  GetProjectByIdUseCase, 
  CreateProjectUseCase, 
  UpdateProjectUseCase, 
  DeleteProjectUseCase, 
  DeleteManyProjectsUseCase 
} from './use-cases/ProjectUseCases';
import { 
  GetActionStepsByProjectIdUseCase, 
  GetActionStepByIdUseCase, 
  CreateActionStepUseCase, 
  UpdateActionStepUseCase, 
  DeleteActionStepUseCase, 
  DeleteManyActionStepsUseCase, 
  ReorderActionStepsUseCase 
} from './use-cases/ActionStepUseCases';

// New Controllers imports
import { ProxyController } from './adapters/controllers/ProxyController';
import { ChromeProfileController } from './adapters/controllers/ChromeProfileController';
import { ProjectController } from './adapters/controllers/ProjectController';
import { ActionStepController } from './adapters/controllers/ActionStepController';

import { createExpressApp } from './infrastructure/webserver/express';

dotenv.config();

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    // 1. Initialize SQLite Database & run migrations
    console.log('[DB] Connecting to SQLite...');
    await getDatabase();
    console.log('[DB] SQLite connection established & tables initialized.');

    // 2. Initialize Repositories
    const taskRepository = new SqliteTaskRepository();
    const proxyRepository = new SqliteProxyRepository();
    const profileRepository = new SqliteChromeProfileRepository();
    const projectRepository = new SqliteProjectRepository();
    const stepRepository = new SqliteActionStepRepository();

    // 3. Initialize Socket.io Server instance
    const io = new SocketIOServer({
      cors: {
        origin: '*', // Allow connections from React & Electron in dev mode
        methods: ['GET', 'POST', 'PATCH']
      }
    });

    // 4. Initialize Use Cases
    const getTasksUseCase = new GetTasksUseCase(taskRepository);
    const createTaskUseCase = new CreateTaskUseCase(taskRepository);
    const toggleTaskUseCase = new ToggleTaskUseCase(taskRepository);

    const getAllProxies = new GetAllProxiesUseCase(proxyRepository);
    const getProxyById = new GetProxyByIdUseCase(proxyRepository);
    const createProxy = new CreateProxyUseCase(proxyRepository);
    const updateProxy = new UpdateProxyUseCase(proxyRepository);
    const deleteProxy = new DeleteProxyUseCase(proxyRepository);
    const deleteManyProxies = new DeleteManyProxiesUseCase(proxyRepository);
    const importProxies = new ImportProxiesUseCase(proxyRepository);

    const getAllProfiles = new GetAllChromeProfilesUseCase(profileRepository);
    const getProfileById = new GetChromeProfileByIdUseCase(profileRepository);
    const createProfile = new CreateChromeProfileUseCase(profileRepository);
    const updateProfile = new UpdateChromeProfileUseCase(profileRepository);
    const deleteProfile = new DeleteChromeProfileUseCase(profileRepository);
    const deleteManyProfiles = new DeleteManyChromeProfilesUseCase(profileRepository);

    const getAllProjects = new GetAllProjectsUseCase(projectRepository);
    const getProjectById = new GetProjectByIdUseCase(projectRepository);
    const createProject = new CreateProjectUseCase(projectRepository);
    const updateProject = new UpdateProjectUseCase(projectRepository);
    const deleteProject = new DeleteProjectUseCase(projectRepository);
    const deleteManyProjects = new DeleteManyProjectsUseCase(projectRepository);

    const getStepsByProjectId = new GetActionStepsByProjectIdUseCase(stepRepository);
    const getStepById = new GetActionStepByIdUseCase(stepRepository);
    const createStep = new CreateActionStepUseCase(stepRepository);
    const updateStep = new UpdateActionStepUseCase(stepRepository);
    const deleteStep = new DeleteActionStepUseCase(stepRepository);
    const deleteManySteps = new DeleteManyActionStepsUseCase(stepRepository);
    const reorderSteps = new ReorderActionStepsUseCase(stepRepository);

    // 5. Initialize Controllers
    const taskController = new TaskController(
      getTasksUseCase,
      createTaskUseCase,
      toggleTaskUseCase,
      io
    );

    const proxyController = new ProxyController(
      getAllProxies,
      getProxyById,
      createProxy,
      updateProxy,
      deleteProxy,
      deleteManyProxies,
      importProxies
    );

    const profileController = new ChromeProfileController(
      getAllProfiles,
      getProfileById,
      createProfile,
      updateProfile,
      deleteProfile,
      deleteManyProfiles
    );

    const projectController = new ProjectController(
      getAllProjects,
      getProjectById,
      createProject,
      updateProject,
      deleteProject,
      deleteManyProjects
    );

    const stepController = new ActionStepController(
      getStepsByProjectId,
      getStepById,
      createStep,
      updateStep,
      deleteStep,
      deleteManySteps,
      reorderSteps
    );

    // 6. Initialize Express App
    const app = createExpressApp({
      taskController,
      proxyController,
      profileController,
      projectController,
      stepController
    });
    
    // 7. Create HTTP Server passing the Express app
    const server = http.createServer(app);

    // 8. Attach Socket.io to the HTTP Server
    io.attach(server);

    // Proxy websocket events from Python automation server (Port 5000) to clients on Port 3000
    const { io: ClientIO } = require('socket.io-client');
    const pythonSocket = ClientIO('http://localhost:5000', {
      reconnectionDelayMax: 10000,
      autoConnect: true
    });

    pythonSocket.on('connect', () => {
      console.log('[Socket Proxy] Connected to Python automation engine (Port 5000)');
    });

    pythonSocket.on('flow_execution_status', (data: any) => {
      io.emit('flow_execution_status', data);
    });

    pythonSocket.on('proxy_checked', (data: any) => {
      io.emit('proxy_checked', data);
    });

    pythonSocket.on('proxy_check_all_finished', (data: any) => {
      io.emit('proxy_check_all_finished', data);
    });

    pythonSocket.on('flow_updated', (data: any) => {
      io.emit('flow_updated', data);
    });

    pythonSocket.on('disconnect', () => {
      console.log('[Socket Proxy] Disconnected from Python automation engine (Port 5000)');
    });

    // 9. Socket.io Event Handling
    io.on('connection', (socket) => {
      console.log(`[Socket] Client connected: ${socket.id}`);
      
      socket.on('disconnect', () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
      });
    });

    // 10. Start HTTP & Socket server
    server.listen(PORT, () => {
      console.log(`[Server] running on http://localhost:${PORT}`);
      console.log(`[Socket.io] server bound and listening.`);
    });

  } catch (error) {
    console.error('Failed to bootstrap application:', error);
    process.exit(1);
  }
}

bootstrap();
