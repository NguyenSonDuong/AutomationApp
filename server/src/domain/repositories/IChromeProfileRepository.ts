import { ChromeProfile } from '../entities/ChromeProfile';
import { ChromeProfileDto } from '../dto/ChromeProfileDto';

export interface IChromeProfileRepository {
  create(profile: Omit<ChromeProfile, 'id' | 'createdAt'>): Promise<ChromeProfileDto>;
  getById(id: number): Promise<ChromeProfileDto | null>;
  getByFolderName(folderName: string): Promise<ChromeProfileDto | null>;
  getAll(): Promise<ChromeProfileDto[]>;
  update(id: number, profileData: Partial<Omit<ChromeProfile, 'id' | 'folderName' | 'createdAt'>>): Promise<ChromeProfileDto | null>;
  delete(id: number): Promise<boolean>;
  deleteMany(ids: number[]): Promise<number>;
}
