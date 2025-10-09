import { Button as TamaguiButton, styled } from 'tamagui';

export const Button = styled(TamaguiButton, {
  name: 'AppButton',
  borderRadius: '$md',
  minHeight: 48,
  paddingHorizontal: '$4',
  gap: '$2',
  alignItems: 'center',
  justifyContent: 'center',
  variants: {
    variant: {
      primary: {
        backgroundColor: '$primary',
        color: '$colorInverse',
        hoverStyle: { backgroundColor: '$primaryHover' },
        pressStyle: { backgroundColor: '$primaryPress' }
      },
      secondary: {
        backgroundColor: '$surface',
        color: '$color',
        borderColor: '$borderColor',
        borderWidth: 1,
        hoverStyle: { backgroundColor: '$surfaceHover' },
        pressStyle: { backgroundColor: '$surfacePress' }
      },
      outline: {
        backgroundColor: 'transparent',
        color: '$color',
        borderColor: '$borderColor',
        borderWidth: 1,
        hoverStyle: { backgroundColor: '$surfaceHover' },
        pressStyle: { backgroundColor: '$surfacePress' }
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '$primary',
        hoverStyle: { backgroundColor: '$surfaceHover' },
        pressStyle: { backgroundColor: '$surfacePress' }
      }
    },
    size: {
      sm: {
        minHeight: 40,
        paddingHorizontal: '$3'
      },
      md: {
        minHeight: 48,
        paddingHorizontal: '$4'
      },
      lg: {
        minHeight: 56,
        paddingHorizontal: '$5'
      }
    },
    destructive: {
      true: {
        backgroundColor: '$danger',
        color: '$colorInverse',
        hoverStyle: { opacity: 0.9 },
        pressStyle: { opacity: 0.84 }
      }
    }
  } as const,
  defaultVariants: {
    variant: 'primary',
    size: 'md'
  }
});
