/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#183C31',
    tint: '#1E7657',

    // Core surfaces
    background: '#FFF9ED',
    foreground: '#183C31',

    // Cards / elevated surfaces
    card: '#FFFFFF',
    cardForeground: '#183C31',

    // Primary action color (buttons, links, active states)
    primary: '#1E7657',
    primaryShade: '#3A9B72',
    primaryForeground: '#FFFFFF',
    heroMuted: 'rgba(255,255,255,0.82)',
    glass: 'rgba(255,255,255,0.12)',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#E6F1E6',
    secondaryForeground: '#27513F',
    softAccent: '#FCEAD8',
    warmInk: '#B5663C',
    dangerSurface: '#FBE2D9',
    overlay: 'rgba(18, 38, 30, 0.48)',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#F3EBDC',
    mutedForeground: '#718077',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#F5C85B',
    accentForeground: '#523F13',

    // Destructive actions (delete, error states)
    destructive: '#ef4444',
    destructiveForeground: '#FFFFFF',

    // Borders and input outlines
    border: '#E6E6D9',
    input: '#D8E2D9',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 22,
};

export default colors;
