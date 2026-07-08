// ============================================================
// AutomationSocketController.ts — Adapters Layer (v2)
// Bridges Socket.IO events to the FlowRunnerService.
// Loads Profile + Proxy + ActionStep data from DB repositories,
// maps them to FlowNode/FlowEdge, and dispatches to the runner.
// ============================================================

import { Server as SocketIOServer, Socket } from 'socket.io';
import { flowRunnerService } from '../../infrastructure/automation-core/FlowRunnerService';
import { AutomationCoreFactory } from '../../infrastructure/automation-core/AutomationCoreFactory';
import type { WorkerInput } from '../../infrastructure/automation-core/FlowRunnerService';
import type { FlowNode, FlowEdge } from '../../use-cases/ExecuteFlowUseCase';

// ── Repository interfaces (injected) ─────────────────────────

import type { IChromeProfileRepository } from '../../domain/repositories/IChromeProfileRepository';
import type { IProxyRepository } from '../../domain/repositories/IProxyRepository';
import type { IActionStepRepository } from '../../domain/repositories/IActionStepRepository';
import type { IProjectRepository } from '../../domain/repositories/IProjectRepository';

// ── Proxy URL builder (mirrors Python setup_proxy logic) ──────

function buildProxyUrl(proxy: {
  type?: string;
  host?: string;
  port?: number | string;
  username?: string;
  password?: string;
} | null | undefined): string | undefined {
  if (!proxy || !proxy.host) return undefined;

  const scheme = (proxy.type ?? 'http').toLowerCase();
  const host = proxy.host.trim();
  const port = proxy.port ?? 80;

  if (proxy.username && proxy.password) {
    return `${scheme}://${proxy.username}:${proxy.password}@${host}:${port}`;
  }
  return `${scheme}://${host}:${port}`;
}

// ── DB → FlowNode mapper ──────────────────────────────────────

function mapActionStepToFlowNode(step: any): FlowNode {
  // Parse extra_params if stored as JSON string
  let extraParams: Record<string, any> | undefined;
  if (typeof step.extraParams === 'string') {
    try { extraParams = JSON.parse(step.extraParams); } catch { extraParams = {}; }
  } else {
    extraParams = step.extraParams;
  }

  return {
    id: String(step.id),
    data: {
      action_type: step.actionType,
      is_start: Boolean(step.isStart),
      selector: step.selector ?? undefined,
      target_selector: step.targetSelector ?? undefined,
      target_tab: step.targetTab ?? 'current',
      value: step.value ?? undefined,
      scroll_x: step.scrollX ?? undefined,
      scroll_y: step.scrollY ?? undefined,
      extra_params: extraParams,
      is_random: Boolean(step.isRandom),
      random_type: step.randomType ?? undefined,
      min_val: step.minVal ?? undefined,
      max_val: step.maxVal ?? undefined,
    }
  };
}

// ── DB → FlowEdge mapper ──────────────────────────────────────

function mapFlowEdgeFromDb(edge: any): FlowEdge {
  let condition: any = undefined;
  if (edge.condition) {
    if (typeof edge.condition === 'string') {
      try { condition = JSON.parse(edge.condition); } catch { condition = undefined; }
    } else {
      condition = edge.condition;
    }
  }

  return {
    id: String(edge.id),
    source: String(edge.sourceStepId ?? edge.source_step_id ?? edge.source),
    target: String(edge.targetStepId ?? edge.target_step_id ?? edge.target),
    data: {
      condition,
      is_loop: Boolean(edge.isLoop ?? edge.is_loop),
      time_delay: Number(edge.timeDelay ?? edge.time_delay ?? 0),
    }
  };
}

// ── Controller ────────────────────────────────────────────────

export class AutomationSocketController {
  constructor(
    private readonly io: SocketIOServer,
    private readonly profileRepo: IChromeProfileRepository,
    private readonly proxyRepo: IProxyRepository,
    private readonly stepRepo: IActionStepRepository,
    private readonly projectRepo: IProjectRepository
  ) {
    // Forward FlowRunnerService events to all connected Socket.IO clients
    flowRunnerService.on('log', (data) => {
      this.io.emit('flow_log', data);
    });

    flowRunnerService.on('progress', (data) => {
      this.io.emit('flow_node_status', data);
    });

    flowRunnerService.on('finished', (data) => {
      this.io.emit(data.success ? 'flow_run_finished' : 'flow_run_error', data);
    });
  }

  registerEvents(socket: Socket): void {
    // ── run_flow ─────────────────────────────────────────────
    // Payload: { projectId, profileIds: number[], engine?: string, nodes?: FlowNode[], edges?: FlowEdge[] }
    // If nodes/edges are not provided, loads them from the DB by projectId.
    socket.on('run_flow', async (payload: {
      projectId: number;
      profileIds?: number[];
      engine?: string;
      nodes?: FlowNode[];
      edges?: FlowEdge[];
    }) => {
      const { projectId, profileIds, engine } = payload;

      console.log(`[AutomationSocket] run_flow → project=${projectId}, profiles=${JSON.stringify(profileIds)}, engine=${engine ?? 'default'}`);

      try {
        // 1. Load nodes/edges from DB if not passed directly
        let nodes: FlowNode[] = payload.nodes ?? [];
        let edges: FlowEdge[] = payload.edges ?? [];

        if (nodes.length === 0) {
          const steps = await this.stepRepo.getByProjectId(projectId);
          nodes = steps.map(mapActionStepToFlowNode);
        }

        if (nodes.length === 0) {
          socket.emit('flow_run_error', { projectId, error: 'Không có action steps nào trong project.' });
          return;
        }

        // 2. Load edges from DB (FlowEdge table)
        if (edges.length === 0) {
          const project = await this.projectRepo.getById(projectId);
          if (project) {
            // edges are stored in flow_edges table joined via project
            const rawEdges = (project as any).flowEdges ?? [];
            edges = rawEdges.map(mapFlowEdgeFromDb);
          }
        }

        // 3. Determine profile list
        let targetProfileIds: number[] = profileIds ?? [];
        if (targetProfileIds.length === 0) {
          // Run all profiles linked to project if none specified
          const project = await this.projectRepo.getById(projectId);
          if (project && (project as any).profileId) {
            targetProfileIds = [(project as any).profileId];
          }
        }

        if (targetProfileIds.length === 0) {
          socket.emit('flow_run_error', { projectId, error: 'Không có Profile nào được chỉ định để chạy.' });
          return;
        }

        // 4. Launch one Worker thread per profile (parallel)
        socket.emit('flow_run_started', { projectId, profileIds: targetProfileIds });

        for (const profileId of targetProfileIds) {
          const profile = await this.profileRepo.getById(profileId);
          if (!profile) {
            socket.emit('flow_log', { projectId, profileId, message: `[Warning] Không tìm thấy Profile ID=${profileId}, bỏ qua.` });
            continue;
          }

          // Build proxy URL from linked proxy
          let proxyUrl: string | undefined;
          if (profile.proxyId) {
            const proxy = await this.proxyRepo.getById(profile.proxyId);
            proxyUrl = buildProxyUrl(proxy as any);
          }

          const workerInput: WorkerInput = {
            projectId,
            profileId,
            profileLabel: profile.name,
            profileDir: profile.folderName,
            proxyUrl,
            engine: engine ?? (process.env.AUTOMATION_ENGINE ?? 'patchright'),
            nodes,
            edges
          };

          // Non-blocking: each profile gets its own thread
          flowRunnerService.runProfile(workerInput).catch((err) => {
            socket.emit('flow_run_error', { projectId, profileId, error: err.message });
          });
        }

      } catch (err: any) {
        console.error('[AutomationSocket] run_flow error:', err);
        socket.emit('flow_run_error', { projectId, error: err.message });
      }
    });

    // ── stop_flow ─────────────────────────────────────────────
    socket.on('stop_flow', (payload: { projectId: number; profileId?: number }) => {
      const { projectId, profileId } = payload;
      if (profileId) {
        const stopped = flowRunnerService.stopProfile(projectId, profileId);
        socket.emit('flow_stopped', { projectId, profileId, stopped });
      } else {
        const count = flowRunnerService.stopProject(projectId);
        socket.emit('flow_stopped', { projectId, count });
      }
    });

    // ── list_active_runs ──────────────────────────────────────
    socket.on('list_active_runs', () => {
      socket.emit('active_runs', { runs: flowRunnerService.listActiveRuns() });
    });

    // ── list_engines ──────────────────────────────────────────
    socket.on('list_engines', () => {
      socket.emit('engines_list', { engines: AutomationCoreFactory.listEngines() });
    });
  }
}
