// Core domain types. Kept in @neuflow/shared so the mobile app, future web/coach
// view, and Supabase edge functions can all speak the same language.
//
// Intentionally minimal — fields land when their feature lands. Triggers,
// completion state, notes, and userId will return when auth, scheduling, and
// "today's wins" are built.

/**
 * Energy cost of a task. The "spoons mode" filter keys off this.
 * Values are intentionally coarse — fine-grained estimation is decision tax.
 */
export type EnergyLevel = 'low' | 'med' | 'high';

export interface Task {
  id: string;
  text: string;
  energy: EnergyLevel;
  /** ISO 8601 timestamp, set on triage. */
  createdAt: string;
  /**
   * ISO 8601 timestamp set when the task is marked done; null when active.
   * The "Today" view filters on this falling within the local-timezone day.
   */
  completedAt: string | null;
  /** Set when this task was promoted from an InboxItem during triage. */
  triagedFromInboxId?: string;
}
