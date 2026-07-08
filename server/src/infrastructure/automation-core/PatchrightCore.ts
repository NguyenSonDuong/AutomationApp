// ============================================================
// PatchrightCore.ts — Infrastructure Layer
// Implements IAutomationCore using the patchright-nodejs library.
// patchright is a stealth Playwright fork that patches browser
// fingerprints, making it harder for sites to detect automation.
// ============================================================

import {
  IAutomationCore,
  BrowserContext,
  ActionPayload,
  ActionResult
} from '../../domain/automation-core/IAutomationCore';

// Type-only import so the module is optional at runtime.
// Install with: npm install patchright
// eslint-disable-next-line @typescript-eslint/no-require-imports
let patchright: any;
try { patchright = require('patchright'); } catch { /* not installed */ }

// Internal session registry: sessionId → playwright BrowserContext
const sessions = new Map<string, any>();

// ── Helpers ──────────────────────────────────────────────────────────────────

function ok(data?: string | null, variableName?: string): ActionResult {
  return { success: true, data: data ?? null, variableName };
}
function fail(error: string): ActionResult {
  return { success: false, error };
}

/** Retrieve the Playwright page object for the active session */
async function getPage(ctx: BrowserContext): Promise<any> {
  const session = sessions.get(ctx.sessionId);
  if (!session) throw new Error(`Session not found: ${ctx.sessionId}`);
  // Return the most recently focused page
  const pages = session.pages();
  return pages[pages.length - 1] ?? await session.newPage();
}

/** Resolve tab target: 'current', 'new', 'tab_0' … */
async function resolveTab(session: any, targetTab: string): Promise<any> {
  if (!targetTab || targetTab === 'current') {
    const pages = session.pages();
    return pages[pages.length - 1];
  }
  if (targetTab === 'new') {
    return await session.newPage();
  }
  const match = targetTab.match(/^tab_(\d+)$/);
  if (match) {
    const idx = parseInt(match[1], 10);
    const pages = session.pages();
    return pages[idx] ?? pages[pages.length - 1];
  }
  throw new Error(`Unknown targetTab: ${targetTab}`);
}

// ── Implementation ────────────────────────────────────────────────────────────

export class PatchrightCore implements IAutomationCore {

  // ── Lifecycle ────────────────────────────────────────────────

  async launchBrowser(profileDir: string, proxyUrl?: string): Promise<BrowserContext> {
    if (!patchright) throw new Error('[PatchrightCore] patchright package not installed.');

    const sessionId = `pr_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const launchOptions: any = {
      headless: false,
      userDataDir: profileDir,
      channel: 'chrome',  // patchright uses a patched chromium channel
    };
    if (proxyUrl) launchOptions.proxy = { server: proxyUrl };

    // patchright exposes chromium.launchPersistentContext
    const context = await patchright.chromium.launchPersistentContext(
      profileDir,
      launchOptions
    );
    sessions.set(sessionId, context);
    return { sessionId };
  }

  async closeBrowser(ctx: BrowserContext): Promise<void> {
    const session = sessions.get(ctx.sessionId);
    if (session) {
      await session.close();
      sessions.delete(ctx.sessionId);
    }
  }

  // ── Navigation / Tab control ─────────────────────────────────

  async navigateTo(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult> {
    try {
      const session = sessions.get(ctx.sessionId)!;
      const page = await resolveTab(session, payload.targetTab ?? 'current');
      await page.goto(payload.value!, { timeout: payload.timeoutMs ?? 30_000 });
      return ok();
    } catch (e: any) { return fail(e.message); }
  }

  async openNewTab(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult> {
    try {
      const session = sessions.get(ctx.sessionId)!;
      const page = await session.newPage();
      if (payload.value) await page.goto(payload.value, { timeout: payload.timeoutMs ?? 30_000 });
      return ok(`tab_${session.pages().length - 1}`);
    } catch (e: any) { return fail(e.message); }
  }

  async switchTab(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult> {
    try {
      const session = sessions.get(ctx.sessionId)!;
      const page = await resolveTab(session, payload.value ?? 'current');
      await page.bringToFront();
      return ok();
    } catch (e: any) { return fail(e.message); }
  }

  async closeTab(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult> {
    try {
      const session = sessions.get(ctx.sessionId)!;
      const page = await resolveTab(session, payload.value ?? 'current');
      await page.close();
      return ok();
    } catch (e: any) { return fail(e.message); }
  }

  async switchToIframe(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult> {
    // Patchright/Playwright handles iframes via frameLocator in individual actions.
    // We store the iframe selector in the session for subsequent calls.
    try {
      const session = sessions.get(ctx.sessionId);
      if (session) session.__iframeSelector = payload.iframeSelector ?? null;
      return ok();
    } catch (e: any) { return fail(e.message); }
  }

  // ── Control actions ──────────────────────────────────────────

  async fillText(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult> {
    try {
      const page = await getPage(ctx);
      const session = sessions.get(ctx.sessionId);
      const locator = session?.__iframeSelector
        ? page.frameLocator(session.__iframeSelector).locator(payload.selector!)
        : page.locator(payload.selector!);
      await locator.fill(payload.value ?? '', { timeout: payload.timeoutMs ?? 30_000 });
      return ok();
    } catch (e: any) { return fail(e.message); }
  }

  async clickElement(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult> {
    try {
      const page = await getPage(ctx);
      const session = sessions.get(ctx.sessionId);
      const locator = session?.__iframeSelector
        ? page.frameLocator(session.__iframeSelector).locator(payload.selector!)
        : page.locator(payload.selector!);
      await locator.click({ timeout: payload.timeoutMs ?? 30_000 });
      return ok();
    } catch (e: any) { return fail(e.message); }
  }

  async selectOption(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult> {
    try {
      const page = await getPage(ctx);
      await page.locator(payload.selector!).selectOption(payload.value!, {
        timeout: payload.timeoutMs ?? 30_000
      });
      return ok();
    } catch (e: any) { return fail(e.message); }
  }

  async setCheckbox(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult> {
    try {
      const page = await getPage(ctx);
      const el = page.locator(payload.selector!);
      if (payload.checked) {
        await el.check({ timeout: payload.timeoutMs ?? 30_000 });
      } else {
        await el.uncheck({ timeout: payload.timeoutMs ?? 30_000 });
      }
      return ok();
    } catch (e: any) { return fail(e.message); }
  }

  async clickRadioButton(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult> {
    try {
      const page = await getPage(ctx);
      await page.locator(payload.selector!).check({ timeout: payload.timeoutMs ?? 30_000 });
      return ok();
    } catch (e: any) { return fail(e.message); }
  }

  async scroll(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult> {
    try {
      const page = await getPage(ctx);
      if (payload.selector) {
        await page.locator(payload.selector).scrollIntoViewIfNeeded({
          timeout: payload.timeoutMs ?? 30_000
        });
      } else {
        const x = payload.scrollX ?? 0;
        const y = payload.scrollY ?? 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await page.evaluate(({ sx, sy }: { sx: number; sy: number }) => {
          (globalThis as any).scrollTo(sx, sy);
        }, { sx: x, sy: y });
      }
      return ok();
    } catch (e: any) { return fail(e.message); }
  }

  async dragAndDrop(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult> {
    try {
      const page = await getPage(ctx);
      await page.locator(payload.selector!).dragTo(page.locator(payload.targetSelector!), {
        timeout: payload.timeoutMs ?? 30_000
      });
      return ok();
    } catch (e: any) { return fail(e.message); }
  }

  // ── Data extraction ──────────────────────────────────────────

  async extractData(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult> {
    try {
      const page = await getPage(ctx);
      const attr = payload.extraParams?.attribute ?? 'text';
      let data: string | null = null;

      if (attr === 'text') {
        data = await page.locator(payload.selector!).innerText();
      } else if (attr === 'value') {
        data = await page.locator(payload.selector!).inputValue();
      } else {
        data = await page.locator(payload.selector!).getAttribute(attr);
      }
      return ok(data, payload.value /* variable name */);
    } catch (e: any) { return fail(e.message); }
  }

  async takeScreenshot(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult> {
    try {
      const page = await getPage(ctx);
      let buffer: Buffer;
      if (payload.selector) {
        buffer = await page.locator(payload.selector).screenshot();
      } else {
        buffer = await page.screenshot({ fullPage: true });
      }
      return ok(buffer.toString('base64'));
    } catch (e: any) { return fail(e.message); }
  }

  // ── Utilities ────────────────────────────────────────────────

  async waitMs(_ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult> {
    const ms = payload.extraParams?.ms ?? 1000;
    await new Promise((r) => setTimeout(r, ms));
    return ok();
  }
}
