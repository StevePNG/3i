import { useMemo, useState } from 'react';
import { ScrollView, XStack, YStack, Input, Separator, SizableText } from 'tamagui';
import { Body, Button, Card, Title } from '@3i/ui-kit';

type Stop = {
  id: string;
  label: string;
  notes?: string;
};

const INITIAL_STOPS: Stop[] = [
  { id: 'stop-1', label: 'Warehouse – 145 Market St' },
  { id: 'stop-2', label: 'Drop-off – 500 Embarcadero' },
  { id: 'stop-3', label: 'Drop-off – 2000 Union St' }
];

const PlanningScreen = () => {
  const [stops, setStops] = useState<Stop[]>(INITIAL_STOPS);
  const [newStop, setNewStop] = useState('');

  const routeSummary = useMemo(
    () => ({
      distance: '18.4 km',
      eta: '42 mins',
      traffic: 'Moderate',
      lastUpdated: '2 mins ago'
    }),
    []
  );

  const handleAddStop = () => {
    if (!newStop.trim()) {
      return;
    }

    setStops((prev) => [
      ...prev,
      { id: `stop-${prev.length + 1}`, label: newStop.trim() }
    ]);
    setNewStop('');
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      <YStack gap="$4">
        <Title level={2} accessibilityLabel="Planning screen title">
          Route planning
        </Title>
        <Body tone="muted">
          Build and optimise your run. Stops will be sequenced automatically once the
          route is submitted.
        </Body>
        <Card>
          <YStack gap="$3">
            <SizableText size="$5" fontWeight="600">
              Route summary
            </SizableText>
            <XStack gap="$4" flexWrap="wrap">
              <SummaryItem label="Distance" value={routeSummary.distance} />
              <SummaryItem label="ETA" value={routeSummary.eta} />
              <SummaryItem label="Traffic" value={routeSummary.traffic} />
              <SummaryItem label="Updated" value={routeSummary.lastUpdated} />
            </XStack>
          </YStack>
        </Card>
        <Card>
          <YStack gap="$3">
            <SizableText size="$5" fontWeight="600">
              Stops
            </SizableText>
            <YStack gap="$2">
              {stops.map((stop, index) => (
                <StopRow key={stop.id} index={index} stop={stop} />
              ))}
            </YStack>
            <Separator marginVertical="$2" />
            <XStack gap="$2" alignItems="center">
              <Input
                flex={1}
                size="$4"
                placeholder="Add a stop or address"
                value={newStop}
                onChangeText={setNewStop}
                testID="new-stop-input"
              />
              <Button
                variant="secondary"
                size="sm"
                onPress={handleAddStop}
                testID="add-stop-button"
              >
                Add
              </Button>
            </XStack>
          </YStack>
        </Card>
        <Card>
          <YStack gap="$3">
            <SizableText size="$5" fontWeight="600">
              Next actions
            </SizableText>
            <Body tone="muted">
              Preview the route and share with your driver when you are ready.
            </Body>
            <XStack gap="$2">
              <Button flex={1} variant="secondary">
                Preview route
              </Button>
              <Button flex={1} testID="share-plan-button">
                Share plan
              </Button>
            </XStack>
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  );
};

type SummaryItemProps = {
  label: string;
  value: string;
};

const SummaryItem = ({ label, value }: SummaryItemProps) => (
  <YStack width="45%" minWidth={140} gap="$1">
    <Body tone="muted">{label}</Body>
    <SizableText size="$5" fontWeight="600">
      {value}
    </SizableText>
  </YStack>
);

type StopRowProps = {
  index: number;
  stop: Stop;
};

const StopRow = ({ index, stop }: StopRowProps) => (
  <XStack
    padding="$3"
    borderRadius="$md"
    backgroundColor="$surfaceHover"
    alignItems="center"
    gap="$3"
  >
    <SizableText
      width={28}
      height={28}
      backgroundColor="$primary"
      color="$colorInverse"
      borderRadius="$full"
      textAlign="center"
      alignSelf="center"
      lineHeight={28}
    >
      {index + 1}
    </SizableText>
    <YStack flex={1} gap="$1">
      <SizableText size="$4" fontWeight="500">
        {stop.label}
      </SizableText>
      {stop.notes ? <Body tone="muted">{stop.notes}</Body> : null}
    </YStack>
  </XStack>
);

export default PlanningScreen;
