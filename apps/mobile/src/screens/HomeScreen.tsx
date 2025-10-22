import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Body, Button, Card, Title } from '@3i/ui-kit';
import { ScrollView } from 'react-native';
import { YStack, useTheme, getVariableValue } from 'tamagui';
import { AppNavigationProp } from '../navigation/AppNavigator';

const HomeScreen = () => {
  const navigation = useNavigation<AppNavigationProp<'Home'>>();

  const handleStartPlanning = useCallback(() => {
    navigation.navigate('Planning');
  }, [navigation]);

  const handleViewB8 = useCallback(() => {
    navigation.navigate('RouteB8');
  }, [navigation]);

  const handleOpenQuickActionsDemo = useCallback(() => {
    navigation.navigate('QuickActionsDemo');
  }, [navigation]);

  const theme = useTheme();
  const backgroundColor = getVariableValue(theme.background) as string;

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      style={{ flex: 1, backgroundColor }}
      testID="home-scroll"
    >
      <YStack
        flex={1}
        padding="$5"
        gap="$4"
        backgroundColor="$background"
        justifyContent="flex-start"
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
        <Card elevated interactive>
          <YStack gap="$3" testID="b8-card">
            <Title level={2}>B8 route tracker</Title>
            <Body tone="muted">
              Review every stop on the Citybus B8 line and see the latest arrival estimates
              without leaving the app.
            </Body>
            <Button
              variant="secondary"
              testID="b8-cta"
              accessibilityRole="button"
              onPress={handleViewB8}
            >
              View live ETAs
            </Button>
          </YStack>
        </Card>
        <Card elevated interactive>
          <YStack gap="$3" testID="quick-actions-card">
            <Title level={2}>Radial quick actions</Title>
            <Body tone="muted">
              Showcase the floating action menu pattern that blooms into a one-handed shortcut hub.
            </Body>
            <Button
              variant="primary"
              testID="quick-actions-cta"
              accessibilityRole="button"
              onPress={handleOpenQuickActionsDemo}
            >
              Open demo
            </Button>
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  );
};

export default HomeScreen;
