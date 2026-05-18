import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './screens/LoginScreen';
import { StartPage } from './screens/Start Screen';
import RegisterScreen from './screens/RegisterScreen';
import DemographicsScreen from './screens/DemographicsScreen';
import ARScreen from './screens/ARScreen';
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
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}