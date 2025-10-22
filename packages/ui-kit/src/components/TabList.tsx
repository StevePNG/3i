import React, { type ComponentType, useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { XStack, Stack, SizableText, getVariableValue, useTheme } from 'tamagui';
import { Button } from './Button';

// Lightweight, tokenized segmented control for tabs with optional icons.
// Uses Tamagui theme tokens so it adapts to light/dark automatically.

export type IconComponent = ComponentType<{ size?: number; color?: string }>;

export type TabOption<T extends string> = {
  value: T;
  icon?: IconComponent;
  label?: string;
  disabled?: boolean;
};

export type TabListProps<T extends string> = {
  value: T;
  options: Array<TabOption<T>>;
  onValueChange: (value: T) => void;
  size?: 'sm' | 'md';
  fit?: 'content' | 'fill';
  maxItemWidth?: number;
  mode?: 'icon' | 'text';
  deferChange?: boolean;
  backgroundToken?: string;
};

const sizeTokens = {
  // Slightly tighter radii to match Figma segmented control
  sm: {
    height: 32,
    radius: 10,
    icon: 14,
    padIcon: 8,
    padText: 12,
    fontSize: '$xs' as const,
    wrap: 4,
    containerRadius: 16
  },
  md: {
    height: 40,
    radius: 12,
    icon: 18,
    padIcon: 12,
    padText: 16,
    fontSize: '$xs' as const,
    wrap: 8,
    containerRadius: 20
  }
};

export function TabList<T extends string>({
  value,
  options,
  onValueChange,
  size = 'md',
  fit = 'content',
  maxItemWidth,
  mode,
  deferChange = false,
  backgroundToken
}: TabListProps<T>) {
  const t = sizeTokens[size];
  const displayMode: 'icon' | 'text' = mode ?? (options.every((opt) => !!opt.icon) ? 'icon' : 'text');
  const containerBackground =
    backgroundToken ?? (displayMode === 'icon' ? '$surfacePress' : '$surfaceHover');
  const containerWidth = fit === 'fill' ? '100%' : undefined;
  const [internalValue, setInternalValue] = useState<T>(value);
  const pendingRef = useRef<{ value: T; announced: boolean } | null>(null);
  const activeValue = deferChange ? internalValue : value;
  const theme = useTheme();
  const indicatorColor = getVariableValue(theme.surface) as string;
  const [layouts, setLayouts] = useState<Record<string, { x: number; width: number }>>({});
  const indicatorLeft = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  const [indicatorReady, setIndicatorReady] = useState(false);

  useEffect(() => {
    if (!deferChange) {
      setInternalValue(value);
      pendingRef.current = null;
      return;
    }

    const pending = pendingRef.current;

    if (!pending) {
      setInternalValue(value);
      return;
    }

    if (value === pending.value) {
      if (pending.announced) {
        pendingRef.current = null;
      }
      return;
    }

    if (pending.announced) {
      pendingRef.current = null;
      setInternalValue(value);
    }
  }, [deferChange, value]);

  useEffect(() => {
    const layout = layouts[activeValue];
    if (!layout) {
      return;
    }
    setIndicatorReady(true);
    const shouldAnnounce =
      deferChange &&
      pendingRef.current &&
      pendingRef.current.value === activeValue &&
      !pendingRef.current.announced;

    const leftSpring = Animated.spring(indicatorLeft, {
      toValue: layout.x,
      useNativeDriver: false,
      tension: 210,
      friction: 26
    });
    const widthSpring = Animated.spring(indicatorWidth, {
      toValue: layout.width,
      useNativeDriver: false,
      tension: 210,
      friction: 26
    });

    const animation = Animated.parallel([leftSpring, widthSpring], { stopTogether: false });

    animation.start(({ finished }) => {
      if (finished && shouldAnnounce) {
        if (pendingRef.current) {
          pendingRef.current.announced = true;
        }
        onValueChange(activeValue);
      }
    });

    return () => {
      animation.stop();
    };
  }, [activeValue, deferChange, indicatorLeft, indicatorWidth, layouts, onValueChange]);

  return (
    <XStack
      backgroundColor={containerBackground}
      borderRadius={t.containerRadius}
      padding={t.wrap}
      gap="$2"
      alignItems="center"
      justifyContent="center"
      width={containerWidth}
      position="relative"
    >
      {indicatorReady ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: t.wrap,
            bottom: t.wrap,
            borderRadius: t.radius,
            backgroundColor: indicatorColor,
            left: indicatorLeft,
            width: indicatorWidth
          }}
        />
      ) : null}
      {options.map((opt) => {
        const selected = opt.value === activeValue;
        const color = selected ? '$color' : '$colorMuted';
        const paddingHorizontal = displayMode === 'icon' ? t.padIcon : t.padText;
        const Icon = opt.icon;
        const handlePress = () => {
          if (deferChange) {
            if (opt.value === activeValue) {
              return;
            }
            pendingRef.current = { value: opt.value, announced: false };
            setInternalValue(opt.value);
          } else {
            if (opt.value !== value) {
              onValueChange(opt.value);
            }
          }
        };

        return (
          <Button
            key={opt.value}
            flex={fit === 'fill' ? 1 : undefined}
            maxWidth={maxItemWidth}
            variant="ghost"
            size="$sm"
            minHeight={t.height}
            borderRadius={t.radius}
            backgroundColor="transparent"
            hoverStyle={{ backgroundColor: 'transparent' }}
            pressStyle={{ backgroundColor: 'transparent' }}
            disabled={opt.disabled}
            paddingHorizontal={paddingHorizontal}
            accessibilityRole="tab"
            accessibilityState={{ selected, disabled: !!opt.disabled }}
            accessibilityLabel={opt.label ?? opt.value}
            onPress={handlePress}
            onLayout={({ nativeEvent }) => {
              const { x, width } = nativeEvent.layout;
              setLayouts((prev) => {
                const current = prev[opt.value];
                if (current && current.x === x && current.width === width) {
                  return prev;
                }
                return { ...prev, [opt.value]: { x, width } };
              });
            }}
            position="relative"
            zIndex={1}
          >
            {displayMode === 'icon' ? (
              <Stack alignItems="center" justifyContent="center">
                {Icon ? <Icon size={t.icon} color={color as unknown as string} /> : null}
              </Stack>
            ) : (
              <SizableText size={t.fontSize} lineHeight={18} fontWeight="600" color={color}>
                {opt.label ?? opt.value}
              </SizableText>
            )}
          </Button>
        );
      })}
    </XStack>
  );
}

export default TabList;
