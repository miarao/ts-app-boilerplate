import '@mui/material/styles'

declare module '@mui/material/styles' {
  type Font = {
    fontSize: string
    fontWeight: string
  }

  export type FontSizes = {
    xl: FontGroup
    lg: FontGroup
    md: FontGroup
    sm: FontGroup
    xs: FontGroup
    tiny: FontGroup
  }

  export type FontGroup = {
    regular: Font
    medium: Font
    bold: Font
  }

  type Spacing = {
    small: {
      nospace: string
      tiny: string
      xxs: string
      xs: string
      sm: string
      md: string
      lg: string
      xl: string
      xxl: string
    }
    large: {
      xs: string
      sm: string
      md: string
    }
  }

  type BorderRadius = {
    square: string
    pill: string
    tiny: string
    sm: string
    md: string
    lg: string
  }

  type BorderWidth = {
    none: string
    thin: string
    skinny: string
    medium: string
  }

  type CustomOpacity = {
    zero: string
    bright: string
    light: string
    soft: string
    medium: string
    high: string
    total: string
  }

  type LineHeight = {
    tiny: string
    small: string
    medium: string
    tall: string
  }

  type LetterSpacing = {
    0: string
    default: string
    increased: string
    decreased: string
  }

  type Size = {
    16: string
    24: string
    32: string
    40: string
    48: string
    56: string
    64: string
    80: string
    160: string
    240: string
  }

  type PillSize = {
    tiny: string
    s: string
    sm: string
    md: string
    lg: string
  }
  type TextCase = {
    none: string
    uppercase: string
    lowercase: string
    capitalize: string
  }
  type TextDecoration = {
    none: string
    underline: string
    linethrough: string
  }

  type LineHeightText = {
    12: string
    14: string
    16: string
    20: string
    24: string
    28: string
    36: string
    48: string
    56: string
    64: string
  }

  type ParagraphSpacing = {
    0: string
  }

  type Base = {
    white: string
    black: string
  }

  export type ShadowBox = {
    x: string
    y: string
    blur: string
    spread: string
    color: string
  }

  type Shadow = {
    1: string
    2: string
    3: string
    4: string
    5: string
    6: string
  }

  interface Theme {
    customTypography: {
      display: FontSizes
      text: FontSizes
    }
    customSpacing: Spacing
    borderRadius: BorderRadius
    borderWidth: BorderWidth
    customOpacity: CustomOpacity
    lineHeight: LineHeight
    letterSpacing: LetterSpacing
    size: Size
    pillSize: PillSize
    textCase: TextCase
    textDecoration: TextDecoration
    lineHeightText: LineHeightText
    paragraphSpacing: ParagraphSpacing

    boxShadow: {
      light: Shadow
      dark: Shadow
    }
    dynamicLayout: (n?: number) => {
      maxWidth: number
      '@media (min-width: 1024px)': {
        maxWidth: string
      }
    }
  }

  interface ThemeOptions {
    customTypography?: {
      display: FontSizes
      text: FontSizes
    }
    customSpacing?: Spacing
    borderRadius?: BorderRadius
    borderWidth?: BorderWidth
    customOpacity?: CustomOpacity
    lineHeight?: LineHeight
    letterSpacing?: LetterSpacing
    size?: Size
    pillSize?: PillSize
    textCase?: TextCase
    textDecoration?: TextDecoration
    lineHeightText?: LineHeightText
    paragraphSpacing?: ParagraphSpacing
    boxShadow?: {
      light: Shadow
      dark: Shadow
    }
    // dynamic layout is relevant when serving on mobile devices
    // dynamicLayout?: (n?: number) => {
    //   maxWidth: number
    //   '@media (min-width: 1024px)': {
    //     maxWidth: string
    //   }
    // }
  }
}
