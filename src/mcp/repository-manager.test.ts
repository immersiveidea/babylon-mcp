import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RepositoryManager } from './repository-manager.js';
import { type RepositoryConfig } from './repository-config.js';
import fs from 'fs';
import path from 'path';
import { simpleGit } from 'simple-git';

vi.mock('simple-git', () => {
  const mockGit = {
    clone: vi.fn().mockResolvedValue(undefined),
    pull: vi.fn().mockResolvedValue(undefined),
  };

  return {
    simpleGit: vi.fn(() => mockGit),
  };
});

describe('RepositoryManager', () => {
  let manager: RepositoryManager;
  let testBaseDir: string;

  beforeEach(() => {
    testBaseDir = path.join(process.cwd(), 'test-repos');
    manager = new RepositoryManager(testBaseDir);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should use provided base directory', () => {
      const customDir = '/custom/path';
      const customManager = new RepositoryManager(customDir);

      expect(customManager.getRepositoryPath('test')).toBe(
        path.join(customDir, 'test')
      );
    });

    it('should use default directory when not provided', () => {
      const defaultManager = new RepositoryManager();
      const expectedPath = path.join(process.cwd(), 'data', 'repositories', 'test');

      expect(defaultManager.getRepositoryPath('test')).toBe(expectedPath);
    });
  });

  describe('ensureRepository', () => {
    const config: RepositoryConfig = {
      name: 'TestRepo',
      url: 'https://github.com/test/repo.git',
      shallow: true,
    };

    it('should clone repository when it does not exist', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      vi.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);

      const mockGitInstance = vi.mocked(simpleGit)({} as any);

      const result = await manager.ensureRepository(config);

      expect(result).toBe(path.join(testBaseDir, 'TestRepo'));
      expect(mockGitInstance.clone).toHaveBeenCalled();
    });

    it('should update repository when it already exists', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);

      const result = await manager.ensureRepository(config);

      expect(result).toBe(path.join(testBaseDir, 'TestRepo'));
    });

    it('should pass shallow clone options', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      vi.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);

      const mockGitInstance = vi.mocked(simpleGit)({} as any);

      await manager.ensureRepository(config);

      expect(mockGitInstance.clone).toHaveBeenCalledWith(
        config.url,
        path.join(testBaseDir, config.name),
        ['--depth', '1', '--single-branch']
      );
    });

    it('should pass branch option when specified', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      vi.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);

      const configWithBranch: RepositoryConfig = {
        ...config,
        branch: 'develop',
      };

      const mockGitInstance = vi.mocked(simpleGit)({} as any);

      await manager.ensureRepository(configWithBranch);

      expect(mockGitInstance.clone).toHaveBeenCalledWith(
        config.url,
        path.join(testBaseDir, config.name),
        ['--depth', '1', '--single-branch', '--branch', 'develop']
      );
    });

    it('should not pass shallow options when shallow is false', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      vi.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);

      const fullCloneConfig: RepositoryConfig = {
        ...config,
        shallow: false,
      };

      const mockGitInstance = vi.mocked(simpleGit)({} as any);

      await manager.ensureRepository(fullCloneConfig);

      expect(mockGitInstance.clone).toHaveBeenCalledWith(
        config.url,
        path.join(testBaseDir, config.name),
        []
      );
    });

    it('should throw error when clone fails', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      vi.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);

      const mockGitInstance = vi.mocked(simpleGit)({} as any);
      mockGitInstance.clone = vi
        .fn()
        .mockRejectedValue(new Error('Network error'));

      await expect(manager.ensureRepository(config)).rejects.toThrow(
        'Failed to clone TestRepo: Network error'
      );
    });

    it('should handle filesystem errors gracefully when checking repo', async () => {
      vi.spyOn(fs, 'existsSync').mockImplementation(() => {
        throw new Error('Filesystem error');
      });
      vi.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);

      const mockGitInstance = vi.mocked(simpleGit)({} as any);
      mockGitInstance.clone = vi.fn().mockResolvedValue(undefined);

      const result = await manager.ensureRepository(config);

      expect(result).toBe(path.join(testBaseDir, 'TestRepo'));
      expect(mockGitInstance.clone).toHaveBeenCalled();
    });
  });

  describe('getRepositoryPath', () => {
    it('should return correct path for repository', () => {
      const repoPath = manager.getRepositoryPath('Documentation');

      expect(repoPath).toBe(path.join(testBaseDir, 'Documentation'));
    });
  });

  describe('initializeAllRepositories', () => {
    it('should initialize all three repositories', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      vi.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);

      await manager.initializeAllRepositories();

      const mockGitInstance = vi.mocked(simpleGit)({} as any);

      expect(mockGitInstance.clone).toHaveBeenCalledTimes(3);

      expect(mockGitInstance.clone).toHaveBeenCalledWith(
        'https://github.com/BabylonJS/Documentation.git',
        expect.stringContaining('Documentation'),
        expect.any(Array)
      );

      expect(mockGitInstance.clone).toHaveBeenCalledWith(
        'https://github.com/BabylonJS/Babylon.js.git',
        expect.stringContaining('Babylon.js'),
        expect.any(Array)
      );

      expect(mockGitInstance.clone).toHaveBeenCalledWith(
        'https://github.com/BabylonJS/havok.git',
        expect.stringContaining('havok'),
        expect.any(Array)
      );
    });

    it('should continue if one repository fails', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      vi.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);

      const mockGitInstance = vi.mocked(simpleGit)({} as any);

      let callCount = 0;
      mockGitInstance.clone = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return Promise.reject(new Error('Failed to clone'));
        }
        return Promise.resolve();
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await manager.initializeAllRepositories();

      expect(mockGitInstance.clone).toHaveBeenCalledTimes(3);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Update operations', () => {
    it('should pull changes when repository exists', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);

      const config: RepositoryConfig = {
        name: 'TestRepo',
        url: 'https://github.com/test/repo.git',
        shallow: true,
      };

      await manager.ensureRepository(config);

      const mockGitInstance = vi.mocked(simpleGit)({} as any);
      expect(mockGitInstance.pull).toHaveBeenCalled();
    });

    it('should handle pull errors gracefully', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);

      const mockGitInstance = vi.mocked(simpleGit)({} as any);
      mockGitInstance.pull = vi.fn().mockRejectedValue(new Error('Pull failed'));

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const config: RepositoryConfig = {
        name: 'TestRepo',
        url: 'https://github.com/test/repo.git',
        shallow: true,
      };

      await expect(manager.ensureRepository(config)).resolves.not.toThrow();
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });
});
