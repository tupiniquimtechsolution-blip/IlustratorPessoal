import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

const config: ForgeConfig = {
  packagerConfig: {
    asar: { unpack: '**/*.{node,dll}' },
    icon: 'assets/icons/app',
    executableName: 'IllustratorStudioAI',
    win32metadata: {
      CompanyName: 'Illustrator Studio AI',
      FileDescription: 'Estúdio visual com edição local e IA opcional',
      OriginalFilename: 'IllustratorStudioAI.exe',
      ProductName: 'Illustrator Studio AI',
      InternalName: 'IllustratorStudioAI',
    },
    ignore: (file) => {
      if (!file) return false;
      const runtimePaths = [
        '/.vite', '/package.json', '/migrations', '/node_modules',
        '/node_modules/sharp', '/node_modules/@img', '/node_modules/@img/colour', '/node_modules/@img/sharp-win32-x64',
        '/node_modules/detect-libc', '/node_modules/semver',
      ];
      if (file === '/node_modules' || file === '/node_modules/@img') return false;
      return !runtimePaths.some((included) => included !== '/node_modules' && file.startsWith(included));
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'illustrator_studio_ai',
      setupExe: 'IllustratorStudioAISetup.exe',
      setupIcon: 'assets/icons/app.ico',
      noMsi: true,
    }),
    new MakerZIP({}, ['win32']),
  ],
  plugins: [
    new VitePlugin({
      build: [
        { entry: 'src/main.ts', config: 'vite.main.config.ts', target: 'main' },
        { entry: 'src/preload.ts', config: 'vite.preload.config.ts', target: 'preload' },
      ],
      renderer: [{ name: 'main_window', config: 'vite.renderer.config.ts' }],
    }),
    new AutoUnpackNativesPlugin({}),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
      [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: false,
      [FuseV1Options.GrantFileProtocolExtraPrivileges]: false,
    }),
  ],
};

export default config;
