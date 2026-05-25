import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigator';
import { NutlySessionProvider } from './src/NutlySessionContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        
        {/* Novo Provider - deve ficar o mais alto possível */}
        <NutlySessionProvider>
          
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>

        </NutlySessionProvider>

      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}