export interface RepositoryConfig {
  name: string;
  url: string;
  shallow: boolean;
  branch?: string;
}

export const BABYLON_REPOSITORIES: RepositoryConfig[] = [
  {
    name: 'Documentation',
    url: 'https://github.com/BabylonJS/Documentation.git',
    shallow: true,
  },
  {
    name: 'Babylon.js',
    url: 'https://github.com/BabylonJS/Babylon.js.git',
    shallow: true,
  },
  {
    name: 'havok',
    url: 'https://github.com/BabylonJS/havok.git',
    shallow: true,
  },
  {
    name: 'Editor',
    url: 'https://github.com/BabylonJS/Editor.git',
    shallow: true,
    branch: 'master',
  },
];
