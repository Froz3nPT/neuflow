import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { EnergyLevel, InboxItem } from '@neuflow/shared';
import { tokens } from '../design/tokens';
import { EnergyGlyph } from '../design/EnergyGlyph';

const TRIAGE_OPTIONS: { value: EnergyLevel; label: string; hint: string }[] = [
  { value: 'low', label: 'Low', hint: 'Doable when depleted' },
  { value: 'med', label: 'Medium', hint: 'Needs some fuel' },
  { value: 'high', label: 'High', hint: 'Save for a strong moment' },
];

export function TriageSheet({
  item,
  onCancel,
  onPick,
}: {
  item: InboxItem | null;
  onCancel: () => void;
  onPick: (energy: EnergyLevel) => void;
}) {
  return (
    <Modal
      visible={item !== null}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel} />
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle} numberOfLines={2}>
          {item?.text ?? ''}
        </Text>
        <Text style={styles.sheetPrompt}>How much energy will this take?</Text>
        {TRIAGE_OPTIONS.map((opt) => {
          const energy = tokens.colors.energy[opt.value];
          return (
            <Pressable
              key={opt.value}
              style={({ pressed }) => [
                styles.energyBtn,
                {
                  backgroundColor: energy.bg,
                  borderColor: energy.border,
                },
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => onPick(opt.value)}
            >
              <View style={styles.energyBtnGlyph}>
                <EnergyGlyph energy={opt.value} />
              </View>
              <View style={styles.energyBtnLabels}>
                <Text style={[styles.energyBtnLabel, { color: energy.fg }]}>
                  {opt.label}
                </Text>
                <Text style={[styles.energyBtnHint, { color: energy.fg }]}>
                  {opt.hint}
                </Text>
              </View>
            </Pressable>
          );
        })}
        <Pressable style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: tokens.colors.overlay.backdrop,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: tokens.colors.surface.elevated,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 10,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: tokens.colors.text.primary,
  },
  sheetPrompt: {
    fontSize: 14,
    color: tokens.colors.text.secondary,
    marginBottom: 6,
  },
  energyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  energyBtnGlyph: {
    width: 28,
    alignItems: 'center',
  },
  energyBtnLabels: {
    flex: 1,
  },
  energyBtnLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
  energyBtnHint: {
    fontSize: 13,
    fontWeight: '400',
    opacity: 0.85,
    marginTop: 2,
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelBtnText: {
    fontSize: 16,
    color: tokens.colors.text.secondary,
  },
});
