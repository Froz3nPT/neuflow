import { StyleSheet, View } from 'react-native';
import type { EnergyLevel } from '@neuflow/shared';
import { tokens } from './tokens';

// Three ascending bars (low=1 filled, med=2, high=3). Lets the energy
// signal survive monochrome rendering and red-green colorblindness, so
// hue isn't load-bearing.
export function EnergyGlyph({
  energy,
  tone = 'auto',
}: {
  energy: EnergyLevel;
  // 'inverse' is for use on a saturated background where the energy fg
  // would clash (currently unused, but the TriageSheet may want it
  // later if button backgrounds get darker).
  tone?: 'auto' | 'inverse';
}) {
  const filled = energy === 'low' ? 1 : energy === 'med' ? 2 : 3;
  const fillColor =
    tone === 'inverse'
      ? tokens.colors.text.inverse
      : tokens.colors.energy[energy].fg;
  const emptyColor =
    tone === 'inverse'
      ? 'rgba(255,255,255,0.35)'
      : tokens.colors.energy[energy].border;

  return (
    <View style={styles.glyph}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[
            styles.bar,
            { height: 5 + i * 3 },
            { backgroundColor: i < filled ? fillColor : emptyColor },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  glyph: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 11,
  },
  bar: {
    width: 3,
    borderRadius: 1,
  },
});
