import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { runMigrations } from './migrations';

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (db) return db;

  // Save the database at the root of the server directory
  const dbPath = path.resolve(__dirname, '../../../database.sqlite');
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await db.exec('PRAGMA foreign_keys = ON;');

  // Create the baseline tasks table if not exists (for retrocompatibility with index page tasks)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    )
  `);

  // Run the automated migration engine
  console.log('[DB] Running database migrations...');
  await runMigrations(db);
  console.log('[DB] All database migrations are up to date.');

  return db;
}
