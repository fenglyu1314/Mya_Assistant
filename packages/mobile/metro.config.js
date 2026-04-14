const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// monorepo 根目录
const monorepoRoot = path.resolve(__dirname, '../..');
// 共享层目录
const sharedPath = path.resolve(__dirname, '../shared');

/**
 * Metro configuration
 * 配置 monorepo 路径解析，使移动端可引用 @mya/shared
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  // 监听 shared 包和根目录的变更
  watchFolders: [sharedPath, monorepoRoot],

  resolver: {
    // 告诉 Metro 从哪些目录查找 node_modules
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
    // 禁止 Metro 解析 desktop 包（避免不必要的监听）
    blockList: [
      new RegExp(path.resolve(__dirname, '../desktop').replace(/[/\\]/g, '[/\\\\]') + '/.*'),
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
