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
          <Pressable
            key={opt.value}
            style={[
              styles.chip,
              filter === opt.value && styles.chipActive,
            ]}
            onPress={() => onFilterChange(opt.value)}
          >
            <Text
              style={[
                styles.chipText,
                filter === opt.value && styles.chipTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {tasks === null ? (
        <View style={styles.center}>
          <ActivityIndicator />
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
                <Text
                  style={[
                    styles.energyTag,
                    dim && styles.energyTagDone,
                  ]}
                >
                  {energyLabel(item.energy)}
                </Text>
              </Pressable>
            );
          }}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f4f4f5',
  },
  chipActive: {
    backgroundColor: '#111827',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  chipTextActive: {
    color: '#fff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  empty: {
    fontSize: 16,
    color: '#6b7280',
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
    backgroundColor: '#f4f4f5',
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemPressed: {
    backgroundColor: '#e4e4e7',
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    lineHeight: 22,
  },
  itemTextDone: {
    opacity: 0.6,
    textDecorationLine: 'line-through',
  },
  energyTag: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: '#e4e4e7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  energyTagDone: {
    opacity: 0.6,
  },
});
