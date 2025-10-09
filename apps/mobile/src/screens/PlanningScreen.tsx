import { useMemo, useState } from 'react';
import {
  Alert,
  Share
} from 'react-native';
import {
  ScrollView,
  XStack,
  YStack,
  Input,
  Separator,
  SizableText,
  Checkbox
} from 'tamagui';
import { Body, Button, Card, Title } from '@3i/ui-kit';
import {
  SUGGESTED_LOCATIONS,
  findSuggestion,
  type Coordinates
} from '../data/locations';
import {
  averageEtaMinutes,
  formatDistance,
  formatEta,
  generateCoordinatesFromLabel,
  haversineDistanceKm
} from '../utils/geo';

type StopStatus = 'pending' | 'completed';

export type Stop = {
  id: string;
  label: string;
  coordinates: Coordinates;
  notes?: string;
  status: StopStatus;
};

type RouteMetrics = {
  totalDistanceKm: number;
  totalEtaMinutes: number;
  completedStops: number;
  pendingStops: number;
  legs: Array<{
    stopId: string;
    distanceKm: number;
    etaMinutes: number;
  }>;
};

const INITIAL_STOPS: Stop[] = SUGGESTED_LOCATIONS.slice(0, 3).map((suggestion) => ({
  id: suggestion.id,
  label: suggestion.label,
  notes: suggestion.notes,
  coordinates: suggestion.coordinates,
  status: 'pending'
}));

const PlanningScreen = () => {
  const [stops, setStops] = useState<Stop[]>(INITIAL_STOPS);
  const [newStop, setNewStop] = useState('');

  const metrics = useMemo<RouteMetrics>(() => calculateRouteMetrics(stops), [stops]);

  const handleAddStop = () => {
    const trimmed = newStop.trim();
    if (!trimmed) {
      return;
    }

    const match = findSuggestion(trimmed);
    const coordinates = match
      ? match.coordinates
      : generateCoordinatesFromLabel(trimmed);

    const stop: Stop = {
      id: `stop-${Date.now()}`,
      label: match ? match.label : trimmed,
      notes: match?.notes,
      coordinates,
      status: 'pending'
    };

    setStops((prev) => [...prev, stop]);
    setNewStop('');
  };

  const handleRemoveStop = (id: string) => {
    setStops((prev) => prev.filter((stop) => stop.id !== id));
  };

  const handleToggleStatus = (id: string) => {
    setStops((prev) =>
      prev.map((stop) =>
        stop.id === id
          ? {
              ...stop,
              status: stop.status === 'completed' ? 'pending' : 'completed'
            }
          : stop
      )
    );
  };

  const handleOptimizeRoute = () => {
    setStops((prev) => optimiseStops(prev));
  };

  const handleResetRoute = () => {
    setStops(INITIAL_STOPS);
    setNewStop('');
  };

  const handlePreviewRoute = () => {
    const breakdown = stops
      .map((stop, index) => `${index + 1}. ${stop.label}`)
      .join('\n');
    Alert.alert('Route preview', breakdown);
  };

  const handleSharePlan = async () => {
    const message = `Route summary\nDistance: ${formatDistance(
      metrics.totalDistanceKm
    )}\nETA: ${formatEta(metrics.totalEtaMinutes)}\n\nStops:\n${stops
      .map((stop, index) => `${index + 1}. ${stop.label}`)
      .join('\n')}`;
    await Share.share({ message });
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
            <Body tone="muted">
              {metrics.completedStops} of {stops.length} stops completed ·{' '}
              {formatDistance(metrics.totalDistanceKm)} ·{' '}
              {formatEta(metrics.totalEtaMinutes)}
            </Body>
            <XStack gap="$4" flexWrap="wrap">
              <SummaryItem
                label="Distance"
                value={formatDistance(metrics.totalDistanceKm)}
              />
              <SummaryItem
                label="ETA"
                value={formatEta(metrics.totalEtaMinutes)}
              />
              <SummaryItem
                label="Pending"
                value={`${metrics.pendingStops}`}
              />
              <SummaryItem
                label="Completed"
                value={`${metrics.completedStops}`}
              />
            </XStack>
            <XStack gap="$2">
              <Button flex={1} variant="secondary" onPress={handleOptimizeRoute}>
                Optimise order
              </Button>
              <Button flex={1} variant="ghost" onPress={handleResetRoute}>
                Reset route
              </Button>
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
                <StopRow
                  key={stop.id}
                  index={index}
                  stop={stop}
                  leg={metrics.legs.find((leg) => leg.stopId === stop.id)}
                  onRemove={handleRemoveStop}
                  onToggleStatus={handleToggleStatus}
                />
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
            <SuggestedStops onSelect={(label) => setNewStop(label)} />
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
              <Button flex={1} variant="secondary" onPress={handlePreviewRoute}>
                Preview route
              </Button>
              <Button flex={1} onPress={handleSharePlan} testID="share-plan-button">
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
  leg?: {
    distanceKm: number;
    etaMinutes: number;
  };
  onToggleStatus: (id: string) => void;
  onRemove: (id: string) => void;
};

const StopRow = ({ index, stop, leg, onToggleStatus, onRemove }: StopRowProps) => (
  <YStack
    padding="$3"
    borderRadius="$md"
    backgroundColor="$surfaceHover"
    gap="$2"
    testID={`stop-${index}`}
  >
    <XStack alignItems="center" gap="$3">
      <SizableText
        width={28}
        height={28}
        backgroundColor={stop.status === 'completed' ? '$surfacePress' : '$primary'}
        color="$colorInverse"
        borderRadius="$full"
        textAlign="center"
        alignSelf="center"
        lineHeight={28}
      >
        {index + 1}
      </SizableText>
      <YStack flex={1} gap="$1">
        <SizableText
          size="$4"
          fontWeight="500"
          textDecorationLine={stop.status === 'completed' ? 'line-through' : undefined}
        >
          {stop.label}
        </SizableText>
        {stop.notes ? <Body tone="muted">{stop.notes}</Body> : null}
        {leg ? (
          <Body tone="muted">
            Next: {formatDistance(leg.distanceKm)} · {formatEta(leg.etaMinutes)}
          </Body>
        ) : (
          <Body tone="muted">Final destination</Body>
        )}
      </YStack>
    </XStack>
    <XStack gap="$2" alignItems="center" justifyContent="space-between">
      <Checkbox
        size="$3"
        checked={stop.status === 'completed'}
        onCheckedChange={() => onToggleStatus(stop.id)}
        aria-label={
          stop.status === 'completed' ? 'Mark stop pending' : 'Mark stop completed'
        }
      />
      <Body tone="muted" flex={1}>
        {stop.status === 'completed' ? 'Completed' : 'Tap to mark completed'}
      </Body>
      <Button size="sm" variant="outlined" onPress={() => onRemove(stop.id)}>
        Remove
      </Button>
    </XStack>
  </YStack>
);

type SuggestedStopsProps = {
  onSelect: (label: string) => void;
};

const SuggestedStops = ({ onSelect }: SuggestedStopsProps) => (
  <YStack gap="$2">
    <Body tone="muted">Suggested stops</Body>
    <XStack gap="$2" flexWrap="wrap">
      {SUGGESTED_LOCATIONS.map((suggestion) => (
        <Button
          key={suggestion.id}
          size="sm"
          variant="ghost"
          onPress={() => onSelect(suggestion.label)}
        >
          {suggestion.label}
        </Button>
      ))}
    </XStack>
  </YStack>
);

const calculateRouteMetrics = (stops: Stop[]): RouteMetrics => {
  if (stops.length < 2) {
    return {
      totalDistanceKm: 0,
      totalEtaMinutes: 0,
      completedStops: stops.filter((stop) => stop.status === 'completed').length,
      pendingStops: stops.filter((stop) => stop.status !== 'completed').length,
      legs: []
    };
  }

  let distanceKm = 0;
  const legs: RouteMetrics['legs'] = [];

  for (let i = 0; i < stops.length - 1; i += 1) {
    const from = stops[i];
    const to = stops[i + 1];
    const legDistance = haversineDistanceKm(from.coordinates, to.coordinates);
    distanceKm += legDistance;
    legs.push({
      stopId: from.id,
      distanceKm: legDistance,
      etaMinutes: averageEtaMinutes(legDistance)
    });
  }

  return {
    totalDistanceKm: distanceKm,
    totalEtaMinutes: legs.reduce((acc, leg) => acc + leg.etaMinutes, 0),
    completedStops: stops.filter((stop) => stop.status === 'completed').length,
    pendingStops: stops.filter((stop) => stop.status !== 'completed').length,
    legs
  };
};

const optimiseStops = (stops: Stop[]) => {
  if (stops.length <= 2) {
    return stops;
  }

  const [origin, ...rest] = stops;
  const remaining = [...rest];
  const ordered: Stop[] = [origin];
  let current = origin;

  while (remaining.length) {
    let closestIndex = 0;
    let shortest = Number.MAX_VALUE;

    remaining.forEach((candidate, index) => {
      const distance = haversineDistanceKm(current.coordinates, candidate.coordinates);
      if (distance < shortest) {
        shortest = distance;
        closestIndex = index;
      }
    });

    const [next] = remaining.splice(closestIndex, 1);
    ordered.push(next);
    current = next;
  }

  return ordered;
};

export default PlanningScreen;
