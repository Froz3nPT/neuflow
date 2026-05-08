import { useCallback, useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Alert,
  KeyboardAvoidingView,
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
import { InboxScreen } from './src/screens/InboxScreen';
import { TasksScreen, type EnergyFilter } from './src/screens/TasksScreen';
import { TriageSheet } from './src/components/TriageSheet';

// Two-screen app: Inbox (raw capture) and Tasks (triaged, with energy). A
// single segmented toggle at the top swaps which list is visible. We don't
// reach for a navigation library yet — two views and conditional render is
// less ceremony than a stack.

type ViewKey = 'inbox' | 'tasks';

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
          <InboxScreen
            items={items}
            onLongPress={(item) => setTriageItem(item)}
            onPress={handleDelete}
          />
        ) : (
          <TasksScreen
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
});
