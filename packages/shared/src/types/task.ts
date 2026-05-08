// Core domain types. Kept in @neuflow/shared so the mobile app, future web/coach
// view, and Supabase edge functions can all speak the same language.
//
// These shapes are intentionally minimal — they'll grow as features land.
// When something here changes, the corresponding Supabase migration must
// move with it. See supabase/README.md.

/**
 * Energy cost of a task. The "spoons mode" filter keys off this.
 * Values are intentionally coarse — fine-grained estimation is decision tax.
 */
export type EnergyLevel = 'low' | 'medium' | 'high';

/**
 * How a task gets surfaced. We deliberately don't centre everything around
 * fixed periodicity (calendar-based) because ND users tend to break against
 * rigid schedules. Event triggers (after_shower, when_home) are first-class.
 */
export type TaskTrigger =
  | { kind: 'none' }
  | { kind: 'periodic'; cron: string } // e.g. "0 9 * * 1" — Monday 09:00
  | { kind: 'event'; event: string } // free-form for now: "after_shower", "when_home"
  | { kind: 'location'; placeId: string }; // GPS-based surfacing — Phase 2

export interface Task {
  id: string;
  userId: string;
  title: string;
  notes?: string;
  energy: EnergyLevel;
  trigger: TaskTrigger;
  /** ISO 8601 timestamp. null = not done. */
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Fields the client supplies when creating a task. Server fills the rest. */
export type TaskDraft = Pick<Task, 'title' | 'energy'> &
  Partial<Pick<Task, 'notes' | 'trigger'>>;
