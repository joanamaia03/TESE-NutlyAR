import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import { StartPage } from '../screens/Start Screen';
import HomeScreen from '../screens/HomeScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DemographicsScreen from '../screens/DemographicsScreen';
import ARScreen from '../screens/ARScreen';
import Question1Screen from '../screens/Question1Screen';
import Question2Screen from '../screens/Question2screen';
import Question3Screen from '../screens/Question3Screen';
import Question4Screen from '../screens/Question4Screen';
import ImagesScreen from '../screens/ImagesScreen';
import FinishScreen from '../screens/FinishScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Start" component={StartPage} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="DemographicsScreen" component={DemographicsScreen} />
      <Stack.Screen name="ARScreen" component={ARScreen} />
      <Stack.Screen name="Question1Screen" component={Question1Screen} />
      <Stack.Screen name="Question2Screen" component={Question2Screen} />
      <Stack.Screen name="Question3Screen" component={Question3Screen} />
      <Stack.Screen name="Question4Screen" component={Question4Screen} />
      <Stack.Screen name="ImagineScreen" component={Question4Screen} />
      <Stack.Screen name="ImagesScreen" component={ImagesScreen} />
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="FinishScreen" component={FinishScreen} />
    </Stack.Navigator>
  );
}