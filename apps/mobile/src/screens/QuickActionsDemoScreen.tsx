import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { Animated, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Accessibility,
  Bell,
  Map as MapIcon,
  RefreshCw,
  Settings,
  X,
  MoreHorizontal
} from '@tamagui/lucide-icons';
import { SizableText, Stack, getVariableValue, useTheme } from 'tamagui';
import { green } from 'react-native-reanimated/lib/typescript/Colors';

const FAB_SIZE = 68;
// Slimmer pills (height) to avoid overlap
const ACTION_BUTTON_DIAMETER = 40;
const ACTION_BUTTON_MIN_WIDTH = 120;
const MIN_EXPANDED_SIZE = 200;
const CIRCLE_OFFSET_RATIO = 0.22;
const FAB_HORIZONTAL_INSET = 52;
const FAB_VERTICAL_LIFT = 57;
const ACTION_PILL_MARGIN = 24;
// Limit how far from the FAB the action pills can travel (in px beyond the minimum safe radius).
const MAX_ACTION_EXTRA_DISTANCE = 110;
const ACTION_POSITION_OVERRIDES: Record<
  string,
  {
    angleDelta?: number;
    radiusDelta?: number;
    translateX?: number;
    translateY?: number;
    rotationDelta?: number;
  }
> = {
  // action 1 (map): nudge down
  // settings: { translateY: 220 , translateX: 140},
  // // action 2 (settings): nudge right
  // map: { translateY: 180, translateX: 200 }
};
// Optional rotation fine-tune if the visual feels a hair off.
const ROTATION_TWEAK = 0; // radians; try small values like +/-0.08 if needed

type IconComponent = ComponentType<{ size?: number; color?: string }>;

type QuickAction = {
  key: string;
  label: string;
  icon: IconComponent;
};

const ACTIONS: QuickAction[] = [
  { key: 'map', label: 'Route map', icon: MapIcon },
  { key: 'alerts', label: 'Alerts', icon: Bell },
  { key: 'accessibility', label: 'Accessibility', icon: Accessibility },
  { key: 'refresh', label: 'Refresh', icon: RefreshCw },
  { key: 'settings', label: 'Settings', icon: Settings }
];

const QuickActionsDemoScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [expanded, setExpanded] = useState(false);
  // Track measured widths per action so we can keep each pill tucked inside the circle arc.
  const [buttonWidths, setButtonWidths] = useState<Record<string, number>>({});
  const progress = useRef(new Animated.Value(0)).current;

  const palette = useMemo(() => {
    const surface = (theme.surface && (getVariableValue(theme.surface) as string)) || '#0f172a';
    const surfaceHover =
      (theme.surfaceHover && (getVariableValue(theme.surfaceHover) as string)) || '#1f2937';
    const surfacePress =
      (theme.surfacePress && (getVariableValue(theme.surfacePress) as string)) || '#182533';
    const accent = (theme.primary && (getVariableValue(theme.primary) as string)) || '#2563eb';
    const accentPress =
      (theme.primaryPress && (getVariableValue(theme.primaryPress) as string)) || '#1d4ed8';
    const inverseColor =
      (theme.colorInverse && (getVariableValue(theme.colorInverse) as string)) || '#ffffff';
    const textColor = (theme.color && (getVariableValue(theme.color) as string)) || '#0f172a';

    return {
      surface,
      surfaceHover,
      surfacePress,
      accent,
      accentPress,
      inverseColor,
      textColor
    };
  }, [theme]);

  // Make the visible quarter-circle cover roughly half of the screen area.
  const expandedSize = useMemo(() => {
    const targetDiameter = 2 * Math.sqrt((2 * width * height) / Math.PI);
    return 700;
  }, [height, width]);

  const expandedRadius = expandedSize / 2;
  const fabRadius = FAB_SIZE / 2;
  const circleTranslateY = expandedRadius * (0.48 - CIRCLE_OFFSET_RATIO);

  const minActionDistance = useMemo(
    () => fabRadius + ACTION_BUTTON_DIAMETER / 2 + 12,
    [fabRadius]
  );

  const actionDistance = useMemo(() => {
    const marginInside = ACTION_PILL_MARGIN;
    const outerRing = expandedRadius - ACTION_BUTTON_DIAMETER / 2 - marginInside;
    // Clamp the target distance so pills don't fly too far from the FAB.
    const hardMax = minActionDistance + MAX_ACTION_EXTRA_DISTANCE;
    const clamped = Math.min(outerRing, hardMax);
    return Math.max(minActionDistance, clamped);
  }, [expandedRadius, minActionDistance]);

  const arcAngles = useMemo(() => {
    switch (ACTIONS.length) {
      // case 1:
      //   return [Math.PI * 1.30];
      // case 2:
      //   return [Math.PI * 1.18, Math.PI * 1.42];
      // case 3:
      //   return [Math.PI * 1.12, Math.PI * 1.30, Math.PI * 1.48];
      // case 4:
      //   return [Math.PI * 1.08, Math.PI * 1.24, Math.PI * 1.42, Math.PI * 1.58];
      default: {
        const startAngle = Math.PI * 1.08;
        const endAngle = Math.PI * 1.58;
        return ACTIONS.map((_action, index) => {
          const fraction = index / (ACTIONS.length - 1);
          return startAngle + fraction * (endAngle - startAngle);
        });
      }
    }
  }, [ACTIONS.length]);

  const toggleMenu = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setExpanded(false);
  }, []);

  const handleActionPress = useCallback(
    (_action: QuickAction) => {
      closeMenu();
    },
    [closeMenu]
  );

  useEffect(() => {
    Animated.spring(progress, {
      toValue: expanded ? 1 : 0,
      damping: 16,
      stiffness: 260,
      mass: 0.9,
      useNativeDriver: true
    }).start();
  }, [expanded, progress]);

  const circleScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [FAB_SIZE / expandedSize, 1]
  });
  const menuOpacity = progress.interpolate({
    inputRange: [0, 0.1, 1],
    outputRange: [0, 0.25, 0.4]
  });
  const actionScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1]
  });

  const bottomOffset = Math.max(insets.bottom, 28);

  return (
    <Stack flex={1} backgroundColor="#0b1a2f">
      {expanded ? (
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel="Close quick actions overlay"
          onPress={closeMenu}
        />
      ) : null}

      <Stack
        pointerEvents="box-none"
        position="absolute"
        right={FAB_HORIZONTAL_INSET}
        width={expandedSize}
        height={expandedSize}
        bottom={bottomOffset + FAB_VERTICAL_LIFT}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.expandedCircle,
            {
              backgroundColor: palette.surfaceHover,
              width: expandedSize,
              height: expandedSize,
              borderRadius: expandedRadius,
              opacity: menuOpacity,
              transform: [{ translateY: circleTranslateY }, { scale: circleScale }],
              bottom: -(expandedSize - FAB_SIZE) / 2 + 60,
              right: -(expandedSize - FAB_SIZE) / 2
            }
          ]}
        />

        {ACTIONS.map((action, index) => {
          const overrides = ACTION_POSITION_OVERRIDES[action.key] || {};
          const angle = (arcAngles[index] ?? 0) + (overrides.angleDelta ?? 0);
          const radialDistance = Math.max(
            minActionDistance,
            actionDistance + (overrides.radiusDelta ?? 0)
          );
          const targetTranslateX =
            Math.cos(angle) * radialDistance + (overrides.translateX ?? 0);
          const targetTranslateY =
            Math.sin(angle) * radialDistance + (overrides.translateY ?? 0);

          const translateX = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, targetTranslateX]
          });
          const translateY = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, targetTranslateY]
          });

          const rotation = angle + Math.PI + ROTATION_TWEAK + (overrides.rotationDelta ?? 0);
          const measured = buttonWidths[action.key];
          const halfW = measured ? measured / 2 : ACTION_BUTTON_MIN_WIDTH / 2;
          const shift = Math.max(0, halfW + fabRadius + 2 - radialDistance);

          return (
            <Animated.View
              key={action.key}
              pointerEvents={expanded ? 'auto' : 'none'}
              style={[
                styles.actionWrapper,
                {
                  bottom: FAB_SIZE / 2 - ACTION_BUTTON_DIAMETER / 2,
                  right: (FAB_SIZE / 2 - ACTION_BUTTON_DIAMETER / 2) - 55,
                  transform: [
                    { translateX },
                    { translateY },
                    { scale: actionScale }
                  ],
                  opacity: menuOpacity
                }
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={action.label}
                testID={`quick-action-${action.key}`}
                onPress={() => handleActionPress(action)}
                onLayout={(e) => {
                  const w = e.nativeEvent.layout.width;
                  setButtonWidths((prev) =>
                    prev[action.key] === w ? prev : { ...prev, [action.key]: w }
                  );
                }}
                style={({ pressed }) => [
                  styles.actionButtonContainer,
                  {
                    backgroundColor: pressed ? palette.surfacePress : palette.surfaceHover,
                    transform: [
                      { rotate: `${rotation}rad` },
                      { translateX: -shift }
                    ]
                  }
                ]}
              >
                <Animated.View style={styles.actionButtonContent}>

                  <Stack flexDirection="row" alignItems="center" style={styles.actionButtonMain}>
                    <action.icon size={14} color={palette.accent} />
                    <SizableText
                      size="$xs"
                      fontWeight="600"
                      color={palette.textColor}
                      style={styles.actionLabel}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {action.label}
                    </SizableText>
                  </Stack>
                </Animated.View>
              </Pressable>
            </Animated.View>
          );
        })}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Collapse quick actions menu' : 'Expand quick actions menu'}
          testID="quick-actions-fab"
          onPress={toggleMenu}
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: pressed ? palette.accentPress : palette.accent }
          ]}
        >
          {expanded ? (
            <X size={30} color={palette.inverseColor} />
          ) : (
            <MoreHorizontal size={30} color={palette.inverseColor} />
          )}
        </Pressable>
      </Stack>
    </Stack>
  );
};

const styles = StyleSheet.create({
  expandedCircle: {
    position: 'absolute'
  },
  actionWrapper: {
    position: 'absolute'
  },
  actionButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 6,
    paddingRight: 10,
    paddingVertical: 2,
    minHeight: ACTION_BUTTON_DIAMETER,
    minWidth: ACTION_BUTTON_MIN_WIDTH,
    maxWidth: 150,
    borderRadius: ACTION_BUTTON_DIAMETER / 2,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginLeft: 7,

    width: '100%'
    
  },
  actionLabel: {
    flexShrink: 1,
    marginLeft: 7,
    textAlign: 'left',
    lineHeight: ACTION_BUTTON_DIAMETER - 4,

    // Let the text naturally size vertically; parent centers it.
    minWidth: 0
  },
  actionButtonMain: {
    flexShrink: 1,
    marginLeft: 0,
    height: ACTION_BUTTON_DIAMETER,
    alignItems: 'center'
  },
  actionArrowContainer: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'transparent',
    marginRight: 6
  },
  fab: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 9
  }
});

export default QuickActionsDemoScreen;
