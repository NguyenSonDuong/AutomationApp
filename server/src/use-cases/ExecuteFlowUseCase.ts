// ============================================================
// ExecuteFlowUseCase.ts — Use Cases Layer (v2)
// Full mirror of Python automation_core/runner.py:
//   ✔ Tab management (tabKeys / currentTabKey)
//   ✔ resolve_variables: {{ENV_VAR}} in selector/value/target_selector
//   ✔ Random fill: number, date, text, name, firstname, lastname, email
//   ✔ Random select_option by index range
//   ✔ Edge condition evaluation (AND/OR, eq/neq/contains/not_contains/gt/lt)
//   ✔ upload_file action mapping
//   ✔ waypoint action (no-op)
//   ✔ click_checkbox / check / uncheck
//   ✔ Edge time_delay on selected edge (not node)
//   ✔ Browser-closed detection (graceful exit)
//   ✔ Safety cap (default 500 steps)
// ============================================================

import {
  IAutomationCore,
  BrowserContext,
  ActionPayload,
  ActionResult
} from '../domain/automation-core/IAutomationCore';

// ── Supporting types ──────────────────────────────────────────

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
    extra_params?: Record<string, any> | string;
    is_random?: boolean;
    random_type?: string;
    min_val?: number | string;
    max_val?: number | string;
    time_delay?: number;
    timeout?: number;
  };
}

export interface FlowEdge {
  id: string;
  source: string;       // source_step_id from DB
  target: string;       // target_step_id from DB
  data?: {
    condition?: ConditionGroup | string | null;
    is_loop?: boolean;
    time_delay?: number;
    timeout?: number;
  };
}

export interface ConditionGroup {
  logical_operator?: 'AND' | 'OR';
  rules?: ConditionRule[];
}

export interface ConditionRule {
  attribute: string;    // 'text' | 'value' | 'url' | 'content' | 'custom' | any attr
  custom_attribute?: string;
  selector?: string;
  comparison: 'eq' | 'neq' | 'contains' | 'not_contains' | 'gt' | 'lt';
  value: string;
}

export interface FlowExecutionOptions {
  profileDir: string;
  proxyUrl?: string;
  maxSteps?: number;
  emitProgress?: (event: FlowProgressEvent) => void;
  emitLog?: (message: string) => void;
}

export interface FlowProgressEvent {
  nodeId?: string;
  edgeId?: string;
  isNode: boolean;
  status: 'active' | 'success' | 'failed' | 'inactive';
  message?: string;
  envVars?: Record<string, string>;
}

// ── Utility: resolve {{ENV_VAR}} placeholders ─────────────────

function resolveVariables(
  text: string | undefined | null,
  envVars: Record<string, string>
): string | undefined {
  if (text == null) return undefined;
  return text.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => envVars[key.trim()] ?? `{{${key}}}`);
}

// ── Utility: smart number parser (mirrors Python try_clean_and_parse_float) ──

function tryParseFloat(val: string): number | null {
  if (!val) return null;
  try {
    let cleaned = val.replace(/[đ$€¥%\s]/g, '');
    if (cleaned.includes(',') && cleaned.includes('.')) {
      cleaned = cleaned.replace(/,/g, ''); // US thousands: 1,500.00
    } else if (cleaned.includes(',')) {
      const parts = cleaned.split(',');
      if (parts[parts.length - 1].length === 3) {
        cleaned = cleaned.replace(/,/g, ''); // VN thousands: 150,000
      } else {
        cleaned = cleaned.replace(',', '.'); // EU decimal: 150,5
      }
    } else if (cleaned.includes('.')) {
      const parts = cleaned.split('.');
      if (parts[parts.length - 1].length === 3) {
        cleaned = cleaned.replace(/\./g, ''); // VN thousands dot: 150.000
      }
    }
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : n;
  } catch {
    return null;
  }
}

// ── Utility: random value generator (mirrors Python faker section) ──

function generateRandomValue(randomType: string, minVal: number, maxVal: number): string {
  if (minVal > maxVal) { const t = minVal; minVal = maxVal; maxVal = t; }

  switch (randomType.toLowerCase()) {
    case 'number': {
      const n = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
      return String(n);
    }
    case 'date': {
      if (minVal > 10_000_000) {
        // Unix timestamps
        const ts = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
        return new Date(ts * 1000).toISOString().split('T')[0];
      } else {
        // Offset in days from today
        const today = new Date();
        const offsetDays = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
        today.setDate(today.getDate() + offsetDays);
        return today.toISOString().split('T')[0];
      }
    }
    case 'name': {
      const first = ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Vu', 'Dang', 'Bui', 'Do', 'Ho'];
      const last  = ['Minh', 'Anh', 'Lan', 'Hung', 'Hoa', 'Tuan', 'Linh', 'Nam', 'Hieu', 'Thanh'];
      return `${first[Math.floor(Math.random() * first.length)]} ${last[Math.floor(Math.random() * last.length)]}`;
    }
    case 'firstname': {
      const names = ['Minh', 'Anh', 'Lan', 'Hung', 'Hoa', 'Tuan', 'Linh', 'Nam', 'Hieu', 'Thanh'];
      return names[Math.floor(Math.random() * names.length)];
    }
    case 'lastname': {
      const surs = ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Vu', 'Dang', 'Bui', 'Do', 'Ho'];
      return surs[Math.floor(Math.random() * surs.length)];
    }
    case 'email': {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      const len = Math.max(minVal || 6, 6);
      return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
    default: {
      // text — alphanumeric of length in [min, max]
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const length = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
      return Array.from({ length: Math.max(length, 1) }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
  }
}

// ── Utility: condition evaluator (mirrors Python condition_evaluator.py) ──

function evaluateCondition(
  conditionData: ConditionGroup | string | null | undefined,
  envVars: Record<string, string>
): boolean {
  if (!conditionData) return true;

  let cond: ConditionGroup | null = null;

  if (typeof conditionData === 'string') {
    const trimmed = conditionData.trim();
    if (!trimmed) return true;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && 'rules' in parsed) cond = parsed;
    } catch { return true; /* treat unparseable as default/else edge */ }
  } else if (typeof conditionData === 'object') {
    cond = conditionData as ConditionGroup;
  }

  if (!cond || !cond.rules || cond.rules.length === 0) return true;

  const logicalOp = (cond.logical_operator ?? 'AND').toUpperCase();

  const results = cond.rules.map((rule) => {
    const comp = rule.comparison ?? 'eq';
    const expected = resolveVariables(String(rule.value ?? ''), envVars) ?? '';
    const attr = rule.attribute === 'custom' ? (rule.custom_attribute ?? 'text') : rule.attribute;

    // In server-side Node.js, we can only compare against env_vars (no live DOM).
    // Future: inject live page evaluator callback.
    const actualRaw = envVars[attr] ?? (rule.selector ? envVars[rule.selector] : null) ?? null;

    if (actualRaw === null) {
      // No data — negation operators treat missing as match (mirrors Python)
      return comp === 'neq' || comp === 'not_contains';
    }

    const actual = String(actualRaw);
    switch (comp) {
      case 'eq':           return actual === expected;
      case 'neq':          return actual !== expected;
      case 'contains':     return actual.includes(expected);
      case 'not_contains': return !actual.includes(expected);
      case 'gt': {
        const an = tryParseFloat(actual), en = tryParseFloat(expected);
        return an !== null && en !== null ? an > en : actual > expected;
      }
      case 'lt': {
        const an = tryParseFloat(actual), en = tryParseFloat(expected);
        return an !== null && en !== null ? an < en : actual < expected;
      }
      default: return actual === expected;
    }
  });

  return logicalOp === 'OR' ? results.some(Boolean) : results.every(Boolean);
}

// ── Use Case ─────────────────────────────────────────────────

export class ExecuteFlowUseCase {
  constructor(private readonly core: IAutomationCore) {}

  async execute(
    nodes: FlowNode[],
    edges: FlowEdge[],
    options: FlowExecutionOptions
  ): Promise<{ success: boolean; error?: string }> {

    const { emitProgress, emitLog } = options;
    const log = (msg: string) => {
      emitLog?.(msg);
      console.log(`[AutomationCore] ${msg}`);
    };

    const emitStatus = (
      id: string | undefined,
      isNode: boolean,
      status: FlowProgressEvent['status'],
      message = '',
      edgeId?: string
    ) => {
      emitProgress?.({ nodeId: isNode ? id : undefined, edgeId: isNode ? edgeId : id, isNode, status, message });
    };

    // ── 1. Build adjacency structures ────────────────────────
    const nodeMap = new Map(nodes.map((n) => [String(n.id), n]));
    const outgoing = new Map<string, FlowEdge[]>();
    const incomingCount = new Map<string, number>();
    nodes.forEach((n) => { outgoing.set(String(n.id), []); incomingCount.set(String(n.id), 0); });

    edges.forEach((edge) => {
      const src = String(edge.source);
      const tgt = String(edge.target);
      if (!outgoing.has(src)) outgoing.set(src, []);
      outgoing.get(src)!.push(edge);
      incomingCount.set(tgt, (incomingCount.get(tgt) ?? 0) + 1);
    });

    // ── 2. Find start node (Python fallback cascade) ─────────
    let startNodeId: string | null = null;
    const isStartNode = nodes.find((n) => n.data.is_start);
    if (isStartNode) {
      startNodeId = String(isStartNode.id);
      log(`Tìm thấy nút bắt đầu (is_start): ID ${startNodeId} (${isStartNode.data.action_type})`);
    } else {
      const noIncoming = [...incomingCount.entries()].find(([, c]) => c === 0);
      if (noIncoming) {
        startNodeId = noIncoming[0];
        log(`Cảnh báo: Tự động chọn nút không có liên kết vào: ID ${startNodeId}`);
      } else if (nodes.length > 0) {
        startNodeId = String(nodes[0].id);
        log(`Cảnh báo: Tự động chọn nút đầu tiên: ID ${startNodeId}`);
      } else {
        return { success: false, error: 'Sơ đồ trống! Không có nút nào để chạy.' };
      }
    }

    // ── 3. Launch browser ────────────────────────────────────
    let ctx!: BrowserContext;
    try {
      ctx = await this.core.launchBrowser(options.profileDir, options.proxyUrl);
      log(`Đã khởi chạy trình duyệt với profile: ${options.profileDir}`);
    } catch (e: any) {
      return { success: false, error: `Không thể khởi chạy trình duyệt: ${e.message}` };
    }

    // ── 4. Tab management (mirrors Python pages_map) ─────────
    const tabKeys: string[] = ['tab_0'];
    let currentTabKey = 'tab_0';
    const envVars: Record<string, string> = {};
    let browserClosed = false;
    let currentNodeId: string | null = startNodeId;
    let stepCount = 0;
    const maxSteps = options.maxSteps ?? 500;

    try {
      while (currentNodeId && stepCount < maxSteps && !browserClosed) {
        stepCount++;
        const node = nodeMap.get(String(currentNodeId));
        if (!node) {
          log(`Không tìm thấy Node ID: ${currentNodeId}. Kịch bản kết thúc.`);
          break;
        }

        const actionType = node.data.action_type;

        // Resolve env vars in all text fields before executing
        const val    = resolveVariables(node.data.value, envVars);
        const sel    = resolveVariables(node.data.selector, envVars);
        const tgtSel = resolveVariables(node.data.target_selector, envVars);

        log(`-> Đang thực thi Node ${currentNodeId} (Hành động: ${actionType})`);
        emitStatus(currentNodeId, true, 'active', `Đang thực hiện: ${actionType}`);

        // Parse extra_params
        let extraParams: Record<string, any> = {};
        if (typeof node.data.extra_params === 'string') {
          try { extraParams = JSON.parse(node.data.extra_params); } catch { extraParams = {}; }
        } else if (node.data.extra_params) {
          extraParams = node.data.extra_params;
        }

        const timeoutMs = ((node.data.timeout ?? 30)) * 1000;

        const basePayload: ActionPayload = {
          selector: sel,
          targetSelector: tgtSel,
          targetTab: node.data.target_tab ?? 'current',
          value: val,
          scrollX: node.data.scroll_x,
          scrollY: node.data.scroll_y,
          extraParams,
          timeoutMs
        };

        // ── Dispatch action ───────────────────────────────────
        let result: ActionResult;
        try {
          result = await this.dispatch(
            ctx, actionType, basePayload, node, envVars, tabKeys, currentTabKey, log
          );

          // Update tab tracking state
          if ((actionType === 'new_tab' || actionType === 'open_new_tab') && result.success && result.data) {
            currentTabKey = result.data;
          }
          if ((actionType === 'switch_tab') && result.success && result.data) {
            currentTabKey = result.data;
          }
          if (actionType === 'close_browser') {
            browserClosed = true;
          }

          // Store extracted variable
          if (result.variableName && result.data != null) {
            envVars[result.variableName] = result.data;
            log(`Đã lưu '${result.data}' → {{${result.variableName}}}`);
          }

          emitStatus(currentNodeId, true, 'success', 'Thành công');
          await new Promise((r) => setTimeout(r, 300)); // visual delay

        } catch (actionErr: any) {
          const errMsg = String(actionErr?.message ?? actionErr);
          const closedKeywords = ['target closed', 'browser closed', 'context closed', 'connection closed'];
          if (closedKeywords.some((k) => errMsg.toLowerCase().includes(k))) {
            log('Trình duyệt bị đóng bởi người dùng. Tự động kết thúc luồng thành công.');
            emitStatus(currentNodeId, true, 'success', 'Trình duyệt bị đóng');
            browserClosed = true;
            break;
          }
          log(`Thực thi hành động tại Node ${currentNodeId} thất bại: ${errMsg}`);
          emitStatus(currentNodeId, true, 'failed', errMsg);
          try { await this.core.closeBrowser(ctx); } catch { /* ignore */ }
          return { success: false, error: errMsg };
        }

        // ── 5. Resolve next node ─────────────────────────────
        const edgesOut = outgoing.get(String(currentNodeId)) ?? [];
        if (edgesOut.length === 0) {
          log('Không còn liên kết đi tiếp. Kịch bản kết thúc thành công.');
          break;
        }

        // Sort: conditional edges first (mirrors Python sorted(key=lambda...))
        const sorted = [...edgesOut].sort((a, b) => {
          const aC = Boolean((a.data?.condition as ConditionGroup)?.rules?.length);
          const bC = Boolean((b.data?.condition as ConditionGroup)?.rules?.length);
          return (aC ? 0 : 1) - (bC ? 0 : 1);
        });

        let selectedEdge: FlowEdge | null = null;
        let nextNodeId: string | null = null;

        for (const edge of sorted) {
          const matches = evaluateCondition(edge.data?.condition, envVars);
          log(`Đánh giá điều kiện → Node ${edge.target}: ${matches}`);
          if (matches) {
            nextNodeId = String(edge.target);
            selectedEdge = edge;
            log(`-> Chọn liên kết sang Node ${nextNodeId}`);
            break;
          }
        }

        if (!nextNodeId || !selectedEdge) {
          log('Cảnh báo: Không tìm thấy liên kết thỏa mãn điều kiện. Dừng kịch bản.');
          break;
        }

        // ── 6. Edge time_delay (mirrors Python selected_edge) ─
        const edgeDelay = selectedEdge.data?.time_delay ?? 0;
        if (edgeDelay > 0) {
          log(`Liên kết '${selectedEdge.id}' yêu cầu thời gian trễ: ${edgeDelay}s`);
          emitStatus(selectedEdge.id, false, 'active', `Chờ trễ: ${edgeDelay}s`);
          await new Promise((r) => setTimeout(r, edgeDelay * 1000));
          emitStatus(selectedEdge.id, false, 'inactive');
        }

        currentNodeId = nextNodeId;
      }

      if (!browserClosed) {
        log('Kịch bản kết thúc thành công. Giữ nguyên trình duyệt hoạt động.');
        try { await this.core.closeBrowser(ctx); } catch { /* ignore */ }
      }

      return { success: true };

    } catch (e: any) {
      log(`Dừng luồng kịch bản do lỗi: ${e.message}`);
      try { await this.core.closeBrowser(ctx); } catch { /* ignore */ }
      return { success: false, error: e.message };
    }
  }

  // ── Full action dispatcher — mirrors runner.py elif chain ───

  private async dispatch(
    ctx: BrowserContext,
    actionType: string,
    payload: ActionPayload,
    node: FlowNode,
    envVars: Record<string, string>,
    tabKeys: string[],
    currentTabKey: string,
    log: (msg: string) => void
  ): Promise<ActionResult> {

    switch (actionType) {

      // ── Tab / Navigation ──────────────────────────────────

      case 'new_tab':
      case 'open_new_tab': {
        const res = await this.core.openNewTab(ctx, payload);
        if (res.success) {
          const newKey = `tab_${tabKeys.length}`;
          tabKeys.push(newKey);
          log(`Đã mở tab mới: ${newKey}`);
          return { ...res, data: newKey };
        }
        return res;
      }

      case 'open_tab':
      case 'navigate':
      case 'open_url':
        return this.core.navigateTo(ctx, payload);

      case 'switch_tab': {
        const res = await this.core.switchTab(ctx, payload);
        if (res.success) {
          return { ...res, data: payload.value ?? currentTabKey };
        }
        return res;
      }

      case 'close_tab': {
        const tabToClose = payload.value ?? currentTabKey;
        const res = await this.core.closeTab(ctx, { ...payload, value: tabToClose });
        const idx = tabKeys.indexOf(tabToClose);
        if (idx > -1) tabKeys.splice(idx, 1);
        return res;
      }

      case 'switch_iframe':
        return this.core.switchToIframe(ctx, payload);

      // ── Control ───────────────────────────────────────────

      case 'fill_text': {
        if (node.data.is_random) {
          const minI = Number(node.data.min_val ?? 0);
          const maxI = Number(node.data.max_val ?? 10);
          const randType = (node.data.random_type ?? 'text').toLowerCase();
          const randomStr = generateRandomValue(randType, minI, maxI);
          log(`Ngẫu nhiên (${randType}) [${minI}, ${maxI}]: "${randomStr}"`);
          return this.core.fillText(ctx, { ...payload, value: randomStr });
        }
        return this.core.fillText(ctx, payload);
      }

      case 'click':
        return this.core.clickElement(ctx, payload);

      case 'click_checkbox':
      case 'check': {
        return this.core.setCheckbox(ctx, { ...payload, checked: true });
      }

      case 'uncheck':
        return this.core.setCheckbox(ctx, { ...payload, checked: false });

      case 'click_radio':
        return this.core.clickRadioButton(ctx, payload);

      case 'select_option': {
        if (node.data.is_random) {
          const minIdx = Number(node.data.min_val ?? 0);
          const maxIdx = Number(node.data.max_val ?? 5);
          const rndIdx = Math.floor(Math.random() * (maxIdx - minIdx + 1)) + minIdx;
          log(`Ngẫu nhiên index option [${minIdx}, ${maxIdx}]: ${rndIdx}`);
          return this.core.selectOption(ctx, {
            ...payload,
            extraParams: { ...payload.extraParams, index: rndIdx }
          });
        }
        return this.core.selectOption(ctx, payload);
      }

      case 'scroll':
        return this.core.scroll(ctx, payload);

      case 'drag_drop':
      case 'drag_and_drop':
        return this.core.dragAndDrop(ctx, payload);

      case 'upload_file':
        // value = file path — delegated to engine fillText/setInputFiles
        return this.core.fillText(ctx, payload);

      // ── Data ─────────────────────────────────────────────

      case 'extract_data': {
        let attr = (payload.extraParams?.attribute ?? 'text') as string;
        if (attr === 'custom') attr = payload.extraParams?.custom_attribute ?? 'text';
        const res = await this.core.extractData(ctx, {
          ...payload,
          extraParams: { ...payload.extraParams, attribute: attr }
        });
        // variableName = payload.value (mirrors Python: val = node.get('value'))
        return { ...res, variableName: payload.value };
      }

      case 'screenshot':
        return this.core.takeScreenshot(ctx, payload);

      // ── Utility ───────────────────────────────────────────

      case 'wait':
        return this.core.waitMs(ctx, payload);

      case 'waypoint':
        // Display-only node — no action (mirrors Python `pass`)
        return { success: true, data: null };

      case 'close_browser':
        await this.core.closeBrowser(ctx);
        return { success: true, data: null };

      default:
        log(`Cảnh báo: Loại hành động không xác định: "${actionType}"`);
        return { success: true, data: null }; // warn-only, mirrors Python
    }
  }
}
