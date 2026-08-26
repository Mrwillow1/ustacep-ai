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
    text: '#10243E',
    tint: '#0E7490',

    // Core surfaces
    background: '#F4F8FA',
    foreground: '#10243E',

    // Cards / elevated surfaces
    card: '#FFFFFF',
    cardForeground: '#10243E',

    // Primary action color (buttons, links, active states)
    primary: '#0E7490',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#E7F1F3',
    secondaryForeground: '#164E63',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#EAF0F2',
    mutedForeground: '#668092',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#F59E0B',
    accentForeground: '#10243E',

    // Destructive actions (delete, error states)
    destructive: '#DC5A5A',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#D8E3E7',
    input: '#D8E3E7',
  },
  dark: {
    text: '#E7F3F5',
    tint: '#36B7C9',
    background: '#0D1B2A',
    foreground: '#E7F3F5',
    card: '#13273A',
    cardForeground: '#E7F3F5',
    primary: '#36B7C9',
    primaryForeground: '#06202A',
    secondary: '#1C394C',
    secondaryForeground: '#D3F1F5',
    muted: '#1A3042',
    mutedForeground: '#9CB5C1',
    accent: '#F6B544',
    accentForeground: '#10243E',
    destructive: '#F17A7A',
    destructiveForeground: '#251114',
    border: '#29465A',
    input: '#29465A',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 14,
};

export default colors;
