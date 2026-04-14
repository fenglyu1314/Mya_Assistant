/**
 * @format
 */

// URL polyfill — 必须在所有代码之前导入
// 修复 RN 环境下 URL.protocol 只读导致 Supabase Realtime 崩溃的问题
import 'react-native-url-polyfill/auto';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
