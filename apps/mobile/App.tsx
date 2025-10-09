import { Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppThemeProvider, Body, Button, Card, Title } from '@3i/ui-kit';
import { YStack } from 'tamagui';

export default function App() {
  const handleStartPlanning = () => {
    Alert.alert('Route planning', 'Planning flow coming soon.', [{ text: 'OK' }]);
  };

  return (
    <AppThemeProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <YStack
          flex={1}
          padding="$5"
          gap="$4"
          backgroundColor="$background"
          justifyContent="center"
        >
          <Card elevated interactive>
            <YStack testID="planning-card" gap="$3">
              <Title
                level={2}
                accessibilityLabel="Plan your next run title"
                testID="planning-title"
              >
                Plan your next run
              </Title>
              <Body tone="muted">
                Add stops, preview ETAs, and react to live traffic with Tamagui-powered
                components.
              </Body>
              <Button
                variant="primary"
                testID="planning-cta"
                accessibilityRole="button"
                onPress={handleStartPlanning}
              >
                Start planning
              </Button>
            </YStack>
          </Card>
        </YStack>
      </SafeAreaView>
      <StatusBar style="light" />
    </AppThemeProvider>
  );
}
