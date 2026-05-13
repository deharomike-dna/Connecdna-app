import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import AppNavigator from './src/navigation/AppNavigator';
import { A11yProvider } from './src/context/AccessibilityContext';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#07111f',
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <A11yProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="light" />
          <AppNavigator />
        </NavigationContainer>
      </A11yProvider>
    </GestureHandlerRootView>
  );
}
