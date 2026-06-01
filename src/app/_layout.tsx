import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useAppTheme } from '../context/ThemeContext';
import { ApiKeyProvider } from '../context/ApiKeyContext';
import { DBProvider } from '../context/DBContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function RootLayoutContent() {
  const { colors, isDark } = useAppTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="snippet/[id]" options={{ title: 'Snippet Details' }} />
        <Stack.Screen name="snippet/create" options={{ title: 'New Snippet', presentation: 'modal' }} />
        <Stack.Screen name="snippet/edit" options={{ title: 'Edit Snippet', presentation: 'modal' }} />
        <Stack.Screen name="files/viewer" options={{ title: 'File Viewer' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ApiKeyProvider>
          <DBProvider>
            <RootLayoutContent />
          </DBProvider>
        </ApiKeyProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
