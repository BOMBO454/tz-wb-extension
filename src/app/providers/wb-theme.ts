import type { ThemeConfig } from 'antd'

/**
 * Ant Design theme tokens derived from WB mobile light UI (Figma).
 * Key accents: brand purple #983df4, soft lilac surfaces #f2e6fe,
 * text #252429 / muted #8e8fa3, pill-like radii on controls.
 */
export const wbTheme: ThemeConfig = {
  token: {
    colorPrimary: '#983df4',
    colorInfo: '#983df4',
    colorWarning: '#ff8532',
    colorError: '#e2375b',
    colorLink: '#983df4',
    colorSuccess: '#2f9e44',

    colorTextBase: '#252429',
    colorText: '#252429',
    colorTextSecondary: '#8e8fa3',
    colorTextTertiary: '#8e8fa3',
    colorTextQuaternary: '#c5c4d4',

    colorBorder: '#c5c4d4',
    colorBorderSecondary: '#e4e3ec',

    colorBgBase: '#ffffff',
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f7f4fb',
    colorBgElevated: '#ffffff',
    colorFillAlter: '#f2e6fe',
    colorFillSecondary: '#f2e6fe',
    colorFillTertiary: '#f6f0fc',

    colorPrimaryBg: '#f2e6fe',
    colorPrimaryBgHover: '#e9d6fc',
    colorPrimaryBorder: '#c58ff8',
    colorPrimaryBorderHover: '#b06af6',
    colorPrimaryHover: '#a855f7',
    colorPrimaryActive: '#7c22d4',
    colorPrimaryText: '#983df4',

    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 10,
    borderRadiusXS: 8,

    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,

    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeHeading2: 28,
    fontSizeHeading3: 22,
    fontWeightStrong: 600,
    lineHeight: 1.5,

    boxShadow: '0 4px 20px rgba(37, 36, 41, 0.06)',
    boxShadowSecondary: '0 0 40px rgba(37, 36, 41, 0.05)',
    boxShadowTertiary: '0 2px 12px rgba(37, 36, 41, 0.04)',

    motionDurationMid: '0.2s',
  },
  components: {
    Button: {
      primaryShadow: '0 6px 16px rgba(152, 61, 244, 0.32)',
      defaultShadow: 'none',
      borderRadius: 14,
      borderRadiusLG: 16,
      borderRadiusSM: 12,
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      fontWeight: 600,
      paddingInline: 20,
      paddingInlineLG: 24,
      defaultBorderColor: '#c5c4d4',
      defaultColor: '#252429',
      defaultHoverBorderColor: '#983df4',
      defaultHoverColor: '#983df4',
      defaultHoverBg: '#f2e6fe',
      defaultActiveBorderColor: '#7c22d4',
      defaultActiveColor: '#7c22d4',
    },
    Input: {
      borderRadius: 16,
      borderRadiusLG: 20,
      controlHeight: 44,
      controlHeightLG: 52,
      paddingInline: 16,
      activeBorderColor: '#983df4',
      hoverBorderColor: '#b06af6',
      activeShadow: '0 0 0 3px rgba(152, 61, 244, 0.14)',
      // WB search bar surface
      colorBgContainer: '#f2e6fe',
      colorBorder: 'transparent',
      hoverBg: '#f2e6fe',
      activeBg: '#f2e6fe',
    },
    Form: {
      labelColor: '#252429',
      labelFontSize: 14,
      itemMarginBottom: 20,
    },
    Card: {
      borderRadiusLG: 20,
      paddingLG: 28,
      headerBg: 'transparent',
      colorBorderSecondary: 'transparent',
      boxShadowTertiary: '0 8px 32px rgba(37, 36, 41, 0.06)',
    },
    Modal: {
      borderRadiusLG: 20,
      titleFontSize: 18,
      titleLineHeight: 1.35,
      contentBg: '#ffffff',
      headerBg: '#ffffff',
      footerBg: '#ffffff',
    },
    Progress: {
      defaultColor: '#983df4',
      remainingColor: '#f2e6fe',
      lineBorderRadius: 8,
    },
    Spin: {
      colorPrimary: '#983df4',
    },
    Alert: {
      borderRadiusLG: 14,
      colorErrorBg: '#fee9ee',
      colorErrorBorder: '#f5b8c6',
      colorInfoBg: '#f2e6fe',
      colorInfoBorder: '#d4b0f8',
    },
    Typography: {
      titleMarginBottom: '0.35em',
      titleMarginTop: '0',
    },
  },
}
