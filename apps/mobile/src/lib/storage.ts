import AsyncStorage from '@react-native-async-storage/async-storage';
import type { InboxItem, Task } from '@neuflow/shared';

// Versioned keys so future schema changes can migrate cleanly without colliding
// with prior installs. Bump the suffix when the on-disk shape changes.
//
// Inbox and tasks live under separate keys on purpose — they're different
// stages (raw capture vs triaged) and merging them complicates the eventual
// move to per-user Supabase tables.
const INBOX_KEY = '@neuflow/inbox/v1';
const TASKS_KEY = '@neuflow/tasks/v1';

export async function loadInbox(): Promise<InboxItem[]> {
  return loadList<InboxItem>(INBOX_KEY);
}

export async function saveInbox(items: InboxItem[]): Promise<void> {
  await AsyncStorage.setItem(INBOX_KEY, JSON.stringify(items));
}

export async function loadTasks(): Promise<Task[]> {
  return loadList<Task>(TASKS_KEY);
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

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
