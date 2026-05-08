import { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import type { InboxItem } from '@neuflow/shared';
import { loadInbox, saveInbox } from './src/lib/storage';

// Capture bar lives at the BOTTOM of the screen. The brief is friction-free
// brain dump — the dominant capture context is one-handed phone use, often
// mid-spiral. Bottom placement keeps the input within thumb reach without
// regripping. The on-screen keyboard rises from the bottom too, so under
// KeyboardAvoidingView the input visually pins to the keyboard rather than
// sliding past content the user was looking at.
export default function App() {
  // null = still loading from disk; [] = loaded and empty.
  // Distinguishing the two stops a "your inbox is empty" flash on cold start.
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    let cancelled = false;
    loadInbox()
      .then((loaded) => {
        if (!cancelled) setItems(loaded);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: InboxItem[]) => {
    setItems(next);
    saveInbox(next).catch((err) => {
      console.warn('[neuflow] saveInbox failed', err);
    });
  }, []);

  const handleAdd = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    const entry: InboxItem = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      createdAt: new Date().toISOString(),
    };
    persist([entry, ...(items ?? [])]);
    setDraft('');
  }, [draft, items, persist]);

  const handleDelete = useCallback(
    (id: string) => {
      // Tap-to-delete with a lightweight Alert confirm. Captured thoughts are
      // load-bearing for ND users with RSD/anxiety; a single misfired tap
      // wiping a fresh capture is much worse UX than one extra tap to confirm.
      // Alert.alert is built into RN — no design system or library required.
      Alert.alert('Delete this?', undefined, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            persist((items ?? []).filter((i) => i.id !== id));
          },
        },
      ]);
    },
    [items, persist],
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <Text style={styles.title}>Inbox</Text>
        {items === null ? (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.empty}>
              Your inbox is empty.{'\n'}Type anything that&apos;s on your mind.
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                onPress={() => handleDelete(item.id)}
              >
                <Text style={styles.itemText}>{item.text}</Text>
              </Pressable>
            )}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
        )}
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
              style={[
                styles.sendBtn,
                !draft.trim() && styles.sendBtnDisabled,
              ]}
              onPress={handleAdd}
              disabled={!draft.trim()}
            >
              <Text style={styles.sendBtnText}>Add</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
        <StatusBar style="auto" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
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
  },
  itemPressed: {
    backgroundColor: '#e4e4e7',
  },
  itemText: {
    fontSize: 16,
    color: '#111827',
    lineHeight: 22,
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
