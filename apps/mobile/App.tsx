import { StatusBar } from 'expo-status-bar';
import { AppThemeProvider } from '@3i/ui-kit';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AppThemeProvider>
      <AppNavigator />
      <StatusBar style="light" />
    </AppThemeProvider>
  );
}
