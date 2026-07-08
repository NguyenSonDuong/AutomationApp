import { BaseDto } from './BaseDto';
import { Proxy } from '../entities/Proxy';

export class ProxyDto extends BaseDto {
  id?: number;
  host: string;
  port: number;
  username?: string;
  password?: string;
  type: string;
  country?: string;
  pingSpeed?: number;
  status: string;
  lastChecked?: string;
  createdAt: string;
  displayString: string;

  constructor(proxy: Proxy) {
    super();
    this.id = proxy.id;
    this.host = proxy.host;
    this.port = proxy.port;
    this.username = proxy.username;
    this.password = proxy.password;
    this.type = proxy.type;
    this.country = proxy.country;
    this.pingSpeed = proxy.pingSpeed;
    this.status = proxy.status;
    this.lastChecked = proxy.lastChecked;
    this.createdAt = proxy.createdAt;
    
    // Equivalent of display_string in Python
    this.displayString = `[${proxy.type}] ${proxy.host}:${proxy.port}` + 
      (proxy.username && proxy.password ? `:${proxy.username}:${proxy.password}` : '');
  }
}
