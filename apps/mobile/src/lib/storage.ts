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
const TASKS_KEY_V2 = '@neuflow/tasks/v2';
const TASKS_KEY = '@neuflow/tasks/v3';

export async function loadInbox(): Promise<InboxItem[]> {
  return loadList<InboxItem>(INBOX_KEY);
}

export async function saveInbox(items: InboxItem[]): Promise<void> {
  await AsyncStorage.setItem(INBOX_KEY, JSON.stringify(items));
}

export async function loadTasks(): Promise<Task[]> {
  // Migrations are forward-only and additive: v1 added completedAt, v3 adds
  // skipCount. We check the newest key first; if absent, walk back. Older
  // keys are intentionally left in place after migration as a safety net —
  // a one-way migration shouldn't destroy the only copy of the data on
  // first launch under the new schema.
  try {
    const rawV3 = await AsyncStorage.getItem(TASKS_KEY);
    if (rawV3 !== null) {
      const parsed: unknown = JSON.parse(rawV3);
      if (!Array.isArray(parsed)) return [];
      return parsed as Task[];
    }

    const v2 = await loadList<LegacyTaskV2>(TASKS_KEY_V2);
    if (v2.length > 0) {
      const migrated: Task[] = v2.map((t) => ({ ...t, skipCount: 0 }));
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(migrated));
      console.info(
        `[neuflow] migrated ${migrated.length} task(s) from v2 to v3 (added skipCount: 0)`,
      );
      return migrated;
    }

    const v1 = await loadList<LegacyTaskV1>(TASKS_KEY_V1);
    if (v1.length === 0) return [];

    const migrated: Task[] = v1.map((t) => ({
      ...t,
      completedAt: null,
      skipCount: 0,
    }));
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(migrated));
    console.info(
      `[neuflow] migrated ${migrated.length} task(s) from v1 to v3 (added completedAt: null, skipCount: 0)`,
    );
    return migrated;
  } catch {
    return [];
  }
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

type LegacyTaskV1 = Omit<Task, 'completedAt' | 'skipCount'>;
type LegacyTaskV2 = Omit<Task, 'skipCount'>;

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
