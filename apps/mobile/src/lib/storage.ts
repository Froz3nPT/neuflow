import AsyncStorage from '@react-native-async-storage/async-storage';
import type { InboxItem, Task } from '@neuflow/shared';

// Versioned keys so future schema changes can migrate cleanly without colliding
// with prior installs. Bump the suffix when the on-disk shape changes.
//
// Inbox and tasks live under separate keys on purpose — they're different
// stages (raw capture vs triaged) and merging them complicates the eventual
// move to per-user Supabase tables.
const INBOX_KEY = '@neuflow/inbox/v1';
const TASKS_KEY_V1 = '@neuflow/tasks/v1';
const TASKS_KEY = '@neuflow/tasks/v2';

export async function loadInbox(): Promise<InboxItem[]> {
  return loadList<InboxItem>(INBOX_KEY);
}

export async function saveInbox(items: InboxItem[]): Promise<void> {
  await AsyncStorage.setItem(INBOX_KEY, JSON.stringify(items));
}

export async function loadTasks(): Promise<Task[]> {
  // v2 added `completedAt`. We detect "first read of v2" by the key being
  // absent (getItem → null), not by v2 parsing to an empty array — once v2
  // exists, an empty list is a legitimate state (user deleted everything)
  // and must not be silently rehydrated from v1.
  try {
    const rawV2 = await AsyncStorage.getItem(TASKS_KEY);
    if (rawV2 !== null) {
      const parsed: unknown = JSON.parse(rawV2);
      if (!Array.isArray(parsed)) return [];
      return parsed as Task[];
    }

    const legacy = await loadList<LegacyTaskV1>(TASKS_KEY_V1);
    if (legacy.length === 0) return [];

    const migrated: Task[] = legacy.map((t) => ({ ...t, completedAt: null }));
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(migrated));
    // v1 is intentionally left in place — a one-way migration shouldn't
    // destroy the only copy of the data on first launch under the new schema.
    console.info(
      `[neuflow] migrated ${migrated.length} task(s) from v1 to v2 (added completedAt: null)`,
    );
    return migrated;
  } catch {
    return [];
  }
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

type LegacyTaskV1 = Omit<Task, 'completedAt'>;

// Corrupt/unreadable storage shouldn't crash the app. This is local-only,
// pre-auth dev storage — once data has a real owner we'll validate the shape
// on read instead of silently dropping it.
async function loadList<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as T[];
  } catch {
    return [];
  }
}
