import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Contexts
import { AuthProvider } from './src/contexts/AuthContext';
import { JobProvider } from './src/contexts/JobContext';
import { NotificationProvider } from './src/contexts/NotificationContext';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ActiveJobsScreen from './src/screens/ActiveJobsScreen';
import JobDetailsScreen from './src/screens/JobDetailsScreen';
import JobCompletionScreen from './src/screens/JobCompletionScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Navigation
import { useAuth } from './src/contexts/AuthContext';
import LoadingScreen from './src/screens/LoadingScreen';

const Stack = createNativeStackNavigator();

// Custom dark theme for Sia Moon branding
const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#3B82F6', // Blue
    secondary: '#10B981', // Green
    surface: '#1F2937', // Dark gray
    background: '#111827', // Darker gray
    onSurface: '#F9FAFB', // Light text
    onBackground: '#F9FAFB',
  },
};

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.onSurface,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {user ? (
          // Authenticated screens
          <>
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen}
              options={{ title: 'Sia Moon Staff' }}
            />
            <Stack.Screen 
              name="ActiveJobs" 
              component={ActiveJobsScreen}
              options={{ title: 'Active Jobs' }}
            />
            <Stack.Screen 
              name="JobDetails" 
              component={JobDetailsScreen}
              options={{ title: 'Job Details' }}
            />
            <Stack.Screen 
              name="JobCompletion" 
              component={JobCompletionScreen}
              options={{ title: 'Complete Job' }}
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ title: 'Profile' }}
            />
          </>
        ) : (
          // Unauthenticated screens
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <JobProvider>
            <NotificationProvider>
              <AppNavigator />
              <StatusBar style="light" />
            </NotificationProvider>
          </JobProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
