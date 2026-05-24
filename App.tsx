import React from 'react';
// Keep awake wrapper
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const KeepAwake = require('expo-keep-awake');
  if (KeepAwake) {
    if (KeepAwake.activateKeepAwakeAsync) {
      const _orig = KeepAwake.activateKeepAwakeAsync;
      KeepAwake.activateKeepAwakeAsync = async (...args: any[]) => {
        try {
          // @ts-ignore
          return await _orig(...args);
        } catch (e) {
          console.warn('expo-keep-awake activateKeepAwakeAsync ignored error:', e?.message || e);
        }
      };
    }
    if (KeepAwake.activateKeepAwake) {
      const _orig2 = KeepAwake.activateKeepAwake;
      KeepAwake.activateKeepAwake = (...args: any[]) => {
        try {
          // @ts-ignore
          return _orig2(...args);
        } catch (e) {
          console.warn('expo-keep-awake activateKeepAwake ignored error:', e?.message || e);
          return Promise.resolve();
        }
      };
    }
  }
} catch (e) {
  // ignore if package not available in this environment
}

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}