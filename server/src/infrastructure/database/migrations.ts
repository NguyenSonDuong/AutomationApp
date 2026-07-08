import { Database } from 'sqlite';

export interface Migration {
  id: string; // Unique migration name
  up(db: Database): Promise<void>;
}

export const migrations: Migration[] = [
  {
    id: '001_initial_schema',
    async up(db: Database) {
      console.log('[Migration] Creating proxies table...');
      await db.exec(`
        CREATE TABLE IF NOT EXISTS proxies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          host TEXT NOT NULL,
          port INTEGER NOT NULL,
          username TEXT,
          password TEXT,
          type TEXT NOT NULL DEFAULT 'HTTP',
          country TEXT,
          ping_speed INTEGER,
          status TEXT NOT NULL DEFAULT 'unknown',
          last_checked TEXT,
          created_at TEXT NOT NULL
        )
      `);

      console.log('[Migration] Creating chrome_profiles table...');
      await db.exec(`
        CREATE TABLE IF NOT EXISTS chrome_profiles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          folder_name TEXT NOT NULL UNIQUE,
          user_agent TEXT,
          proxy TEXT,
          proxy_id INTEGER,
          created_at TEXT NOT NULL,
          FOREIGN KEY (proxy_id) REFERENCES proxies(id) ON DELETE SET NULL
        )
      `);

      console.log('[Migration] Creating projects table...');
      await db.exec(`
        CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);

      console.log('[Migration] Creating action_steps table...');
      await db.exec(`
        CREATE TABLE IF NOT EXISTS action_steps (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER NOT NULL,
          is_start INTEGER NOT NULL DEFAULT 0,
          action_type TEXT NOT NULL,
          target_tab TEXT NOT NULL DEFAULT 'current',
          selector TEXT,
          target_selector TEXT,
          value TEXT,
          scroll_x INTEGER,
          scroll_y INTEGER,
          position_x REAL DEFAULT 0.0,
          position_y REAL DEFAULT 0.0,
          extra_params TEXT, -- stored as JSON string
          is_random INTEGER NOT NULL DEFAULT 0,
          min_val INTEGER,
          max_val INTEGER,
          random_type TEXT,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
      `);

      console.log('[Migration] Creating flow_edges table...');
      await db.exec(`
        CREATE TABLE IF NOT EXISTS flow_edges (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER NOT NULL,
          source_step_id INTEGER NOT NULL,
          target_step_id INTEGER NOT NULL,
          condition TEXT, -- stored as JSON string
          is_loop INTEGER NOT NULL DEFAULT 0,
          time_delay REAL NOT NULL DEFAULT 0.0,
          extra_params TEXT, -- stored as JSON string
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
          FOREIGN KEY (source_step_id) REFERENCES action_steps(id) ON DELETE CASCADE,
          FOREIGN KEY (target_step_id) REFERENCES action_steps(id) ON DELETE CASCADE
        )
      `);

      console.log('[Migration] Creating automation_logs table...');
      await db.exec(`
        CREATE TABLE IF NOT EXISTS automation_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          target_url TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          title TEXT,
          error_message TEXT,
          created_at TEXT NOT NULL,
          completed_at TEXT
        )
      `);
    }
  }
];

export async function runMigrations(db: Database) {
  // Create schema_migrations table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      run_at TEXT NOT NULL
    )
  `);

  // Run pending migrations sequentially
  for (const migration of migrations) {
    const isRun = await db.get('SELECT 1 FROM schema_migrations WHERE id = ?', migration.id);
    if (!isRun) {
      console.log(`[Migration] Running migration: ${migration.id}`);
      await db.exec('BEGIN TRANSACTION');
      try {
        await migration.up(db);
        await db.run('INSERT INTO schema_migrations (id, run_at) VALUES (?, ?)', migration.id, new Date().toISOString());
        await db.exec('COMMIT');
        console.log(`[Migration] Completed migration: ${migration.id}`);
      } catch (err) {
        await db.exec('ROLLBACK');
        console.error(`[Migration] Failed migration: ${migration.id}`, err);
        throw err;
      }
    }
  }
}
