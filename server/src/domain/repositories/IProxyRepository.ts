import { Proxy } from '../entities/Proxy';
import { ProxyDto } from '../dto/ProxyDto';

export interface IProxyRepository {
  create(proxy: Omit<Proxy, 'id' | 'createdAt'>): Promise<ProxyDto>;
  getById(id: number): Promise<ProxyDto | null>;
  getAll(): Promise<ProxyDto[]>;
  update(id: number, proxyData: Partial<Omit<Proxy, 'id' | 'createdAt'>>): Promise<ProxyDto | null>;
  delete(id: number): Promise<boolean>;
  bulkCreate(proxies: Omit<Proxy, 'id' | 'createdAt'>[]): Promise<number>;
  deleteMany(ids: number[]): Promise<number>;
}
