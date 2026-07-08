import { IChromeProfileRepository } from '../domain/repositories/IChromeProfileRepository';
import { ChromeProfileDto } from '../domain/dto/ChromeProfileDto';
import { ChromeProfile } from '../domain/entities/ChromeProfile';

export class GetAllChromeProfilesUseCase {
  constructor(private profileRepository: IChromeProfileRepository) {}
  async execute(): Promise<ChromeProfileDto[]> {
    return this.profileRepository.getAll();
  }
}

export class GetChromeProfileByIdUseCase {
  constructor(private profileRepository: IChromeProfileRepository) {}
  async execute(id: number): Promise<ChromeProfileDto | null> {
    return this.profileRepository.getById(id);
  }
}

export class CreateChromeProfileUseCase {
  constructor(private profileRepository: IChromeProfileRepository) {}
  async execute(profileData: Omit<ChromeProfile, 'id' | 'createdAt'>): Promise<ChromeProfileDto> {
    if (!profileData.name) {
      throw new Error('Profile name is required.');
    }

    // Auto-generate folderName if not provided
    if (!profileData.folderName) {
      const slug = profileData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 24);
      const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      profileData.folderName = `${slug}_${suffix}`;
    }

    // Check if duplicate folderName exists
    const existing = await this.profileRepository.getByFolderName(profileData.folderName);
    if (existing) {
      throw new Error(`Profile folder name "${profileData.folderName}" already exists.`);
    }

    return this.profileRepository.create(profileData);
  }
}

export class UpdateChromeProfileUseCase {
  constructor(private profileRepository: IChromeProfileRepository) {}
  async execute(id: number, profileData: Partial<Omit<ChromeProfile, 'id' | 'folderName' | 'createdAt'>>): Promise<ChromeProfileDto | null> {
    return this.profileRepository.update(id, profileData);
  }
}

export class DeleteChromeProfileUseCase {
  constructor(private profileRepository: IChromeProfileRepository) {}
  async execute(id: number): Promise<boolean> {
    return this.profileRepository.delete(id);
  }
}

export class DeleteManyChromeProfilesUseCase {
  constructor(private profileRepository: IChromeProfileRepository) {}
  async execute(ids: number[]): Promise<number> {
    return this.profileRepository.deleteMany(ids);
  }
}
