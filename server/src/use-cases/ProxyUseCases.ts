import { IProxyRepository } from '../domain/repositories/IProxyRepository';
import { ProxyDto } from '../domain/dto/ProxyDto';
import { Proxy } from '../domain/entities/Proxy';

export class GetAllProxiesUseCase {
  constructor(private proxyRepository: IProxyRepository) {}
  async execute(): Promise<ProxyDto[]> {
    return this.proxyRepository.getAll();
  }
}

export class GetProxyByIdUseCase {
  constructor(private proxyRepository: IProxyRepository) {}
  async execute(id: number): Promise<ProxyDto | null> {
    return this.proxyRepository.getById(id);
  }
}

export class CreateProxyUseCase {
  constructor(private proxyRepository: IProxyRepository) {}
  async execute(proxyData: Omit<Proxy, 'id' | 'createdAt'>): Promise<ProxyDto> {
    if (!proxyData.host || !proxyData.port) {
      throw new Error('Host and Port are required for proxy creation.');
    }
    return this.proxyRepository.create(proxyData);
  }
}

export class UpdateProxyUseCase {
  constructor(private proxyRepository: IProxyRepository) {}
  async execute(id: number, proxyData: Partial<Omit<Proxy, 'id' | 'createdAt'>>): Promise<ProxyDto | null> {
    return this.proxyRepository.update(id, proxyData);
  }
}

export class DeleteProxyUseCase {
  constructor(private proxyRepository: IProxyRepository) {}
  async execute(id: number): Promise<boolean> {
    return this.proxyRepository.delete(id);
  }
}

export class DeleteManyProxiesUseCase {
  constructor(private proxyRepository: IProxyRepository) {}
  async execute(ids: number[]): Promise<number> {
    return this.proxyRepository.deleteMany(ids);
  }
}

export class ImportProxiesUseCase {
  constructor(private proxyRepository: IProxyRepository) {}
  
  async execute(textContent: string): Promise<{ success: boolean; message: string; added: number; invalid: number }> {
    if (!textContent || textContent.trim() === '') {
      return { success: false, message: 'Nội dung proxy trống.', added: 0, invalid: 0 };
    }

    const proxyRegex = /^(?:([a-zA-Z0-9]+):\/\/)?([^:\s]+):(\d+)(?::([^:\s]+):([^:\s]+))?$/;
    const lines = textContent.split('\n');
    const parsedProxies: Omit<Proxy, 'id' | 'createdAt'>[] = [];
    let invalidCount = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const match = trimmed.match(proxyRegex);
      if (match) {
        const scheme = match[1];
        const host = match[2];
        const port = parseInt(match[3], 10);
        const username = match[4];
        const password = match[5];

        let type = 'HTTP';
        if (scheme) {
          const schemeLower = scheme.toLowerCase();
          if (schemeLower === 'socks5') type = 'Socks5';
          else if (schemeLower === 'socks4') type = 'Socks4';
          else if (schemeLower === 'ssh') type = 'SSH';
        }

        parsedProxies.push({
          host,
          port,
          username: username || undefined,
          password: password || undefined,
          type,
          country: 'Unknown',
          status: 'unknown'
        });
      } else {
        invalidCount++;
      }
    }

    const addedCount = await this.proxyRepository.bulkCreate(parsedProxies);
    return {
      success: true,
      message: `Đã nhập thành công ${addedCount} proxy. Hàng lỗi định dạng bị bỏ qua: ${invalidCount}`,
      added: addedCount,
      invalid: invalidCount
    };
  }
}
