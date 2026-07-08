// ============================================================
// AutomationCoreFactory.ts — Infrastructure Layer
// Factory class that instantiates and vends the correct IAutomationCore
// implementation based on a simple engine key.
//
// All upper layers (Use Cases, Socket adapters) receive an IAutomationCore
// instance and NEVER import concrete engine classes directly.
// Adding a new engine = add one entry in the registry map.
// ============================================================

import { IAutomationCore } from '../../domain/automation-core/IAutomationCore';
import { PatchrightCore } from './PatchrightCore';
import { CloakBrowserCore } from './CloakBrowserCore';

// ── Engine type registry ──────────────────────────────────────

export type AutomationEngineType = 'patchright' | 'cloakbrowser';

type EngineConstructor = new () => IAutomationCore;

const ENGINE_REGISTRY: Record<AutomationEngineType, EngineConstructor> = {
  patchright: PatchrightCore,
  cloakbrowser: CloakBrowserCore,
};

// ── Factory ───────────────────────────────────────────────────

export class AutomationCoreFactory {
  /** Singleton instances keyed by engine type (lazy-created) */
  private static instances = new Map<AutomationEngineType, IAutomationCore>();

  /**
   * Return a shared IAutomationCore instance for the requested engine.
   * Each engine type is only instantiated once (singleton per type).
   *
   * @param engine - Engine key: 'patchright' | 'cloakbrowser'
   * @throws If the requested engine type is not registered.
   */
  static getInstance(engine: AutomationEngineType): IAutomationCore {
    if (!this.instances.has(engine)) {
      const Ctor = ENGINE_REGISTRY[engine];
      if (!Ctor) {
        throw new Error(
          `[AutomationCoreFactory] Unknown engine: "${engine}". ` +
          `Available engines: ${Object.keys(ENGINE_REGISTRY).join(', ')}`
        );
      }
      this.instances.set(engine, new Ctor());
      console.log(`[AutomationCoreFactory] Created new instance of engine: ${engine}`);
    }
    return this.instances.get(engine)!;
  }

  /**
   * Convenience alias — always returns the default engine as configured
   * by the AUTOMATION_ENGINE environment variable (fallback: 'patchright').
   */
  static getDefault(): IAutomationCore {
    const engine = (process.env.AUTOMATION_ENGINE ?? 'patchright') as AutomationEngineType;
    return this.getInstance(engine);
  }

  /**
   * List all registered engine names.
   * Useful for API endpoints that expose available engines to the frontend.
   */
  static listEngines(): AutomationEngineType[] {
    return Object.keys(ENGINE_REGISTRY) as AutomationEngineType[];
  }
}
