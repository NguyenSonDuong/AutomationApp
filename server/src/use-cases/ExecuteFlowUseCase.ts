// ============================================================
// ExecuteFlowUseCase.ts — Use Cases Layer
// Orchestrates the execution of an automation flow (node graph)
// for a given project, profile, and proxy.
//
// IMPORTANT: This use case ONLY depends on IAutomationCore (interface).
// It never imports PatchrightCore, CloakBrowserCore, or any engine class.
// The concrete engine is injected at construction time via the factory.
// ============================================================

import {
  IAutomationCore,
  BrowserContext,
  ActionPayload,
  ActionResult
} from '../domain/automation-core/IAutomationCore';

// ── DTOs & supporting types ───────────────────────────────────

export interface FlowNode {
  id: string;
  data: {
    action_type: string;
    is_start?: boolean;
    selector?: string;
    target_selector?: string;
    target_tab?: string;
    iframe_selector?: string;
    value?: string;
    scroll_x?: number;
    scroll_y?: number;
    extra_params?: Record<string, any>;
    is_random?: boolean;
    random_type?: string;
    min_val?: number;
    max_val?: number;
    time_delay?: number;
    timeout?: number;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  data?: {
    condition?: {
      logical_operator?: 'AND' | 'OR';
      rules?: Array<{
        attribute: string;
        selector?: string;
        comparison: string;
        value: string;
      }>;
    };
    is_loop?: boolean;
    time_delay?: number;
    timeout?: number;
  };
}

export interface FlowExecutionOptions {
  profileDir: string;
  proxyUrl?: string;
  engine?: string;           // overrides factory default for this run
  maxSteps?: number;         // safety cap (default: 500)
  emitProgress?: (event: FlowProgressEvent) => void;
}

export interface FlowProgressEvent {
  nodeId: string;
  actionType: string;
  status: 'running' | 'done' | 'error' | 'skipped';
  result?: ActionResult;
  envVars?: Record<string, string>;
}

// ── Use Case ─────────────────────────────────────────────────

export class ExecuteFlowUseCase {
  constructor(private readonly core: IAutomationCore) {}

  async execute(
    nodes: FlowNode[],
    edges: FlowEdge[],
    options: FlowExecutionOptions
  ): Promise<{ success: boolean; error?: string }> {

    // ── Build adjacency map ──────────────────────────────────
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const edgesBySource = new Map<string, FlowEdge[]>();
    for (const edge of edges) {
      if (!edgesBySource.has(edge.source)) edgesBySource.set(edge.source, []);
      edgesBySource.get(edge.source)!.push(edge);
    }

    // ── Find start node ──────────────────────────────────────
    const startNode = nodes.find((n) => n.data.is_start);
    if (!startNode) return { success: false, error: 'No start node defined in flow.' };

    // ── Environment variable store ───────────────────────────
    const envVars: Record<string, string> = {};

    // ── Launch browser ───────────────────────────────────────
    let ctx: BrowserContext;
    try {
      ctx = await this.core.launchBrowser(options.profileDir, options.proxyUrl);
    } catch (e: any) {
      return { success: false, error: `Failed to launch browser: ${e.message}` };
    }

    // ── Traverse the graph ───────────────────────────────────
    let currentNodeId: string | null = startNode.id;
    let stepCount = 0;
    const maxSteps = options.maxSteps ?? 500;

    try {
      while (currentNodeId && stepCount < maxSteps) {
        stepCount++;
        const node = nodeMap.get(currentNodeId);
        if (!node) break;

        options.emitProgress?.({
          nodeId: node.id,
          actionType: node.data.action_type,
          status: 'running',
          envVars: { ...envVars },
        });

        // ── Optional time delay before action ────────────────
        if (node.data.time_delay && node.data.time_delay > 0) {
          await new Promise((r) => setTimeout(r, node.data.time_delay! * 1000));
        }

        // ── Build payload ─────────────────────────────────────
        const payload: ActionPayload = {
          selector: this.resolveEnv(node.data.selector, envVars),
          targetSelector: this.resolveEnv(node.data.target_selector, envVars),
          targetTab: node.data.target_tab,
          iframeSelector: node.data.iframe_selector,
          value: this.resolveEnv(node.data.value, envVars),
          scrollX: node.data.scroll_x,
          scrollY: node.data.scroll_y,
          extraParams: node.data.extra_params,
          isRandom: node.data.is_random,
          randomType: node.data.random_type,
          minVal: node.data.min_val,
          maxVal: node.data.max_val,
          timeoutMs: (node.data.timeout ?? 30) * 1000,
        };

        // ── Dispatch action ───────────────────────────────────
        const result = await this.dispatchAction(ctx, node.data.action_type, payload);

        // ── Store env variable ────────────────────────────────
        if (result.variableName && result.data != null) {
          envVars[result.variableName] = result.data;
        }

        options.emitProgress?.({
          nodeId: node.id,
          actionType: node.data.action_type,
          status: result.success ? 'done' : 'error',
          result,
          envVars: { ...envVars },
        });

        if (!result.success) {
          // Stop on error (configurable in future)
          break;
        }

        // ── Choose next node via edges ────────────────────────
        currentNodeId = this.resolveNextNode(node.id, edgesBySource, envVars);
      }
    } finally {
      await this.core.closeBrowser(ctx);
    }

    return { success: true };
  }

  // ── Action dispatcher ─────────────────────────────────────────────────────
  // Maps action_type strings (from the frontend node builder) to
  // IAutomationCore method calls. This is the ONLY place that maps strings.

  private async dispatchAction(
    ctx: BrowserContext,
    actionType: string,
    payload: ActionPayload
  ): Promise<ActionResult> {
    switch (actionType) {
      // Navigation
      case 'navigate':
      case 'open_url':         return this.core.navigateTo(ctx, payload);
      case 'open_new_tab':     return this.core.openNewTab(ctx, payload);
      case 'switch_tab':       return this.core.switchTab(ctx, payload);
      case 'close_tab':        return this.core.closeTab(ctx, payload);
      case 'close_browser':    return this.core.closeBrowser(ctx).then(() => ({ success: true, data: null }));
      case 'switch_iframe':    return this.core.switchToIframe(ctx, payload);

      // Control
      case 'fill_text':        return this.core.fillText(ctx, payload);
      case 'click':            return this.core.clickElement(ctx, payload);
      case 'select_option':    return this.core.selectOption(ctx, payload);
      case 'check':            return this.core.setCheckbox(ctx, { ...payload, checked: true });
      case 'uncheck':          return this.core.setCheckbox(ctx, { ...payload, checked: false });
      case 'click_radio':      return this.core.clickRadioButton(ctx, payload);
      case 'scroll':           return this.core.scroll(ctx, payload);
      case 'drag_and_drop':    return this.core.dragAndDrop(ctx, payload);

      // Data
      case 'extract_data':     return this.core.extractData(ctx, payload);
      case 'screenshot':       return this.core.takeScreenshot(ctx, payload);

      // Utility
      case 'wait':             return this.core.waitMs(ctx, payload);

      default:
        return { success: false, error: `Unknown action_type: "${actionType}"` };
    }
  }

  // ── Edge resolver ─────────────────────────────────────────────────────────
  // Simplified: returns the first unconditional edge target.
  // TODO: evaluate condition rules against live DOM for branching.

  private resolveNextNode(
    sourceId: string,
    edgesBySource: Map<string, FlowEdge[]>,
    _envVars: Record<string, string>
  ): string | null {
    const outEdges = edgesBySource.get(sourceId) ?? [];
    if (outEdges.length === 0) return null;
    // Prefer the edge with no condition (default path)
    const defaultEdge = outEdges.find(
      (e) => !e.data?.condition || (e.data.condition.rules ?? []).length === 0
    );
    return defaultEdge ? defaultEdge.target : outEdges[0].target;
  }

  // ── Env-var interpolation ─────────────────────────────────────────────────
  // Replaces {{VAR_NAME}} tokens in strings with stored env values.

  private resolveEnv(
    template: string | undefined,
    envVars: Record<string, string>
  ): string | undefined {
    if (!template) return template;
    return template.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => envVars[key] ?? `{{${key}}}`);
  }
}
