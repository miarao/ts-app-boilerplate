import './global-theme-interface'

import type { FontGroup, FontSizes, ShadowBox } from '@mui/material'
import { createTheme } from '@mui/material/styles'

import designSystem from './design-system.json'

function createFont(flavor: 'display' | 'text', size: keyof FontSizes, style: keyof FontGroup) {
  return {
    fontSize: designSystem.global.fontSize[`${flavor}-${size}`].value + 'px',
    fontWeight: designSystem.global.fontWeight[style].value,
  }
}

function createShadow(values: ShadowBox[]) {
  return values.map(value => `${value.x}px ${value.y}px ${value.blur}px ${value.spread}px ${value.color}`).join(',')
}

function wrapWithpx(value: { value: string }) {
  return value.value + 'px'
}

export const globalTheme = createTheme({
  customTypography: {
    display: {
      xl: {
        regular: createFont('display', 'xl', 'regular'),
        medium: createFont('display', 'xl', 'medium'),
        bold: createFont('display', 'xl', 'bold'),
      },
      lg: {
        regular: createFont('display', 'lg', 'regular'),
        medium: createFont('display', 'lg', 'medium'),
        bold: createFont('display', 'lg', 'bold'),
      },
      md: {
        regular: createFont('display', 'md', 'regular'),
        medium: createFont('display', 'md', 'medium'),
        bold: createFont('display', 'md', 'bold'),
      },
      sm: {
        regular: createFont('display', 'sm', 'regular'),
        medium: createFont('display', 'sm', 'medium'),
        bold: createFont('display', 'sm', 'bold'),
      },
      xs: {
        regular: createFont('display', 'xs', 'regular'),
        medium: createFont('display', 'xs', 'medium'),
        bold: createFont('display', 'xs', 'bold'),
      },
      tiny: {
        regular: createFont('display', 'tiny', 'regular'),
        medium: createFont('display', 'tiny', 'medium'),
        bold: createFont('display', 'tiny', 'bold'),
      },
    },
    text: {
      xl: {
        regular: createFont('text', 'xl', 'regular'),
        medium: createFont('text', 'xl', 'medium'),
        bold: createFont('text', 'xl', 'bold'),
      },
      lg: {
        regular: createFont('text', 'lg', 'regular'),
        medium: createFont('text', 'lg', 'medium'),
        bold: createFont('text', 'lg', 'bold'),
      },
      md: {
        regular: createFont('text', 'md', 'regular'),
        medium: createFont('text', 'md', 'medium'),
        bold: createFont('text', 'md', 'bold'),
      },
      sm: {
        regular: createFont('text', 'sm', 'regular'),
        medium: createFont('text', 'sm', 'medium'),
        bold: createFont('text', 'sm', 'bold'),
      },
      xs: {
        regular: createFont('text', 'xs', 'regular'),
        medium: createFont('text', 'xs', 'medium'),
        bold: createFont('text', 'xs', 'bold'),
      },
      tiny: {
        regular: createFont('text', 'tiny', 'regular'),
        medium: createFont('text', 'tiny', 'medium'),
        bold: createFont('text', 'tiny', 'bold'),
      },
    },
  },

  customSpacing: {
    small: {
      nospace: wrapWithpx(designSystem.global['s-space']['no-space']),
      tiny: wrapWithpx(designSystem.global['s-space'].tiny),
      xxs: wrapWithpx(designSystem.global['s-space'].xxs),
      xs: wrapWithpx(designSystem.global['s-space'].xs),
      sm: wrapWithpx(designSystem.global['s-space'].sm),
      md: wrapWithpx(designSystem.global['s-space'].md),
      lg: wrapWithpx(designSystem.global['s-space'].lg),
      xl: wrapWithpx(designSystem.global['s-space'].xl),
      xxl: wrapWithpx(designSystem.global['s-space'].xxl),
    },
    large: {
      xs: wrapWithpx(designSystem.global['l-space'].xs),
      sm: wrapWithpx(designSystem.global['l-space'].sm),
      md: wrapWithpx(designSystem.global['l-space'].md),
    },
  },

  borderRadius: {
    square: wrapWithpx(designSystem.global.borderRadius.square),
    pill: wrapWithpx(designSystem.global.borderRadius.pill),
    tiny: wrapWithpx(designSystem.global.borderRadius.tiny),
    sm: wrapWithpx(designSystem.global.borderRadius.sm),
    md: wrapWithpx(designSystem.global.borderRadius.md),
    lg: wrapWithpx(designSystem.global.borderRadius.lg),
  },

  borderWidth: {
    none: wrapWithpx(designSystem.global.borderWidth.none),
    thin: wrapWithpx(designSystem.global.borderWidth.thin),
    skinny: wrapWithpx(designSystem.global.borderWidth.skinny),
    medium: wrapWithpx(designSystem.global.borderWidth.medium),
  },

  customOpacity: {
    zero: designSystem.global.opacity.zero.value,
    bright: designSystem.global.opacity.bright.value,
    light: designSystem.global.opacity.light.value,
    soft: designSystem.global.opacity.soft.value,
    medium: designSystem.global.opacity.medium.value,
    high: designSystem.global.opacity.high.value,
    total: designSystem.global.opacity.total.value,
  },

  lineHeight: {
    tiny: designSystem.global.lineHeight.tiny.value,
    small: designSystem.global.lineHeight.small.value,
    medium: designSystem.global.lineHeight.medium.value,
    tall: designSystem.global.lineHeight.tall.value,
  },

  letterSpacing: {
    0: designSystem.global.letterSpacing['0'].value,
    default: designSystem.global.letterSpacing.default.value,
    increased: designSystem.global.letterSpacing.increased.value,
    decreased: designSystem.global.letterSpacing.decreased.value,
  },

  size: {
    16: wrapWithpx(designSystem.global.size['16']),
    24: wrapWithpx(designSystem.global.size['24']),
    32: wrapWithpx(designSystem.global.size['32']),
    40: wrapWithpx(designSystem.global.size['40']),
    48: wrapWithpx(designSystem.global.size['48']),
    56: wrapWithpx(designSystem.global.size['56']),
    64: wrapWithpx(designSystem.global.size['64']),
    80: wrapWithpx(designSystem.global.size['80']),
    160: wrapWithpx(designSystem.global.size['160']),
    240: wrapWithpx(designSystem.global.size['240']),
  },

  pillSize: {
    tiny: wrapWithpx(designSystem.global.pillSize.tiny),
    s: wrapWithpx(designSystem.global.pillSize.s),
    sm: wrapWithpx(designSystem.global.pillSize.sm),
    md: wrapWithpx(designSystem.global.pillSize.md),
    lg: wrapWithpx(designSystem.global.pillSize.lg),
  },

  textCase: {
    none: designSystem.global.textCase.none.value,
    uppercase: designSystem.global.textCase.uppercase.value,
    lowercase: designSystem.global.textCase.lowercase.value,
    capitalize: designSystem.global.textCase.capitalize.value,
  },

  textDecoration: {
    none: designSystem.global.textDecoration.none.value,
    underline: designSystem.global.textDecoration.underline.value,
    linethrough: designSystem.global.textDecoration['line-through'].value,
  },

  lineHeightText: {
    12: wrapWithpx(designSystem.global.lineHeightText['12']),
    14: wrapWithpx(designSystem.global.lineHeightText['24']),
    16: wrapWithpx(designSystem.global.lineHeightText['16']),
    20: wrapWithpx(designSystem.global.lineHeightText['20']),
    24: wrapWithpx(designSystem.global.lineHeightText['24']),
    28: wrapWithpx(designSystem.global.lineHeightText['28']),
    36: wrapWithpx(designSystem.global.lineHeightText['36']),
    48: wrapWithpx(designSystem.global.lineHeightText['48']),
    56: wrapWithpx(designSystem.global.lineHeightText['56']),
    64: wrapWithpx(designSystem.global.lineHeightText['64']),
  },

  paragraphSpacing: {
    0: designSystem.global.paragraphSpacing['0'].value,
  },

  boxShadow: {
    light: {
      1: createShadow(designSystem.light['shadow-light']['1'].value),
      2: createShadow(designSystem.light['shadow-light']['2'].value),
      3: createShadow(designSystem.light['shadow-light']['3'].value),
      4: createShadow(designSystem.light['shadow-light']['4'].value),
      5: createShadow(designSystem.light['shadow-light']['5'].value),
      6: createShadow(designSystem.light['shadow-light']['6'].value),
    },
    dark: {
      1: createShadow(designSystem.dark['shadow-dark']['1'].value),
      2: createShadow(designSystem.dark['shadow-dark']['2'].value),
      3: createShadow(designSystem.dark['shadow-dark']['3'].value),
      4: createShadow(designSystem.dark['shadow-dark']['4'].value),
      5: createShadow(designSystem.dark['shadow-dark']['5'].value),
      6: createShadow(designSystem.dark['shadow-dark']['6'].value),
    },
  },
  // relevant when serving on mobile devices
  // dynamicLayout: (ratio = 1) => ({
  //   maxWidth: 512 * ratio,
  //   '@media (min-width: 1024px)': {
  //     maxWidth: `${50 * ratio}%`,
  //   },
  // }),
})
