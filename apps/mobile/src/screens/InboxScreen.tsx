import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { InboxItem } from '@neuflow/shared';

export function InboxScreen({
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

const styles = StyleSheet.create({
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
});
