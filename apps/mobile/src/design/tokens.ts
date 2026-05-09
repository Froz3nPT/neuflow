/**
 * Design tokens — single source of truth for visual decisions.
 *
 * Light theme only this pass; dark mode is intentionally out of scope.
 *
 * Energy semantic axis
 * --------------------
 * Energy uses a warm-to-cool gradient rather than a red-yellow-green
 * traffic-light. Reasons:
 *
 *   - Red-as-high reads as "danger / stop", which is the wrong signal —
 *     high-energy tasks aren't bad, they just need fuel.
 *   - Green-as-low reads as "go / safe", which contradicts the meaning;
 *     low-energy is what's doable when depleted, not what's encouraged.
 *   - Warm-to-cool maps loosely to body warmth (high effort = warm,
 *     restful = cool) without overloading existing color metaphors.
 *
 * Concretely:
 *     high → coral / soft orange (warm)
 *     med  → amber / sand (neutral)
 *     low  → dusty teal / blue (cool)
 *
 * All three are desaturated. The autism corner of the ND audience the
 * product brief calls out reacts badly to vibrant saturation, so we
 * stay closer to Things 3 / Notion-calm than Trello-bright.
 *
 * Color is not the only signal
 * ----------------------------
 * Energy is also rendered with a 3-bar glyph (1/2/3 bars for
 * low/med/high) — see ./EnergyGlyph.tsx. Roughly 8% of men are
 * red-green colorblind, and we don't want hue to be the only cue
 * for "how much fuel does this need".
 */
export const tokens = {
  colors: {
    surface: {
      background: '#FAF8F5', // warm off-white, not pure #FFF
      card: '#FFFFFF',
      elevated: '#FFFFFF', // sheets, modals
    },
    text: {
      primary: '#1F1D1A', // warm near-black
      secondary: '#6B6660',
      muted: '#9C9690',
      inverse: '#FFFFFF',
    },
    border: {
      subtle: '#ECE8E2',
      strong: '#D6D1C9',
    },
    energy: {
      high: {
        bg: '#FCEBE2',
        fg: '#9F4A30',
        border: '#F2C9B6',
      },
      med: {
        bg: '#FBF1DE',
        fg: '#8C6A2A',
        border: '#ECD7A5',
      },
      low: {
        bg: '#E1ECEC',
        fg: '#406972',
        border: '#BDD3D5',
      },
    },
    accent: {
      primary: '#2F5D62', // calm deep teal — CTAs, neutral active filter
      primaryFg: '#FFFFFF',
    },
    state: {
      success: '#6B8E6F',
      danger: '#B8624D',
    },
    overlay: {
      backdrop: 'rgba(31, 29, 26, 0.45)', // text.primary @ 45%
    },
  },
} as const;

export type Tokens = typeof tokens;
