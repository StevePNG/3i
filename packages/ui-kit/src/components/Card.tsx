import { Stack, styled } from 'tamagui';

export const Card = styled(Stack, {
  name: 'Card',
  backgroundColor: '$surface',
  borderRadius: '$lg',
  padding: '$4',
  gap: '$3',
  borderWidth: 1,
  borderColor: '$borderColor',
  shadowColor: 'rgba(15, 23, 42, 0.1)',
  shadowOpacity: 1,
  shadowRadius: 16,
  variants: {
    elevated: {
      true: {
        shadowOpacity: 0.18,
        elevation: 4,
        backgroundColor: '$surfaceHover'
      }
    },
    interactive: {
      true: {
        hoverStyle: {
          backgroundColor: '$surfaceHover'
        },
        pressStyle: {
          backgroundColor: '$surfacePress'
        }
      }
    }
  } as const
});
