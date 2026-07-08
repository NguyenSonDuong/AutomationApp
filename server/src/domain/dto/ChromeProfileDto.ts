import { BaseDto } from './BaseDto';
import { ChromeProfile } from '../entities/ChromeProfile';
import { ProxyDto } from './ProxyDto';

export class ChromeProfileDto extends BaseDto {
  id?: number;
  name: string;
  folderName: string;
  userAgent?: string;
  proxy?: string;
  proxyId?: number;
  createdAt: string;
  proxyDetail?: ProxyDto;

  constructor(profile: ChromeProfile, proxyDetail?: ProxyDto) {
    super();
    this.id = profile.id;
    this.name = profile.name;
    this.folderName = profile.folderName;
    this.userAgent = profile.userAgent;
    this.proxy = profile.proxy;
    this.proxyId = profile.proxyId;
    this.createdAt = profile.createdAt;
    this.proxyDetail = proxyDetail;
  }
}
