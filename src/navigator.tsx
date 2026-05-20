import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import { StartPage } from '../screens/Start Screen';
import RegisterScreen from '../screens/RegisterScreen';
import DemographicsScreen from '../screens/DemographicsScreen';
import ARScreen from '../screens/ARScreen';
import Question1Screen from '../screens/Question1Screen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Start" component={StartPage} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="DemographicsScreen" component={DemographicsScreen} />
      <Stack.Screen name="ARScreen" component={ARScreen} />
      <Stack.Screen name="Question1Screen" component={Question1Screen} />
    </Stack.Navigator>
  );
}