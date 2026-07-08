export interface Proxy {
  id?: number;
  host: string;
  port: number;
  username?: string;
  password?: string;
  type: string; // HTTP, Socks5, Socks4, SSH
  country?: string;
  pingSpeed?: number;
  status: string; // alive, dead, unknown
  lastChecked?: string;
  createdAt: string;
}
