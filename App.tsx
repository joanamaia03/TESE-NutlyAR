import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Wrap expo-keep-awake activation to avoid uncaught promise if activity is gone
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

import LoginScreen from './screens/LoginScreen';
import { StartPage } from './screens/Start Screen';
import RegisterScreen from './screens/RegisterScreen';
import DemographicsScreen from './screens/DemographicsScreen';
import ARScreen from './screens/ARScreen';
import Question1Screen from './screens/Question1Screen';
import Question2Screen from './screens/Question2screen';
import Question3Screen from './screens/Question3Screen';
import Question4Screen from './screens/Question4Screen';
import HomeScreen from './screens/HomeScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
        />
        <Stack.Screen 
          name="Start" 
          component={StartPage} 
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
        />
        <Stack.Screen 
          name="DemographicsScreen" 
          component={DemographicsScreen} 
        />
        <Stack.Screen 
          name="ARScreen" 
          component={ARScreen} 
        />
        <Stack.Screen 
          name="Question1Screen" 
          component={Question1Screen} 
        />
        <Stack.Screen 
          name="Question2Screen" 
          component={Question2Screen} 
        />
        <Stack.Screen 
          name="Question3Screen" 
          component={Question3Screen} 
        />
        <Stack.Screen 
          name="Question4Screen" 
          component={Question4Screen} 
        />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}