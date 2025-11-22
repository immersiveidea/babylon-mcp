import { simpleGit, type SimpleGit } from 'simple-git';
import fs from 'fs';
import path from 'path';
import {
  BABYLON_REPOSITORIES,
  type RepositoryConfig,
} from './repository-config.js';

export class RepositoryManager {
  private gitInstance: SimpleGit;
  private baseDir: string;

  constructor(baseDir?: string) {
    this.gitInstance = simpleGit();
    this.baseDir = baseDir || path.join(process.cwd(), 'data', 'repositories');
  }

  async ensureRepository(config: RepositoryConfig): Promise<string> {
    const targetDir = path.join(this.baseDir, config.name);

    if (await this.isValidRepo(targetDir)) {
      console.log(`Updating ${config.name}...`);
      await this.updateRepo(targetDir);
    } else {
      console.log(`Cloning ${config.name}...`);
      await this.cloneRepo(config, targetDir);
    }

    return targetDir;
  }

  private async isValidRepo(repoDir: string): Promise<boolean> {
    try {
      const gitDir = path.join(repoDir, '.git');
      return fs.existsSync(gitDir);
    } catch {
      return false;
    }
  }

  private async cloneRepo(
    config: RepositoryConfig,
    targetDir: string
  ): Promise<void> {
    await fs.promises.mkdir(this.baseDir, { recursive: true });

    const options: string[] = [];

    if (config.shallow) {
      options.push('--depth', '1', '--single-branch');
    }

    if (config.branch) {
      options.push('--branch', config.branch);
    }

    try {
      await this.gitInstance.clone(config.url, targetDir, options);
    } catch (error) {
      throw new Error(
        `Failed to clone ${config.name}: ${(error as Error).message}`
      );
    }
  }

  private async updateRepo(repoDir: string): Promise<void> {
    const repoGit = simpleGit(repoDir);

    try {
      await repoGit.pull();
    } catch (error) {
      console.warn(`Failed to update ${path.basename(repoDir)}: ${error}`);
    }
  }

  async initializeAllRepositories(): Promise<void> {
    await Promise.all(
      BABYLON_REPOSITORIES.map((repo) =>
        this.ensureRepository(repo).catch((err) => {
          console.error(`Failed to initialize ${repo.name}:`, err.message);
          return null;
        })
      )
    );
  }

  getRepositoryPath(name: string): string {
    return path.join(this.baseDir, name);
  }
}
