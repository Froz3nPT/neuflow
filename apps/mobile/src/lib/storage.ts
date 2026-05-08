import AsyncStorage from '@react-native-async-storage/async-storage';
import type { InboxItem } from '@neuflow/shared';

// Versioned key so future schema changes can migrate cleanly without colliding
// with prior installs. Bump the suffix when the on-disk shape changes.
const INBOX_KEY = '@neuflow/inbox/v1';

export async function loadInbox(): Promise<InboxItem[]> {
  try {
    const raw = await AsyncStorage.getItem(INBOX_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as InboxItem[];
  } catch {
    // Corrupt/unreadable storage shouldn't crash capture. This is local-only,
    // pre-auth dev storage — once data has a real owner we'll validate the
    // shape on read instead of silently dropping it.
    return [];
  }
}

export async function saveInbox(items: InboxItem[]): Promise<void> {
  await AsyncStorage.setItem(INBOX_KEY, JSON.stringify(items));
}
