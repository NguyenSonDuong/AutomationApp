// ============================================================
// FlowRunnerService.ts — Infrastructure Layer
// Manages per-profile isolated execution threads using Node.js
// worker_threads. Each profile runs in its own Worker so that:
//   • Blocking Playwright calls don't freeze the main event loop
//   • Multiple profiles run truly in parallel
//   • A crash in one profile doesn't affect others
//
// Thread lifecycle events are forwarded to Socket.IO so the
// frontend can see per-profile status in real time.
// ============================================================

import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import path from 'path';
import { EventEmitter } from 'events';

// ── Worker message types ──────────────────────────────────────

export interface WorkerInput {
  projectId: number;
  profileId: number;
  profileLabel: string;
  profileDir: string;
  proxyUrl?: string;
  engine: string;
  nodes: any[];
  edges: any[];
}

export interface WorkerOutput {
  type: 'log' | 'progress' | 'finished' | 'error';
  profileId: number;
  projectId: number;
  data: any;
}

// ── Per-run tracking ─────────────────────────────────────────

interface RunHandle {
  worker: Worker;
  profileId: number;
  projectId: number;
  startedAt: Date;
}

// ── Service ───────────────────────────────────────────────────

export class FlowRunnerService extends EventEmitter {
  /** Map of "projectId_profileId" → active RunHandle */
  private activeRuns = new Map<string, RunHandle>();

  private runKey(projectId: number, profileId: number): string {
    return `${projectId}_${profileId}`;
  }

  /**
   * Launch a dedicated Worker thread for one profile run.
   * Emits events that AutomationSocketController forwards to Socket.IO.
   *
   * Events emitted:
   *   'log'      { projectId, profileId, message }
   *   'progress' { projectId, profileId, nodeId, edgeId, isNode, status, message }
   *   'finished' { projectId, profileId, success, error? }
   */
  async runProfile(input: WorkerInput): Promise<void> {
    const key = this.runKey(input.projectId, input.profileId);

    if (this.activeRuns.has(key)) {
      this.emit('log', {
        projectId: input.projectId,
        profileId: input.profileId,
        message: `[FlowRunner] Profile ${input.profileId} đang chạy, bỏ qua lệnh mới.`
      });
      return;
    }

    // Worker script path — points to the compiled JS file
    // In development (ts-node) we load the TS source via ts-node/esm
    const workerScript = path.resolve(__dirname, 'FlowRunnerWorker.js');

    const worker = new Worker(workerScript, {
      workerData: input
    });

    const handle: RunHandle = {
      worker,
      profileId: input.profileId,
      projectId: input.projectId,
      startedAt: new Date()
    };
    this.activeRuns.set(key, handle);

    console.log(`[FlowRunner] Bắt đầu Worker cho Profile ${input.profileId}, Project ${input.projectId}`);

    worker.on('message', (msg: WorkerOutput) => {
      switch (msg.type) {
        case 'log':
          this.emit('log', { projectId: msg.projectId, profileId: msg.profileId, message: msg.data });
          break;
        case 'progress':
          this.emit('progress', { projectId: msg.projectId, profileId: msg.profileId, ...msg.data });
          break;
        case 'finished':
        case 'error':
          this.emit('finished', { projectId: msg.projectId, profileId: msg.profileId, ...msg.data });
          this.activeRuns.delete(key);
          break;
      }
    });

    worker.on('error', (err) => {
      console.error(`[FlowRunner] Worker error (profile ${input.profileId}):`, err);
      this.emit('finished', {
        projectId: input.projectId,
        profileId: input.profileId,
        success: false,
        error: err.message
      });
      this.activeRuns.delete(key);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        this.emit('finished', {
          projectId: input.projectId,
          profileId: input.profileId,
          success: false,
          error: `Worker thoát với code ${code}`
        });
      }
      this.activeRuns.delete(key);
    });
  }

  /** Stop a running profile (terminate its worker) */
  stopProfile(projectId: number, profileId: number): boolean {
    const key = this.runKey(projectId, profileId);
    const handle = this.activeRuns.get(key);
    if (!handle) return false;
    handle.worker.terminate();
    this.activeRuns.delete(key);
    console.log(`[FlowRunner] Đã dừng Worker cho Profile ${profileId}, Project ${projectId}`);
    return true;
  }

  /** Stop all running workers for a project */
  stopProject(projectId: number): number {
    let stopped = 0;
    for (const [key, handle] of this.activeRuns.entries()) {
      if (handle.projectId === projectId) {
        handle.worker.terminate();
        this.activeRuns.delete(key);
        stopped++;
      }
    }
    return stopped;
  }

  /** List currently active runs */
  listActiveRuns(): Array<{ projectId: number; profileId: number; startedAt: Date }> {
    return [...this.activeRuns.values()].map((h) => ({
      projectId: h.projectId,
      profileId: h.profileId,
      startedAt: h.startedAt
    }));
  }

  isRunning(projectId: number, profileId: number): boolean {
    return this.activeRuns.has(this.runKey(projectId, profileId));
  }
}

// ── Singleton export ──────────────────────────────────────────
export const flowRunnerService = new FlowRunnerService();
