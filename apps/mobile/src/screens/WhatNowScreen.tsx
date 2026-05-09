import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { EnergyLevel, Task } from '@neuflow/shared';
import { tokens } from '../design/tokens';
import { EnergyGlyph } from '../design/EnergyGlyph';

// "What now?" — single-task focus surface. The user picks current energy,
// the app surfaces ONE matching task, and the choice collapses to
// done / skip / change energy. Decision load is the enemy.
//
// Task selection is deterministic — oldest-first. No randomness:
//   1. randomness adds anxiety for ND users ("why this one?")
//   2. "the same task keeps coming up" is the signal the future
//      procrastination decoder will read off skipCount.
//
// Skip during a session adds the task ID to a session-local skip set so the
// same item doesn't immediately re-appear. The set resets when the user
// changes energy or leaves the screen — next time, oldest-first puts the
// skipped task right back in front of them. That recurrence is the point.

const ENERGY_OPTIONS: { value: EnergyLevel; label: string; hint: string }[] = [
  { value: 'low', label: 'Low', hint: 'Running on fumes' },
  { value: 'med', label: 'Medium', hint: 'Some fuel in the tank' },
  { value: 'high', label: 'High', hint: 'Ready to push' },
];

type Mode =
  | { kind: 'picking' }
  | { kind: 'active'; energy: EnergyLevel; skippedIds: Set<string> };

export function WhatNowScreen({
  tasks,
  onComplete,
  onSkip,
}: {
  tasks: Task[] | null;
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
}) {
  const [mode, setMode] = useState<Mode>({ kind: 'picking' });

  const candidate = useMemo(() => {
    if (mode.kind !== 'active' || !tasks) return null;
    return pickCandidate(tasks, mode.energy, mode.skippedIds);
  }, [mode, tasks]);

  if (tasks === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={tokens.colors.text.secondary} />
      </View>
    );
  }

  if (mode.kind === 'picking') {
    return (
      <EnergyPicker
        onPick={(energy) =>
          setMode({ kind: 'active', energy, skippedIds: new Set() })
        }
      />
    );
  }

  if (candidate === null) {
    return (
      <EmptyState onChangeEnergy={() => setMode({ kind: 'picking' })} />
    );
  }

  return (
    <ActiveTaskView
      task={candidate}
      onDone={() => {
        onComplete(candidate.id);
        // Stay in active mode at same energy; the next render picks the
        // new oldest from updated tasks. completedAt removes it from
        // candidates naturally — no need to mutate skippedIds.
      }}
      onSkip={() => {
        onSkip(candidate.id);
        setMode({
          kind: 'active',
          energy: mode.energy,
          skippedIds: new Set(mode.skippedIds).add(candidate.id),
        });
      }}
      onChangeEnergy={() => setMode({ kind: 'picking' })}
    />
  );
}

function pickCandidate(
  tasks: Task[],
  energy: EnergyLevel,
  skippedIds: Set<string>,
): Task | null {
  let oldest: Task | null = null;
  for (const task of tasks) {
    if (task.completedAt !== null) continue;
    if (task.energy !== energy) continue;
    if (skippedIds.has(task.id)) continue;
    if (oldest === null || task.createdAt < oldest.createdAt) {
      oldest = task;
    }
  }
  return oldest;
}

function EnergyPicker({ onPick }: { onPick: (energy: EnergyLevel) => void }) {
  return (
    <View style={styles.pickerContainer}>
      <Text style={styles.pickerPrompt}>How's your energy right now?</Text>
      <View style={styles.pickerOptions}>
        {ENERGY_OPTIONS.map((opt) => {
          const energy = tokens.colors.energy[opt.value];
          return (
            <Pressable
              key={opt.value}
              style={({ pressed }) => [
                styles.pickerBtn,
                {
                  backgroundColor: energy.bg,
                  borderColor: energy.border,
                },
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => onPick(opt.value)}
            >
              <View style={styles.pickerGlyph}>
                <EnergyGlyph energy={opt.value} />
              </View>
              <View style={styles.pickerLabels}>
                <Text style={[styles.pickerLabel, { color: energy.fg }]}>
                  {opt.label}
                </Text>
                <Text style={[styles.pickerHint, { color: energy.fg }]}>
                  {opt.hint}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ActiveTaskView({
  task,
  onDone,
  onSkip,
  onChangeEnergy,
}: {
  task: Task;
  onDone: () => void;
  onSkip: () => void;
  onChangeEnergy: () => void;
}) {
  const energy = tokens.colors.energy[task.energy];
  return (
    <View style={styles.activeContainer}>
      <View
        style={[
          styles.taskCard,
          {
            backgroundColor: energy.bg,
            borderColor: energy.border,
          },
        ]}
      >
        <View style={styles.taskMeta}>
          <EnergyGlyph energy={task.energy} />
          <Text style={[styles.taskMetaLabel, { color: energy.fg }]}>
            {energyLabel(task.energy)}
          </Text>
        </View>
        <Text style={styles.taskText}>{task.text}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && { opacity: 0.85 },
          ]}
          onPress={onDone}
        >
          <Text style={styles.primaryBtnText}>Done</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryBtn,
            pressed && styles.secondaryBtnPressed,
          ]}
          onPress={onSkip}
        >
          <Text style={styles.secondaryBtnText}>Skip</Text>
        </Pressable>
        <Pressable style={styles.tertiaryBtn} onPress={onChangeEnergy}>
          <Text style={styles.tertiaryBtnText}>Change energy</Text>
        </Pressable>
      </View>
    </View>
  );
}

function EmptyState({ onChangeEnergy }: { onChangeEnergy: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>All clear at this energy. Nice.</Text>
      <Pressable style={styles.tertiaryBtn} onPress={onChangeEnergy}>
        <Text style={styles.tertiaryBtnText}>Change energy</Text>
      </Pressable>
    </View>
  );
}

function energyLabel(energy: EnergyLevel): string {
  switch (energy) {
    case 'low':
      return 'Low';
    case 'med':
      return 'Medium';
    case 'high':
      return 'High';
  }
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  pickerContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
  },
  pickerPrompt: {
    fontSize: 22,
    fontWeight: '600',
    color: tokens.colors.text.primary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 30,
  },
  pickerOptions: {
    gap: 12,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pickerGlyph: {
    width: 28,
    alignItems: 'center',
  },
  pickerLabels: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  pickerHint: {
    fontSize: 14,
    fontWeight: '400',
    opacity: 0.85,
    marginTop: 2,
  },
  activeContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  taskCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 28,
    paddingVertical: 36,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskMetaLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  taskText: {
    fontSize: 26,
    fontWeight: '500',
    color: tokens.colors.text.primary,
    textAlign: 'center',
    lineHeight: 36,
  },
  actions: {
    gap: 10,
    marginTop: 24,
  },
  primaryBtn: {
    backgroundColor: tokens.colors.accent.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: tokens.colors.accent.primaryFg,
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryBtn: {
    backgroundColor: tokens.colors.surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border.strong,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryBtnPressed: {
    backgroundColor: tokens.colors.border.subtle,
  },
  secondaryBtnText: {
    color: tokens.colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  tertiaryBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  tertiaryBtnText: {
    color: tokens.colors.text.muted,
    fontSize: 15,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 26,
  },
});
