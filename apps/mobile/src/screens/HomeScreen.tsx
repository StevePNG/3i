import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Body, Button, Card, Title } from '@3i/ui-kit';
import { ScrollView, YStack } from 'tamagui';
import { AppNavigationProp } from '../navigation/AppNavigator';

const HomeScreen = () => {
  const navigation = useNavigation<AppNavigationProp<'Home'>>();

  const handleStartPlanning = useCallback(() => {
    navigation.navigate('Planning');
  }, [navigation]);

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <YStack
        flex={1}
        padding="$5"
        gap="$4"
        backgroundColor="$background"
        justifyContent="center"
      >
        <Card elevated interactive>
          <YStack gap="$3" testID="planning-card">
            <Title level={2} accessibilityLabel="Plan your next run title">
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
    </ScrollView>
  );
};

export default HomeScreen;
