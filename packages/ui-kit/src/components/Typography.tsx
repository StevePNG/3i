import { Paragraph, SizableText, styled } from 'tamagui';

export const Title = styled(SizableText, {
  name: 'Title',
  fontFamily: '$heading',
  fontWeight: '600',
  color: '$color',
  size: '$7',
  lineHeight: '$7',
  marginBottom: '$3',
  variants: {
    intent: {
      default: {},
      accent: {
        color: '$primary'
      },
      inverse: {
        color: '$colorInverse'
      }
    },
    level: {
      1: {
        size: '$8',
        lineHeight: '$8'
      },
      2: {
        size: '$7',
        lineHeight: '$7'
      },
      3: {
        size: '$6',
        lineHeight: '$6'
      }
    }
  } as const,
  defaultVariants: {
    intent: 'default',
    level: 2
  }
});

export const Body = styled(Paragraph, {
  name: 'Body',
  fontFamily: '$body',
  color: '$color',
  size: '$4',
  lineHeight: '$5',
  variants: {
    tone: {
      default: {
        color: '$color'
      },
      muted: {
        color: '$colorMuted'
      },
      inverse: {
        color: '$colorInverse'
      }
    }
  } as const,
  defaultVariants: {
    tone: 'default'
  }
});

export const Caption = styled(SizableText, {
  name: 'Caption',
  fontFamily: '$body',
  color: '$colorMuted',
  size: '$3',
  lineHeight: '$4'
});
