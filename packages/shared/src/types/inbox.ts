/**
 * Brain-dump capture: an unprocessed thought the user offloaded before triage.
 * Intentionally separate from Task — capture must be friction-free, so InboxItem
 * has no energy, trigger, or completion concept. Triage promotes an InboxItem
 * into a Task, at which point energy/trigger become required.
 */
export interface InboxItem {
  id: string;
  text: string;
  /** ISO 8601 timestamp, set on capture. */
  createdAt: string;
}
