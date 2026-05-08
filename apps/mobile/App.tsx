import { useCallback, useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import type { EnergyLevel, InboxItem, Task } from '@neuflow/shared';
import { loadInbox, loadTasks, saveInbox, saveTasks } from './src/lib/storage';

// Two-screen app: Inbox (raw capture) and Tasks (triaged, with energy). A
// single segmented toggle at the top swaps which list is visible. We don't
// reach for a navigation library yet — two views and conditional render is
// less ceremony than a stack.

type ViewKey = 'inbox' | 'tasks';
type EnergyFilter = 'all' | EnergyLevel;

const TRIAGE_OPTIONS: { value: EnergyLevel; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'med', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const FILTER_OPTIONS: { value: EnergyFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'low', label: 'Low' },
  { value: 'med', label: 'Med' },
  { value: 'high', label: 'High' },
];

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [view, setView] = useState<ViewKey>('inbox');
  // null = still loading from disk; [] = loaded and empty.
  // Distinguishing the two stops a "your inbox is empty" flash on cold start.
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [draft, setDraft] = useState('');
  const [filter, setFilter] = useState<EnergyFilter>('all');
  const [triageItem, setTriageItem] = useState<InboxItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadInbox(), loadTasks()])
      .then(([loadedInbox, loadedTasks]) => {
        if (cancelled) return;
        setItems(loadedInbox);
        setTasks(loadedTasks);
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
        setTasks([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persistInbox = useCallback((next: InboxItem[]) => {
    setItems(next);
    saveInbox(next).catch((err) => {
      console.warn('[neuflow] saveInbox failed', err);
    });
  }, []);

  const persistTasks = useCallback((next: Task[]) => {
    setTasks(next);
    saveTasks(next).catch((err) => {
      console.warn('[neuflow] saveTasks failed', err);
    });
  }, []);

  const handleAdd = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    const entry: InboxItem = {
      id: newId(),
      text,
      createdAt: new Date().toISOString(),
    };
    persistInbox([entry, ...(items ?? [])]);
    setDraft('');
  }, [draft, items, persistInbox]);

  const handleDelete = useCallback(
    (id: string) => {
      // Tap-to-delete with a lightweight Alert confirm. Captured thoughts are
      // load-bearing for ND users with RSD/anxiety; a single misfired tap
      // wiping a fresh capture is much worse UX than one extra tap to confirm.
      // Alert.alert is a placeholder — once a snackbar/undo primitive lands,
      // this should switch to immediate-delete + undo.
      Alert.alert('Delete this?', undefined, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            persistInbox((items ?? []).filter((i) => i.id !== id));
          },
        },
      ]);
    },
    [items, persistInbox],
  );

  const handleTriage = useCallback(
    (energy: EnergyLevel) => {
      const source = triageItem;
      if (!source) return;
      const promoted: Task = {
        id: newId(),
        text: source.text,
        energy,
        createdAt: new Date().toISOString(),
        triagedFromInboxId: source.id,
      };
      persistTasks([promoted, ...(tasks ?? [])]);
      persistInbox((items ?? []).filter((i) => i.id !== source.id));
      setTriageItem(null);
    },
    [items, persistInbox, persistTasks, tasks, triageItem],
  );

  const filteredTasks = useMemo(() => {
    if (!tasks) return null;
    if (filter === 'all') return tasks;
    return tasks.filter((t) => t.energy === filter);
  }, [tasks, filter]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.tabs}>
          <TabButton
            label="Inbox"
            active={view === 'inbox'}
            onPress={() => setView('inbox')}
          />
          <TabButton
            label="Tasks"
            active={view === 'tasks'}
            onPress={() => setView('tasks')}
          />
        </View>

        {view === 'inbox' ? (
          <InboxList
            items={items}
            onLongPress={(item) => setTriageItem(item)}
            onPress={handleDelete}
          />
        ) : (
          <TasksList
            tasks={filteredTasks}
            filter={filter}
            onFilterChange={setFilter}
          />
        )}

        {view === 'inbox' && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.composer}>
              <TextInput
                style={styles.input}
                placeholder="What's on your mind?"
                placeholderTextColor="#9ca3af"
                value={draft}
                onChangeText={setDraft}
                multiline
              />
              <Pressable
                style={[styles.sendBtn, !draft.trim() && styles.sendBtnDisabled]}
                onPress={handleAdd}
                disabled={!draft.trim()}
              >
                <Text style={styles.sendBtnText}>Add</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        )}

        <TriageSheet
          item={triageItem}
          onCancel={() => setTriageItem(null)}
          onPick={handleTriage}
        />

        <StatusBar style="auto" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function InboxList({
  items,
  onLongPress,
  onPress,
}: {
  items: InboxItem[] | null;
  onLongPress: (item: InboxItem) => void;
  onPress: (id: string) => void;
}) {
  if (items === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }
  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>
          Your inbox is empty.{'\n'}Type anything that&apos;s on your mind.
        </Text>
      </View>
    );
  }
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
          onPress={() => onPress(item.id)}
          onLongPress={() => onLongPress(item)}
        >
          <Text style={styles.itemText}>{item.text}</Text>
        </Pressable>
      )}
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
    />
  );
}

function TasksList({
  tasks,
  filter,
  onFilterChange,
}: {
  tasks: Task[] | null;
  filter: EnergyFilter;
  onFilterChange: (next: EnergyFilter) => void;
}) {
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
          <Text style={styles.empty}>
            {filter === 'all'
              ? 'No tasks yet.\nLong-press an inbox item to triage it.'
              : 'Nothing matches this energy filter.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(task) => task.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.itemText}>{item.text}</Text>
              <Text style={styles.energyTag}>{energyLabel(item.energy)}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

function TriageSheet({
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: '#f4f4f5',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#111827',
    fontWeight: '600',
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
  tasksContainer: {
    flex: 1,
  },
  filters: {
    flexDirection: 'row',
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
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e4e4e7',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 140,
    borderRadius: 12,
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  sendBtn: {
    paddingHorizontal: 18,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#a1a1aa',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
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
