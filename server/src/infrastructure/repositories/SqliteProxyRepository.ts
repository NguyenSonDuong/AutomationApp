import { IProxyRepository } from '../../domain/repositories/IProxyRepository';
import { Proxy } from '../../domain/entities/Proxy';
import { ProxyDto } from '../../domain/dto/ProxyDto';
import { getDatabase } from '../database/sqlite';

export class SqliteProxyRepository implements IProxyRepository {
  async create(proxy: Omit<Proxy, 'id' | 'createdAt'>): Promise<ProxyDto> {
    const db = await getDatabase();
    const createdAt = new Date().toISOString();
    const result = await db.run(
      `INSERT INTO proxies (host, port, username, password, type, country, ping_speed, status, last_checked, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      proxy.host,
      proxy.port,
      proxy.username || null,
      proxy.password || null,
      proxy.type || 'HTTP',
      proxy.country || null,
      proxy.pingSpeed || null,
      proxy.status || 'unknown',
      proxy.lastChecked || null,
      createdAt
    );
    const id = result.lastID!;
    return new ProxyDto({ ...proxy, id, createdAt });
  }

  async getById(id: number): Promise<ProxyDto | null> {
    const db = await getDatabase();
    const row = await db.get('SELECT * FROM proxies WHERE id = ?', id);
    if (!row) return null;
    return new ProxyDto({
      id: row.id,
      host: row.host,
      port: row.port,
      username: row.username,
      password: row.password,
      type: row.type,
      country: row.country,
      pingSpeed: row.ping_speed,
      status: row.status,
      lastChecked: row.last_checked,
      createdAt: row.created_at
    });
  }

  async getAll(): Promise<ProxyDto[]> {
    const db = await getDatabase();
    const rows = await db.all('SELECT * FROM proxies ORDER BY created_at DESC');
    return rows.map(row => new ProxyDto({
      id: row.id,
      host: row.host,
      port: row.port,
      username: row.username,
      password: row.password,
      type: row.type,
      country: row.country,
      pingSpeed: row.ping_speed,
      status: row.status,
      lastChecked: row.last_checked,
      createdAt: row.created_at
    }));
  }

  async update(id: number, proxyData: Partial<Omit<Proxy, 'id' | 'createdAt'>>): Promise<ProxyDto | null> {
    const db = await getDatabase();
    const proxy = await this.getById(id);
    if (!proxy) return null;

    const host = proxyData.host !== undefined ? proxyData.host : proxy.host;
    const port = proxyData.port !== undefined ? proxyData.port : proxy.port;
    const username = proxyData.username !== undefined ? proxyData.username : proxy.username;
    const password = proxyData.password !== undefined ? proxyData.password : proxy.password;
    const type = proxyData.type !== undefined ? proxyData.type : proxy.type;
    const country = proxyData.country !== undefined ? proxyData.country : proxy.country;
    const pingSpeed = proxyData.pingSpeed !== undefined ? proxyData.pingSpeed : proxy.pingSpeed;
    const status = proxyData.status !== undefined ? proxyData.status : proxy.status;
    const lastChecked = proxyData.lastChecked !== undefined ? proxyData.lastChecked : proxy.lastChecked;

    await db.run(
      `UPDATE proxies 
       SET host = ?, port = ?, username = ?, password = ?, type = ?, country = ?, ping_speed = ?, status = ?, last_checked = ?
       WHERE id = ?`,
      host,
      port,
      username,
      password,
      type,
      country,
      pingSpeed,
      status,
      lastChecked,
      id
    );

    return this.getById(id);
  }

  async delete(id: number): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.run('DELETE FROM proxies WHERE id = ?', id);
    return (result.changes ?? 0) > 0;
  }

  async bulkCreate(proxies: Omit<Proxy, 'id' | 'createdAt'>[]): Promise<number> {
    const db = await getDatabase();
    let addedCount = 0;
    const createdAt = new Date().toISOString();

    for (const p of proxies) {
      // Check for exact duplicates
      const existing = await db.get(
        `SELECT 1 FROM proxies WHERE host = ? AND port = ? AND COALESCE(username, '') = ? AND COALESCE(password, '') = ? AND type = ?`,
        p.host,
        p.port,
        p.username || '',
        p.password || '',
        p.type || 'HTTP'
      );

      if (!existing) {
        await db.run(
          `INSERT INTO proxies (host, port, username, password, type, country, ping_speed, status, last_checked, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          p.host,
          p.port,
          p.username || null,
          p.password || null,
          p.type || 'HTTP',
          p.country || 'Unknown',
          p.pingSpeed || null,
          p.status || 'unknown',
          p.lastChecked || null,
          createdAt
        );
        addedCount++;
      }
    }
    return addedCount;
  }

  async deleteMany(ids: number[]): Promise<number> {
    if (!ids || ids.length === 0) return 0;
    const db = await getDatabase();
    // Build parameterized query in SQLite
    const placeholders = ids.map(() => '?').join(',');
    const result = await db.run(`DELETE FROM proxies WHERE id IN (${placeholders})`, ...ids);
    return result.changes ?? 0;
  }
}
