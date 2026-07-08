// ============================================================
// CloakBrowserCore.ts — Infrastructure Layer
// Implements IAutomationCore using the cloakbrowser-nodejs library.
// CloakBrowser provides advanced anti-fingerprint capabilities and
// a Playwright-compatible API surface, making the port straightforward.
// ============================================================

import {
  IAutomationCore,
  BrowserContext,
  ActionPayload,
  ActionResult
} from '../../domain/automation-core/IAutomationCore';

// Optional dependency — install with: npm install cloakbrowser-nodejs
// eslint-disable-next-line @typescript-eslint/no-require-imports
let cloakbrowser: any;
try { cloakbrowser = require('cloakbrowser-nodejs'); } catch { /* not installed */ }

// Internal session registry: sessionId → CloakBrowser BrowserContext
const sessions = new Map<string, any>();

// ── Helpers ──────────────────────────────────────────────────────────────────

function ok(data?: string | null, variableName?: string): ActionResult {
  return { success: true, data: data ?? null, variableName };
}
function fail(error: string): ActionResult {
  return { success: false, error };
}

async function getActivePage(sessionId: string): Promise<any> {
  const ctx = sessions.get(sessionId);
  if (!ctx) throw new Error(`CloakBrowser session not found: ${sessionId}`);
  const pages = ctx.pages();
  return pages[pages.length - 1] ?? await ctx.newPage();
}

async function resolveTab(ctx: any, targetTab?: string): Promise<any> {
  if (!targetTab || targetTab === 'current') {
    const pages = ctx.pages();
    return pages[pages.length - 1];
  }
  if (targetTab === 'new') return await ctx.newPage();
  const match = targetTab.match(/^tab_(\d+)$/);
  if (match) {
    const idx = parseInt(match[1], 10);
    return ctx.pages()[idx] ?? ctx.pages()[ctx.pages().length - 1];
  }
  throw new Error(`Unknown targetTab: ${targetTab}`);
}

// ── Implementation ────────────────────────────────────────────────────────────

export class CloakBrowserCore implements IAutomationCore {

  // ── Lifecycle ────────────────────────────────────────────────

  async launchBrowser(profileDir: string, proxyUrl?: string): Promise<BrowserContext> {
    if (!cloakbrowser) throw new Error('[CloakBrowserCore] cloakbrowser-nodejs package not installed.');

    const sessionId = `cb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const launchOptions: any = {
      headless: false,
      userDataDir: profileDir,
    };
    if (proxyUrl) launchOptions.proxy = { server: proxyUrl };

    // CloakBrowser exposes a chromium.launchPersistentContext API similar to Playwright
    const context = await cloakbrowser.chromium.launchPersistentContext(
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
      const page = await resolveTab(session, payload.targetTab);
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
      const page = await resolveTab(session, payload.value);
      await page.bringToFront();
      return ok();
    } catch (e: any) { return fail(e.message); }
  }

  async closeTab(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult> {
    try {
      const session = sessions.get(ctx.sessionId)!;
      const page = await resolveTab(session, payload.value);
      await page.close();
      return ok();
    } catch (e: any) { return fail(e.message); }
  }

  async switchToIframe(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult> {
    try {
      const session = sessions.get(ctx.sessionId);
      if (session) session.__iframeSelector = payload.iframeSelector ?? null;
      return ok();
    } catch (e: any) { return fail(e.message); }
  }

  // ── Control actions ──────────────────────────────────────────

  async fillText(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult> {
    try {
      const page = await getActivePage(ctx.sessionId);
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
      const page = await getActivePage(ctx.sessionId);
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
      const page = await getActivePage(ctx.sessionId);
      await page.locator(payload.selector!).selectOption(payload.value!, {
        timeout: payload.timeoutMs ?? 30_000
      });
      return ok();
    } catch (e: any) { return fail(e.message); }
  }

  async setCheckbox(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult> {
    try {
      const page = await getActivePage(ctx.sessionId);
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
      const page = await getActivePage(ctx.sessionId);
      await page.locator(payload.selector!).check({ timeout: payload.timeoutMs ?? 30_000 });
      return ok();
    } catch (e: any) { return fail(e.message); }
  }

  async scroll(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult> {
    try {
      const page = await getActivePage(ctx.sessionId);
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
      const page = await getActivePage(ctx.sessionId);
      await page.locator(payload.selector!).dragTo(page.locator(payload.targetSelector!), {
        timeout: payload.timeoutMs ?? 30_000
      });
      return ok();
    } catch (e: any) { return fail(e.message); }
  }

  // ── Data extraction ──────────────────────────────────────────

  async extractData(ctx: BrowserContext, payload: ActionPayload): Promise<ActionResult> {
    try {
      const page = await getActivePage(ctx.sessionId);
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
      const page = await getActivePage(ctx.sessionId);
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
