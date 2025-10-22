import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, type LayoutRectangle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Body, Button, Card, TabList } from '@3i/ui-kit';
import {
  Accessibility,
  AlertTriangle,
  ArrowLeft,
  BusFront,
  ChevronRight,
  Clock,
  MoreHorizontal,
  List,
  Map as MapIcon,
  MapPin,
  Monitor,
  RefreshCw,
  Umbrella
} from '@tamagui/lucide-icons';
import { ScrollView, SizableText, Separator, Stack, XStack, YStack, useTheme, getVariableValue } from 'tamagui';
import { smoothBusProgress, type BusProgressState } from './RouteB8/busProgress';
import type { AppNavigationProp } from '../navigation/AppNavigator';

const API_BASE_URL = 'https://rt.data.gov.hk/v1/transport/citybus-nwfb';
const COMPANY_CODE = 'CTB';
const ROUTE_NUMBER = 'B8';
const USE_MOCK_DATA = true && !!process.env.EXPO_PUBLIC_ROUTE_B8_USE_MOCK;

const MOCK_DIRECTION_META: Record<RouteDirection, DirectionMeta> = {
  outbound: { origin: 'Downtown Terminal', destination: 'Airport Terminal' },
  inbound: { origin: 'Airport Terminal', destination: 'Downtown Terminal' }
};

const MOCK_STOPS: StopWithEta[] = (() => {
  const base = Date.now();
  const stopsMeta = [
    { id: 'mock-1', nameEn: 'Downtown Terminal', nameTc: '市中心總站' },
    { id: 'mock-2', nameEn: 'Central Park', nameTc: '中央公園' },
    { id: 'mock-3', nameEn: 'University Campus', nameTc: '大學校園' },
    { id: 'mock-4', nameEn: 'Shopping District', nameTc: '購物區' },
    { id: 'mock-5', nameEn: 'Medical Center', nameTc: '醫療中心' },
    { id: 'mock-6', nameEn: 'Industrial Park', nameTc: '工業園' },
    { id: 'mock-7', nameEn: 'Airport Terminal', nameTc: '機場航站' }
  ];

  const bus1OffsetsMinutes = [-2, 4, 10, 16, 22, 30, 38];
  const bus2OffsetsMinutes = [-14, -6, 2, 10, 18, 26, 34];

  return stopsMeta.map((stop, index) => {
    const seq = index + 1;
    const bus1Eta = new Date(base + bus1OffsetsMinutes[index] * 60 * 1000).toISOString();
    const bus2Eta = new Date(base + bus2OffsetsMinutes[index] * 60 * 1000).toISOString();

    return {
      stopId: stop.id,
      seq,
      nameEn: stop.nameEn,
      nameTc: stop.nameTc,
      etas: [
        { eta: bus1Eta, etaSeq: 1, remark: null },
        { eta: bus2Eta, etaSeq: 2, remark: null }
      ]
    } as StopWithEta;
  });
})();

type RouteDirection = 'inbound' | 'outbound';

type RouteStopResponse = {
  data: Array<{
    co: string;
    route: string;
    dir: 'I' | 'O';
    seq: number;
    stop: string;
  }>;
};

type StopResponse = {
  data: {
    stop: string;
    name_en: string;
    name_tc: string;
    name_sc: string;
    lat: string;
    long: string;
    data_timestamp: string;
  };
};

type RouteInfoResponse = {
  data: {
    co: string;
    route: string;
    orig_en: string;
    orig_tc: string;
    dest_en: string;
    dest_tc: string;
  };
};

type RouteEtaResponse = {
  data: Array<{
    co: string;
    route: string;
    dir: 'I' | 'O';
    seq: number;
    stop: string;
    dest_en: string;
    dest_tc: string;
    eta: string | null;
    eta_seq: number;
    rmk_en?: string | null;
    data_timestamp?: string;
  }>;
};

type StopDetail = {
  id: string;
  nameEn: string;
  nameTc: string;
  latitude: string;
  longitude: string;
};

type EtaDetail = {
  eta: string | null;
  etaSeq: number;
  remark?: string | null;
  destination?: string | null;
};

type StopWithEta = {
  stopId: string;
  seq: number;
  nameEn: string;
  nameTc: string;
  etas: EtaDetail[];
};

type DirectionMeta = {
  origin: string;
  destination: string;
};

const DIRECTION_TO_BOUND: Record<RouteDirection, 'I' | 'O'> = {
  inbound: 'I',
  outbound: 'O'
};

const DIRECTION_TO_PARAM: Record<RouteDirection, string> = {
  inbound: 'inbound',
  outbound: 'outbound'
};

type IconComponent = ComponentType<{ size?: number; color?: string }>;

const TOP_TAB_OPTIONS: Array<{
  value: 'map' | 'alerts' | 'list';
  label: string;
  icon: IconComponent;
}> = [
  { value: 'map', label: 'Route map', icon: MapIcon },
  { value: 'alerts', label: 'Alerts', icon: AlertTriangle },
  { value: 'list', label: 'Stops', icon: List }
];

const AMENITIES: Array<{ label: string; icon: IconComponent }> = [
  { label: 'Shelter', icon: Umbrella },
  { label: 'Real-time display', icon: Monitor },
  { label: 'Accessible', icon: Accessibility }
];

type BusMarker = {
  id: number;
  nextStopSeq: number;
  nextStopId: string;
  prevStopSeq: number | null;
  prevStopId: string | null;
  progress: number;
};

const STOP_ICON_SIZE = 45;
const STOP_VERTICAL_GAP = 24;
const BUS_MARKER_SIZE = 32;
const BUS_MARKER_PULSE_SIZE = BUS_MARKER_SIZE + 12;
const BUS_ASSIGN_THRESHOLD = 0.5;
const TIMELINE_LINE_X = 20;
const TIMELINE_CONTENT_OFFSET = TIMELINE_LINE_X + STOP_ICON_SIZE / 2 + 18;

const formatTime = (date: Date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const fetchJson = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status} for ${url}`);
  }

  return (await response.json()) as T;
};

const RouteB8Screen = () => {
  const navigation = useNavigation<AppNavigationProp<'RouteB8'>>();
  const [direction, setDirection] = useState<RouteDirection>('inbound');
  const [stops, setStops] = useState<StopWithEta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [directionMeta, setDirectionMeta] =
    useState<Record<RouteDirection, DirectionMeta> | null>(null);
  const [activeView, setActiveView] = useState<'map' | 'alerts' | 'list'>('map');

  const stopCacheRef = useRef<Map<string, StopDetail>>(new Map());
  const previousBusStateRef = useRef<Map<number, BusProgressState>>(new Map());

  useEffect(() => {
    if (USE_MOCK_DATA) {
      setDirectionMeta(MOCK_DIRECTION_META);
      return;
    }

    let cancelled = false;

    const loadRouteInfo = async () => {
      try {
        const response = await fetchJson<RouteInfoResponse>(
          `${API_BASE_URL}/route/${COMPANY_CODE}/${ROUTE_NUMBER}`
        );

        if (cancelled) {
          return;
        }

        const meta: Record<RouteDirection, DirectionMeta> = {
          outbound: {
            origin: response.data.orig_en,
            destination: response.data.dest_en
          },
          inbound: {
            origin: response.data.dest_en,
            destination: response.data.orig_en
          }
        };

        setDirectionMeta(meta);
      } catch (routeInfoError) {
        console.warn('Unable to load B8 route description', routeInfoError);
      }
    };

    loadRouteInfo();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadData = useCallback(
    async ({
      signal,
      isRefresh = false
    }: { signal?: { cancelled: boolean }; isRefresh?: boolean } = {}) => {
      // Only show loading state on initial load, not on auto-refresh
      const isInitialLoad = !isRefresh;

      if (isInitialLoad && !signal?.cancelled) {
        setLoading(true);
        setError(null);
      }

      try {
        if (USE_MOCK_DATA) {
          console.log('[RouteB8] using mock data');
          setStops(MOCK_STOPS);
          setLastUpdated(new Date());
          return;
        }

        const directionParam = DIRECTION_TO_PARAM[direction];
        const boundCode = DIRECTION_TO_BOUND[direction];

        const routeStopsResponse = await fetchJson<RouteStopResponse>(
          `${API_BASE_URL}/route-stop/${COMPANY_CODE}/${ROUTE_NUMBER}/${directionParam}`
        );

        const sortedStops = [...routeStopsResponse.data].sort((a, b) => a.seq - b.seq);

        const debugEtaSummary: Array<{
          stopId: string;
          seq: number;
          etaCount: number;
          etaSeqs: number[];
        }> = [];

        const stopsWithEta = await Promise.all(
          sortedStops.map(async (routeStop) => {
            const cached = stopCacheRef.current.get(routeStop.stop);
            let detail = cached;

            if (!detail) {
              const stopResponse = await fetchJson<StopResponse>(
                `${API_BASE_URL}/stop/${routeStop.stop}`
              );

              detail = {
                id: stopResponse.data.stop,
                nameEn: stopResponse.data.name_en,
                nameTc: stopResponse.data.name_tc,
                latitude: stopResponse.data.lat,
                longitude: stopResponse.data.long
              };

              stopCacheRef.current.set(detail.id, detail);
            }

            const etaResponse = await fetchJson<RouteEtaResponse>(
              `${API_BASE_URL}/eta/${COMPANY_CODE}/${routeStop.stop}/${ROUTE_NUMBER}`
            );

            const relevantEtas = etaResponse.data
              .filter((entry) => entry.dir === boundCode && entry.route === ROUTE_NUMBER)
              .sort((a, b) => a.eta_seq - b.eta_seq);

            const etaDetails: EtaDetail[] = relevantEtas.map((entry) => ({
              eta: entry.eta,
              etaSeq: entry.eta_seq,
              remark: entry.rmk_en ?? null,
              destination: entry.dest_en ?? null
            }));

            debugEtaSummary.push({
              stopId: routeStop.stop,
              seq: routeStop.seq,
              etaCount: etaDetails.length,
              etaSeqs: etaDetails.map((item) => item.etaSeq)
            });

            return {
              stopId: routeStop.stop,
              seq: routeStop.seq,
              nameEn: detail?.nameEn ?? `Stop ${routeStop.stop}`,
              nameTc: detail?.nameTc ?? '',
              etas: etaDetails
            };
          })
        );

        if (signal?.cancelled) {
          return;
        }

        setStops(stopsWithEta);
        setLastUpdated(new Date());

        if (isInitialLoad) {
          console.log('[RouteB8] data summary', {
            direction,
            stopCount: stopsWithEta.length,
            etaBreakdown: debugEtaSummary.slice(0, 10)
          });
        } else {
          console.log('[RouteB8] auto-refresh updated buses');
        }
      } catch (loadError) {
        console.error('Failed to load B8 stop and ETA data', loadError);
        if (isInitialLoad && !signal?.cancelled) {
          setError('Unable to load live bus data. Please try again.');
        }
      } finally {
        if (isInitialLoad && !signal?.cancelled) {
          setLoading(false);
        }
      }
    },
    [direction]
  );

  useEffect(() => {
    previousBusStateRef.current.clear();
  }, [direction]);

  useEffect(() => {
    const state = { cancelled: false };

    // Initial load
    console.log('[RouteB8] Initial data load started');
    loadData({ signal: state }).catch(() => {
      // loadData handles its own errors
    });

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      if (!state.cancelled) {
        console.log('[RouteB8] Auto-refresh triggered (every 5s)');
        loadData({ signal: state, isRefresh: true }).catch(() => {
          // loadData handles its own errors
        });
      }
    }, 5000); // 5 seconds

    return () => {
      state.cancelled = true;
      clearInterval(interval);
      console.log('[RouteB8] Cleanup: stopped auto-refresh');
    };
  }, [loadData]);

  const busInsights = useMemo(() => {
    const perBus = new Map<number, Array<{ stopId: string; seq: number; eta: Date }>>();

    stops.forEach((stop) => {
      stop.etas.forEach((etaEntry) => {
        if (!etaEntry.eta) {
          return;
        }
        const etaDate = new Date(etaEntry.eta);
        if (Number.isNaN(etaDate.getTime())) {
          return;
        }

        const timeline = perBus.get(etaEntry.etaSeq) ?? [];
        timeline.push({ stopId: stop.stopId, seq: stop.seq, eta: etaDate });
        perBus.set(etaEntry.etaSeq, timeline);

      });
    });

    const presence = new Map<string, number>();
    let highlightSeq: number | null = null;
    let earliestEta = Number.POSITIVE_INFINITY;

    const now = Date.now();
    const markers: BusMarker[] = [];
    const debugMarkers: Array<BusMarker & { busId: number; timelineLength: number }> = [];
    const seenBusIds = new Set<number>();

    perBus.forEach((timeline, busId) => {
      if (!timeline.length) {
        return;
      }

      timeline.sort((a, b) => a.eta.getTime() - b.eta.getTime());

      let nextPoint = timeline.find((point) => point.eta.getTime() >= now);
      if (!nextPoint) {
        nextPoint = timeline[timeline.length - 1];
      }
      const nextIndex = timeline.indexOf(nextPoint);
      const prevPoint = nextIndex > 0 ? timeline[nextIndex - 1] : null;

      let progress = 0;
      if (prevPoint && prevPoint.eta && nextPoint.eta) {
        // Bus is between two stops
        const total = nextPoint.eta.getTime() - prevPoint.eta.getTime();
        if (total > 0) {
          const elapsed = now - prevPoint.eta.getTime();
          progress = Math.min(1, Math.max(0, elapsed / total));
        }
      } else if (!prevPoint) {
        // Bus hasn't started yet - calculate how far ahead/behind it is
        // We'll use a virtual "departure point" some time before the first stop
        const VIRTUAL_DEPARTURE_MINUTES = 30; // Virtual departure 30 minutes before first stop
        const firstStopEta = nextPoint.eta.getTime();
        const virtualDeparture = firstStopEta - VIRTUAL_DEPARTURE_MINUTES * 60 * 1000;
        const totalTime = firstStopEta - virtualDeparture;
        const elapsedTime = now - virtualDeparture;
        progress = Math.min(1, Math.max(0, elapsedTime / totalTime));
      } else {
        progress = 1;
      }

      const previousState = previousBusStateRef.current.get(busId);
      const smoothResult = smoothBusProgress({
        rawProgress: progress,
        nextStopSeq: nextPoint.seq,
        nextStopId: nextPoint.stopId,
        prevStopSeq: prevPoint?.seq ?? null,
        prevStopId: prevPoint?.stopId ?? null,
        previousState,
        now
      });

      previousBusStateRef.current.set(busId, smoothResult.state);
      seenBusIds.add(busId);

      const assignPrev =
        smoothResult.prevStopSeq != null &&
        smoothResult.prevStopId &&
        smoothResult.progress < BUS_ASSIGN_THRESHOLD;

      const presenceStopSeq = assignPrev ? smoothResult.prevStopSeq! : smoothResult.nextStopSeq;
      const presenceStopId = assignPrev ? smoothResult.prevStopId! : smoothResult.nextStopId;

      presence.set(presenceStopId, (presence.get(presenceStopId) ?? 0) + 1);

      if (!assignPrev && smoothResult.nextStopSeq === nextPoint.seq && smoothResult.nextStopId === nextPoint.stopId) {
        const nextEtaTime = nextPoint.eta.getTime();
        if (nextEtaTime >= now && nextEtaTime < earliestEta) {
          earliestEta = nextEtaTime;
          highlightSeq = nextPoint.seq;
        } else if (highlightSeq == null) {
          highlightSeq = nextPoint.seq;
        }
      } else if (highlightSeq == null) {
        highlightSeq = presenceStopSeq;
      }

      const marker: BusMarker = {
        id: busId,
        nextStopSeq: smoothResult.nextStopSeq,
        nextStopId: smoothResult.nextStopId,
        prevStopSeq: smoothResult.prevStopSeq,
        prevStopId: smoothResult.prevStopId,
        progress: smoothResult.progress
      };

      markers.push(marker);
      debugMarkers.push({ ...marker, busId, timelineLength: timeline.length });
    });

    const stateMap = previousBusStateRef.current;
    const staleBusIds: number[] = [];
    stateMap.forEach((_state, busId) => {
      if (!seenBusIds.has(busId)) {
        staleBusIds.push(busId);
      }
    });
    staleBusIds.forEach((busId) => {
      stateMap.delete(busId);
    });

    if (debugMarkers.length) {
      console.log(
        '[RouteB8] bus markers',
        debugMarkers.map((marker) => ({
          bus: marker.busId,
          nextStopSeq: marker.nextStopSeq,
          prevStopSeq: marker.prevStopSeq,
          progress: Number(marker.progress.toFixed(2)),
          timelineLength: marker.timelineLength
        }))
      );
    } else {
      console.log('[RouteB8] bus markers', []);
    }

    // Debug: Log per-bus timeline with ETAs for all stops
    console.log(
      '[RouteB8] bus timelines',
      Array.from(perBus.entries()).map(([busId, timeline]) => ({
        busId,
        stops: timeline.map((t) => `Seq${t.seq}`),
        firstStopEta: timeline[0] ? new Date(timeline[0].eta).toLocaleTimeString() : 'N/A'
      }))
    );

    // Detailed timeline with all ETAs for each bus
    console.log(
      '[RouteB8] detailed bus timelines with ETAs',
      Array.from(perBus.entries()).map(([busId, timeline]) => ({
        busId: `Bus ${busId}`,
        etas: timeline.map((t) => ({
          stopSeq: t.seq,
          eta: new Date(t.eta).toLocaleTimeString(),
          minutesFromNow: Math.round((t.eta.getTime() - now) / 60000)
        }))
      }))
    );

    // All stops with bus ETAs in chronological order
    const allStopsMap = new Map<number, Array<{ busId: number; eta: Date }>>();
    stops.forEach((stop) => {
      stop.etas.forEach((etaEntry) => {
        if (etaEntry.eta) {
          const key = stop.seq;
          if (!allStopsMap.has(key)) {
            allStopsMap.set(key, []);
          }
          allStopsMap.get(key)?.push({
            busId: etaEntry.etaSeq,
            eta: new Date(etaEntry.eta)
          });
        }
      });
    });

    console.log(
      '[RouteB8] all stops with bus arrivals',
      Array.from(allStopsMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([seq, etas]) => ({
          stopSeq: seq,
          buses: etas
            .sort((a, b) => a.busId - b.busId)
            .map((e) => ({
              busId: e.busId,
              eta: e.eta.toLocaleTimeString(),
              minutesFromNow: Math.round((e.eta.getTime() - now) / 60000)
            }))
        }))
    );

    // Detailed debug for pre-start buses
    const detailedDebug = markers
      .filter((m) => m.prevStopSeq === null)
      .map((marker) => {
        const busTimeline = Array.from(perBus.entries()).find(([id]) => id === marker.id)?.[1];
        const firstStopEta = busTimeline?.[0]?.eta ? new Date(busTimeline[0].eta).getTime() : 0;
        const virtualDeparture = firstStopEta - 30 * 60 * 1000;
        const now_debug = Date.now();
        return {
          bus: marker.id,
          now: new Date(now_debug).toLocaleTimeString(),
          virtualDeparture: new Date(virtualDeparture).toLocaleTimeString(),
          firstStopEta: new Date(firstStopEta).toLocaleTimeString(),
          minutesUntilFirstStop: Math.round((firstStopEta - now_debug) / 60000),
          progress: Number(marker.progress.toFixed(2))
        };
      });
    console.log('[RouteB8] pre-start bus details', detailedDebug);

    return {
      total: markers.length,
      presence,
      highlightSeq,
      markers
    };
  }, [stops]);

  const timelineStops = useMemo<TimelineStop[]>(() => {
    return stops.map((stop) => {
      const primaryEta = stop.etas.find((entry) => entry.eta);
      const primaryEtaDate = primaryEta ? new Date(primaryEta.eta as string) : null;
      const busesAtNextStop = busInsights.presence.get(stop.stopId) ?? 0;
      return {
        stopId: stop.stopId,
        seq: stop.seq,
        nameEn: stop.nameEn,
        nameTc: stop.nameTc,
        busCount: busesAtNextStop,
        primaryEtaLabel: primaryEtaDate ? formatTime(primaryEtaDate) : 'No live data',
        primaryEtaDate,
        etas: stop.etas
      };
    });
  }, [stops, busInsights]);

  const handleRefresh = useCallback(() => {
    loadData().catch(() => {
      // loadData handles its own errors
    });
  }, [loadData]);

  const handleDirectionChange = useCallback((next: RouteDirection) => {
    setDirection(next);
  }, []);

  const currentDirectionLabel = directionMeta?.[direction];
  const selectedStop = useMemo(() => {
    if (!timelineStops.length) {
      return null;
    }
    if (busInsights.highlightSeq != null) {
      const match = timelineStops.find((stop) => stop.seq === busInsights.highlightSeq);
      if (match) {
        return match;
      }
    }
    return timelineStops[0];
  }, [timelineStops, busInsights.highlightSeq]);

  const selectedStopBusCount = selectedStop
    ? busInsights.presence.get(selectedStop.stopId) ?? 0
    : 0;

  return (
    <ScrollView
      backgroundColor="$background"
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 64 }}
    >
      <YStack gap="$4">
        <XStack alignItems="center" justifyContent="space-between">
          <IconButton icon={ArrowLeft} label="Go back" onPress={() => navigation.goBack()} />
          <IconButton
            icon={RefreshCw}
            label="Refresh data"
            onPress={handleRefresh}
            disabled={loading}
          />
        </XStack>

        <Card
          padding="$4"
          backgroundColor="$surface"
          borderRadius={28}
          borderWidth={1}
          borderColor="$borderColor"
          shadowColor="rgba(15, 23, 42, 0.06)"
          shadowOpacity={1}
          shadowRadius={14}
          shadowOffset={{ width: 0, height: 8 }}
          gap="$4"
        >
          <HeaderCard
            routeNumber={ROUTE_NUMBER}
            metaLabel={
              currentDirectionLabel
                ? `${currentDirectionLabel.origin} → ${currentDirectionLabel.destination}`
                : 'Live tracking'
            }
          />

          <TabList
            value={activeView}
            options={TOP_TAB_OPTIONS}
            onValueChange={setActiveView}
            fit="fill"
            mode="icon"
          />

          <RouteTimelineCard
            direction={direction}
            onDirectionChange={handleDirectionChange}
            timelineStops={timelineStops}
            busInsights={busInsights}
            loading={loading}
            error={error}
            lastUpdated={lastUpdated}
            onRefresh={handleRefresh}
          />
        </Card>

        {selectedStop ? (
          <StopDetailsCard stop={selectedStop} busesHere={selectedStopBusCount} />
        ) : null}

        <FooterNote lastUpdated={lastUpdated} />
      </YStack>
    </ScrollView>
  );
};

export default RouteB8Screen;

type TimelineStop = {
  stopId: string;
  seq: number;
  nameEn: string;
  nameTc: string;
  busCount: number;
  primaryEtaLabel: string;
  primaryEtaDate: Date | null;
  etas: EtaDetail[];
};

type IconButtonProps = {
  icon: IconComponent;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  tone?: 'default' | 'inverse';
};

const IconButton = ({ icon: Icon, label, onPress, disabled, tone = 'default' }: IconButtonProps) => {
  const backgroundColor = tone === 'inverse' ? 'rgba(255, 255, 255, 0.12)' : 'transparent';
  const hoverBackground = tone === 'inverse' ? 'rgba(255, 255, 255, 0.18)' : '$surfaceHover';
  const pressBackground = tone === 'inverse' ? 'rgba(255, 255, 255, 0.24)' : '$surfacePress';
  const iconColor = tone === 'inverse' ? '$colorInverse' : '$color';

  return (
    <Button
      accessibilityLabel={label}
      size="$sm"
      variant="ghost"
      borderRadius="$lg"
      backgroundColor={backgroundColor}
      color={iconColor}
      minHeight={40}
      paddingHorizontal="$2"
      hoverStyle={{ backgroundColor: hoverBackground }}
      pressStyle={{ backgroundColor: pressBackground }}
      onPress={onPress}
      disabled={disabled}
    >
      <Icon size={20} color={iconColor} />
    </Button>
  );
};

const Badge = ({ label, tone = 'default' }: { label: string; tone?: 'default' | 'inverse' }) => {
  const backgroundColor = tone === 'inverse' ? 'rgba(255, 255, 255, 0.16)' : '$surfaceHover';
  const textColor = tone === 'inverse' ? '$colorInverse' : '$color';
  const minHeight = 24;

  return (
    <XStack
      backgroundColor={backgroundColor}
      borderRadius={999}
      paddingHorizontal="$3"
      paddingVertical="$1"
      minHeight={minHeight}
      alignItems="center"
      justifyContent="center"
    >
      <SizableText size="$xs" lineHeight={16} fontWeight="600" color={textColor}>
        {label}
      </SizableText>
    </XStack>
  );
};

const HeaderCard = ({ routeNumber, metaLabel }: { routeNumber: string; metaLabel: string }) => (
  <XStack alignItems="center" justifyContent="space-between" gap="$3">
    <XStack alignItems="center" gap="$3" flex={1}>
      <Stack
        width={52}
        height={52}
        borderRadius={16}
        theme="dark"
        backgroundColor="$background"
        alignItems="center"
        justifyContent="center"
      >
        <BusFront size={26} color="$color" />
      </Stack>
      <YStack gap="$1" flex={1}>
        <XStack alignItems="center" gap="$2" flexWrap="wrap">
          <SizableText size="$md" lineHeight={24} fontWeight="700" color="$color">
            Route {routeNumber}
          </SizableText>
          <Badge label="Express" />
        </XStack>
        <Body tone="muted" size="$xs" lineHeight={16}>
          {metaLabel}
        </Body>
      </YStack>
    </XStack>
    <IconButton icon={MoreHorizontal} label="More options" disabled />
  </XStack>
);

// IconTabList component removed in favor of shared TabList from UI kit

type RouteTimelineCardProps = {
  direction: RouteDirection;
  onDirectionChange: (direction: RouteDirection) => void;
  timelineStops: TimelineStop[];
  busInsights: {
    total: number;
    presence: Map<string, number>;
    highlightSeq: number | null;
    markers: BusMarker[];
  };
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  onRefresh: () => void;
};

const RouteTimelineCard = ({
  direction,
  onDirectionChange,
  timelineStops,
  busInsights,
  loading,
  error,
  lastUpdated,
  onRefresh
}: RouteTimelineCardProps) => {
  const busLabel = `${busInsights.total} ${busInsights.total === 1 ? 'bus' : 'buses'}`;
  const lastUpdatedLabel = lastUpdated
    ? `Last updated at ${formatTime(lastUpdated)}`
    : 'Fetching latest estimates…';

  let content: JSX.Element = <></>;

  if (loading) {
    content = (
      <YStack paddingVertical="$5" alignItems="center" gap="$3">
        <ActivityIndicator size="large" />
        <Body tone="muted">Loading stops and arrival times…</Body>
      </YStack>
    );
  } else if (error) {
    content = (
      <YStack backgroundColor="$surfaceHover" borderRadius="$md" padding="$4" gap="$3">
        <XStack alignItems="center" gap="$2">
          <AlertTriangle size={20} color="$danger" />
          <Body>{error}</Body>
        </XStack>
        <Button variant="secondary" onPress={onRefresh} accessibilityLabel="Retry loading">
          Try again
        </Button>
      </YStack>
    );
  } else if (!timelineStops.length) {
    content = (
      <Body tone="muted">
        No live stop information is available at the moment. Pull to refresh or try again
        shortly.
      </Body>
    );
  } else {
    content = (
      <Timeline
        stops={timelineStops}
        highlightSeq={busInsights.highlightSeq}
        busMarkers={busInsights.markers}
      />
    );
  }

  return (
    <Card
      padding="$4"
      gap="$4"
      backgroundColor="$background"
      borderRadius={24}
      borderColor="$borderColor"
      shadowColor="transparent"
      shadowOpacity={0}
    >
      <YStack gap="$1">
        <SizableText size="$sm" lineHeight={20} fontWeight="600">
          Route map
        </SizableText>
        <Body tone="muted" size="$xs" lineHeight={16}>
          Live tracking
        </Body>
      </YStack>

      <TabList
        value={direction}
        options={[
          { value: 'inbound', label: 'Inbound' },
          { value: 'outbound', label: 'Outbound' }
        ]}
        onValueChange={onDirectionChange}
        size="sm"
        fit="fill"
        mode="text"
        deferChange
      />

      <XStack alignItems="center" justifyContent="space-between">
        <Body tone="muted" size="$xs" lineHeight={16}>
          {lastUpdatedLabel}
        </Body>
        <Badge label={busLabel} />
      </XStack>

      <Separator backgroundColor="$borderColor" />

      {content}
    </Card>
  );
};

type TimelineProps = {
  stops: TimelineStop[];
  highlightSeq: number | null;
  busMarkers: BusMarker[];
};

type StopExpandedDetails = {
  arrivals: Array<{
    etaSeq: number;
    etaLabel: string;
    countdownLabel: string;
    remark: string | null;
    hasLiveEta: boolean;
    destination: string | null;
  }>;
  generatedAt: Date;
};

const buildStopDetails = (stop: TimelineStop): StopExpandedDetails => {
  const now = Date.now();

  const arrivals = stop.etas
    .map((entry) => {
      if (!entry.eta) {
        return {
          etaSeq: entry.etaSeq,
          etaLabel: 'No live ETA',
          countdownLabel: entry.remark ? entry.remark : 'Awaiting update',
          remark: entry.remark ?? null,
          hasLiveEta: false,
          destination: entry.destination ?? null,
          sortKey: Number.POSITIVE_INFINITY
        };
      }

      const etaDate = new Date(entry.eta);
      const diffMinutes = Math.max(0, Math.round((etaDate.getTime() - now) / 60000));
      const countdownLabel = diffMinutes === 0 ? 'Arriving' : `${diffMinutes} min`;

      return {
        etaSeq: entry.etaSeq,
        etaLabel: formatTime(etaDate),
        countdownLabel,
        remark: entry.remark ?? null,
        hasLiveEta: true,
        destination: entry.destination ?? null,
        sortKey: etaDate.getTime()
      };
    })
    .sort((a, b) => {
      if (a.sortKey === b.sortKey) {
        return a.etaSeq - b.etaSeq;
      }
      return a.sortKey - b.sortKey;
    })
    .map(({ sortKey: _sortKey, ...rest }) => rest);

  return {
    arrivals,
    generatedAt: new Date(now)
  };
};

const Timeline = ({ stops, highlightSeq, busMarkers }: TimelineProps) => {
  const [stopCenters, setStopCenters] = useState<Record<string, number>>({});
  const [expandedStopId, setExpandedStopId] = useState<string | null>(null);
  const stopsSignature = useMemo(() => stops.map((stop) => stop.stopId).join('|'), [stops]);

  useEffect(() => {
    setStopCenters({});
    setExpandedStopId(null);
  }, [stopsSignature]);

  const handleStopLayout = useCallback((stopId: string, layout: LayoutRectangle) => {
    const center = layout.y + layout.height / 2;
    setStopCenters((prev) => {
      if (Math.abs((prev[stopId] ?? Number.NaN) - center) < 0.5) {
        return prev;
      }
      return { ...prev, [stopId]: center };
    });
  }, []);

  const handleToggle = useCallback((stopId: string) => {
    setExpandedStopId((current) => (current === stopId ? null : stopId));
  }, []);

  return (
    <Stack position="relative" paddingLeft={TIMELINE_CONTENT_OFFSET}>
      <Stack
        position="absolute"
        left={TIMELINE_LINE_X}
        top={0}
        bottom={0}
        width={1}
        backgroundColor="$borderColor"
      />
      <BusMarkersOverlay markers={busMarkers} stops={stops} stopCenters={stopCenters} />
      <YStack>
        {stops.map((stop, index) => {
          const busLabel = stop.busCount
            ? `${stop.busCount} ${stop.busCount === 1 ? 'bus' : 'buses'}`
            : null;
          const status =
            highlightSeq == null
              ? 'upcoming'
              : stop.seq < highlightSeq
                ? 'completed'
                : stop.seq === highlightSeq
                  ? 'active'
                  : 'upcoming';
          return (
            <StopTimelineItem
              key={stop.stopId}
              stop={stop}
              status={status}
              busLabel={busLabel}
              isLast={index === stops.length - 1}
              onMeasure={handleStopLayout}
              isExpanded={expandedStopId === stop.stopId}
              onToggle={() => handleToggle(stop.stopId)}
              details={buildStopDetails(stop)}
            />
          );
        })}
      </YStack>
    </Stack>
  );
};

type StopTimelineItemProps = {
  stop: TimelineStop;
  status: 'completed' | 'active' | 'upcoming';
  busLabel: string | null;
  isLast: boolean;
  onMeasure: (stopId: string, layout: LayoutRectangle) => void;
  isExpanded: boolean;
  onToggle: () => void;
  details: StopExpandedDetails;
};

const StopTimelineItem = ({
  stop,
  status,
  busLabel,
  isLast,
  onMeasure,
  isExpanded,
  onToggle,
  details
}: StopTimelineItemProps) => {
  const isHighlighted = status === 'active';
  const isSelected = isExpanded || isHighlighted;

  const markerBackground = isSelected ? '$primary' : '$surface';
  const markerBorder = isSelected ? '$primary' : '$borderColor';
  const markerIconColor = isSelected ? '$colorInverse' : '$color';

  const trailingSpacing = isLast ? 0 : isExpanded ? STOP_VERTICAL_GAP / 2 : STOP_VERTICAL_GAP;

  return (
    <YStack marginBottom={trailingSpacing}>
      <Pressable onPress={onToggle}>
        {({ pressed }) => (
          <XStack
            alignItems="center"
            gap="$3"
            paddingVertical={isExpanded ? 4 : 14}
            paddingRight="$3"
            borderRadius={24}
            // backgroundColor={pressed ? '$surfaceHover' : '$surface'}
            // borderWidth={isSelected ? 2 : 1}
            borderColor={isSelected ? '$primary' : '$borderColor'}
            onLayout={(event) => onMeasure(stop.stopId, event.nativeEvent.layout)}
          >
            <Stack width={TIMELINE_CONTENT_OFFSET} alignItems="flex-start" justifyContent="center">
              <Stack
                width={STOP_ICON_SIZE}
                height={STOP_ICON_SIZE}
                borderRadius={STOP_ICON_SIZE / 2}
                backgroundColor={markerBackground}
                borderWidth={isSelected ? 0 : 1.5}
                borderColor={markerBorder}
                marginLeft={TIMELINE_LINE_X - STOP_ICON_SIZE / 2}
                alignItems="center"
                justifyContent="center"
              >
                <MapPin size={22} color={markerIconColor} />
              </Stack>
            </Stack>

            <YStack gap="$0.5" flex={1}>
              <SizableText size="$sm" lineHeight={21} fontWeight="600" color="$color">
                {stop.nameEn}
              </SizableText>
              <Body tone="muted" size="$xs" lineHeight={18}>
                {stop.primaryEtaLabel}
              </Body>
            </YStack>

            <XStack alignItems="center" gap="$2">
              {busLabel ? <Badge label={busLabel} /> : null}
            </XStack>
          </XStack>
        )}
      </Pressable>

      {isExpanded ? (
        <YStack
          marginLeft={20}
          borderLeftColor={'$borderColor'}
          borderLeftWidth={1}
          marginTop={-4}
          paddingLeft={12}
          paddingTop={0}
          paddingBottom={0}
          gap={2}
        >
          <SizableText size="$xs" fontWeight="600" color="$colorMuted">
            Arriving buses
          </SizableText>
          {details.arrivals.length ? (
            <YStack gap={"$2"}>
              {details.arrivals.map((arrival, index) => (
                <XStack
                  key={`${stop.stopId}-arrival-${arrival.etaSeq}`}
                  alignItems="center"
                  justifyContent="space-between"
                  height={14}
                  marginTop={index === 0 ? 0 : 0}
                >
                  <XStack gap="$1" alignItems="center">
                    <Stack
                      width={24}
                      height={16}
                      borderRadius={8}
                      backgroundColor="$primary"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <SizableText size="$xs" lineHeight={14} fontWeight="600" color="$colorInverse">
                        {ROUTE_NUMBER}
                      </SizableText>
                    </Stack>
                    <SizableText size="$xs" lineHeight={12} fontWeight="500" color="$colorMuted">
                      {arrival.destination ? `To ${arrival.destination}` : `Bus ${arrival.etaSeq}`}
                    </SizableText>
                  </XStack>
                  <SizableText size="$xs" fontWeight="700" color={arrival.hasLiveEta ? '$success' : '$colorMuted'}>
                    {arrival.countdownLabel}
                  </SizableText>
                </XStack>
              ))}
            </YStack>
          ) : (
            <Body tone="muted" size="$xs" lineHeight={18}>
              No live buses are currently reported for this stop. Please check again shortly.
            </Body>
          )}
        </YStack>
      ) : null}
    </YStack>
  );
};

const BusMarkersOverlay = ({
  markers,
  stops,
  stopCenters
}: {
  markers: BusMarker[];
  stops: TimelineStop[];
  stopCenters: Record<string, number>;
}) => {
  if (!markers.length || !stops.length) {
    return null;
  }

  const seqIndex = new Map<number, number>();
  stops.forEach((stop, index) => {
    seqIndex.set(stop.seq, index);
  });

  const placements = markers
    .map((marker) => {
      const nextIndex = seqIndex.get(marker.nextStopSeq);
      if (nextIndex == null) {
        return null;
      }

      const nextStop = stops[nextIndex];
      const nextCenter = stopCenters[nextStop.stopId];
      if (typeof nextCenter !== 'number') {
        return null;
      }

      let prevCenter = nextCenter;
      if (marker.prevStopSeq != null) {
        const prevIndex = seqIndex.get(marker.prevStopSeq);
        if (prevIndex != null) {
          const prevStop = stops[prevIndex];
          const measured = stopCenters[prevStop.stopId];
          if (typeof measured === 'number') {
            prevCenter = measured;
          }
        }
        if (prevCenter === nextCenter) {
          prevCenter = nextCenter - (STOP_ICON_SIZE + STOP_VERTICAL_GAP);
        }
      }

      const clampedProgress = Number.isFinite(marker.progress)
        ? Math.min(1, Math.max(0, marker.progress))
        : 0;

      const delta = nextCenter - prevCenter;
      const center = prevCenter + (delta !== 0 ? delta * clampedProgress : 0);
      const top = center - BUS_MARKER_SIZE / 2;

      return {
        key: `bus-marker-${marker.id}`,
        top,
        marker
      };
    })
    .filter(Boolean) as Array<{ key: string; top: number; marker: BusMarker }>;

  if (!placements.length) {
    return null;
  }

  // Sort by position
  placements.sort((a, b) => a.top - b.top);

  // No clustering - show each bus at its exact calculated position
  const baseLeft = TIMELINE_LINE_X - BUS_MARKER_SIZE / 2;

  return (
    <Stack
      position="absolute"
      left={0}
      right={0}
      top={0}
      bottom={0}
      pointerEvents="none"
      zIndex={10}
    >
      {placements.map((placement) => (
        <Stack
          key={placement.key}
          position="absolute"
          left={baseLeft}
          top={placement.top}
          width={BUS_MARKER_PULSE_SIZE}
          height={BUS_MARKER_PULSE_SIZE}
          alignItems="center"
          justifyContent="center"
        >
          <AnimatedPulseCircle size={BUS_MARKER_PULSE_SIZE} />
          <Stack
            width={BUS_MARKER_SIZE}
            height={BUS_MARKER_SIZE}
            borderRadius={BUS_MARKER_SIZE / 2}
            backgroundColor="$primary"
            alignItems="center"
            justifyContent="center"
            borderWidth={2}
            borderColor="$borderColor"
          >
            <BusFront size={18} color="$colorInverse" />
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
};

const AnimatedPulseCircle = ({ size }: { size: number }) => {
  const theme = useTheme();
  const pulseBg = getVariableValue(theme.surfacePress) as string;
  const scale = useRef(new Animated.Value(0.75)).current;
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 1400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
          })
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 0.75,
            duration: 0,
            useNativeDriver: true
          }),
          Animated.timing(opacity, {
            toValue: 0.35,
            duration: 0,
            useNativeDriver: true
          })
        ])
      ])
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [scale, opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: pulseBg,
        transform: [{ scale }],
        opacity
      }}
    />
  );
};

type StopDetailsCardProps = {
  stop: TimelineStop;
  busesHere: number;
};

const StopDetailsCard = ({ stop, busesHere }: StopDetailsCardProps) => (
  <Card padding={0} gap={0} overflow="hidden" borderColor="$borderColor" shadowColor="transparent">
    <YStack theme="dark" backgroundColor="$background" padding="$4" gap="$3">
      <XStack alignItems="flex-start" justifyContent="space-between" gap="$3">
        <XStack gap="$3" flex={1}>
          <Stack
            width={40}
            height={40}
            borderRadius={12}
            backgroundColor="rgba(255, 255, 255, 0.12)"
            alignItems="center"
            justifyContent="center"
          >
            <MapPin size={20} color="$color" />
          </Stack>
          <YStack gap="$1" flex={1}>
            <Badge tone="inverse" label={`Stop #${stop.seq}`} />
            <SizableText size="$md" lineHeight={24} fontWeight="600" color="$color">
              {stop.nameEn}
            </SizableText>
            <XStack gap="$2" alignItems="center">
              <Clock size={14} color="$color" />
              <Body tone="inverse" size="$xs" lineHeight={16}>
                Scheduled: {stop.primaryEtaLabel}
              </Body>
            </XStack>
          </YStack>
        </XStack>
        <IconButton icon={ChevronRight} label="View stop details" tone="inverse" disabled />
      </XStack>
      {busesHere > 0 ? (
        <Badge tone="inverse" label={`${busesHere} ${busesHere === 1 ? 'bus nearby' : 'buses nearby'}`} />
      ) : null}
    </YStack>
    <YStack padding="$4" gap="$3">
      <Separator backgroundColor="$borderColor" />
      <SizableText size="$sm" lineHeight={20} fontWeight="600">
        Amenities
      </SizableText>
      <XStack gap="$2" flexWrap="wrap">
        {AMENITIES.map((amenity) => (
          <AmenityChip key={amenity.label} icon={amenity.icon} label={amenity.label} />
        ))}
      </XStack>
    </YStack>
  </Card>
);

const AmenityChip = ({ icon: Icon, label }: { icon: IconComponent; label: string }) => (
  <XStack
    gap="$2"
    alignItems="center"
    paddingHorizontal="$3"
    paddingVertical="$1.5"
    backgroundColor="$surfaceHover"
    borderRadius="$md"
    borderWidth={1}
    borderColor="$borderColor"
  >
    <Icon size={16} color="$color" />
    <SizableText size="$xs" lineHeight={16} fontWeight="600" color="$color">
      {label}
    </SizableText>
  </XStack>
);

const FooterNote = ({ lastUpdated }: { lastUpdated: Date | null }) => (
  <Body tone="muted" textAlign="center" size="$xs" lineHeight={16}>
    {lastUpdated
      ? `Last updated: ${lastUpdated.toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit'
        })}`
      : 'Live tracking updates regularly'}
  </Body>
);
