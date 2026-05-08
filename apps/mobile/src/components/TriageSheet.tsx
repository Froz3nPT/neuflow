import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { EnergyLevel, InboxItem } from '@neuflow/shared';

const TRIAGE_OPTIONS: { value: EnergyLevel; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'med', label: 'Medium' },
  { value: 'high', label: 'High' },
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
        {TRIAGE_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            style={({ pressed }) => [
              styles.energyBtn,
              pressed && styles.energyBtnPressed,
            ]}
            onPress={() => onPick(opt.value)}
          >
            <Text style={styles.energyBtnText}>{opt.label}</Text>
          </Pressable>
        ))}
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
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
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
    color: '#111827',
  },
  sheetPrompt: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  energyBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
  },
  energyBtnPressed: {
    backgroundColor: '#e4e4e7',
  },
  energyBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelBtnText: {
    fontSize: 16,
    color: '#6b7280',
  },
});
