import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './screens/LoginScreen';
import { StartPage } from './screens/Start Screen';
import RegisterScreen from './screens/RegisterScreen';
import ARScreen from './screens/ARScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Start" 
          component={StartPage} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="ARScreen" 
          component={ARScreen} 
          options={{ title: 'Nutly AR' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}