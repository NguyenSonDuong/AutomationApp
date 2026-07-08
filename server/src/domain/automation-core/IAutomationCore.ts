// ============================================================
// IAutomationCore.ts — Domain Layer
// Defines the strict contract for ALL automation engine implementations.
// This interface is the ONLY thing the upper layers (Use Cases, Adapters)
// ever interact with. No concrete library details leak above this line.
// ============================================================

export interface BrowserContext {
  /** Opaque handle returned by the engine on launch, passed to every action */
  sessionId: string;
  /** Human-readable label, e.g. profile name, for logging */
  label?: string;
}

export interface ActionPayload {
  // ── Targeting ──────────────────────────────────────────────
  selector?: string;           // CSS / XPath selector for source element
  targetSelector?: string;     // CSS / XPath selector for drop target (drag-drop)
  targetTab?: string;          // 'current' | 'new' | 'tab_0' … 'tab_N' | iframeSelector
  iframeSelector?: string;     // CSS selector of the <iframe> element

  // ── Input value ────────────────────────────────────────────
  value?: string;              // URL, text to fill, option value, variable name…

  // ── Scroll / Position ──────────────────────────────────────
  scrollX?: number;
  scrollY?: number;
  positionX?: number;
  positionY?: number;

  // ── Checkbox / Radio ───────────────────────────────────────
  checked?: boolean;

  // ── Random fill ────────────────────────────────────────────
  isRandom?: boolean;
  randomType?: string;         // 'text' | 'number' | 'date' | 'name' | 'email' …
  minVal?: number;
  maxVal?: number;

  // ── Extra engine-specific params ───────────────────────────
  extraParams?: Record<string, any>;

  // ── Timing ─────────────────────────────────────────────────
  timeoutMs?: number;          // Default: 30_000 ms
}

export interface ActionResult {
  success: boolean;
  /** Extracted text / attribute / screenshot base64 etc. */
  data?: string | null;
  /** Key name to store the result in the environment variable map */
  variableName?: string;
  error?: string;
}

// ────────────────────────────────────────────────────────────
// Main Interface — every engine implementation MUST satisfy this.
// ────────────────────────────────────────────────────────────
export interface IAutomationCore {
  // ── Lifecycle ──────────────────────────────────────────────
  /** Launch a browser session and return context metadata */
  launchBrowser(profileDir: string, proxyUrl?: string): Promise<BrowserContext>;
  /** Gracefully close the browser session */
  closeBrowser(ctx: BrowserContext): Promise<void>;

  // ── Navigation / Tab control ───────────────────────────────
  /** Open a new blank tab, or navigate the current tab to a URL */
  navigateTo(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult>;
  /** Open a brand-new tab (does not navigate anywhere) */
  openNewTab(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult>;
  /** Switch focus to a specific tab by index / id */
  switchTab(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult>;
  /** Close a specific tab */
  closeTab(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult>;
  /** Switch into an iframe context so subsequent actions target it */
  switchToIframe(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult>;

  // ── Control actions ────────────────────────────────────────
  /** Type text into a focusable element */
  fillText(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult>;
  /** Click on an element */
  clickElement(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult>;
  /** Select an <option> inside a <select> element */
  selectOption(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult>;
  /** Set a checkbox to checked or unchecked */
  setCheckbox(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult>;
  /** Click a radio button */
  clickRadioButton(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult>;
  /** Scroll the page or element to a position */
  scroll(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult>;
  /** Simulate drag-and-drop between two elements */
  dragAndDrop(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult>;

  // ── Data extraction ────────────────────────────────────────
  /**
   * Extract an attribute / text from an element.
   * Returns ActionResult.data with the value; ActionResult.variableName
   * indicates which env-var key the caller should store it under.
   */
  extractData(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult>;
  /**
   * Take a screenshot of a specific element (or full page if no selector).
   * Returns ActionResult.data as a base64-encoded PNG string.
   */
  takeScreenshot(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult>;

  // ── Utilities ──────────────────────────────────────────────
  /** Wait for a fixed millisecond delay */
  waitMs(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult>;
}
