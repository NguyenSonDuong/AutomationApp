import { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { Task } from '../../domain/entities/Task';
import { getDatabase } from '../database/sqlite';

export class SqliteTaskRepository implements ITaskRepository {
  async getAll(): Promise<Task[]> {
    const db = await getDatabase();
    const rows = await db.all('SELECT * FROM tasks ORDER BY createdAt DESC');
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      completed: row.completed === 1,
      createdAt: row.createdAt
    }));
  }

  async getById(id: string): Promise<Task | null> {
    const db = await getDatabase();
    const row = await db.get('SELECT * FROM tasks WHERE id = ?', id);
    if (!row) return null;
    return {
      id: row.id,
      title: row.title,
      completed: row.completed === 1,
      createdAt: row.createdAt
    };
  }

  async create(task: Task): Promise<Task> {
    const db = await getDatabase();
    await db.run(
      'INSERT INTO tasks (id, title, completed, createdAt) VALUES (?, ?, ?, ?)',
      task.id,
      task.title,
      task.completed ? 1 : 0,
      task.createdAt
    );
    return task;
  }

  async update(task: Task): Promise<Task> {
    const db = await getDatabase();
    await db.run(
      'UPDATE tasks SET title = ?, completed = ? WHERE id = ?',
      task.title,
      task.completed ? 1 : 0,
      task.id
    );
    return task;
  }

  async delete(id: string): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.run('DELETE FROM tasks WHERE id = ?', id);
    return (result.changes ?? 0) > 0;
  }
}
