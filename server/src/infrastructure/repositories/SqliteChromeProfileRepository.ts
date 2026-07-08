import { IChromeProfileRepository } from '../../domain/repositories/IChromeProfileRepository';
import { ChromeProfile } from '../../domain/entities/ChromeProfile';
import { ChromeProfileDto } from '../../domain/dto/ChromeProfileDto';
import { ProxyDto } from '../../domain/dto/ProxyDto';
import { getDatabase } from '../database/sqlite';

export class SqliteChromeProfileRepository implements IChromeProfileRepository {
  private async getProxyDto(db: any, proxyId?: number): Promise<ProxyDto | undefined> {
    if (!proxyId) return undefined;
    const row = await db.get('SELECT * FROM proxies WHERE id = ?', proxyId);
    if (!row) return undefined;
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

  async create(profile: Omit<ChromeProfile, 'id' | 'createdAt'>): Promise<ChromeProfileDto> {
    const db = await getDatabase();
    const createdAt = new Date().toISOString();
    const result = await db.run(
      `INSERT INTO chrome_profiles (name, folder_name, user_agent, proxy, proxy_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      profile.name,
      profile.folderName,
      profile.userAgent || null,
      profile.proxy || null,
      profile.proxyId || null,
      createdAt
    );
    const id = result.lastID!;
    const proxyDetail = await this.getProxyDto(db, profile.proxyId);
    return new ChromeProfileDto({ ...profile, id, createdAt }, proxyDetail);
  }

  async getById(id: number): Promise<ChromeProfileDto | null> {
    const db = await getDatabase();
    const row = await db.get('SELECT * FROM chrome_profiles WHERE id = ?', id);
    if (!row) return null;
    const proxyDetail = await this.getProxyDto(db, row.proxy_id);
    return new ChromeProfileDto({
      id: row.id,
      name: row.name,
      folderName: row.folder_name,
      userAgent: row.user_agent,
      proxy: row.proxy,
      proxyId: row.proxy_id,
      createdAt: row.created_at
    }, proxyDetail);
  }

  async getByFolderName(folderName: string): Promise<ChromeProfileDto | null> {
    const db = await getDatabase();
    const row = await db.get('SELECT * FROM chrome_profiles WHERE folder_name = ?', folderName);
    if (!row) return null;
    const proxyDetail = await this.getProxyDto(db, row.proxy_id);
    return new ChromeProfileDto({
      id: row.id,
      name: row.name,
      folderName: row.folder_name,
      userAgent: row.user_agent,
      proxy: row.proxy,
      proxyId: row.proxy_id,
      createdAt: row.created_at
    }, proxyDetail);
  }

  async getAll(): Promise<ChromeProfileDto[]> {
    const db = await getDatabase();
    const rows = await db.all('SELECT * FROM chrome_profiles ORDER BY created_at DESC');
    const profiles: ChromeProfileDto[] = [];
    for (const row of rows) {
      const proxyDetail = await this.getProxyDto(db, row.proxy_id);
      profiles.push(new ChromeProfileDto({
        id: row.id,
        name: row.name,
        folderName: row.folder_name,
        userAgent: row.user_agent,
        proxy: row.proxy,
        proxyId: row.proxy_id,
        createdAt: row.created_at
      }, proxyDetail));
    }
    return profiles;
  }

  async update(id: number, profileData: Partial<Omit<ChromeProfile, 'id' | 'folderName' | 'createdAt'>>): Promise<ChromeProfileDto | null> {
    const db = await getDatabase();
    const profile = await this.getById(id);
    if (!profile) return null;

    const name = profileData.name !== undefined ? profileData.name : profile.name;
    const userAgent = profileData.userAgent !== undefined ? profileData.userAgent : profile.userAgent;
    const proxy = profileData.proxy !== undefined ? profileData.proxy : profile.proxy;
    const proxyId = profileData.proxyId !== undefined ? (profileData.proxyId === -1 ? null : profileData.proxyId) : profile.proxyId;

    await db.run(
      `UPDATE chrome_profiles 
       SET name = ?, user_agent = ?, proxy = ?, proxy_id = ?
       WHERE id = ?`,
      name,
      userAgent,
      proxy,
      proxyId,
      id
    );

    return this.getById(id);
  }

  async delete(id: number): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.run('DELETE FROM chrome_profiles WHERE id = ?', id);
    return (result.changes ?? 0) > 0;
  }

  async deleteMany(ids: number[]): Promise<number> {
    if (!ids || ids.length === 0) return 0;
    const db = await getDatabase();
    const placeholders = ids.map(() => '?').join(',');
    const result = await db.run(`DELETE FROM chrome_profiles WHERE id IN (${placeholders})`, ...ids);
    return result.changes ?? 0;
  }
}
