// ============================================================
// FlowRunnerWorker.ts — Infrastructure Layer
// This file runs inside a Worker thread (one per profile run).
// It imports the real Playwright/CloakBrowser engine and the
// ExecuteFlowUseCase, then executes the flow independently.
//
// Communication: parentPort.postMessage(WorkerOutput) only.
// ============================================================

import { workerData, parentPort } from 'worker_threads';
import { AutomationCoreFactory, AutomationEngineType } from './AutomationCoreFactory';
import { ExecuteFlowUseCase } from '../../use-cases/ExecuteFlowUseCase';
import type { WorkerInput, WorkerOutput } from './FlowRunnerService';

const input = workerData as WorkerInput;

function send(msg: WorkerOutput) {
  parentPort?.postMessage(msg);
}

function log(message: string) {
  send({ type: 'log', projectId: input.projectId, profileId: input.profileId, data: message });
}

async function main() {
  log(`[Worker] Bắt đầu chạy Profile ${input.profileId} (${input.profileLabel}) - Engine: ${input.engine}`);

  try {
    const core = AutomationCoreFactory.getInstance((input.engine ?? 'patchright') as AutomationEngineType);
    const useCase = new ExecuteFlowUseCase(core);

    const result = await useCase.execute(input.nodes, input.edges, {
      profileDir: input.profileDir,
      proxyUrl: input.proxyUrl,
      emitLog: log,
      emitProgress: (event) => {
        send({
          type: 'progress',
          projectId: input.projectId,
          profileId: input.profileId,
          data: event
        });
      }
    });

    send({
      type: result.success ? 'finished' : 'error',
      projectId: input.projectId,
      profileId: input.profileId,
      data: { success: result.success, error: result.error }
    });

  } catch (err: any) {
    log(`[Worker] Lỗi không xử lý được: ${err.message}`);
    send({
      type: 'error',
      projectId: input.projectId,
      profileId: input.profileId,
      data: { success: false, error: err.message }
    });
  }
}

main();
