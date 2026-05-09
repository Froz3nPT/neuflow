import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { EnergyLevel, Task } from '@neuflow/shared';
import { tokens } from '../design/tokens';
import { EnergyGlyph } from '../design/EnergyGlyph';

export type EnergyFilter = 'all' | 'today' | EnergyLevel;

const FILTER_OPTIONS: { value: EnergyFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'low', label: 'Low' },
  { value: 'med', label: 'Med' },
  { value: 'high', label: 'High' },
  { value: 'today', label: 'Today' },
];

export function TasksScreen({
  tasks,
  filter,
  onFilterChange,
  onToggleComplete,
  onDelete,
}: {
  tasks: Task[] | null;
  filter: EnergyFilter;
  onFilterChange: (next: EnergyFilter) => void;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isToday = filter === 'today';

  const handleLongPress = (task: Task) => {
    // Destructive needs friction. Tap-to-complete is reversible (tap again);
    // delete isn't, and we don't have a snackbar+undo primitive yet.
    Alert.alert('Delete this task?', task.text, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete(task.id),
      },
    ]);
  };

  return (
    <View style={styles.tasksContainer}>
      <View style={styles.filters}>
        {FILTER_OPTIONS.map((opt) => (
          <FilterChip
            key={opt.value}
            value={opt.value}
            label={opt.label}
            active={filter === opt.value}
            onPress={() => onFilterChange(opt.value)}
          />
        ))}
      </View>
      {tasks === null ? (
        <View style={styles.center}>
          <ActivityIndicator color={tokens.colors.text.secondary} />
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>{emptyCopy(filter)}</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(task) => task.id}
          renderItem={({ item }) => {
            const completed = item.completedAt !== null;
            const dim = isToday && completed;
            const energyColors = tokens.colors.energy[item.energy];
            return (
              <Pressable
                style={({ pressed }) => [
                  styles.item,
                  pressed && styles.itemPressed,
                ]}
                onPress={() => onToggleComplete(item.id)}
                onLongPress={() => handleLongPress(item)}
              >
                <Text
                  style={[
                    styles.itemText,
                    dim && styles.itemTextDone,
                  ]}
                >
                  {item.text}
                </Text>
                <View
                  style={[
                    styles.energyTag,
                    {
                      backgroundColor: energyColors.bg,
                      borderColor: energyColors.border,
                    },
                    dim && styles.energyTagDone,
                  ]}
                >
                  <EnergyGlyph energy={item.energy} />
                  <Text
                    style={[
                      styles.energyTagText,
                      { color: energyColors.fg },
                    ]}
                  >
                    {energyLabel(item.energy)}
                  </Text>
                </View>
              </Pressable>
            );
          }}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

function FilterChip({
  value,
  label,
  active,
  onPress,
}: {
  value: EnergyFilter;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  // Energy filters take on the matching energy tone when active so the
  // active state itself signals which axis the user is filtering by.
  // 'all' / 'today' aren't on the energy axis, so they fall back to
  // accent.
  if (value === 'low' || value === 'med' || value === 'high') {
    const energy = tokens.colors.energy[value];
    return (
      <Pressable
        style={[
          styles.chip,
          active
            ? { backgroundColor: energy.bg, borderColor: energy.border }
            : styles.chipInactive,
        ]}
        onPress={onPress}
      >
        <EnergyGlyph energy={value} />
        <Text
          style={[
            styles.chipText,
            { color: active ? energy.fg : tokens.colors.text.secondary },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  }
  return (
    <Pressable
      style={[
        styles.chip,
        active ? styles.chipActiveAccent : styles.chipInactive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.chipText,
          {
            color: active
              ? tokens.colors.accent.primaryFg
              : tokens.colors.text.secondary,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function emptyCopy(filter: EnergyFilter): string {
  switch (filter) {
    case 'all':
      return 'No tasks yet.\nLong-press an inbox item to triage it.';
    case 'today':
      return "Nothing finished today — yet.\nTap a task to mark it done.";
    default:
      return 'Nothing matches this energy filter.';
  }
}

function energyLabel(energy: EnergyLevel): string {
  switch (energy) {
    case 'low':
      return 'Low';
    case 'med':
      return 'Med';
    case 'high':
      return 'High';
  }
}

const styles = StyleSheet.create({
  tasksContainer: {
    flex: 1,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipInactive: {
    backgroundColor: tokens.colors.surface.card,
    borderColor: tokens.colors.border.subtle,
  },
  chipActiveAccent: {
    backgroundColor: tokens.colors.accent.primary,
    borderColor: tokens.colors.accent.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  empty: {
    fontSize: 16,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: tokens.colors.surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border.subtle,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemPressed: {
    backgroundColor: tokens.colors.border.subtle,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: tokens.colors.text.primary,
    lineHeight: 22,
  },
  itemTextDone: {
    opacity: 0.6,
    textDecorationLine: 'line-through',
  },
  energyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  energyTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  energyTagDone: {
    opacity: 0.6,
  },
});
