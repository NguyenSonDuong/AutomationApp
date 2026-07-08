// ============================================================
// AutomationSocketController.ts — Adapters Layer
// Bridges Socket.IO events from the frontend node-builder to
// the ExecuteFlowUseCase.
//
// This controller ONLY knows about:
//   • Socket.IO (infrastructure concern — acceptable in adapters)
//   • ExecuteFlowUseCase (use-case layer)
//   • AutomationCoreFactory (fetches the engine instance)
//
// It NEVER imports PatchrightCore or CloakBrowserCore directly.
// ============================================================

import { Server as SocketIOServer, Socket } from 'socket.io';
import { AutomationCoreFactory, AutomationEngineType } from '../../infrastructure/automation-core/AutomationCoreFactory';
import { ExecuteFlowUseCase, FlowNode, FlowEdge } from '../../use-cases/ExecuteFlowUseCase';

// ── Socket event payload shapes ───────────────────────────────

interface RunFlowPayload {
  projectId: number;
  nodes: FlowNode[];
  edges: FlowEdge[];
  profileDir: string;
  proxyUrl?: string;
  /** Optional override for the engine type ('patchright' | 'cloakbrowser') */
  engine?: AutomationEngineType;
}

// ── Controller ────────────────────────────────────────────────

export class AutomationSocketController {
  constructor(private readonly io: SocketIOServer) {}

  /**
   * Register all automation-related Socket.IO event listeners.
   * Call this once per connected socket inside io.on('connection', …).
   */
  registerEvents(socket: Socket): void {
    // ── run_flow ─────────────────────────────────────────────
    socket.on('run_flow', async (payload: RunFlowPayload) => {
      const { projectId, nodes, edges, profileDir, proxyUrl, engine } = payload;

      console.log(`[AutomationSocket] run_flow received — projectId: ${projectId}, engine: ${engine ?? 'default'}`);

      // Emit an ack so the frontend knows the run has started
      socket.emit('flow_run_started', { projectId });

      try {
        // Resolve the correct engine instance (never knowing the concrete class)
        const core = engine
          ? AutomationCoreFactory.getInstance(engine)
          : AutomationCoreFactory.getDefault();

        const useCase = new ExecuteFlowUseCase(core);

        const result = await useCase.execute(nodes, edges, {
          profileDir,
          proxyUrl,
          engine,
          emitProgress: (event) => {
            // Forward real-time progress to all clients (or just this socket)
            this.io.emit('flow_node_status', { projectId, ...event });
          },
        });

        if (result.success) {
          socket.emit('flow_run_finished', { projectId, success: true });
        } else {
          socket.emit('flow_run_error', { projectId, error: result.error });
        }
      } catch (err: any) {
        console.error('[AutomationSocket] Uncaught error during flow execution:', err);
        socket.emit('flow_run_error', { projectId, error: err.message });
      }
    });

    // ── list_engines ─────────────────────────────────────────
    // Lets the frontend query which engines are available.
    socket.on('list_engines', () => {
      socket.emit('engines_list', { engines: AutomationCoreFactory.listEngines() });
    });
  }
}
